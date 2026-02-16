<?php

namespace App\Observers;

use App\Models\Party;
use App\Services\ActivityLogService;

class PartyObserver
{
    /**
     * After party is created.
     */
    public function created(Party $party): void
    {
        // Activity logging handled by LogsActivity trait
    }

    /**
     * After party is updated.
     */
    public function updated(Party $party): void
    {
        // Activity logging handled by LogsActivity trait
    }

    /**
     * After party is deleted.
     */
    public function deleted(Party $party): void
    {
        // Activity logging handled by LogsActivity trait
    }
}
