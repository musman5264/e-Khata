<?php

namespace App\Http\Requests;

class UpdatePartyRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $tenantId = app('currentTenant')?->id;
        $partyId = $this->route('party') ?? $this->route('id');

        return [
            'name' => 'sometimes|required|string|max:255',
            'mobile' => "nullable|string|max:20|unique:parties,mobile,{$partyId},id,tenant_id,{$tenantId}",
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'khata_number' => 'nullable|string|max:50',
            'book_number' => 'nullable|string|max:50',
            'bill_book_name' => 'nullable|string|max:255',
            'bill_book_number' => 'nullable|string|max:100',
            'page_number' => 'nullable|string|max:50',
            'photo_url' => 'nullable|string|max:500',
            'type' => 'sometimes|in:customer,supplier,both',
            'opening_balance' => 'nullable|numeric|min:0',
            'opening_balance_type' => 'nullable|in:dr,cr',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ];
    }
}
