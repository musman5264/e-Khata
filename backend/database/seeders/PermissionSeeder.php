<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    /**
     * Seed permissions and assign to roles.
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'manage_tenant',
            'manage_team',
            'create_party',
            'edit_party',
            'delete_party',
            'create_transaction',
            'edit_transaction',
            'delete_transaction',
            'view_ledger',
            'share_ledger',
            'collect_payment',
            'send_payment',
            'view_reports',
            'view_audit_log',
            // Super Admin permissions
            'manage_system_settings',
            'manage_all_tenants',
            'manage_all_users',
            'view_system_logs',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        // ── Role → Permission Mapping ─────────────────────────

        // Super Admin: all permissions (system-wide access)
        $superAdmin = Role::findByName('Super Admin', 'web');
        $superAdmin->syncPermissions($permissions);

        // Owner: all tenant-level permissions
        $owner = Role::findByName('Owner', 'web');
        $owner->syncPermissions([
            'manage_tenant',
            'manage_team',
            'create_party',
            'edit_party',
            'delete_party',
            'create_transaction',
            'edit_transaction',
            'delete_transaction',
            'view_ledger',
            'share_ledger',
            'collect_payment',
            'send_payment',
            'view_reports',
            'view_audit_log',
        ]);

        // Manager: all except manage_tenant, manage_team, view_audit_log
        $manager = Role::findByName('Manager', 'web');
        $manager->syncPermissions(array_diff($permissions, [
            'manage_tenant', 'manage_team', 'view_audit_log',
        ]));

        // Accountant: party CRUD, transactions, ledger, payments, reports
        $accountant = Role::findByName('Accountant', 'web');
        $accountant->syncPermissions([
            'create_party',
            'create_transaction',
            'view_ledger',
            'share_ledger',
            'collect_payment',
            'view_reports',
        ]);

        // Viewer: read-only
        $viewer = Role::findByName('Viewer', 'web');
        $viewer->syncPermissions([
            'view_ledger',
            'view_reports',
        ]);

        $this->command->info('Permissions seeded and assigned to roles.');
    }
}
