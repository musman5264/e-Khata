<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name'             => 'Free Trial',
                'slug'             => 'free-trial',
                'description'      => '14-day free trial with basic features to get started.',
                'price'            => 0.00,
                'billing_cycle'    => 'monthly',
                'duration_days'    => 14,
                'max_parties'      => 10,
                'max_users'        => 2,
                'max_transactions' => 100,
                'has_reports'      => true,
                'has_payment_links'=> false,
                'has_sms'          => false,
                'has_whatsapp'     => false,
                'trial_days'       => 14,
                'is_active'        => true,
                'sort_order'       => 0,
            ],
            [
                'name'             => 'Basic Monthly',
                'slug'             => 'basic-monthly',
                'description'      => 'Essential features for small businesses. Manage parties, transactions and reports.',
                'price'            => 500.00,
                'billing_cycle'    => 'monthly',
                'duration_days'    => 30,
                'max_parties'      => 50,
                'max_users'        => 3,
                'max_transactions' => 500,
                'has_reports'      => true,
                'has_payment_links'=> true,
                'has_sms'          => false,
                'has_whatsapp'     => false,
                'trial_days'       => 7,
                'is_active'        => true,
                'sort_order'       => 1,
            ],
            [
                'name'             => 'Basic Yearly',
                'slug'             => 'basic-yearly',
                'description'      => 'Essential features at a discounted yearly price. Save 17% compared to monthly.',
                'price'            => 5000.00,
                'billing_cycle'    => 'yearly',
                'duration_days'    => 365,
                'max_parties'      => 50,
                'max_users'        => 3,
                'max_transactions' => 500,
                'has_reports'      => true,
                'has_payment_links'=> true,
                'has_sms'          => false,
                'has_whatsapp'     => false,
                'trial_days'       => 7,
                'is_active'        => true,
                'sort_order'       => 2,
            ],
            [
                'name'             => 'Pro Monthly',
                'slug'             => 'pro-monthly',
                'description'      => 'Advanced features for growing businesses. Unlimited parties with SMS & WhatsApp.',
                'price'            => 1500.00,
                'billing_cycle'    => 'monthly',
                'duration_days'    => 30,
                'max_parties'      => 0, // unlimited
                'max_users'        => 10,
                'max_transactions' => 0, // unlimited
                'has_reports'      => true,
                'has_payment_links'=> true,
                'has_sms'          => true,
                'has_whatsapp'     => true,
                'trial_days'       => 7,
                'is_active'        => true,
                'sort_order'       => 3,
            ],
            [
                'name'             => 'Pro Yearly',
                'slug'             => 'pro-yearly',
                'description'      => 'Advanced features at a discounted yearly price. Save 17% compared to monthly.',
                'price'            => 15000.00,
                'billing_cycle'    => 'yearly',
                'duration_days'    => 365,
                'max_parties'      => 0, // unlimited
                'max_users'        => 10,
                'max_transactions' => 0, // unlimited
                'has_reports'      => true,
                'has_payment_links'=> true,
                'has_sms'          => true,
                'has_whatsapp'     => true,
                'trial_days'       => 7,
                'is_active'        => true,
                'sort_order'       => 4,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }

        echo "Subscription plans seeded: " . count($plans) . " plans.\n";
    }
}
