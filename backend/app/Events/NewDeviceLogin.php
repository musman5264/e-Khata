<?php

namespace App\Events;

use App\Models\Session;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewDeviceLogin
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
        public Session $session,
        public bool $isSuspicious = false,
    ) {
    }
}
