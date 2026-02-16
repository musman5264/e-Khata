<?php

namespace App\Services;

use App\Models\LedgerShare;
use App\Models\Party;
use Illuminate\Support\Str;

class ShareService
{
    /**
     * Create a shareable link for a party's ledger.
     */
    public function createShareLink(
        int $partyId,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?int $expiresInDays = 30,
    ): LedgerShare {
        return LedgerShare::create([
            'party_id' => $partyId,
            'share_token' => Str::uuid()->toString(),
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'expires_at' => $expiresInDays ? now()->addDays($expiresInDays) : null,
            'is_active' => true,
            'created_by' => auth()->id(),
        ]);
    }

    /**
     * Generate WhatsApp share URL.
     */
    public function getWhatsAppUrl(Party $party, string $shareUrl): string
    {
        $message = urlencode("Here is your account statement from " . (app('currentTenant')?->name ?? 'e-Khata') . ". View it here: {$shareUrl}");
        $phone = $party->mobile ? preg_replace('/[^0-9]/', '', $party->mobile) : '';

        return "https://wa.me/{$phone}?text={$message}";
    }

    /**
     * Get the public URL for a share token.
     */
    public function getShareUrl(string $token): string
    {
        return url("/shared/{$token}");
    }
}
