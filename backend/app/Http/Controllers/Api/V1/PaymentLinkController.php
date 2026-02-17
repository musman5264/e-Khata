<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Models\PaymentLink;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentLinkController extends Controller
{
    protected ActivityLogService $activityLog;

    public function __construct(ActivityLogService $activityLog)
    {
        $this->activityLog = $activityLog;
    }

    /**
     * POST /api/v1/parties/{partyId}/payment-links
     * Create a new payment link for a party.
     */
    public function store(Request $request, int $partyId): JsonResponse
    {
        $this->authorize('collect_payment');

        $request->validate([
            'amount' => 'required|numeric|min:1',
            'gateway' => 'required|in:jazzcash,easypaisa',
            'description' => 'nullable|string|max:255',
            'expires_in_hours' => 'nullable|integer|min:1|max:720', // max 30 days
        ]);

        $party = Party::findOrFail($partyId);
        $tenant = app('currentTenant');

        $expiresAt = null;
        if ($request->expires_in_hours) {
            $expiresAt = now()->addHours($request->expires_in_hours);
        } else {
            // Default: 7 days
            $expiresAt = now()->addDays(7);
        }

        $paymentLink = PaymentLink::create([
            'tenant_id' => $tenant->id,
            'party_id' => $party->id,
            'created_by' => $request->user()->id,
            'token' => PaymentLink::generateToken(),
            'amount' => $request->amount,
            'currency' => $tenant->getSetting('currency', 'PKR'),
            'gateway' => $request->gateway,
            'description' => $request->description ?: "Payment to {$tenant->name}",
            'status' => 'active',
            'expires_at' => $expiresAt,
        ]);

        $this->activityLog->log('payment_link_created', $paymentLink, 'Payment link created', null, [
            'amount' => $paymentLink->amount,
            'gateway' => $paymentLink->gateway,
            'party' => $party->name,
        ]);

        Log::channel('payment')->info('Payment link created', [
            'link_id' => $paymentLink->id,
            'party_id' => $party->id,
            'amount' => $paymentLink->amount,
            'gateway' => $paymentLink->gateway,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment link created successfully.',
            'data' => [
                'payment_link' => $paymentLink->fresh()->load('party:id,name,mobile'),
                'shareable_url' => $paymentLink->shareable_url,
                'whatsapp_url' => $this->generateWhatsAppUrl($party, $paymentLink),
            ],
        ], 201);
    }

    /**
     * GET /api/v1/payment-links
     * List all payment links for the tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PaymentLink::with('party:id,name,mobile', 'creator:id,name');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('party_id')) {
            $query->where('party_id', $request->party_id);
        }
        if ($request->has('gateway')) {
            $query->where('gateway', $request->gateway);
        }

        $links = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 20));

        // Add shareable URLs
        $items = collect($links->items())->map(function ($link) {
            $data = $link->toArray();
            $data['shareable_url'] = $link->shareable_url;
            $data['is_expired'] = $link->expires_at && $link->expires_at->isPast();
            return $data;
        });

        return response()->json([
            'success' => true,
            'data' => $items,
            'meta' => [
                'page' => $links->currentPage(),
                'per_page' => $links->perPage(),
                'total' => $links->total(),
                'last_page' => $links->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/payment-links/{id}
     * Show a specific payment link.
     */
    public function show(int $id): JsonResponse
    {
        $link = PaymentLink::with('party', 'creator', 'payment')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => array_merge($link->toArray(), [
                'shareable_url' => $link->shareable_url,
                'whatsapp_url' => $this->generateWhatsAppUrl($link->party, $link),
                'is_expired' => $link->expires_at && $link->expires_at->isPast(),
            ]),
        ]);
    }

    /**
     * PUT /api/v1/payment-links/{id}/cancel
     * Cancel a payment link.
     */
    public function cancel(int $id): JsonResponse
    {
        $link = PaymentLink::findOrFail($id);

        if ($link->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Only active links can be cancelled.',
            ], 422);
        }

        $link->update(['status' => 'cancelled']);

        $this->activityLog->log('payment_link_cancelled', $link, 'Payment link cancelled');

        return response()->json([
            'success' => true,
            'message' => 'Payment link cancelled.',
        ]);
    }

    /**
     * GET /api/v1/payment-links/{id}/share
     * Get sharing details for a payment link (WhatsApp URLs).
     */
    public function share(int $id): JsonResponse
    {
        $link = PaymentLink::with('party')->findOrFail($id);

        if (!$link->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'This payment link is no longer active.',
            ], 422);
        }

        $partyMobile = $link->party?->mobile;
        $shareableUrl = $link->shareable_url;
        $tenant = app('currentTenant');

        // Generate message
        $message = "Dear {$link->party->name},\n\n"
            . "You have a pending payment of Rs {$link->amount} via {$link->gateway}.\n\n"
            . "Click the link below to make the payment:\n{$shareableUrl}\n\n"
            . ($link->description ? "Note: {$link->description}\n\n" : "")
            . "Thank you,\n{$tenant->name}";

        // WhatsApp direct URL (wa.me)
        $waDirectUrl = null;
        if ($partyMobile) {
            $cleanMobile = preg_replace('/[^0-9]/', '', $partyMobile);
            $waDirectUrl = "https://wa.me/{$cleanMobile}?text=" . rawurlencode($message);
        }

        // Generic WhatsApp share (no specific number)
        $waShareUrl = "https://wa.me/?text=" . rawurlencode($message);

        return response()->json([
            'success' => true,
            'data' => [
                'shareable_url' => $shareableUrl,
                'message' => $message,
                'whatsapp_direct_url' => $waDirectUrl,
                'whatsapp_share_url' => $waShareUrl,
                'party_mobile' => $partyMobile,
            ],
        ]);
    }

    /**
     * GET /api/v1/pay/{token} (PUBLIC — no auth)
     * View a payment link page for the payer.
     */
    public function publicView(string $token): JsonResponse
    {
        $link = PaymentLink::with('party:id,name', 'tenant:id,name')
            ->where('token', $token)
            ->firstOrFail();

        if ($link->status === 'paid') {
            return response()->json([
                'success' => true,
                'data' => [
                    'status' => 'paid',
                    'message' => 'This payment has already been completed.',
                    'paid_at' => $link->paid_at,
                ],
            ]);
        }

        if (!$link->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'This payment link has expired or been cancelled.',
                'data' => ['status' => $link->status],
            ], 410);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'active',
                'business_name' => $link->tenant?->name,
                'party_name' => $link->party?->name,
                'amount' => (float)$link->amount,
                'currency' => $link->currency,
                'gateway' => $link->gateway,
                'description' => $link->description,
                'expires_at' => $link->expires_at?->format('Y-m-d H:i'),
            ],
        ]);
    }

    /**
     * Generate WhatsApp deep link URL.
     */
    protected function generateWhatsAppUrl(Party $party, PaymentLink $link): ?string
    {
        $mobile = $party->mobile;
        if (!$mobile) return null;

        $cleanMobile = preg_replace('/[^0-9]/', '', $mobile);
        $tenant = app('currentTenant');

        $message = "Dear {$party->name},\n\n"
            . "Please pay Rs {$link->amount} via {$link->gateway}.\n"
            . "Payment link: {$link->shareable_url}\n\n"
            . "— {$tenant->name}";

        return "https://wa.me/{$cleanMobile}?text=" . rawurlencode($message);
    }
}
