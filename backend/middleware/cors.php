<?php

declare(strict_types=1);

namespace App\Middleware;

use function App\Config\applyEnv;

function applyCors(): void
{
    applyEnv();

    $allowedOrigin = ALLOWED_ORIGIN;
    $apiKey        = API_KEY;

    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($allowedOrigin) {
        header("Access-Control-Allow-Origin: {$allowedOrigin}");
    }
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
    header('Access-Control-Max-Age: 86400');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    $isLocal = in_array($origin, ['', 'null'], true)
        || str_starts_with($origin, 'http://localhost')
        || str_starts_with($origin, 'http://127.0.0.1');

    if (!$isLocal && $allowedOrigin && $origin !== $allowedOrigin) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: origin not allowed.']);
        exit;
    }

    if (!$isLocal && $apiKey) {
        $sentKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
        if (!hash_equals($apiKey, $sentKey)) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized: invalid API key.']);
            exit;
        }
    }
}
