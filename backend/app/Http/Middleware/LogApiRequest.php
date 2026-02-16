<?php

namespace App\Http\Middleware;

use App\Models\AccessLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequest
{
    /**
     * Fields to sanitize from request body logging.
     */
    protected array $sensitiveFields = [
        'password',
        'password_confirmation',
        'token',
        'otp',
        'credit_card',
        'cvv',
        'secret',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        $response = $next($request);

        $responseTimeMs = round((microtime(true) - $startTime) * 1000);

        try {
            $user = $request->user();
            $tenant = app('currentTenant');

            AccessLog::create([
                'user_id' => $user?->id,
                'tenant_id' => $tenant?->id,
                'session_id' => null,
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'route_name' => $request->route()?->getName(),
                'request_headers' => $this->sanitizeHeaders($request->headers->all()),
                'request_body' => $this->sanitizeBody($request->all()),
                'response_status' => $response->getStatusCode(),
                'response_time_ms' => $responseTimeMs,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        } catch (\Throwable $e) {
            // Silently fail — logging should not break the app
            report($e);
        }

        return $response;
    }

    protected function sanitizeHeaders(array $headers): array
    {
        $hidden = ['authorization', 'cookie', 'x-csrf-token'];
        foreach ($hidden as $key) {
            if (isset($headers[$key])) {
                $headers[$key] = ['***'];
            }
        }
        return $headers;
    }

    protected function sanitizeBody(array $body): array
    {
        foreach ($this->sensitiveFields as $field) {
            if (isset($body[$field])) {
                $body[$field] = '***';
            }
        }
        return $body;
    }
}
