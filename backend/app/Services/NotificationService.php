<?php

namespace App\Services;

use App\Models\Notification as NotificationModel;
use App\Models\NotificationPreference;
use App\Models\User;

class NotificationService
{
    protected FirebaseMessagingService $fcm;

    public function __construct(FirebaseMessagingService $fcm)
    {
        $this->fcm = $fcm;
    }

    /**
     * Send a notification to a user via configured channels.
     */
    public function notify(
        User $user,
        string $type,
        string $title,
        string $body,
        array $data = [],
        ?int $tenantId = null,
    ): ?NotificationModel {
        // Check user preferences
        $pref = NotificationPreference::where('user_id', $user->id)
            ->where('type', $type)
            ->first();

        $pushEnabled = $pref ? $pref->push_enabled : true;
        $inAppEnabled = $pref ? $pref->in_app_enabled : true;

        $channel = 'both';
        if ($pushEnabled && !$inAppEnabled) $channel = 'push';
        if (!$pushEnabled && $inAppEnabled) $channel = 'in_app';
        if (!$pushEnabled && !$inAppEnabled) return null;

        // Create in-app notification
        $notification = null;
        if ($inAppEnabled) {
            $notification = NotificationModel::create([
                'tenant_id' => $tenantId ?? app('currentTenant')?->id,
                'user_id' => $user->id,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'channel' => $channel,
            ]);
        }

        // Send push notification
        if ($pushEnabled) {
            $sent = $this->fcm->sendToUser($user->id, $title, $body, $data);

            if ($notification && $sent > 0) {
                $notification->update([
                    'sent_via_push' => true,
                    'push_sent_at' => now(),
                ]);
            }
        }

        return $notification;
    }

    /**
     * Notify multiple users.
     */
    public function notifyMany(
        array $userIds,
        string $type,
        string $title,
        string $body,
        array $data = [],
        ?int $tenantId = null,
    ): void {
        $users = User::whereIn('id', $userIds)->get();
        foreach ($users as $user) {
            $this->notify($user, $type, $title, $body, $data, $tenantId);
        }
    }
}
