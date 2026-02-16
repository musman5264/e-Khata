<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class JazzCashService implements PaymentGatewayInterface
{
    protected string $merchantId;
    protected string $password;
    protected string $integritySalt;
    protected string $returnUrl;
    protected string $apiUrl;

    public function __construct()
    {
        $this->merchantId = config('services.jazzcash.merchant_id', '');
        $this->password = config('services.jazzcash.password', '');
        $this->integritySalt = config('services.jazzcash.integrity_salt', '');
        $this->returnUrl = config('services.jazzcash.return_url', '');
        $this->apiUrl = config('services.jazzcash.sandbox', true)
            ? 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction'
            : 'https://payments.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction';
    }

    public function collect(array $params): array
    {
        $dateTime = now()->format('YmdHis');
        $expiryDateTime = now()->addHour()->format('YmdHis');
        $amountInPaisa = (int) ($params['amount'] * 100);

        $data = [
            'pp_Version' => '2.0',
            'pp_TxnType' => 'MWALLET',
            'pp_Language' => 'EN',
            'pp_MerchantID' => $this->merchantId,
            'pp_SubMerchantID' => '',
            'pp_Password' => $this->password,
            'pp_BankID' => '',
            'pp_ProductID' => '',
            'pp_TxnRefNo' => $params['txn_ref'],
            'pp_Amount' => (string) $amountInPaisa,
            'pp_TxnCurrency' => 'PKR',
            'pp_TxnDateTime' => $dateTime,
            'pp_BillReference' => $params['description'] ?? 'e-Khata Payment',
            'pp_Description' => $params['description'] ?? 'Payment Collection',
            'pp_TxnExpiryDateTime' => $expiryDateTime,
            'pp_ReturnURL' => $params['return_url'] ?? $this->returnUrl,
            'pp_CustomerMobile' => $params['party_mobile'] ?? '',
            'pp_CustomerCardNumber' => '',
            'pp_CustomerEmail' => '',
        ];

        $data['pp_SecureHash'] = $this->generateHash($data);

        try {
            $response = Http::asForm()->post($this->apiUrl, $data);
            $result = $response->json();

            return [
                'success' => ($result['pp_ResponseCode'] ?? '') === '000',
                'gateway_txn_ref' => $result['pp_TxnRefNo'] ?? $params['txn_ref'],
                'redirect_url' => null,
                'gateway_response' => $result,
            ];
        } catch (\Throwable $e) {
            Log::channel('payment')->error('JazzCash collect failed', [
                'error' => $e->getMessage(),
                'params' => $params,
            ]);

            return [
                'success' => false,
                'gateway_txn_ref' => $params['txn_ref'],
                'redirect_url' => null,
                'gateway_response' => ['error' => $e->getMessage()],
            ];
        }
    }

    public function disburse(array $params): array
    {
        // JazzCash disbursement API
        $dateTime = now()->format('YmdHis');
        $amountInPaisa = (int) ($params['amount'] * 100);

        $data = [
            'pp_Version' => '2.0',
            'pp_TxnType' => 'MWALLET',
            'pp_Language' => 'EN',
            'pp_MerchantID' => $this->merchantId,
            'pp_Password' => $this->password,
            'pp_TxnRefNo' => $params['txn_ref'],
            'pp_Amount' => (string) $amountInPaisa,
            'pp_TxnCurrency' => 'PKR',
            'pp_TxnDateTime' => $dateTime,
            'pp_BillReference' => $params['description'] ?? 'e-Khata Disbursement',
            'pp_Description' => $params['description'] ?? 'Payment Disbursement',
            'pp_CustomerMobile' => $params['recipient_mobile'] ?? '',
        ];

        $data['pp_SecureHash'] = $this->generateHash($data);

        try {
            $response = Http::asForm()->post($this->apiUrl, $data);
            $result = $response->json();

            return [
                'success' => ($result['pp_ResponseCode'] ?? '') === '000',
                'gateway_txn_ref' => $result['pp_TxnRefNo'] ?? $params['txn_ref'],
                'gateway_response' => $result,
            ];
        } catch (\Throwable $e) {
            Log::channel('payment')->error('JazzCash disburse failed', [
                'error' => $e->getMessage(),
                'params' => $params,
            ]);

            return [
                'success' => false,
                'gateway_txn_ref' => $params['txn_ref'],
                'gateway_response' => ['error' => $e->getMessage()],
            ];
        }
    }

    public function verifyCallback(array $data): array
    {
        $receivedHash = $data['pp_SecureHash'] ?? '';
        unset($data['pp_SecureHash']);

        $calculatedHash = $this->generateHash($data);

        $verified = hash_equals($calculatedHash, $receivedHash);

        $status = 'failed';
        if ($verified && ($data['pp_ResponseCode'] ?? '') === '000') {
            $status = 'completed';
        }

        return [
            'verified' => $verified,
            'status' => $status,
            'gateway_txn_ref' => $data['pp_TxnRefNo'] ?? null,
            'gateway_response' => $data,
        ];
    }

    public function getName(): string
    {
        return 'jazzcash';
    }

    /**
     * Generate HMAC SHA256 secure hash.
     */
    protected function generateHash(array $data): string
    {
        ksort($data);

        $hashString = $this->integritySalt;
        foreach ($data as $key => $value) {
            if ($value !== '' && $value !== null) {
                $hashString .= '&' . $value;
            }
        }

        return hash_hmac('sha256', $hashString, $this->integritySalt);
    }
}
