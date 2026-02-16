<?php

namespace App\Listeners;

use App\Events\NewDeviceLogin;
use Illuminate\Support\Facades\Log;

class DetectSuspiciousActivity
{
    public function handle(NewDeviceLogin $event): void
    {
        if ($event->isSuspicious) {
            Log::channel('auth')->warning('Suspicious login detected', [
                'user_id' => $event->user->id,
                'session_id' => $event->session->id,
                'device' => $event->session->display_name,
                'location' => $event->session->location,
                'ip' => $event->session->ip_address,
            ]);
        }
    }
}
