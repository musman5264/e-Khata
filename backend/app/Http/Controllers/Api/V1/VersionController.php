<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AppVersion;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VersionController extends Controller
{
    protected ActivityLogService $activityLog;

    public function __construct(ActivityLogService $activityLog)
    {
        $this->activityLog = $activityLog;
    }

    /**
     * GET /api/v1/version/current
     * Public — returns current app version info.
     */
    public function current(Request $request): JsonResponse
    {
        $platform = $request->get('platform', 'all');
        $version = AppVersion::current($platform);

        return response()->json([
            'success' => true,
            'data' => $version ? [
                'version'      => $version->version,
                'title'        => $version->title,
                'channel'      => $version->channel,
                'release_date' => $version->release_date->format('Y-m-d'),
                'force_update' => $version->force_update,
            ] : null,
        ]);
    }

    /**
     * GET /api/v1/admin/versions
     * List all versions with timeline (for SuperAdmin).
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('manage_system_settings');

        $query = AppVersion::with('releasedBy:id,name')
            ->orderByDesc('release_date')
            ->orderByDesc('created_at');

        if ($channel = $request->get('channel')) {
            $query->where('channel', $channel);
        }
        if ($platform = $request->get('platform')) {
            $query->where('platform', $platform);
        }
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('version', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('changelog', 'like', "%{$search}%");
            });
        }

        $versions = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => $versions,
        ]);
    }

    /**
     * GET /api/v1/admin/versions/{id}
     * Show single version detail.
     */
    public function show(int $id): JsonResponse
    {
        $this->authorize('manage_system_settings');

        $version = AppVersion::with('releasedBy:id,name')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $version,
        ]);
    }

    /**
     * POST /api/v1/admin/versions
     * Create a new version release.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('manage_system_settings');

        $request->validate([
            'version'      => 'required|string|max:20',
            'title'        => 'required|string|max:255',
            'changelog'    => 'required|string',
            'channel'      => 'sometimes|in:stable,beta,alpha',
            'platform'     => 'sometimes|in:all,web,ios,android',
            'is_current'   => 'sometimes|boolean',
            'force_update' => 'sometimes|boolean',
            'release_date' => 'required|date',
        ]);

        // If marking as current, unset previous current
        if ($request->boolean('is_current')) {
            AppVersion::where('is_current', true)->update(['is_current' => false]);
        }

        $version = AppVersion::create([
            ...$request->only(['version', 'title', 'changelog', 'channel', 'platform', 'is_current', 'force_update', 'release_date']),
            'released_by' => $request->user()->id,
        ]);

        $this->activityLog->logAction('version_created', "Released version {$version->version}");

        return response()->json([
            'success' => true,
            'message' => "Version {$version->version} created.",
            'data'    => $version->load('releasedBy:id,name'),
        ], 201);
    }

    /**
     * PUT /api/v1/admin/versions/{id}
     * Update a version.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $this->authorize('manage_system_settings');

        $version = AppVersion::findOrFail($id);

        $request->validate([
            'version'      => 'sometimes|string|max:20',
            'title'        => 'sometimes|string|max:255',
            'changelog'    => 'sometimes|string',
            'channel'      => 'sometimes|in:stable,beta,alpha',
            'platform'     => 'sometimes|in:all,web,ios,android',
            'is_current'   => 'sometimes|boolean',
            'force_update' => 'sometimes|boolean',
            'release_date' => 'sometimes|date',
        ]);

        // If marking as current, unset previous current
        if ($request->has('is_current') && $request->boolean('is_current')) {
            AppVersion::where('is_current', true)->where('id', '!=', $id)->update(['is_current' => false]);
        }

        $version->update($request->only(['version', 'title', 'changelog', 'channel', 'platform', 'is_current', 'force_update', 'release_date']));

        $this->activityLog->logAction('version_updated', "Updated version {$version->version}");

        return response()->json([
            'success' => true,
            'message' => "Version {$version->version} updated.",
            'data'    => $version->fresh()->load('releasedBy:id,name'),
        ]);
    }

    /**
     * DELETE /api/v1/admin/versions/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $this->authorize('manage_system_settings');

        $version = AppVersion::findOrFail($id);
        $versionStr = $version->version;
        $version->delete();

        $this->activityLog->logAction('version_deleted', "Deleted version {$versionStr}");

        return response()->json([
            'success' => true,
            'message' => "Version {$versionStr} deleted.",
        ]);
    }
}
