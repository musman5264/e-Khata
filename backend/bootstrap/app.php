<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Middleware aliases for route groups
        $middleware->alias([
            'tenant' => \App\Http\Middleware\EnsureTenant::class,
            'track.session' => \App\Http\Middleware\TrackSession::class,
            'log.api' => \App\Http\Middleware\LogApiRequest::class,
            'detect.suspicious' => \App\Http\Middleware\DetectSuspiciousLogin::class,
            'subscription' => \App\Http\Middleware\EnsureActiveSubscription::class,
        ]);

        // Sanctum stateful domains (for SPA/web if needed)
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Return JSON for API 404s
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource not found.',
                ], 404);
            }
        });
    })->create();
