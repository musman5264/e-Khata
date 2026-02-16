<?php

namespace App\Services;

use App\Models\Session;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FCMNotification;

class FirebaseMessagingService
{
    protected ?Messaging $messaging;

    public function __construct(?Messaging $messaging = null)
    {
        $this->messaging = $messaging;
    }

    /**
     * Send push notification to a specific device token.
     */
    public function sendToDevice(string $fcmToken, string $title, string $body, array $data = []): bool
    {
        if (!$this->messaging) {
            return false;
        }

        try {
            $message = CloudMessage::withTarget('token', $fcmToken)
                ->withNotification(FCMNotification::create($title, $body))
                ->withData($data);

            $this->messaging->send($message);
            return true;
        } catch (\Throwable $e) {
            // Handle unregistered token
            if (str_contains($e->getMessage(), 'UNREGISTERED') || str_contains($e->getMessage(), 'NOT_FOUND')) {
                Session::where('fcm_token', $fcmToken)->update(['is_active' => false]);
            }
            report($e);
            return false;
        }
    }

    /**
     * Send push notification to all active sessions of a user.
     */
    public function sendToUser(int $userId, string $title, string $body, array $data = []): int
    {
        $sessions = Session::where('user_id', $userId)
            ->where('is_active', true)
            ->whereNotNull('fcm_token')
            ->get();

        $sent = 0;
        foreach ($sessions as $session) {
            if ($this->sendToDevice($session->fcm_token, $title, $body, $data)) {
                $sent++;
            }
        }

        return $sent;
    }

    /**
     * Send to a topic (e.g., all users of a tenant).
     */
    public function sendToTopic(string $topic, string $title, string $body, array $data = []): bool
    {
        if (!$this->messaging) {
            return false;
        }

        try {
            $message = CloudMessage::withTarget('topic', $topic)
                ->withNotification(FCMNotification::create($title, $body))
                ->withData($data);

            $this->messaging->send($message);
            return true;
        } catch (\Throwable $e) {
            report($e);
            return false;
        }
    }

    /**
     * Subscribe a token to a topic.
     */
    public function subscribeToTopic(string $topic, string $fcmToken): void
    {
        if (!$this->messaging) {
            return;
        }

        try {
            $this->messaging->subscribeToTopic($topic, [$fcmToken]);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
