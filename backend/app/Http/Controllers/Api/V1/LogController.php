<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\SystemLog;
use App\Models\AccessLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class LogController extends Controller
{
    /**
     * GET /api/v1/logs/activity
     * Paginated activity logs, filterable by user, action, model, date.
     */
    public function activity(Request $request): JsonResponse
    {
        $this->authorize('view_audit_log');

        $query = ActivityLog::where('tenant_id', app('currentTenant')->id)
            ->with('user:id,name')
            ->orderByDesc('created_at');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->has('action')) {
            $query->where('action', $request->action);
        }
        if ($request->has('model_type')) {
            $query->where('model_type', $request->model_type);
        }
        if ($request->has('model_id')) {
            $query->where('model_id', $request->model_id);
        }
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/logs/system
     * Filterable by level, channel, date.
     */
    public function system(Request $request): JsonResponse
    {
        $this->authorize('view_audit_log');

        $query = SystemLog::orderByDesc('created_at');

        if ($request->has('level')) {
            $query->where('level', $request->level);
        }
        if ($request->has('channel')) {
            $query->where('channel', $request->channel);
        }
        if ($request->has('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/logs/access
     * Filterable by user, method, status, date.
     */
    public function access(Request $request): JsonResponse
    {
        $this->authorize('view_audit_log');

        $query = AccessLog::orderByDesc('created_at');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->has('method')) {
            $query->where('method', $request->method);
        }
        if ($request->has('response_status')) {
            $query->where('response_status', $request->response_status);
        }
        if ($request->has('route_name')) {
            $query->where('route_name', $request->route_name);
        }
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/logs/activity/export
     * Export activity logs as CSV.
     */
    public function exportActivity(Request $request): JsonResponse
    {
        $this->authorize('view_audit_log');

        $query = ActivityLog::where('tenant_id', app('currentTenant')->id)
            ->with('user:id,name')
            ->orderByDesc('created_at');

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->get()->map(fn($log) => [
            'id' => $log->id,
            'user' => $log->user?->name ?? 'System',
            'action' => $log->action,
            'model_type' => $log->model_type,
            'model_id' => $log->model_id,
            'description' => $log->description,
            'ip_address' => $log->ip_address,
            'device_type' => $log->device_type,
            'platform' => $log->platform,
            'created_at' => $log->created_at,
        ]);

        return response()->json([
            'success' => true,
            'data' => $logs,
            'meta' => ['total' => $logs->count()],
        ]);
    }
}
