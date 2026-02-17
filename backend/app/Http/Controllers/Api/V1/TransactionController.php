<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Models\Party;
use App\Models\Transaction;
use App\Services\ActivityLogService;
use App\Services\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    protected LedgerService $ledgerService;
    protected ActivityLogService $activityLog;

    public function __construct(LedgerService $ledgerService, ActivityLogService $activityLog)
    {
        $this->ledgerService = $ledgerService;
        $this->activityLog = $activityLog;
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

        $this->activityLog->log('transaction_created', $transaction, "Created {$transaction->type} transaction of Rs {$transaction->amount} for {$party->name}", null, $transaction->toArray());

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
        $oldValues = $transaction->toArray();
        $transaction = $this->ledgerService->updateTransaction($transaction, $request->validated());

        $this->activityLog->log('transaction_updated', $transaction, "Updated transaction #{$transaction->id}", $oldValues, $transaction->fresh()->toArray());

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

        $this->activityLog->log('transaction_deleted', $transaction, "Deleted {$transaction->type} transaction of Rs {$transaction->amount}", $transaction->toArray());

        $this->ledgerService->deleteTransaction($transaction);

        return response()->json([
            'success' => true,
            'message' => 'Transaction deleted successfully.',
        ]);
    }

    // ──────────────────────────────────────────────────────
    // Flat routes (no party prefix — convenience endpoints)
    // ──────────────────────────────────────────────────────

    /**
     * GET /api/v1/transactions/{id}
     */
    public function showFlat(int $id): JsonResponse
    {
        $this->authorize('view_ledger');

        $transaction = Transaction::with('party', 'user', 'payment')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $transaction,
        ]);
    }

    /**
     * PUT /api/v1/transactions/{id}
     */
    public function updateFlat(Request $request, int $id): JsonResponse
    {
        $this->authorize('edit_transaction');

        $transaction = Transaction::findOrFail($id);
        $oldValues = $transaction->toArray();

        $request->validate([
            'type' => 'sometimes|in:debit,credit',
            'amount' => 'sometimes|numeric|gt:0',
            'date' => 'sometimes|date',
            'description' => 'nullable|string|max:500',
            'reference_number' => 'nullable|string|max:100',
        ]);

        $transaction = $this->ledgerService->updateTransaction($transaction, $request->only([
            'type', 'amount', 'date', 'description', 'reference_number',
        ]));

        $this->activityLog->log('transaction_updated', $transaction, "Updated transaction #{$transaction->id} (flat)", $oldValues, $transaction->fresh()->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Transaction updated successfully.',
            'data' => $transaction->load('party', 'user'),
        ]);
    }

    /**
     * DELETE /api/v1/transactions/{id}
     */
    public function destroyFlat(int $id): JsonResponse
    {
        $this->authorize('delete_transaction');

        $transaction = Transaction::findOrFail($id);

        $this->activityLog->log('transaction_deleted', $transaction, "Deleted {$transaction->type} transaction of Rs {$transaction->amount} (flat)", $transaction->toArray());

        $this->ledgerService->deleteTransaction($transaction);

        return response()->json([
            'success' => true,
            'message' => 'Transaction deleted successfully.',
        ]);
    }
}
