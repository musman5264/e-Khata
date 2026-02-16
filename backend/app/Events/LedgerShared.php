<?php

namespace App\Events;

use App\Models\LedgerShare;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LedgerShared
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public LedgerShare $share,
        public string $channel, // pdf, whatsapp, email, link
    ) {
    }
}
