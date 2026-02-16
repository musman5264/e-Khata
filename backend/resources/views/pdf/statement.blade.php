<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Statement — {{ $party->name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 11px; color: #333; line-height: 1.4; }

        .header { border-bottom: 3px solid #1A237E; padding-bottom: 12px; margin-bottom: 10px; }
        .header-row { display: table; width: 100%; }
        .header-left { display: table-cell; vertical-align: top; width: 60%; }
        .header-right { display: table-cell; vertical-align: top; width: 40%; text-align: right; }
        .business-name { font-size: 20px; font-weight: bold; color: #1A237E; }
        .business-info { font-size: 10px; color: #666; margin-top: 4px; }
        .logo { max-height: 60px; max-width: 120px; }

        .party-section { background: #F5F7FA; border: 1px solid #E0E0E0; padding: 10px 14px; margin-bottom: 12px; border-radius: 4px; }
        .party-section table { width: 100%; }
        .party-section td { padding: 2px 0; font-size: 11px; }
        .party-section .label { font-weight: bold; color: #555; width: 120px; }
        .party-section .value { color: #333; }

        .period { font-size: 10px; color: #888; margin-bottom: 10px; text-align: right; }

        .statement-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .statement-table thead th {
            background: #1A237E; color: #fff; padding: 8px 6px; text-align: left; font-size: 10px;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .statement-table thead th.amount { text-align: right; }
        .statement-table tbody td { padding: 6px; border-bottom: 1px solid #E8E8E8; font-size: 10px; }
        .statement-table tbody tr:nth-child(even) { background: #FAFAFA; }
        .statement-table tbody td.amount { text-align: right; font-family: 'DejaVu Sans Mono', monospace; }
        .statement-table tbody td.debit { color: #E53935; }
        .statement-table tbody td.credit { color: #00897B; }
        .statement-table tbody td.balance { font-weight: bold; }

        .totals-row td {
            font-weight: bold; padding: 8px 6px; border-top: 2px solid #1A237E;
            font-size: 11px; background: #F0F0F0;
        }
        .totals-row td.amount { text-align: right; font-family: 'DejaVu Sans Mono', monospace; }

        .dr { color: #E53935; }
        .cr { color: #00897B; }

        .footer {
            margin-top: 20px; padding-top: 10px; border-top: 1px solid #DDD;
            font-size: 8px; color: #999; text-align: center; line-height: 1.6;
        }
        .footer a { color: #1A237E; text-decoration: none; }
        .generated-at { font-size: 8px; color: #BBB; text-align: right; margin-top: 5px; }
    </style>
</head>
<body>
    {{-- ── Header ──────────────────────────────────────────── --}}
    <div class="header">
        <div class="header-row">
            <div class="header-left">
                @if($tenant->logo_url)
                    <img src="{{ $tenant->logo_url }}" alt="{{ $tenant->name }}" class="logo"><br>
                @endif
                <div class="business-name">{{ $tenant->name }}</div>
                <div class="business-info">
                    @if($tenant->address){{ $tenant->address }}@endif
                    @if($tenant->city), {{ $tenant->city }}@endif
                    @if($tenant->phone)<br>{{ $tenant->phone }}@endif
                    @if($tenant->email) | {{ $tenant->email }}@endif
                </div>
            </div>
            <div class="header-right">
                <div style="font-size: 14px; font-weight: bold; color: #1A237E;">ACCOUNT STATEMENT</div>
                @if($party->khata_number)
                    <div style="margin-top: 4px;">Khata #: <strong>{{ $party->khata_number }}</strong></div>
                @endif
                @if($party->book_number)
                    <div>Book #: <strong>{{ $party->book_number }}</strong></div>
                @endif
            </div>
        </div>
    </div>

    {{-- ── Party Info ──────────────────────────────────────── --}}
    <div class="party-section">
        <table>
            <tr>
                <td class="label">Party Name:</td>
                <td class="value"><strong>{{ $party->name }}</strong></td>
                <td class="label">Mobile:</td>
                <td class="value">{{ $party->mobile ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Type:</td>
                <td class="value">{{ ucfirst($party->type) }}</td>
                <td class="label">Address:</td>
                <td class="value">{{ $party->address ?? '—' }}{{ $party->city ? ', ' . $party->city : '' }}</td>
            </tr>
        </table>
    </div>

    {{-- ── Period ──────────────────────────────────────────── --}}
    <div class="period">
        Period:
        {{ $options['date_from'] ? \Carbon\Carbon::parse($options['date_from'])->format('d M Y') : 'Beginning' }}
        —
        {{ $options['date_to'] ? \Carbon\Carbon::parse($options['date_to'])->format('d M Y') : 'Present' }}
    </div>

    {{-- ── Statement Table ─────────────────────────────────── --}}
    <table class="statement-table">
        <thead>
            <tr>
                <th style="width: 12%;">Date</th>
                <th style="width: 35%;">Description</th>
                <th style="width: 13%;">Reference</th>
                <th class="amount" style="width: 13%;">Debit (Dr)</th>
                <th class="amount" style="width: 13%;">Credit (Cr)</th>
                <th class="amount" style="width: 14%;">Balance</th>
            </tr>
        </thead>
        <tbody>
            {{-- Opening Balance Row --}}
            @if($party->opening_balance > 0)
            <tr>
                <td>{{ $options['date_from'] ? \Carbon\Carbon::parse($options['date_from'])->format('d M Y') : '—' }}</td>
                <td><em>Opening Balance</em></td>
                <td>—</td>
                <td class="amount">—</td>
                <td class="amount">—</td>
                <td class="amount balance {{ $party->opening_balance_type === 'dr' ? 'dr' : 'cr' }}">
                    Rs. {{ number_format($party->opening_balance, 2) }}
                    {{ strtoupper($party->opening_balance_type) }}
                </td>
            </tr>
            @endif

            {{-- Transaction Rows --}}
            @foreach($statement['transactions'] as $txn)
            <tr>
                <td>{{ $txn->date->format('d M Y') }}</td>
                <td>{{ $txn->description ?? '—' }}</td>
                <td>{{ $txn->reference_number ?? '—' }}</td>
                <td class="amount debit">
                    {{ $txn->type === 'debit' ? 'Rs. ' . number_format($txn->amount, 2) : '—' }}
                </td>
                <td class="amount credit">
                    {{ $txn->type === 'credit' ? 'Rs. ' . number_format($txn->amount, 2) : '—' }}
                </td>
                <td class="amount balance {{ $txn->running_balance >= 0 ? 'dr' : 'cr' }}">
                    Rs. {{ number_format(abs($txn->running_balance), 2) }}
                    {{ $txn->running_balance >= 0 ? 'Dr' : 'Cr' }}
                </td>
            </tr>
            @endforeach

            {{-- Totals Row --}}
            <tr class="totals-row">
                <td colspan="3" style="text-align: right; padding-right: 10px;"><strong>TOTALS</strong></td>
                <td class="amount dr">Rs. {{ number_format($statement['total_debit'], 2) }}</td>
                <td class="amount cr">Rs. {{ number_format($statement['total_credit'], 2) }}</td>
                <td class="amount {{ $statement['closing_balance'] >= 0 ? 'dr' : 'cr' }}" style="font-size: 12px;">
                    Rs. {{ number_format(abs($statement['closing_balance']), 2) }}
                    {{ $statement['closing_balance'] >= 0 ? 'Dr' : 'Cr' }}
                </td>
            </tr>
        </tbody>
    </table>

    {{-- ── Generated At ────────────────────────────────────── --}}
    <div class="generated-at">
        Generated on {{ now()->format('d M Y, h:i A') }}
    </div>

    {{-- ── Footer (SEO / Branding) ─────────────────────────── --}}
    <div class="footer">
        Generated by <strong>e-Khata</strong> | Powered by
        <a href="https://www.esystematics.com">Esystematic Technologies</a> |
        <a href="https://www.esystematics.com/services.php">Software Development Services</a><br>
        Gujranwala, Pakistan | 0311-3999345 | 0334-5266444
    </div>
</body>
</html>
