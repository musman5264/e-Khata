<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Seed the default system settings.
     */
    public function run(): void
    {
        foreach (SystemSetting::defaults() as $setting) {
            SystemSetting::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('System settings seeded: ' . count(SystemSetting::defaults()) . ' settings.');
    }
}
