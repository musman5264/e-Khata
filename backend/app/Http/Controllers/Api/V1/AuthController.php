<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected SessionService $sessionService;
    protected ActivityLogService $activityLog;

    public function __construct(SessionService $sessionService, ActivityLogService $activityLog)
    {
        $this->sessionService = $sessionService;
        $this->activityLog = $activityLog;
    }

    /**
     * POST /api/v1/auth/register
     */
    public function register(Request $request): JsonResponse
    {
        // Normalize mobile: 03xx → 923xx
        $mobile = $request->mobile;
        if ($mobile) {
            $mobile = preg_replace('/[^0-9]/', '', $mobile);
            if (strlen($mobile) === 11 && str_starts_with($mobile, '0')) {
                $mobile = '92' . substr($mobile, 1);
            } elseif (strlen($mobile) === 10 && str_starts_with($mobile, '3')) {
                $mobile = '92' . $mobile;
            }
            $request->merge(['mobile' => $mobile]);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'mobile' => 'required|string|max:20|unique:users,mobile',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'mobile' => $request->mobile,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth-token');
        $session = $this->sessionService->createSession($user, $request, $token->accessToken->id);

        $this->activityLog->logAction('login', 'User registered and logged in');

        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
            'data' => [
                'user' => $user,
                'token' => $token->plainTextToken,
                'session_id' => $session->id,
            ],
        ], 201);
    }

    /**
     * POST /api/v1/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'mobile' => 'required|string',
            'password' => 'required|string',
        ]);

        // Normalize mobile: 03xx → 923xx for lookup
        $mobile = preg_replace('/[^0-9]/', '', $request->mobile);
        if (strlen($mobile) === 11 && str_starts_with($mobile, '0')) {
            $mobile = '92' . substr($mobile, 1);
        } elseif (strlen($mobile) === 10 && str_starts_with($mobile, '3')) {
            $mobile = '92' . $mobile;
        }

        $user = User::where('mobile', $mobile)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'mobile' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated.',
            ], 403);
        }

        $token = $user->createToken('auth-token');
        $session = $this->sessionService->createSession($user, $request, $token->accessToken->id);

        $this->activityLog->logAction('login', 'User logged in');

        $user->load('roles', 'tenants');

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => $user,
                'token' => $token->plainTextToken,
                'session_id' => $session->id,
                'tenants' => $user->tenants,
            ],
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $this->activityLog->logAction('logout', 'User logged out');

        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        // Deactivate session
        $deviceId = $request->header('X-Device-ID');
        if ($deviceId) {
            $session = \App\Models\Session::where('user_id', $request->user()->id)
                ->where('device_id', $deviceId)
                ->where('is_active', true)
                ->first();

            $session?->deactivate();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('roles', 'tenants');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'tenants' => $user->tenants,
            ],
        ]);
    }

    /**
     * PUT /api/v1/auth/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'language_pref' => 'sometimes|in:en,ur',
        ]);

        $user->update($request->only(['name', 'email', 'language_pref']));

        $this->activityLog->logAction('profile_updated', 'User updated their profile');

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => $user->fresh()->load('roles', 'tenants'),
        ]);
    }

    /**
     * PUT /api/v1/auth/password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        $this->activityLog->logAction('password_changed', 'User changed their password');

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }
}
