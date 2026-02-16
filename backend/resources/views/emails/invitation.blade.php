<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>You're invited to join {{ $tenant->name }} on e-Khata</title>
</head>
<body style="font-family: Arial, sans-serif; background: #F5F5F5; margin: 0; padding: 30px;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: #1A237E; color: #fff; padding: 24px 30px;">
            <h1 style="margin: 0; font-size: 20px;">e-Khata</h1>
            <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.8;">Team Invitation</p>
        </div>

        <!-- Body -->
        <div style="padding: 24px 30px;">
            <p style="font-size: 14px; color: #333; margin-bottom: 16px;">
                Assalamu Alaikum,
            </p>
            <p style="font-size: 14px; color: #333; margin-bottom: 16px;">
                <strong>{{ $inviter->name }}</strong> has invited you to join
                <strong>{{ $tenant->name }}</strong> on e-Khata as a <strong>{{ $role }}</strong>.
            </p>

            <div style="text-align: center; margin: 24px 0;">
                <a href="{{ $acceptUrl }}"
                   style="display: inline-block; background: #1A237E; color: #fff; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: bold; text-decoration: none;">
                    Accept Invitation
                </a>
            </div>

            <p style="font-size: 12px; color: #999; text-align: center;">
                This invitation expires on {{ $expiresAt }}.<br>
                If you don't have the e-Khata app, download it first from the App Store or Play Store.
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
