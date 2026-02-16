<?php

namespace App\Listeners;

use App\Services\ActivityLogService;

class LogActivity
{
    protected ActivityLogService $logService;

    public function __construct(ActivityLogService $logService)
    {
        $this->logService = $logService;
    }

    /**
     * Handle generic events for logging.
     */
    public function handle(object $event): void
    {
        $eventName = class_basename($event);

        $data = [];
        if (property_exists($event, 'transaction')) {
            $data = ['transaction_id' => $event->transaction->id];
        } elseif (property_exists($event, 'payment')) {
            $data = ['payment_id' => $event->payment->id];
        } elseif (property_exists($event, 'session')) {
            $data = ['session_id' => $event->session->id];
        }

        $this->logService->logAction(
            action: strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $eventName)),
            description: "Event: {$eventName}",
            data: $data,
        );
    }
}
