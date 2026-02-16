<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TeamMemberJoined;
use App\Http\Controllers\Controller;
use App\Models\TenantInvitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class TeamController extends Controller
{
    /**
     * GET /api/v1/team/members
     */
    public function members(Request $request): JsonResponse
    {
        $tenant = app('currentTenant');
        $members = $tenant->users()
            ->with('roles')
            ->get()
            ->map(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'avatar_url' => $user->avatar_url,
                'roles' => $user->roles->pluck('name'),
                'joined_at' => $user->pivot->joined_at,
            ]);

        return response()->json([
            'success' => true,
            'data' => $members,
        ]);
    }

    /**
     * POST /api/v1/team/invite
     */
    public function invite(Request $request): JsonResponse
    {
        $this->authorize('manage_team');

        $request->validate([
            'mobile' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'role' => 'required|string|in:Manager,Accountant,Viewer',
        ]);

        if (!$request->mobile && !$request->email) {
            return response()->json([
                'success' => false,
                'message' => 'Mobile or email is required.',
            ], 422);
        }

        $tenant = app('currentTenant');
        $role = Role::where('name', $request->role)->first();

        $invitation = TenantInvitation::create([
            'tenant_id' => $tenant->id,
            'invited_by' => $request->user()->id,
            'mobile' => $request->mobile,
            'email' => $request->email,
            'role_id' => $role?->id,
            'token' => Str::random(64),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Invitation sent successfully.',
            'data' => $invitation,
        ], 201);
    }

    /**
     * PUT /api/v1/team/members/{userId}/role
     */
    public function changeRole(Request $request, int $userId): JsonResponse
    {
        $this->authorize('manage_team');

        $request->validate([
            'role' => 'required|string|in:Owner,Manager,Accountant,Viewer',
        ]);

        $tenant = app('currentTenant');
        $user = User::findOrFail($userId);

        if (!$user->belongsToTenant($tenant->id)) {
            return response()->json([
                'success' => false,
                'message' => 'User does not belong to this business.',
            ], 404);
        }

        $user->syncRoles([$request->role]);

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully.',
        ]);
    }

    /**
     * DELETE /api/v1/team/members/{userId}
     */
    public function removeMember(int $userId): JsonResponse
    {
        $this->authorize('manage_team');

        $tenant = app('currentTenant');
        $tenant->users()->detach($userId);

        return response()->json([
            'success' => true,
            'message' => 'Member removed successfully.',
        ]);
    }

    /**
     * POST /api/v1/team/invite/accept
     */
    public function acceptInvite(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $invitation = TenantInvitation::where('token', $request->token)->firstOrFail();

        if (!$invitation->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'This invitation has expired or is no longer valid.',
            ], 410);
        }

        $user = $request->user();
        $tenant = $invitation->tenant;

        // Attach user to tenant
        if (!$user->belongsToTenant($tenant->id)) {
            $tenant->users()->attach($user->id, ['joined_at' => now()]);
        }

        // Assign role from invitation
        if ($invitation->role_id) {
            $role = Role::find($invitation->role_id);
            if ($role) {
                $user->assignRole($role);
            }
        }

        $invitation->accept();

        event(new TeamMemberJoined($user, $tenant));

        return response()->json([
            'success' => true,
            'message' => 'Invitation accepted. You are now a member of ' . $tenant->name,
            'data' => ['tenant' => $tenant],
        ]);
    }
}
