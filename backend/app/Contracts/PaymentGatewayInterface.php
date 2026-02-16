<?php

namespace App\Contracts;

interface PaymentGatewayInterface
{
    /**
     * Initiate a payment collection (inbound).
     *
     * @param array $params [amount, party_mobile, description, txn_ref, return_url]
     * @return array [success, gateway_txn_ref, redirect_url, gateway_response]
     */
    public function collect(array $params): array;

    /**
     * Initiate a payment disbursement (outbound).
     *
     * @param array $params [amount, recipient_mobile, description, txn_ref]
     * @return array [success, gateway_txn_ref, gateway_response]
     */
    public function disburse(array $params): array;

    /**
     * Verify a callback/IPN from the gateway.
     *
     * @param array $data The callback data
     * @return array [verified, status, gateway_txn_ref, gateway_response]
     */
    public function verifyCallback(array $data): array;

    /**
     * Get gateway identifier name.
     */
    public function getName(): string;
}
