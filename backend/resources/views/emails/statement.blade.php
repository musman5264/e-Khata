<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Your Account Statement from {{ $tenant->name }}</title>
</head>
<body style="font-family: Arial, sans-serif; background: #F5F5F5; margin: 0; padding: 30px;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: #1A237E; color: #fff; padding: 24px 30px;">
            <h1 style="margin: 0; font-size: 20px;">{{ $tenant->name }}</h1>
            <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.8;">Account Statement</p>
        </div>

        <!-- Body -->
        <div style="padding: 24px 30px;">
            <p style="font-size: 14px; color: #333; margin-bottom: 16px;">
                Assalamu Alaikum,
            </p>
            <p style="font-size: 14px; color: #333; margin-bottom: 16px;">
                Please find attached your account statement from <strong>{{ $tenant->name }}</strong>
                for <strong>{{ $party->name }}</strong>.
            </p>

            <div style="background: #F8F9FC; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
                <table style="width: 100%; font-size: 13px;">
                    <tr>
                        <td style="padding: 4px 0; color: #666;">Party:</td>
                        <td style="padding: 4px 0; font-weight: bold;">{{ $party->name }}</td>
                    </tr>
                    @if($party->khata_number)
                    <tr>
                        <td style="padding: 4px 0; color: #666;">Khata #:</td>
                        <td style="padding: 4px 0; font-weight: bold;">{{ $party->khata_number }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td style="padding: 4px 0; color: #666;">Period:</td>
                        <td style="padding: 4px 0; font-weight: bold;">
                            {{ $dateFrom ?? 'Beginning' }} — {{ $dateTo ?? 'Present' }}
                        </td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 13px; color: #666;">
                The detailed statement is attached as a PDF file.
            </p>
        </div>

        <!-- Footer -->
        <div style="padding: 16px 30px; background: #FAFAFA; border-top: 1px solid #E8E8E8; text-align: center; font-size: 11px; color: #999;">
            Sent via <strong>e-Khata</strong> |
            Powered by <a href="https://www.esystematics.com" style="color: #1A237E; text-decoration: none;">Esystematic Technologies</a><br>
            Gujranwala, Pakistan | 0311-3999345 | 0334-5266444
        </div>
    </div>
</body>
</html>
