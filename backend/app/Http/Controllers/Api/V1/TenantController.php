<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    /**
     * POST /api/v1/tenants — Create business.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        $tenant = Tenant::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . Str::random(4),
            'address' => $request->address,
            'city' => $request->city,
            'phone' => $request->phone,
            'email' => $request->email,
            'settings' => Tenant::defaultSettings(),
        ]);

        // Attach user as Owner
        $user = $request->user();
        $tenant->users()->attach($user->id, ['joined_at' => now()]);

        // Assign Owner role
        $user->assignRole('Owner');

        return response()->json([
            'success' => true,
            'message' => 'Business created successfully.',
            'data' => $tenant,
        ], 201);
    }

    /**
     * GET /api/v1/tenants — List user's businesses.
     */
    public function index(Request $request): JsonResponse
    {
        $tenants = $request->user()->tenants()->get();

        return response()->json([
            'success' => true,
            'data' => $tenants,
        ]);
    }

    /**
     * PUT /api/v1/tenants/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $this->authorize('manage_tenant');

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'logo_url' => 'nullable|string|max:500',
            'settings' => 'nullable|array',
        ]);

        $tenant->update($request->only([
            'name', 'address', 'city', 'phone', 'email', 'logo_url', 'settings',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Business updated successfully.',
            'data' => $tenant,
        ]);
    }

    /**
     * DELETE /api/v1/tenants/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $this->authorize('manage_tenant');

        $tenant->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Business deactivated successfully.',
        ]);
    }
}
