<?php

namespace App\Http\Requests;

class StoreTransactionRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $tenant = app('currentTenant');
        $allowFuture = $tenant?->getSetting('allow_future_dates', false);

        return [
            'type' => 'required|in:debit,credit',
            'amount' => 'required|numeric|gt:0',
            'date' => 'required|date' . ($allowFuture ? '' : '|before_or_equal:today'),
            'description' => ($tenant?->getSetting('require_description', true) ? 'required|' : 'nullable|') . 'string|max:500',
            'reference_number' => ($tenant?->getSetting('require_reference_number', false) ? 'required|' : 'nullable|') . 'string|max:100',
            'attachment_url' => 'nullable|string|max:500',
        ];
    }
}
