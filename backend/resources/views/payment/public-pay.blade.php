<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pay {{ $link->tenant?->name }} — e-Khata</title>
    <meta name="description" content="Payment of Rs {{ number_format($link->amount) }} to {{ $link->tenant?->name }}">
    <meta property="og:title" content="Pay {{ $link->tenant?->name }}">
    <meta property="og:description" content="Pay Rs {{ number_format($link->amount) }} via {{ ucfirst($link->gateway) }}">
    <meta property="og:type" content="website">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #F5F5F5; color: #333; line-height: 1.5;
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
        }
        .card {
            max-width: 420px; width: 90%; background: #fff; border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1); overflow: hidden; margin: 20px;
        }
        .header {
            background: linear-gradient(135deg, #1A237E 0%, #283593 100%);
            color: #fff; padding: 28px 24px; text-align: center;
        }
        .header .logo { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .header .subtitle { font-size: 13px; opacity: 0.85; }
        .body { padding: 24px; }
        .amount-display {
            text-align: center; padding: 20px; background: #F8F9FC;
            border-radius: 12px; margin-bottom: 20px;
        }
        .amount-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .amount-value { font-size: 36px; font-weight: 800; color: #1A237E; margin-top: 4px; }
        .detail-rows { margin-bottom: 24px; }
        .detail-row {
            display: flex; justify-content: space-between; padding: 10px 0;
            border-bottom: 1px solid #f0f0f0; font-size: 14px;
        }
        .detail-row .label { color: #888; }
        .detail-row .value { font-weight: 600; color: #333; }
        .pay-btn {
            display: block; width: 100%; padding: 16px; border: none; border-radius: 12px;
            font-size: 16px; font-weight: 700; color: #fff; cursor: pointer;
            text-align: center; text-decoration: none; transition: transform 0.1s;
        }
        .pay-btn:hover { transform: scale(1.02); }
        .pay-btn:active { transform: scale(0.98); }
        .pay-btn.jazzcash { background: linear-gradient(135deg, #E31837 0%, #C41230 100%); }
        .pay-btn.easypaisa { background: linear-gradient(135deg, #36B37E 0%, #2D9A6E 100%); }
        .status-card {
            text-align: center; padding: 32px 24px;
        }
        .status-icon { font-size: 48px; margin-bottom: 12px; }
        .status-text { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .status-sub { font-size: 13px; color: #888; }
        .footer {
            text-align: center; padding: 16px; background: #F8F9FC;
            font-size: 11px; color: #aaa;
        }
        .footer a { color: #1A237E; text-decoration: none; }
        .gateway-icon { width: 40px; height: 40px; margin-bottom: 8px; }
        .expires { font-size: 12px; color: #E53935; text-align: center; margin-top: 12px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="logo">e-Khata</div>
            <div class="subtitle">Secure Payment</div>
        </div>

        @if($status === 'paid')
            <div class="status-card">
                <div class="status-icon">✅</div>
                <div class="status-text">Payment Completed</div>
                <div class="status-sub">This payment has already been processed successfully.</div>
                @if($link->paid_at)
                    <div class="status-sub" style="margin-top: 8px;">Paid on: {{ $link->paid_at->format('d M Y, h:i A') }}</div>
                @endif
            </div>
        @elseif($status === 'expired')
            <div class="status-card">
                <div class="status-icon">⏰</div>
                <div class="status-text">Link Expired</div>
                <div class="status-sub">This payment link has expired. Please contact the business for a new link.</div>
            </div>
        @elseif($status === 'cancelled')
            <div class="status-card">
                <div class="status-icon">❌</div>
                <div class="status-text">Link Cancelled</div>
                <div class="status-sub">This payment link has been cancelled by the business.</div>
            </div>
        @else
            <div class="body">
                <div class="amount-display">
                    <div class="amount-label">Amount Due</div>
                    <div class="amount-value">Rs. {{ number_format($link->amount, 0) }}</div>
                </div>

                <div class="detail-rows">
                    <div class="detail-row">
                        <span class="label">Business</span>
                        <span class="value">{{ $link->tenant?->name ?? '—' }}</span>
                    </div>
                    @if($link->party?->name)
                    <div class="detail-row">
                        <span class="label">For</span>
                        <span class="value">{{ $link->party->name }}</span>
                    </div>
                    @endif
                    <div class="detail-row">
                        <span class="label">Payment Method</span>
                        <span class="value">{{ ucfirst($link->gateway) }}</span>
                    </div>
                    @if($link->description)
                    <div class="detail-row">
                        <span class="label">Description</span>
                        <span class="value">{{ $link->description }}</span>
                    </div>
                    @endif
                </div>

                @if($link->gateway === 'jazzcash')
                    <a href="{{ $gatewayUrl }}" class="pay-btn jazzcash" id="payBtn" onclick="return handlePayClick(event, '{{ $gatewayUrl }}', 'jazzcash')">
                        Pay with JazzCash
                    </a>
                @else
                    <a href="{{ $gatewayUrl }}" class="pay-btn easypaisa" id="payBtn" onclick="return handlePayClick(event, '{{ $gatewayUrl }}', 'easypaisa')">
                        Pay with EasyPaisa
                    </a>
                @endif

                @if($link->expires_at)
                    <div class="expires">
                        Expires: {{ $link->expires_at->format('d M Y, h:i A') }}
                    </div>
                @endif
            </div>

            <script>
            function handlePayClick(event, url, gateway) {
                // For intent:// URIs (Android deep links), handle gracefully
                if (url.startsWith('intent://')) {
                    // On Android Chrome, intent:// URIs work natively
                    // On iOS/desktop, try universal links or fallback to app store
                    var isAndroid = /android/i.test(navigator.userAgent);
                    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

                    if (isAndroid) {
                        // Let the browser handle the intent:// URI
                        return true;
                    }

                    event.preventDefault();

                    if (isIOS) {
                        // Try iOS App Store for the payment app
                        if (gateway === 'jazzcash') {
                            window.location.href = 'https://apps.apple.com/pk/app/jazzcash/id1008498498';
                        } else {
                            window.location.href = 'https://apps.apple.com/pk/app/easypaisa/id1517591392';
                        }
                    } else {
                        // Desktop fallback — open web portal
                        if (gateway === 'jazzcash') {
                            window.location.href = 'https://www.jazzcash.com.pk/';
                        } else {
                            window.location.href = 'https://easypaisa.com.pk/';
                        }
                    }
                    return false;
                }
                return true;
            }
            </script>
        @endif

        <div class="footer">
            Powered by <a href="https://www.esystematics.com" target="_blank">e-Khata</a> — Esystematic Technologies
        </div>
    </div>
</body>
</html>
