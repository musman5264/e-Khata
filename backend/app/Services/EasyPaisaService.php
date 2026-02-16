<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EasyPaisaService implements PaymentGatewayInterface
{
    protected string $storeId;
    protected string $username;
    protected string $password;
    protected string $apiUrl;

    public function __construct()
    {
        $this->storeId = config('services.easypaisa.store_id', '');
        $this->username = config('services.easypaisa.username', '');
        $this->password = config('services.easypaisa.password', '');
        $this->apiUrl = config('services.easypaisa.sandbox', true)
            ? 'https://easypaystg.easypaisa.com.pk/easypay-service/rest/v4'
            : 'https://easypay.easypaisa.com.pk/easypay-service/rest/v4';
    }

    public function collect(array $params): array
    {
        $data = [
            'orderId' => $params['txn_ref'],
            'storeId' => $this->storeId,
            'transactionAmount' => number_format($params['amount'], 2, '.', ''),
            'transactionType' => 'OTC', // Over the counter
            'mobileAccountNo' => $params['party_mobile'] ?? '',
            'emailAddress' => $params['email'] ?? '',
        ];

        try {
            $token = base64_encode("{$this->username}:{$this->password}");

            $response = Http::withHeaders([
                'Authorization' => "Basic {$token}",
                'Content-Type' => 'application/json',
            ])->post("{$this->apiUrl}/initiate-ma-transaction", $data);

            $result = $response->json();

            return [
                'success' => ($result['responseCode'] ?? '') === '0000',
                'gateway_txn_ref' => $result['transactionId'] ?? $params['txn_ref'],
                'redirect_url' => $result['paymentUrl'] ?? null,
                'gateway_response' => $result,
            ];
        } catch (\Throwable $e) {
            Log::channel('payment')->error('EasyPaisa collect failed', [
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
        $data = [
            'orderId' => $params['txn_ref'],
            'storeId' => $this->storeId,
            'transactionAmount' => number_format($params['amount'], 2, '.', ''),
            'mobileAccountNo' => $params['recipient_mobile'] ?? '',
            'transactionType' => 'MA',
        ];

        try {
            $token = base64_encode("{$this->username}:{$this->password}");

            $response = Http::withHeaders([
                'Authorization' => "Basic {$token}",
                'Content-Type' => 'application/json',
            ])->post("{$this->apiUrl}/initiate-ma-transaction", $data);

            $result = $response->json();

            return [
                'success' => ($result['responseCode'] ?? '') === '0000',
                'gateway_txn_ref' => $result['transactionId'] ?? $params['txn_ref'],
                'gateway_response' => $result,
            ];
        } catch (\Throwable $e) {
            Log::channel('payment')->error('EasyPaisa disburse failed', [
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
        $status = 'failed';
        if (($data['responseCode'] ?? '') === '0000') {
            $status = 'completed';
        }

        return [
            'verified' => true, // EasyPaisa uses server-to-server callback
            'status' => $status,
            'gateway_txn_ref' => $data['transactionId'] ?? $data['orderId'] ?? null,
            'gateway_response' => $data,
        ];
    }

    public function getName(): string
    {
        return 'easypaisa';
    }
}
