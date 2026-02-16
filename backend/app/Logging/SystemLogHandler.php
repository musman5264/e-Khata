<?php

namespace App\Logging;

use App\Models\SystemLog;
use Monolog\Handler\AbstractProcessingHandler;
use Monolog\Level;
use Monolog\LogRecord;

class SystemLogHandler extends AbstractProcessingHandler
{
    protected string $channel;

    public function __construct(string $channel = 'general', int|string|Level $level = Level::Debug, bool $bubble = true)
    {
        parent::__construct($level, $bubble);
        $this->channel = $channel;
    }

    protected function write(LogRecord $record): void
    {
        try {
            $level = match ($record->level) {
                Level::Emergency, Level::Critical, Level::Alert => 'critical',
                Level::Error => 'error',
                Level::Warning => 'warning',
                default => 'info',
            };

            SystemLog::create([
                'level' => $level,
                'channel' => $this->channel,
                'message' => $record->message,
                'context' => !empty($record->context) ? $record->context : null,
                'ip_address' => request()?->ip(),
                'user_id' => auth()->id(),
                'tenant_id' => app()->bound('currentTenant') ? app('currentTenant')?->id : null,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Prevent infinite loops
        }
    }
}
