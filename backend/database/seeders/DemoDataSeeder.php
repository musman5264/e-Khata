<?php

namespace Database\Seeders;

use App\Models\Party;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    /**
     * Seed demo tenant, user, parties, and transactions.
     */
    public function run(): void
    {
        // ── Super Admin User ─────────────────────────────────
        $superAdmin = User::firstOrCreate(
            ['mobile' => '03009999999'],
            [
                'name' => 'Super Admin',
                'email' => 'admin@ekhata.pk',
                'mobile' => '03009999999',
                'password' => Hash::make('admin123'),
                'language_pref' => 'en',
                'is_active' => true,
            ]
        );

        if (!$superAdmin->hasRole('Super Admin')) {
            $superAdmin->assignRole('Super Admin');
        }

        $this->command->info('Super Admin created: mobile=03009999999 / password=admin123');

        // ── Demo User ────────────────────────────────────────
        $user = User::firstOrCreate(
            ['email' => 'demo@ekhata.pk'],
            [
                'name' => 'Demo User',
                'email' => 'demo@ekhata.pk',
                'mobile' => '03001234567',
                'password' => Hash::make('password'),
                'language_pref' => 'en',
                'is_active' => true,
            ]
        );

        // ── Demo Tenant ──────────────────────────────────────
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'demo-business'],
            [
                'name' => 'Demo Business',
                'slug' => 'demo-business',
                'address' => '123 Main Road',
                'city' => 'Gujranwala',
                'phone' => '03001234567',
                'email' => 'demo@ekhata.pk',
                'is_active' => true,
                'settings' => Tenant::defaultSettings(),
            ]
        );

        // Attach demo user to tenant
        $tenant->users()->syncWithoutDetaching([$user->id => ['joined_at' => now()]]);

        // Assign Owner role to demo user
        if (!$user->hasRole('Owner')) {
            $user->assignRole('Owner');
        }

        // Attach Super Admin to demo tenant too (so Super Admin can use tenant features)
        $tenant->users()->syncWithoutDetaching([$superAdmin->id => ['joined_at' => now()]]);

        // Bind tenant for BelongsToTenant scope
        app()->instance('currentTenant', $tenant);

        // ── Demo Parties ─────────────────────────────────────
        $parties = [
            [
                'name' => 'XYZ Traders',
                'mobile' => '03111111111',
                'type' => 'customer',
                'khata_number' => '001',
                'book_number' => 'A-1',
                'opening_balance' => 5000,
                'opening_balance_type' => 'dr',
                'city' => 'Gujranwala',
            ],
            [
                'name' => 'ABC Suppliers',
                'mobile' => '03222222222',
                'type' => 'supplier',
                'khata_number' => '002',
                'book_number' => 'A-1',
                'opening_balance' => 15000,
                'opening_balance_type' => 'cr',
                'city' => 'Lahore',
            ],
            [
                'name' => 'PQR General Store',
                'mobile' => '03333333333',
                'type' => 'both',
                'khata_number' => '003',
                'book_number' => 'A-1',
                'opening_balance' => 0,
                'opening_balance_type' => 'dr',
                'city' => 'Faisalabad',
            ],
            [
                'name' => 'Muhammad Ali & Sons',
                'mobile' => '03444444444',
                'type' => 'customer',
                'khata_number' => '004',
                'book_number' => 'A-2',
                'opening_balance' => 25000,
                'opening_balance_type' => 'dr',
                'city' => 'Sialkot',
            ],
            [
                'name' => 'Noor Fabrics',
                'mobile' => '03555555555',
                'type' => 'supplier',
                'khata_number' => '005',
                'book_number' => 'A-2',
                'opening_balance' => 50000,
                'opening_balance_type' => 'cr',
                'city' => 'Gujranwala',
            ],
        ];

        foreach ($parties as $partyData) {
            $party = Party::firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'mobile' => $partyData['mobile'],
                ],
                array_merge($partyData, [
                    'tenant_id' => $tenant->id,
                    'created_by' => $user->id,
                    'is_active' => true,
                ])
            );

            // ── Demo Transactions ────────────────────────────
            if ($party->wasRecentlyCreated) {
                $this->seedTransactions($party, $user, $tenant);
            }
        }

        $this->command->info('Demo data seeded: 1 super admin, 1 demo user, 1 tenant, 5 parties with transactions.');
    }

    protected function seedTransactions(Party $party, User $user, Tenant $tenant): void
    {
        $transactions = [
            ['type' => 'debit', 'amount' => 10000, 'description' => 'Goods delivered', 'days_ago' => 25],
            ['type' => 'credit', 'amount' => 8000, 'description' => 'Cash payment received', 'days_ago' => 20],
            ['type' => 'debit', 'amount' => 15000, 'description' => 'Material supplied', 'days_ago' => 15],
            ['type' => 'credit', 'amount' => 5000, 'description' => 'Partial payment', 'days_ago' => 10],
            ['type' => 'debit', 'amount' => 7500, 'description' => 'Additional order', 'days_ago' => 5],
            ['type' => 'credit', 'amount' => 12000, 'description' => 'Bank transfer received', 'days_ago' => 2],
        ];

        // Calculate running balance starting from opening balance
        $balance = $party->opening_balance_type === 'dr'
            ? (float)$party->opening_balance
            : -(float)$party->opening_balance;

        foreach ($transactions as $txnData) {
            if ($txnData['type'] === 'debit') {
                $balance += $txnData['amount'];
            } else {
                $balance -= $txnData['amount'];
            }

            Transaction::create([
                'tenant_id' => $tenant->id,
                'party_id' => $party->id,
                'user_id' => $user->id,
                'type' => $txnData['type'],
                'amount' => $txnData['amount'],
                'running_balance' => $balance,
                'date' => now()->subDays($txnData['days_ago']),
                'description' => $txnData['description'],
            ]);
        }
    }
}
