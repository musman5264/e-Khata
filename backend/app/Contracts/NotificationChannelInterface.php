<?php

namespace App\Contracts;

interface NotificationChannelInterface
{
    /**
     * Send a notification to a user.
     *
     * @param int $userId
     * @param string $title
     * @param string $body
     * @param array $data
     * @return bool
     */
    public function send(int $userId, string $title, string $body, array $data = []): bool;
}
