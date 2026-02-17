<?php

namespace Database\Seeders;

use App\Models\AppVersion;
use Illuminate\Database\Seeder;

class AppVersionSeeder extends Seeder
{
    public function run(): void
    {
        $versions = [
            [
                'version'      => '1.0.0',
                'title'        => 'Initial Release',
                'changelog'    => "### 🎉 e-Khata v1.0.0 — Initial Release\n\n" .
                    "**New Features:**\n" .
                    "- Complete digital khata (ledger) system\n" .
                    "- Party management (customers & suppliers)\n" .
                    "- Debit/Credit transaction recording\n" .
                    "- Real-time balance tracking & running balances\n" .
                    "- Multi-business support with tenant isolation\n" .
                    "- Team management & role-based permissions\n" .
                    "- Reports: Trial Balance, Daybook, Receivable/Payable Aging\n" .
                    "- Shareable ledger links (PDF & live)\n" .
                    "- Session management & activity logging\n" .
                    "- Push notification preferences\n" .
                    "- Bilingual support (English & Urdu)\n\n" .
                    "**Admin Features:**\n" .
                    "- Super Admin dashboard with system overview\n" .
                    "- User & business management\n" .
                    "- System settings (SMS, Email, Notifications)\n" .
                    "- Activity & session monitoring\n\n" .
                    "**Tech Stack:**\n" .
                    "- Laravel 11 API backend\n" .
                    "- React Native (Expo SDK 54) cross-platform frontend\n" .
                    "- Spatie Permissions for RBAC\n" .
                    "- Sanctum token authentication\n",
                'channel'      => 'stable',
                'platform'     => 'all',
                'is_current'   => false,
                'force_update' => false,
                'release_date' => '2026-02-16',
                'released_by'  => 1,
            ],
            [
                'version'      => '1.1.0',
                'title'        => 'UX Polish & Admin Sessions',
                'changelog'    => "### 🚀 e-Khata v1.1.0 — UX Polish & Admin Sessions\n\n" .
                    "**Bug Fixes:**\n" .
                    "- Fixed Rs. NaN in trial balance reports\n" .
                    "- Fixed missing translation keys (transaction.addDebit/addCredit)\n" .
                    "- Fixed duplicate prop on login screen\n" .
                    "- Fixed session_id null in activity logs\n" .
                    "- Fixed SessionService method signature mismatches\n\n" .
                    "**Improvements:**\n" .
                    "- Readable date/time format (dd-MMM-yyyy, hh:mm a) across all screens\n" .
                    "- Mobile number auto-normalized: 03xx → 923xx for WhatsApp compatibility\n" .
                    "- Mobile input restricted to 11 digits with validation\n" .
                    "- formatCurrency/formatAmount handle null/undefined/NaN safely\n\n" .
                    "**New Features:**\n" .
                    "- Searchable dropdown component for party selection & settings\n" .
                    "- Loading overlay on all form submissions\n" .
                    "- Admin session management with full device details\n" .
                    "- Activity log viewer per session (Super Admin)\n" .
                    "- Session revoke capability from admin panel\n",
                'channel'      => 'stable',
                'platform'     => 'all',
                'is_current'   => false,
                'force_update' => false,
                'release_date' => '2026-02-17',
                'released_by'  => 1,
            ],
            [
                'version'      => '1.2.0',
                'title'        => 'Version Control, Profile & Integrations',
                'changelog'    => "### ✨ e-Khata v1.2.0 — Version Control, Profile & Integrations\n\n" .
                    "**New Features:**\n" .
                    "- Version management system for Super Admin\n" .
                    "- Version changelog timeline with release history\n" .
                    "- App version displayed in sidebar and profile\n" .
                    "- Enhanced user profile with avatar, language preference & password change\n" .
                    "- Third-party integrations settings (Meta, Google, Apple, Microsoft)\n" .
                    "- Social sign-in configuration panel\n" .
                    "- Detailed setup documentation for each OAuth provider\n\n" .
                    "**Improvements:**\n" .
                    "- Profile system fully functional with all fields\n" .
                    "- Admin settings organized with Integrations tab\n",
                'channel'      => 'stable',
                'platform'     => 'all',
                'is_current'   => true,
                'force_update' => false,
                'release_date' => '2026-02-17',
                'released_by'  => 1,
            ],
        ];

        foreach ($versions as $v) {
            AppVersion::firstOrCreate(
                ['version' => $v['version'], 'platform' => $v['platform']],
                $v
            );
        }

        $this->command->info('App versions seeded: ' . count($versions) . ' versions.');
    }
}
