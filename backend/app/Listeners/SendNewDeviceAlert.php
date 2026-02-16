<?php

namespace App\Listeners;

use App\Events\NewDeviceLogin;
use App\Services\NotificationService;

class SendNewDeviceAlert
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(NewDeviceLogin $event): void
    {
        $session = $event->session;
        $deviceName = $session->display_name;
        $location = $session->location;

        $type = $event->isSuspicious ? 'SuspiciousLogin' : 'NewDeviceLogin';
        $title = $event->isSuspicious
            ? "Login from unusual location: {$location}"
            : "New login from {$deviceName}";
        $body = "New login from {$deviceName} in {$location}";

        $this->notificationService->notify(
            $event->user,
            $type,
            $title,
            $body,
            [
                'action_url' => '/settings/sessions',
                'session_id' => $session->id,
                'device_name' => $deviceName,
                'location' => $location,
            ],
        );
    }
}
