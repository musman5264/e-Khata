<?php

namespace App\Http\Requests;

class UpdateTransactionRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $tenant = app('currentTenant');
        $allowFuture = $tenant?->getSetting('allow_future_dates', false);

        return [
            'type' => 'sometimes|required|in:debit,credit',
            'amount' => 'sometimes|required|numeric|gt:0',
            'date' => 'sometimes|required|date' . ($allowFuture ? '' : '|before_or_equal:today'),
            'description' => 'sometimes|nullable|string|max:500',
            'reference_number' => 'sometimes|nullable|string|max:100',
            'attachment_url' => 'sometimes|nullable|string|max:500',
        ];
    }
}
