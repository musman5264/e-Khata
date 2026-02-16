<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\FirebaseAuthService;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FirebaseAuthController extends Controller
{
    protected FirebaseAuthService $firebaseAuth;
    protected SessionService $sessionService;

    public function __construct(FirebaseAuthService $firebaseAuth, SessionService $sessionService)
    {
        $this->firebaseAuth = $firebaseAuth;
        $this->sessionService = $sessionService;
    }

    /**
     * POST /api/v1/auth/firebase/verify
     * Verify Firebase ID token, upsert user, issue Sanctum token.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'id_token' => 'required|string',
            'name' => 'nullable|string|max:255',
        ]);

        try {
            $firebaseData = $this->firebaseAuth->verifyIdToken($request->id_token);
        } catch (\Exception $e) {
            Log::channel('auth')->warning('Firebase token verification failed', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired Firebase token.',
            ], 401);
        }

        $phone = $firebaseData['phone'];
        $firebaseUid = $firebaseData['uid'];

        if (!$phone) {
            return response()->json([
                'success' => false,
                'message' => 'Phone number not found in Firebase token.',
            ], 422);
        }

        // Upsert user
        $user = User::where('mobile', $phone)
            ->orWhere('firebase_uid', $firebaseUid)
            ->first();

        if ($user) {
            $user->update([
                'firebase_uid' => $firebaseUid,
                'name' => $user->name ?: ($request->name ?? $firebaseData['name'] ?? 'User'),
                'email' => $user->email ?: $firebaseData['email'],
                'avatar_url' => $user->avatar_url ?: $firebaseData['picture'],
            ]);
        } else {
            $user = User::create([
                'name' => $request->name ?? $firebaseData['name'] ?? 'User',
                'mobile' => $phone,
                'email' => $firebaseData['email'],
                'avatar_url' => $firebaseData['picture'],
                'firebase_uid' => $firebaseUid,
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated.',
            ], 403);
        }

        $token = $user->createToken('firebase-auth');
        $session = $this->sessionService->createSession($user, $request, $token->accessToken->id);

        return response()->json([
            'success' => true,
            'message' => 'Firebase authentication successful.',
            'data' => [
                'user' => $user,
                'token' => $token->plainTextToken,
                'session_id' => $session->id,
                'tenants' => $user->tenants,
                'is_new_user' => $user->wasRecentlyCreated,
            ],
        ]);
    }
}
