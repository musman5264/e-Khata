<?php

namespace App\Console\Commands;

use App\Models\AccessLog;
use Illuminate\Console\Command;

class PurgeLogs extends Command
{
    protected $signature = 'logs:purge {--days=90 : Number of days to retain}';
    protected $description = 'Purge old access logs beyond retention period';

    public function handle(): void
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $deleted = AccessLog::where('created_at', '<', $cutoff)->delete();

        $this->info("Purged {$deleted} access log records older than {$days} days.");
    }
}
