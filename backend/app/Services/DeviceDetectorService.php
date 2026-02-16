<?php

namespace App\Services;

use Jenssegers\Agent\Agent;

class DeviceDetectorService
{
    /**
     * Detect device info from request.
     */
    public function detect(?string $userAgent = null): array
    {
        $agent = new Agent();

        if ($userAgent) {
            $agent->setUserAgent($userAgent);
        }

        return [
            'device' => $agent->device() ?: 'Unknown',
            'platform' => $agent->platform() ?: 'Unknown',
            'platform_version' => $agent->version($agent->platform()) ?: null,
            'browser' => $agent->browser() ?: null,
            'browser_version' => $agent->version($agent->browser()) ?: null,
            'is_desktop' => $agent->isDesktop(),
            'is_mobile' => $agent->isMobile(),
            'is_tablet' => $agent->isTablet(),
            'is_robot' => $agent->isRobot(),
            'robot' => $agent->robot() ?: null,
            'device_type' => $this->getDeviceType($agent),
        ];
    }

    protected function getDeviceType(Agent $agent): string
    {
        if ($agent->isTablet()) return 'tablet';
        if ($agent->isMobile()) return 'mobile';
        if ($agent->isDesktop()) return 'desktop';
        if ($agent->isRobot()) return 'robot';
        return 'unknown';
    }
}
