<?php

namespace App\Http\Controllers;

use App\Models\PaymentLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PublicPaymentController extends Controller
{
    /**
     * GET /pay/{token}
     * Public payment page — renders a Blade view with payment info
     * and a button that deep-links to JazzCash/EasyPaisa or redirects to their web portal.
     */
    public function show(string $token)
    {
        $link = PaymentLink::with('tenant:id,name', 'party:id,name')
            ->where('token', $token)
            ->firstOrFail();

        // Determine the payment status
        if ($link->status === 'paid') {
            $status = 'paid';
        } elseif ($link->status === 'cancelled') {
            $status = 'cancelled';
        } elseif ($link->expires_at && $link->expires_at->isPast()) {
            $status = 'expired';
        } else {
            $status = 'active';
        }

        // Build the gateway deep-link / web URL
        $gatewayUrl = $this->buildGatewayUrl($link);

        Log::channel('payment')->info('Public payment page viewed', [
            'link_id' => $link->id,
            'token' => $token,
            'status' => $status,
            'gateway' => $link->gateway,
        ]);

        return view('payment.public-pay', compact('link', 'status', 'gatewayUrl'));
    }

    /**
     * Build the payment gateway URL based on the gateway type.
     * For JazzCash: Deep-link to app or fallback to web portal
     * For EasyPaisa: Deep-link to app or fallback to web portal
     */
    protected function buildGatewayUrl(PaymentLink $link): string
    {
        $amount = (int) $link->amount;
        $txnRef = 'EK-' . $link->id . '-' . time();
        $description = urlencode($link->description ?: 'Payment via e-Khata');
        $returnUrl = urlencode(config('app.url') . '/api/v1/payments/jazzcash/return');

        if ($link->gateway === 'jazzcash') {
            // JazzCash Mobile Account payment URL
            // This opens the JazzCash app if installed, or their web portal
            $merchantId = config('services.jazzcash.merchant_id', '');
            $password = config('services.jazzcash.password', '');

            if ($merchantId) {
                // Production JazzCash integration
                return "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform?"
                    . "pp_Amount=" . ($amount * 100) // Amount in paisa
                    . "&pp_TxnRefNo=" . $txnRef
                    . "&pp_Description=" . $description
                    . "&pp_MerchantID=" . $merchantId
                    . "&pp_ReturnURL=" . $returnUrl;
            }

            // Fallback: JazzCash app deep link
            return "https://www.jazzcash.com.pk/";
        }

        if ($link->gateway === 'easypaisa') {
            $storeId = config('services.easypaisa.store_id', '');

            if ($storeId) {
                // Production EasyPaisa integration
                return "https://easypay.easypaisa.com.pk/easypay/Index.jsf?"
                    . "storeId=" . $storeId
                    . "&amount=" . $amount
                    . "&orderRefNum=" . $txnRef;
            }

            // Fallback: EasyPaisa app deep link
            return "https://easypaisa.com.pk/";
        }

        return '#';
    }
}
