<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Models\Payment;
use App\Services\JazzCashService;
use App\Services\EasyPaisaService;
use App\Events\PaymentReceived;
use App\Events\PaymentSent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected JazzCashService $jazzCash;
    protected EasyPaisaService $easyPaisa;

    public function __construct(JazzCashService $jazzCash, EasyPaisaService $easyPaisa)
    {
        $this->jazzCash = $jazzCash;
        $this->easyPaisa = $easyPaisa;
    }

    /**
     * POST /api/v1/parties/{partyId}/payments/collect
     * Initiate inbound payment collection.
     */
    public function collect(Request $request, int $partyId): JsonResponse
    {
        $this->authorize('collect_payment');

        $request->validate([
            'amount' => 'required|numeric|min:1',
            'gateway' => 'required|in:jazzcash,easypaisa',
            'mobile' => 'required|string',
        ]);

        $party = Party::findOrFail($partyId);
        $tenant = app('currentTenant');

        $payment = Payment::create([
            'tenant_id' => $tenant->id,
            'party_id' => $party->id,
            'gateway' => $request->gateway,
            'direction' => 'inbound',
            'amount' => $request->amount,
            'currency' => $tenant->getSetting('currency', 'PKR'),
            'status' => 'pending',
            'initiated_by' => $request->user()->id,
        ]);

        $gateway = $this->resolveGateway($request->gateway);

        try {
            $result = $gateway->collect([
                'amount' => $request->amount,
                'mobile' => $request->mobile,
                'txn_ref' => 'EK-' . $payment->id . '-' . time(),
                'description' => "Collection from {$party->name}",
                'return_url' => config('app.url') . "/api/v1/payments/{$request->gateway}/return",
            ]);

            $payment->update([
                'gateway_txn_ref' => $result['txn_ref'] ?? null,
                'pp_TxnRefNo' => $result['pp_TxnRefNo'] ?? null,
                'gateway_response' => $result,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment initiated successfully.',
                'data' => [
                    'payment' => $payment->fresh(),
                    'redirect_url' => $result['redirect_url'] ?? null,
                    'gateway_response' => $result,
                ],
            ], 201);
        } catch (\Exception $e) {
            $payment->update(['status' => 'failed', 'gateway_response' => ['error' => $e->getMessage()]]);
            Log::channel('payment')->error('Payment collection failed', [
                'payment_id' => $payment->id,
                'gateway' => $request->gateway,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment initiation failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/parties/{partyId}/payments/send
     * Initiate outbound disbursement.
     */
    public function send(Request $request, int $partyId): JsonResponse
    {
        $this->authorize('send_payment');

        $request->validate([
            'amount' => 'required|numeric|min:1',
            'gateway' => 'required|in:jazzcash,easypaisa',
            'mobile' => 'required|string',
        ]);

        $party = Party::findOrFail($partyId);
        $tenant = app('currentTenant');

        $payment = Payment::create([
            'tenant_id' => $tenant->id,
            'party_id' => $party->id,
            'gateway' => $request->gateway,
            'direction' => 'outbound',
            'amount' => $request->amount,
            'currency' => $tenant->getSetting('currency', 'PKR'),
            'status' => 'pending',
            'initiated_by' => $request->user()->id,
        ]);

        $gateway = $this->resolveGateway($request->gateway);

        try {
            $result = $gateway->disburse([
                'amount' => $request->amount,
                'mobile' => $request->mobile,
                'txn_ref' => 'EK-' . $payment->id . '-' . time(),
                'description' => "Disbursement to {$party->name}",
            ]);

            $payment->update([
                'gateway_txn_ref' => $result['txn_ref'] ?? null,
                'gateway_response' => $result,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Disbursement initiated successfully.',
                'data' => $payment->fresh(),
            ], 201);
        } catch (\Exception $e) {
            $payment->update(['status' => 'failed', 'gateway_response' => ['error' => $e->getMessage()]]);
            Log::channel('payment')->error('Payment disbursement failed', [
                'payment_id' => $payment->id,
                'gateway' => $request->gateway,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Disbursement initiation failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/payments
     * Payment history.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::query()
            ->with('party:id,name,mobile', 'initiator:id,name');

        if ($request->has('party_id')) {
            $query->where('party_id', $request->party_id);
        }
        if ($request->has('gateway')) {
            $query->where('gateway', $request->gateway);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('direction')) {
            $query->where('direction', $request->direction);
        }
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $payments = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $payments->items(),
            'meta' => [
                'page' => $payments->currentPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
                'last_page' => $payments->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/payments/{id}
     */
    public function show(int $id): JsonResponse
    {
        $payment = Payment::with('party', 'initiator', 'transaction')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $payment,
        ]);
    }

    /**
     * POST /api/v1/payments/jazzcash/callback (public)
     */
    public function jazzCashCallback(Request $request): JsonResponse
    {
        Log::channel('payment')->info('JazzCash callback received', $request->all());

        try {
            $result = $this->jazzCash->verifyCallback($request->all());

            if ($result['verified']) {
                $payment = Payment::where('gateway_txn_ref', $result['txn_ref'])
                    ->orWhere('pp_TxnRefNo', $request->pp_TxnRefNo)
                    ->first();

                if ($payment && $payment->status === 'pending') {
                    $payment->update([
                        'status' => $result['status'],
                        'gateway_response' => $request->all(),
                        'completed_at' => $result['status'] === 'completed' ? now() : null,
                    ]);

                    if ($result['status'] === 'completed') {
                        if ($payment->isInbound()) {
                            event(new PaymentReceived($payment));
                        } else {
                            event(new PaymentSent($payment));
                        }
                    }
                }
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::channel('payment')->error('JazzCash callback verification failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
            ]);
            return response()->json(['success' => false], 400);
        }
    }

    /**
     * POST /api/v1/payments/easypaisa/callback (public)
     */
    public function easypaisaCallback(Request $request): JsonResponse
    {
        Log::channel('payment')->info('EasyPaisa callback received', $request->all());

        try {
            $result = $this->easyPaisa->verifyCallback($request->all());

            if ($result['verified']) {
                $payment = Payment::where('gateway_txn_ref', $result['txn_ref'])->first();

                if ($payment && $payment->status === 'pending') {
                    $payment->update([
                        'status' => $result['status'],
                        'gateway_response' => $request->all(),
                        'completed_at' => $result['status'] === 'completed' ? now() : null,
                    ]);

                    if ($result['status'] === 'completed') {
                        if ($payment->isInbound()) {
                            event(new PaymentReceived($payment));
                        } else {
                            event(new PaymentSent($payment));
                        }
                    }
                }
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::channel('payment')->error('EasyPaisa callback verification failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
            ]);
            return response()->json(['success' => false], 400);
        }
    }

    /**
     * GET /api/v1/payments/jazzcash/return (public redirect)
     */
    public function jazzCashReturn(Request $request)
    {
        // This handles the redirect back from JazzCash after payment
        $txnRef = $request->pp_TxnRefNo;
        $status = $request->pp_ResponseCode === '000' ? 'success' : 'failed';

        return response()->json([
            'success' => $status === 'success',
            'message' => $status === 'success' ? 'Payment completed.' : 'Payment failed.',
            'txn_ref' => $txnRef,
        ]);
    }

    /**
     * Resolve gateway service by name.
     */
    protected function resolveGateway(string $gateway)
    {
        return match ($gateway) {
            'jazzcash' => $this->jazzCash,
            'easypaisa' => $this->easyPaisa,
            default => throw new \InvalidArgumentException("Unsupported gateway: {$gateway}"),
        };
    }
}
