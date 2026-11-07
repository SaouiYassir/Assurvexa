<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Enums\InsuranceType;
use App\Models\Policy;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class PolicyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $policies = Policy::with('admin.user')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $policies
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'admin_id'    => ['required', 'exists:admins,id'],
            'nom'         => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:255'],
            'type'        => ['required', Rule::enum(InsuranceType::class)],
            'prix'        => ['required', 'numeric', 'min:0'],
        ]);

        $policy = Policy::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Policy created successfully.',
            'data' => $policy
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Policy $policy): JsonResponse
    {
        $policy->load('admin.user');

        return response()->json([
            'success' => true,
            'data' => $policy
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Policy $policy): JsonResponse
    {
        $validated = $request->validate([
            'admin_id'    => ['sometimes', 'required', 'exists:admins,id'],
            'nom'         => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string', 'max:255'],
            'type'        => ['sometimes', 'required', Rule::enum(InsuranceType::class)],
            'prix'        => ['sometimes', 'required', 'numeric', 'min:0'],
        ]);

        $policy->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Policy updated successfully.',
            'data' => $policy->fresh()
        ], 200);
    }

    /**
     * Remove the specified policy.
     */
    public function destroy(Policy $policy): JsonResponse
    {
        $policy->delete();

        return response()->json([
            'success' => true,
            'message' => 'Policy deleted successfully.'
        ], 200);
    }
}
