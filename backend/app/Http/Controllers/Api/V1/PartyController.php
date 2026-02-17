<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePartyRequest;
use App\Http\Requests\UpdatePartyRequest;
use App\Models\Party;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PartyController extends Controller
{
    protected ActivityLogService $activityLog;

    public function __construct(ActivityLogService $activityLog)
    {
        $this->activityLog = $activityLog;
    }
    /**
     * POST /api/v1/parties
     */
    public function store(StorePartyRequest $request): JsonResponse
    {
        $this->authorize('create_party');

        $party = Party::create(array_merge($request->validated(), [
            'created_by' => $request->user()->id,
        ]));

        $this->activityLog->log('party_created', $party, "Created party: {$party->name}", null, $party->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Party created successfully.',
            'data' => $party,
        ], 201);
    }

    /**
     * GET /api/v1/parties
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('view_ledger');

        $query = Party::query();

        // Search
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('khata_number', 'like', "%{$search}%");
            });
        }

        // Filter by type
        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Sort
        $sortBy = $request->get('sort', 'name');
        $sortDir = $request->get('direction', 'asc');

        if ($sortBy === 'balance') {
            // Sort by computed balance needs special handling
            $query->orderBy('name', $sortDir);
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $parties = $query->paginate($request->get('per_page', 20));

        // Append balance to each party
        $parties->getCollection()->transform(function ($party) {
            $party->current_balance = $party->current_balance;
            return $party;
        });

        return response()->json([
            'success' => true,
            'data' => $parties->items(),
            'meta' => [
                'page' => $parties->currentPage(),
                'per_page' => $parties->perPage(),
                'total' => $parties->total(),
                'last_page' => $parties->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/parties/{id}
     */
    public function show(int $id): JsonResponse
    {
        $this->authorize('view_ledger');

        $party = Party::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => array_merge($party->toArray(), [
                'current_balance' => $party->current_balance,
                'total_debit' => $party->total_debit,
                'total_credit' => $party->total_credit,
                'transaction_count' => $party->transactions()->count(),
            ]),
        ]);
    }

    /**
     * PUT /api/v1/parties/{id}
     */
    public function update(UpdatePartyRequest $request, int $id): JsonResponse
    {
        $this->authorize('edit_party');

        $party = Party::findOrFail($id);
        $oldValues = $party->toArray();
        $party->update($request->validated());

        $this->activityLog->log('party_updated', $party, "Updated party: {$party->name}", $oldValues, $party->fresh()->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Party updated successfully.',
            'data' => $party,
        ]);
    }

    /**
     * DELETE /api/v1/parties/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $this->authorize('delete_party');

        $party = Party::findOrFail($id);

        $this->activityLog->log('party_deleted', $party, "Deleted party: {$party->name}", $party->toArray());

        $party->delete();

        return response()->json([
            'success' => true,
            'message' => 'Party deleted successfully.',
        ]);
    }

    /**
     * GET /api/v1/parties/summary
     */
    public function summary(): JsonResponse
    {
        $this->authorize('view_ledger');

        $parties = Party::where('is_active', true)->get();

        $totalReceivable = 0;
        $totalPayable = 0;

        foreach ($parties as $party) {
            $balance = $party->current_balance;
            if ($balance > 0) {
                $totalReceivable += $balance;
            } else {
                $totalPayable += abs($balance);
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_receivable' => round($totalReceivable, 2),
                'total_payable' => round($totalPayable, 2),
                'net' => round($totalReceivable - $totalPayable, 2),
                'party_count' => $parties->count(),
            ],
        ]);
    }

    /**
     * POST /api/v1/parties/{id}/photo
     */
    public function uploadPhoto(Request $request, int $id): JsonResponse
    {
        $this->authorize('edit_party');

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $party = Party::findOrFail($id);

        // Delete old photo if exists
        if ($party->photo_url) {
            $oldPath = str_replace('/storage/', '', $party->photo_url);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('photo')->store('party-photos', 'public');
        $party->update(['photo_url' => '/storage/' . $path]);

        $this->activityLog->log('party_photo_uploaded', $party, "Uploaded photo for party: {$party->name}");

        return response()->json([
            'success' => true,
            'message' => 'Photo uploaded successfully.',
            'data' => ['photo_url' => $party->photo_url],
        ]);
    }

    /**
     * DELETE /api/v1/parties/{id}/photo
     */
    public function deletePhoto(int $id): JsonResponse
    {
        $this->authorize('edit_party');

        $party = Party::findOrFail($id);

        if ($party->photo_url) {
            $oldPath = str_replace('/storage/', '', $party->photo_url);
            Storage::disk('public')->delete($oldPath);
            $party->update(['photo_url' => null]);
        }

        $this->activityLog->log('party_photo_deleted', $party, "Deleted photo for party: {$party->name}");

        return response()->json([
            'success' => true,
            'message' => 'Photo deleted successfully.',
        ]);
    }
}
