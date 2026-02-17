<?php

use App\Models\SystemSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $defaults = SystemSetting::defaults();
        $newGroups = ['firebase', 'google_cloud'];

        foreach ($defaults as $setting) {
            if (in_array($setting['group'], $newGroups)) {
                SystemSetting::firstOrCreate(
                    ['key' => $setting['key']],
                    $setting
                );
            }
        }
    }

    public function down(): void
    {
        SystemSetting::whereIn('group', ['firebase', 'google_cloud'])->delete();
    }
};
