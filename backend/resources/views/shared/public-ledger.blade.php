<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Statement — {{ $party->name }}</title>
    <meta name="description" content="Account statement for {{ $party->name }} from {{ $tenant->name }}">

    <!-- Open Graph -->
    <meta property="og:title" content="Account Statement — {{ $party->name }}">
    <meta property="og:description" content="View your account ledger from {{ $tenant->name }}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url('/shared/' . $share->share_token) }}">
    <link rel="canonical" href="{{ url('/shared/' . $share->share_token) }}">

    <!-- JSON-LD -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "e-Khata",
        "operatingSystem": "Android, iOS, Web",
        "applicationCategory": "BusinessApplication",
        "description": "Multi-Tenant Digital Ledger System for Pakistani businesses",
        "url": "https://www.esystematics.com",
        "author": {
            "@type": "Organization",
            "name": "Esystematic Technologies",
            "url": "https://www.esystematics.com"
        }
    }
    </script>

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #F5F5F5; color: #333; line-height: 1.5;
        }
        .container { max-width: 900px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); overflow: hidden; }

        .header { background: #1A237E; color: #fff; padding: 24px 30px; }
        .header h1 { font-size: 22px; margin-bottom: 4px; }
        .header p { font-size: 13px; opacity: 0.85; }

        .info-bar { display: flex; justify-content: space-between; padding: 16px 30px; background: #F8F9FC; border-bottom: 1px solid #E8E8E8; flex-wrap: wrap; gap: 12px; }
        .info-group h3 { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 2px; letter-spacing: 0.5px; }
        .info-group p { font-size: 14px; font-weight: 600; color: #333; }

        .statement-wrapper { padding: 20px 30px; overflow-x: auto; }

        table { width: 100%; border-collapse: collapse; }
        thead th { background: #F0F0F0; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; border-bottom: 2px solid #DDD; }
        thead th.amount { text-align: right; }
        tbody td { padding: 10px 12px; border-bottom: 1px solid #F0F0F0; font-size: 13px; }
        tbody tr:hover { background: #FAFAFA; }
        tbody td.amount { text-align: right; font-family: 'Courier New', monospace; }
        .debit { color: #E53935; }
        .credit { color: #00897B; }
        .balance { font-weight: 600; }

        .totals-row td { font-weight: bold; border-top: 2px solid #1A237E; background: #F5F5F5; font-size: 14px; }

        .summary-cards { display: flex; gap: 16px; padding: 20px 30px; flex-wrap: wrap; }
        .summary-card { flex: 1; min-width: 150px; padding: 16px; border-radius: 8px; text-align: center; }
        .summary-card.debit-card { background: #FFEBEE; }
        .summary-card.credit-card { background: #E0F2F1; }
        .summary-card.net-card { background: #E8EAF6; }
        .summary-card .label { font-size: 11px; text-transform: uppercase; color: #666; }
        .summary-card .value { font-size: 20px; font-weight: bold; margin-top: 4px; }
        .summary-card.debit-card .value { color: #E53935; }
        .summary-card.credit-card .value { color: #00897B; }
        .summary-card.net-card .value { color: #1A237E; }

        .footer { padding: 16px 30px; background: #FAFAFA; border-top: 1px solid #E8E8E8; text-align: center; font-size: 11px; color: #999; }
        .footer a { color: #1A237E; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }

        .expired { text-align: center; padding: 60px 30px; }
        .expired h2 { color: #E53935; margin-bottom: 10px; }

        @media (max-width: 600px) {
            .info-bar { flex-direction: column; }
            .summary-cards { flex-direction: column; }
            .container { margin: 0; border-radius: 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        {{-- Header --}}
        <div class="header">
            <h1>{{ $tenant->name }}</h1>
            <p>{{ $tenant->address }}{{ $tenant->city ? ', ' . $tenant->city : '' }}{{ $tenant->phone ? ' | ' . $tenant->phone : '' }}</p>
        </div>

        {{-- Info Bar --}}
        <div class="info-bar">
            <div class="info-group">
                <h3>Party</h3>
                <p>{{ $party->name }}</p>
            </div>
            @if($party->mobile)
            <div class="info-group">
                <h3>Mobile</h3>
                <p>{{ $party->mobile }}</p>
            </div>
            @endif
            @if($party->khata_number)
            <div class="info-group">
                <h3>Khata #</h3>
                <p>{{ $party->khata_number }}</p>
            </div>
            @endif
            <div class="info-group">
                <h3>Period</h3>
                <p>
                    {{ $share->date_from ? \Carbon\Carbon::parse($share->date_from)->format('d M Y') : 'Start' }}
                    — {{ $share->date_to ? \Carbon\Carbon::parse($share->date_to)->format('d M Y') : 'Present' }}
                </p>
            </div>
        </div>

        {{-- Summary Cards --}}
        <div class="summary-cards">
            <div class="summary-card debit-card">
                <div class="label">Total Debit</div>
                <div class="value">Rs. {{ number_format($totalDebit, 2) }}</div>
            </div>
            <div class="summary-card credit-card">
                <div class="label">Total Credit</div>
                <div class="value">Rs. {{ number_format($totalCredit, 2) }}</div>
            </div>
            <div class="summary-card net-card">
                <div class="label">Balance</div>
                <div class="value">
                    Rs. {{ number_format(abs($closingBalance), 2) }}
                    {{ $closingBalance >= 0 ? 'Dr' : 'Cr' }}
                </div>
            </div>
        </div>

        {{-- Statement Table --}}
        <div class="statement-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style="width: 12%;">Date</th>
                        <th style="width: 32%;">Description</th>
                        <th style="width: 14%;">Reference</th>
                        <th class="amount" style="width: 14%;">Debit</th>
                        <th class="amount" style="width: 14%;">Credit</th>
                        <th class="amount" style="width: 14%;">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($transactions as $txn)
                    <tr>
                        <td>{{ $txn->date->format('d M Y') }}</td>
                        <td>{{ $txn->description ?? '—' }}</td>
                        <td>{{ $txn->reference_number ?? '—' }}</td>
                        <td class="amount debit">
                            {{ $txn->type === 'debit' ? 'Rs. ' . number_format($txn->amount, 2) : '' }}
                        </td>
                        <td class="amount credit">
                            {{ $txn->type === 'credit' ? 'Rs. ' . number_format($txn->amount, 2) : '' }}
                        </td>
                        <td class="amount balance {{ $txn->running_balance >= 0 ? 'debit' : 'credit' }}">
                            Rs. {{ number_format(abs($txn->running_balance), 2) }}
                            {{ $txn->running_balance >= 0 ? 'Dr' : 'Cr' }}
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 30px; color: #999;">No transactions found.</td>
                    </tr>
                    @endforelse

                    @if($transactions->count() > 0)
                    <tr class="totals-row">
                        <td colspan="3" style="text-align: right; padding-right: 12px;">TOTALS</td>
                        <td class="amount debit">Rs. {{ number_format($totalDebit, 2) }}</td>
                        <td class="amount credit">Rs. {{ number_format($totalCredit, 2) }}</td>
                        <td class="amount balance">
                            Rs. {{ number_format(abs($closingBalance), 2) }}
                            {{ $closingBalance >= 0 ? 'Dr' : 'Cr' }}
                        </td>
                    </tr>
                    @endif
                </tbody>
            </table>
        </div>

        {{-- Footer --}}
        <div class="footer">
            Developed by <a href="https://www.esystematics.com" target="_blank">Esystematic Technologies</a> —
            <a href="https://www.esystematics.com/services.php" target="_blank">Software Development Services</a> —
            Gujranwala, Pakistan — 0311-3999345 / 0334-5266444
        </div>
    </div>
</body>
</html>
