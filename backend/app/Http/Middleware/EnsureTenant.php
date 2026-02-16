<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $request->header('X-Tenant-ID');

        if (!$tenantId) {
            return response()->json([
                'success' => false,
                'message' => 'X-Tenant-ID header is required.',
            ], 400);
        }

        $tenant = Tenant::where('id', $tenantId)->where('is_active', true)->first();

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant not found or inactive.',
            ], 404);
        }

        $user = $request->user();
        if ($user && !$user->belongsToTenant($tenant->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not belong to this tenant.',
            ], 403);
        }

        app()->instance('currentTenant', $tenant);
        $request->merge(['current_tenant' => $tenant]);

        return $next($request);
    }
}
