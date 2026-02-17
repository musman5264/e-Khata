<?php

namespace Database\Seeders;

use App\Models\Party;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    /**
     * Seed demo tenant, user, parties, and transactions.
     */
    public function run(): void
    {
        $today = Carbon::today();

        // ── Super Admin User ─────────────────────────────────
        $superAdmin = User::firstOrCreate(
            ['mobile' => '923009999999'],
            [
                'name' => 'Super Admin',
                'email' => 'admin@ekhata.pk',
                'mobile' => '923009999999',
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
                'mobile' => '923001234567',
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

        // Attach users to tenant
        $tenant->users()->syncWithoutDetaching([
            $user->id => ['joined_at' => now()],
            $superAdmin->id => ['joined_at' => now()],
        ]);

        if (!$user->hasRole('Owner')) {
            $user->assignRole('Owner');
        }

        // Bind tenant for BelongsToTenant scope
        app()->instance('currentTenant', $tenant);

        // ── Demo Parties (15 parties) ────────────────────────
        $partiesData = [
            // Existing 5
            ['name' => 'XYZ Traders', 'mobile' => '923111111111', 'type' => 'customer', 'khata_number' => '001', 'book_number' => 'A-1', 'opening_balance' => 5000, 'opening_balance_type' => 'dr', 'city' => 'Gujranwala'],
            ['name' => 'ABC Suppliers', 'mobile' => '923222222222', 'type' => 'supplier', 'khata_number' => '002', 'book_number' => 'A-1', 'opening_balance' => 15000, 'opening_balance_type' => 'cr', 'city' => 'Lahore'],
            ['name' => 'PQR General Store', 'mobile' => '923333333333', 'type' => 'both', 'khata_number' => '003', 'book_number' => 'A-1', 'opening_balance' => 0, 'opening_balance_type' => 'dr', 'city' => 'Faisalabad'],
            ['name' => 'Muhammad Ali & Sons', 'mobile' => '923444444444', 'type' => 'customer', 'khata_number' => '004', 'book_number' => 'A-2', 'opening_balance' => 25000, 'opening_balance_type' => 'dr', 'city' => 'Sialkot'],
            ['name' => 'Noor Fabrics', 'mobile' => '923555555555', 'type' => 'supplier', 'khata_number' => '005', 'book_number' => 'A-2', 'opening_balance' => 50000, 'opening_balance_type' => 'cr', 'city' => 'Gujranwala'],
            // New 10
            ['name' => 'Rashid Hardware', 'mobile' => '923016666666', 'type' => 'supplier', 'khata_number' => '006', 'book_number' => 'B-1', 'opening_balance' => 32000, 'opening_balance_type' => 'cr', 'city' => 'Rawalpindi'],
            ['name' => 'Bilal Cloth House', 'mobile' => '923027777777', 'type' => 'customer', 'khata_number' => '007', 'book_number' => 'B-1', 'opening_balance' => 18000, 'opening_balance_type' => 'dr', 'city' => 'Multan'],
            ['name' => 'Karachi Dry Fruits', 'mobile' => '923038888888', 'type' => 'customer', 'khata_number' => '008', 'book_number' => 'B-1', 'opening_balance' => 45000, 'opening_balance_type' => 'dr', 'city' => 'Karachi'],
            ['name' => 'Jinnah Electronics', 'mobile' => '923049999999', 'type' => 'both', 'khata_number' => '009', 'book_number' => 'B-2', 'opening_balance' => 12000, 'opening_balance_type' => 'cr', 'city' => 'Islamabad'],
            ['name' => 'Lahore Steel Works', 'mobile' => '923051112222', 'type' => 'supplier', 'khata_number' => '010', 'book_number' => 'B-2', 'opening_balance' => 75000, 'opening_balance_type' => 'cr', 'city' => 'Lahore'],
            ['name' => 'Faisal Auto Parts', 'mobile' => '923062223333', 'type' => 'customer', 'khata_number' => '011', 'book_number' => 'B-2', 'opening_balance' => 8500, 'opening_balance_type' => 'dr', 'city' => 'Peshawar'],
            ['name' => 'Hamza Rice Mills', 'mobile' => '923073334444', 'type' => 'supplier', 'khata_number' => '012', 'book_number' => 'C-1', 'opening_balance' => 120000, 'opening_balance_type' => 'cr', 'city' => 'Gujranwala'],
            ['name' => 'Al-Madina Textiles', 'mobile' => '923084445555', 'type' => 'customer', 'khata_number' => '013', 'book_number' => 'C-1', 'opening_balance' => 35000, 'opening_balance_type' => 'dr', 'city' => 'Faisalabad'],
            ['name' => 'Siddiqui Brothers', 'mobile' => '923095556666', 'type' => 'both', 'khata_number' => '014', 'book_number' => 'C-1', 'opening_balance' => 22000, 'opening_balance_type' => 'dr', 'city' => 'Hyderabad'],
            ['name' => 'Khan Timber Mart', 'mobile' => '923106667777', 'type' => 'customer', 'khata_number' => '015', 'book_number' => 'C-2', 'opening_balance' => 0, 'opening_balance_type' => 'dr', 'city' => 'Quetta'],
        ];

        $parties = [];
        foreach ($partiesData as $pData) {
            $parties[] = Party::firstOrCreate(
                ['tenant_id' => $tenant->id, 'mobile' => $pData['mobile']],
                array_merge($pData, [
                    'tenant_id' => $tenant->id,
                    'created_by' => $user->id,
                    'is_active' => true,
                ])
            );
        }

        // ── Historical Transactions (past 30 days) ───────────
        // Only seed if party has no transactions yet
        foreach ($parties as $party) {
            if ($party->transactions()->count() > 0) {
                continue;
            }
            $this->seedHistoricalTransactions($party, $user, $tenant, $today);
        }

        // ── Today's Transactions (daybook entries) ───────────
        $this->seedTodayTransactions($parties, $user, $tenant, $today);

        // ── Payments ─────────────────────────────────────────
        $this->seedPayments($parties, $user, $tenant, $today);

        $countP = Party::where('tenant_id', $tenant->id)->count();
        $countT = Transaction::where('tenant_id', $tenant->id)->count();
        $countPay = Payment::where('tenant_id', $tenant->id)->count();
        $this->command->info("Demo data seeded: {$countP} parties, {$countT} transactions, {$countPay} payments.");
    }

    /**
     * Seed historical transactions spread over last 30 days for a party.
     */
    protected function seedHistoricalTransactions(Party $party, User $user, Tenant $tenant, Carbon $today): void
    {
        // Vary transaction count by party
        $txnTemplates = [
            ['type' => 'debit', 'amount' => rand(5000, 25000), 'desc' => 'Goods delivered', 'days' => 28],
            ['type' => 'credit', 'amount' => rand(3000, 15000), 'desc' => 'Cash payment received', 'days' => 25],
            ['type' => 'debit', 'amount' => rand(8000, 35000), 'desc' => 'Material supplied', 'days' => 22],
            ['type' => 'credit', 'amount' => rand(5000, 20000), 'desc' => 'Cheque cleared', 'days' => 18],
            ['type' => 'debit', 'amount' => rand(2000, 12000), 'desc' => 'Additional stock', 'days' => 14],
            ['type' => 'credit', 'amount' => rand(4000, 18000), 'desc' => 'Bank transfer received', 'days' => 11],
            ['type' => 'debit', 'amount' => rand(6000, 20000), 'desc' => 'Order #' . rand(100, 999), 'days' => 8],
            ['type' => 'credit', 'amount' => rand(2000, 10000), 'desc' => 'Partial payment', 'days' => 5],
            ['type' => 'debit', 'amount' => rand(3000, 15000), 'desc' => 'Delivery batch', 'days' => 3],
            ['type' => 'credit', 'amount' => rand(5000, 25000), 'desc' => 'Settlement payment', 'days' => 1],
        ];

        $balance = $party->opening_balance_type === 'dr'
            ? (float) $party->opening_balance
            : -(float) $party->opening_balance;

        foreach ($txnTemplates as $t) {
            $balance += ($t['type'] === 'debit' ? $t['amount'] : -$t['amount']);

            Transaction::create([
                'tenant_id' => $tenant->id,
                'party_id' => $party->id,
                'user_id' => $user->id,
                'type' => $t['type'],
                'amount' => $t['amount'],
                'running_balance' => $balance,
                'date' => $today->copy()->subDays($t['days']),
                'description' => $t['desc'],
                'reference_number' => 'REF-' . strtoupper(Str::random(6)),
            ]);
        }
    }

    /**
     * Seed today's transactions across multiple parties for daybook.
     */
    protected function seedTodayTransactions(array $parties, User $user, Tenant $tenant, Carbon $today): void
    {
        // Check if we already seeded today's transactions
        $existingToday = Transaction::where('tenant_id', $tenant->id)
            ->whereDate('date', $today)
            ->count();
        if ($existingToday > 0) {
            return;
        }

        $todayTxns = [
            // Morning transactions
            ['party_idx' => 0, 'type' => 'debit', 'amount' => 12500, 'desc' => 'Morning delivery — 50 bags cement'],
            ['party_idx' => 1, 'type' => 'credit', 'amount' => 28000, 'desc' => 'Payment for last month invoice #INV-2026-041'],
            ['party_idx' => 2, 'type' => 'debit', 'amount' => 8750, 'desc' => 'Store supplies ordered'],
            ['party_idx' => 3, 'type' => 'credit', 'amount' => 15000, 'desc' => 'Cash received at shop counter'],
            ['party_idx' => 4, 'type' => 'debit', 'amount' => 42000, 'desc' => 'Fabric roll — 200 meters polyester'],
            // Mid-day transactions
            ['party_idx' => 5, 'type' => 'credit', 'amount' => 18500, 'desc' => 'Cheque deposit — UBL Bank'],
            ['party_idx' => 6, 'type' => 'debit', 'amount' => 9200, 'desc' => 'Cloth pieces — 15 suits'],
            ['party_idx' => 7, 'type' => 'credit', 'amount' => 35000, 'desc' => 'Dry fruits consignment settled'],
            ['party_idx' => 8, 'type' => 'debit', 'amount' => 6300, 'desc' => 'TV wall mount bracket + cables'],
            ['party_idx' => 9, 'type' => 'credit', 'amount' => 55000, 'desc' => 'Steel bars — partial payment via JazzCash'],
            // Afternoon transactions
            ['party_idx' => 10, 'type' => 'debit', 'amount' => 4800, 'desc' => 'Brake pads + oil filter'],
            ['party_idx' => 11, 'type' => 'credit', 'amount' => 95000, 'desc' => 'Rice export payment — 500kg Basmati'],
            ['party_idx' => 12, 'type' => 'debit', 'amount' => 22000, 'desc' => 'Cotton bales — 5 bales Super Fine'],
            ['party_idx' => 13, 'type' => 'debit', 'amount' => 11500, 'desc' => 'Mixed goods shipment — Hyderabad'],
            ['party_idx' => 14, 'type' => 'credit', 'amount' => 7500, 'desc' => 'Timber planks advance payment'],
            // Late afternoon
            ['party_idx' => 0, 'type' => 'credit', 'amount' => 10000, 'desc' => 'XYZ Traders — evening payment'],
            ['party_idx' => 3, 'type' => 'debit', 'amount' => 18000, 'desc' => 'Second batch goods — Ali & Sons'],
            ['party_idx' => 7, 'type' => 'debit', 'amount' => 27500, 'desc' => 'Premium Kaju — 25kg @ Rs.1100/kg'],
            ['party_idx' => 12, 'type' => 'credit', 'amount' => 16000, 'desc' => 'Al-Madina partial clearance'],
            ['party_idx' => 9, 'type' => 'debit', 'amount' => 38000, 'desc' => 'MS Pipe — 2 inch 20 ft x 10 pcs'],
        ];

        foreach ($todayTxns as $txn) {
            $party = $parties[$txn['party_idx']];

            // Get current balance
            $lastTxn = Transaction::where('tenant_id', $tenant->id)
                ->where('party_id', $party->id)
                ->orderByDesc('date')->orderByDesc('id')->first();

            $balance = $lastTxn
                ? (float) $lastTxn->running_balance
                : ($party->opening_balance_type === 'dr' ? (float) $party->opening_balance : -(float) $party->opening_balance);

            $balance += ($txn['type'] === 'debit' ? $txn['amount'] : -$txn['amount']);

            Transaction::create([
                'tenant_id' => $tenant->id,
                'party_id' => $party->id,
                'user_id' => $user->id,
                'type' => $txn['type'],
                'amount' => $txn['amount'],
                'running_balance' => $balance,
                'date' => $today,
                'description' => $txn['desc'],
                'reference_number' => 'TDY-' . strtoupper(Str::random(5)),
            ]);
        }
    }

    /**
     * Seed payments (JazzCash / EasyPaisa / Bank) over last 2 weeks + today.
     */
    protected function seedPayments(array $parties, User $user, Tenant $tenant, Carbon $today): void
    {
        if (Payment::where('tenant_id', $tenant->id)->count() > 0) {
            return;
        }

        $paymentsData = [
            // Historical payments
            ['party_idx' => 0, 'gateway' => 'jazzcash', 'direction' => 'inbound', 'amount' => 8000, 'status' => 'completed', 'days_ago' => 12],
            ['party_idx' => 1, 'gateway' => 'easypaisa', 'direction' => 'outbound', 'amount' => 15000, 'status' => 'completed', 'days_ago' => 10],
            ['party_idx' => 3, 'gateway' => 'jazzcash', 'direction' => 'inbound', 'amount' => 20000, 'status' => 'completed', 'days_ago' => 8],
            ['party_idx' => 4, 'gateway' => 'easypaisa', 'direction' => 'outbound', 'amount' => 30000, 'status' => 'completed', 'days_ago' => 6],
            ['party_idx' => 7, 'gateway' => 'jazzcash', 'direction' => 'inbound', 'amount' => 25000, 'status' => 'completed', 'days_ago' => 4],
            ['party_idx' => 9, 'gateway' => 'easypaisa', 'direction' => 'outbound', 'amount' => 55000, 'status' => 'completed', 'days_ago' => 3],
            ['party_idx' => 11, 'gateway' => 'jazzcash', 'direction' => 'inbound', 'amount' => 45000, 'status' => 'completed', 'days_ago' => 2],
            // Today's payments
            ['party_idx' => 5, 'gateway' => 'easypaisa', 'direction' => 'inbound', 'amount' => 18500, 'status' => 'completed', 'days_ago' => 0],
            ['party_idx' => 9, 'gateway' => 'jazzcash', 'direction' => 'outbound', 'amount' => 55000, 'status' => 'completed', 'days_ago' => 0],
            ['party_idx' => 14, 'gateway' => 'easypaisa', 'direction' => 'inbound', 'amount' => 7500, 'status' => 'completed', 'days_ago' => 0],
            // Pending payment
            ['party_idx' => 12, 'gateway' => 'jazzcash', 'direction' => 'inbound', 'amount' => 16000, 'status' => 'pending', 'days_ago' => 0],
        ];

        foreach ($paymentsData as $pd) {
            $party = $parties[$pd['party_idx']];
            $completedAt = $pd['status'] === 'completed' ? $today->copy()->subDays($pd['days_ago']) : null;

            Payment::create([
                'tenant_id' => $tenant->id,
                'party_id' => $party->id,
                'gateway' => $pd['gateway'],
                'direction' => $pd['direction'],
                'amount' => $pd['amount'],
                'currency' => 'PKR',
                'status' => $pd['status'],
                'gateway_txn_ref' => strtoupper($pd['gateway']) . '-' . now()->format('Ymd') . '-' . strtoupper(Str::random(8)),
                'gateway_response' => ['status' => $pd['status'], 'ref' => Str::random(12)],
                'initiated_by' => $user->id,
                'completed_at' => $completedAt,
            ]);
        }
    }
}
