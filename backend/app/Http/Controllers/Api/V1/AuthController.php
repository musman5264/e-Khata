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
            'login' => 'required|string', // email or mobile
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->login)
            ->orWhere('mobile', $request->login)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
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
        $user->load('tenants');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'tenants' => $user->tenants,
            ],
        ]);
    }
}
