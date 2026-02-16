<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Services\LedgerService;
use App\Services\PdfService;
use App\Services\ShareService;
use App\Events\LedgerShared;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ShareController extends Controller
{
    protected LedgerService $ledgerService;
    protected PdfService $pdfService;
    protected ShareService $shareService;

    public function __construct(
        LedgerService $ledgerService,
        PdfService $pdfService,
        ShareService $shareService,
    ) {
        $this->ledgerService = $ledgerService;
        $this->pdfService = $pdfService;
        $this->shareService = $shareService;
    }

    /**
     * GET /api/v1/parties/{partyId}/statement/pdf?from=&to=
     * Generate and download bank-statement PDF.
     */
    public function pdf(Request $request, int $partyId)
    {
        $this->authorize('share_ledger');

        $party = Party::findOrFail($partyId);
        $tenant = app('currentTenant');

        $statement = $this->ledgerService->getStatement(
            $party->id,
            $request->get('from'),
            $request->get('to'),
        );

        $pdfContent = $this->pdfService->generateStatement($tenant, $party, $statement, [
            'date_from' => $request->get('from'),
            'date_to' => $request->get('to'),
        ]);

        event(new LedgerShared($party, $request->user(), 'pdf'));

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="statement-' . $party->name . '.pdf"');
    }

    /**
     * POST /api/v1/parties/{partyId}/statement/share
     * Generate UUID share link.
     */
    public function share(Request $request, int $partyId): JsonResponse
    {
        $this->authorize('share_ledger');

        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'expires_in_days' => 'nullable|integer|min:1|max:365',
        ]);

        $party = Party::findOrFail($partyId);

        $shareLink = $this->shareService->createShareLink(
            $party,
            $request->user(),
            $request->get('date_from'),
            $request->get('date_to'),
            $request->get('expires_in_days', 7),
        );

        event(new LedgerShared($party, $request->user(), 'link'));

        return response()->json([
            'success' => true,
            'message' => 'Share link created successfully.',
            'data' => [
                'share_url' => $this->shareService->getShareUrl($shareLink->share_token),
                'token' => $shareLink->share_token,
                'expires_at' => $shareLink->expires_at,
            ],
        ]);
    }

    /**
     * POST /api/v1/parties/{partyId}/statement/email
     * Email PDF statement to party's email.
     */
    public function email(Request $request, int $partyId): JsonResponse
    {
        $this->authorize('share_ledger');

        $request->validate([
            'email' => 'nullable|email',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $party = Party::findOrFail($partyId);
        $tenant = app('currentTenant');
        $recipientEmail = $request->get('email', $party->email);

        if (!$recipientEmail) {
            return response()->json([
                'success' => false,
                'message' => 'No email address available for this party.',
            ], 422);
        }

        $statement = $this->ledgerService->getStatement(
            $party->id,
            $request->get('date_from'),
            $request->get('date_to'),
        );

        $pdfContent = $this->pdfService->generateStatement($tenant, $party, $statement, [
            'date_from' => $request->get('date_from'),
            'date_to' => $request->get('date_to'),
        ]);

        // Send email with PDF attachment
        Mail::raw("Please find your account statement from {$tenant->name} attached.", function ($message) use ($recipientEmail, $party, $tenant, $pdfContent) {
            $message->to($recipientEmail)
                ->subject("Account Statement - {$party->name} | {$tenant->name}")
                ->attachData($pdfContent, "statement-{$party->name}.pdf", [
                    'mime' => 'application/pdf',
                ]);
        });

        event(new LedgerShared($party, $request->user(), 'email'));

        return response()->json([
            'success' => true,
            'message' => "Statement emailed to {$recipientEmail}.",
        ]);
    }

    /**
     * POST /api/v1/parties/{partyId}/statement/whatsapp
     * Return WhatsApp deep link.
     */
    public function whatsapp(Request $request, int $partyId): JsonResponse
    {
        $this->authorize('share_ledger');

        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $party = Party::findOrFail($partyId);

        // Create share link first
        $shareLink = $this->shareService->createShareLink(
            $party,
            $request->user(),
            $request->get('date_from'),
            $request->get('date_to'),
            7,
        );

        $shareUrl = $this->shareService->getShareUrl($shareLink->share_token);
        $whatsappUrl = $this->shareService->getWhatsAppUrl($party, $shareUrl);

        event(new LedgerShared($party, $request->user(), 'whatsapp'));

        return response()->json([
            'success' => true,
            'data' => [
                'whatsapp_url' => $whatsappUrl,
                'share_url' => $shareUrl,
            ],
        ]);
    }
}
