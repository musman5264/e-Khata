<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /api/v1/notifications
     * Paginated list, filterable by type, read status.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Notification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('is_read')) {
            $query->where('is_read', filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN));
        }

        $notifications = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'meta' => [
                'page' => $notifications->currentPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'last_page' => $notifications->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/notifications/unread-count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => ['count' => $count],
        ]);
    }

    /**
     * PUT /api/v1/notifications/{id}/read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    /**
     * PUT /api/v1/notifications/read-all
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }

    /**
     * DELETE /api/v1/notifications/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted.',
        ]);
    }

    /**
     * GET /api/v1/notifications/preferences
     */
    public function preferences(Request $request): JsonResponse
    {
        $preferences = NotificationPreference::where('user_id', $request->user()->id)
            ->get()
            ->keyBy('type');

        // Return default preferences for all notification types
        $types = [
            'transaction_created', 'transaction_edited', 'transaction_deleted',
            'payment_received', 'payment_sent', 'payment_failed',
            'new_device_login', 'suspicious_login',
            'ledger_shared', 'team_member_joined', 'team_invited',
            'balance_threshold', 'system_announcement',
        ];

        $result = [];
        foreach ($types as $type) {
            if ($preferences->has($type)) {
                $pref = $preferences[$type];
                $result[$type] = [
                    'push_enabled' => $pref->push_enabled,
                    'in_app_enabled' => $pref->in_app_enabled,
                    'email_enabled' => $pref->email_enabled,
                ];
            } else {
                $result[$type] = [
                    'push_enabled' => true,
                    'in_app_enabled' => true,
                    'email_enabled' => false,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * PUT /api/v1/notifications/preferences
     * Update notification preferences (toggle per type).
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $request->validate([
            'preferences' => 'required|array',
            'preferences.*.push_enabled' => 'boolean',
            'preferences.*.in_app_enabled' => 'boolean',
            'preferences.*.email_enabled' => 'boolean',
        ]);

        foreach ($request->preferences as $type => $settings) {
            NotificationPreference::updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'type' => $type,
                ],
                [
                    'push_enabled' => $settings['push_enabled'] ?? true,
                    'in_app_enabled' => $settings['in_app_enabled'] ?? true,
                    'email_enabled' => $settings['email_enabled'] ?? false,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification preferences updated.',
        ]);
    }
}
