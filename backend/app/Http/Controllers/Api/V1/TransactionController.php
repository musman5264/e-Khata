<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Models\Party;
use App\Models\Transaction;
use App\Services\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    protected LedgerService $ledgerService;

    public function __construct(LedgerService $ledgerService)
    {
        $this->ledgerService = $ledgerService;
    }

    /**
     * POST /api/v1/parties/{partyId}/transactions
     */
    public function store(StoreTransactionRequest $request, int $partyId): JsonResponse
    {
        $this->authorize('create_transaction');

        $party = Party::findOrFail($partyId);

        $transaction = $this->ledgerService->createTransaction(array_merge(
            $request->validated(),
            [
                'tenant_id' => app('currentTenant')->id,
                'party_id' => $party->id,
                'user_id' => $request->user()->id,
            ]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Transaction created successfully.',
            'data' => $transaction->load('party', 'user'),
        ], 201);
    }

    /**
     * GET /api/v1/parties/{partyId}/transactions
     */
    public function index(Request $request, int $partyId): JsonResponse
    {
        $this->authorize('view_ledger');

        $party = Party::findOrFail($partyId);

        $statement = $this->ledgerService->getStatement(
            $party->id,
            $request->get('date_from'),
            $request->get('date_to'),
            $request->get('type'),
        );

        $transactionData = $statement['transactions']->map(fn($txn) => [
            'id' => $txn->id,
            'date' => $txn->date->format('Y-m-d'),
            'description' => $txn->description,
            'reference_number' => $txn->reference_number,
            'debit_amount' => $txn->debit_amount,
            'credit_amount' => $txn->credit_amount,
            'running_balance' => (float) $txn->running_balance,
            'balance_display' => $txn->balance_display,
            'type' => $txn->type,
            'amount' => (float) $txn->amount,
            'user' => $txn->user?->name,
            'payment_id' => $txn->payment_id,
            'created_at' => $txn->created_at,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'party' => [
                    'id' => $party->id,
                    'name' => $party->name,
                    'mobile' => $party->mobile,
                    'khata_number' => $party->khata_number,
                    'book_number' => $party->book_number,
                ],
                'transactions' => $transactionData,
                'opening_balance' => $statement['opening_balance'],
                'opening_balance_type' => $statement['opening_balance_type'],
                'total_debit' => $statement['total_debit'],
                'total_credit' => $statement['total_credit'],
                'closing_balance' => $statement['closing_balance'],
            ],
        ]);
    }

    /**
     * GET /api/v1/parties/{partyId}/transactions/{id}
     */
    public function show(int $partyId, int $id): JsonResponse
    {
        $this->authorize('view_ledger');

        $transaction = Transaction::where('party_id', $partyId)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $transaction->load('party', 'user', 'payment'),
        ]);
    }

    /**
     * PUT /api/v1/parties/{partyId}/transactions/{id}
     */
    public function update(UpdateTransactionRequest $request, int $partyId, int $id): JsonResponse
    {
        $this->authorize('edit_transaction');

        $transaction = Transaction::where('party_id', $partyId)->findOrFail($id);
        $transaction = $this->ledgerService->updateTransaction($transaction, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Transaction updated successfully.',
            'data' => $transaction->load('party', 'user'),
        ]);
    }

    /**
     * DELETE /api/v1/parties/{partyId}/transactions/{id}
     */
    public function destroy(int $partyId, int $id): JsonResponse
    {
        $this->authorize('delete_transaction');

        $transaction = Transaction::where('party_id', $partyId)->findOrFail($id);
        $this->ledgerService->deleteTransaction($transaction);

        return response()->json([
            'success' => true,
            'message' => 'Transaction deleted successfully.',
        ]);
    }
}
