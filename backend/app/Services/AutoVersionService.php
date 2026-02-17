<?php

namespace App\Services;

use App\Models\AppVersion;
use Illuminate\Support\Facades\Auth;

class AutoVersionService
{
    /**
     * Auto-increment version and create a changelog entry.
     *
     * @param string $changeType  'major' | 'minor' | 'patch'
     * @param string $title       Short title for the change
     * @param string $changelog   Detailed description
     * @param string $channel     'stable' | 'beta' | 'alpha'
     */
    public static function track(
        string $changeType,
        string $title,
        string $changelog,
        string $channel = 'stable'
    ): AppVersion {
        $current = AppVersion::current();
        $currentVersion = $current?->version ?? '1.0.0';

        $newVersion = self::incrementVersion($currentVersion, $changeType);

        // Unset previous current
        AppVersion::where('is_current', true)->update(['is_current' => false]);

        return AppVersion::create([
            'version'      => $newVersion,
            'title'        => $title,
            'changelog'    => $changelog,
            'channel'      => $channel,
            'platform'     => 'all',
            'is_current'   => true,
            'force_update' => $changeType === 'major',
            'release_date' => now(),
            'released_by'  => Auth::id(),
        ]);
    }

    /**
     * Track a minor/patch change automatically.
     */
    public static function trackMinor(string $title, string $changelog): AppVersion
    {
        return self::track('patch', $title, $changelog);
    }

    /**
     * Track a feature addition.
     */
    public static function trackFeature(string $title, string $changelog): AppVersion
    {
        return self::track('minor', $title, $changelog);
    }

    /**
     * Track a breaking change.
     */
    public static function trackMajor(string $title, string $changelog): AppVersion
    {
        return self::track('major', $title, $changelog);
    }

    /**
     * Increment semantic version.
     */
    protected static function incrementVersion(string $version, string $type): string
    {
        $parts = explode('.', $version);
        $major = (int) ($parts[0] ?? 1);
        $minor = (int) ($parts[1] ?? 0);
        $patch = (int) ($parts[2] ?? 0);

        return match ($type) {
            'major' => ($major + 1) . '.0.0',
            'minor' => $major . '.' . ($minor + 1) . '.0',
            'patch' => $major . '.' . $minor . '.' . ($patch + 1),
            default => $major . '.' . $minor . '.' . ($patch + 1),
        };
    }

    /**
     * Get full version history with summary.
     */
    public static function getHistory(int $limit = 50): array
    {
        $versions = AppVersion::with('releasedBy:id,name')
            ->orderByDesc('release_date')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return [
            'current'  => AppVersion::current(),
            'timeline' => $versions,
            'total'    => AppVersion::count(),
            'stats'    => [
                'total_releases' => AppVersion::count(),
                'stable'         => AppVersion::where('channel', 'stable')->count(),
                'beta'           => AppVersion::where('channel', 'beta')->count(),
                'alpha'          => AppVersion::where('channel', 'alpha')->count(),
            ],
        ];
    }
}
