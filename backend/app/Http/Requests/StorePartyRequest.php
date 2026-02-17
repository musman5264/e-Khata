<?php

namespace App\Http\Requests;

class StorePartyRequest extends ApiFormRequest
{
    protected function prepareForValidation(): void
    {
        // Convert empty strings to null for optional fields
        $this->merge(array_map(
            fn($v) => $v === '' ? null : $v,
            $this->only(['mobile', 'email', 'address', 'city', 'khata_number', 'book_number', 'bill_book_name', 'bill_book_number', 'page_number', 'notes', 'opening_balance', 'opening_balance_type'])
        ));

        // Normalize mobile: if 11-digit local (03xx), convert to 923xx format
        if ($this->mobile) {
            $mobile = preg_replace('/[^0-9]/', '', $this->mobile);
            if (strlen($mobile) === 11 && str_starts_with($mobile, '0')) {
                $mobile = '92' . substr($mobile, 1);
            } elseif (strlen($mobile) === 10 && str_starts_with($mobile, '3')) {
                $mobile = '92' . $mobile;
            }
            $this->merge(['mobile' => $mobile]);
        }
    }

    public function rules(): array
    {
        $tenantId = app('currentTenant')?->id;

        return [
            'name' => 'required|string|max:255',
            'mobile' => "nullable|string|max:20|unique:parties,mobile,NULL,id,tenant_id,{$tenantId}",
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'khata_number' => 'nullable|string|max:50',
            'book_number' => 'nullable|string|max:50',
            'bill_book_name' => 'nullable|string|max:255',
            'bill_book_number' => 'nullable|string|max:100',
            'page_number' => 'nullable|string|max:50',
            'photo_url' => 'nullable|string|max:500',
            'type' => 'required|in:customer,supplier,both',
            'opening_balance' => 'nullable|numeric|min:0',
            'opening_balance_type' => 'nullable|in:dr,cr',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
