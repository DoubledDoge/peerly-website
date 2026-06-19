<?php
// phpcs:ignorefile PSR1.Files.SideEffects.FoundWithSymbols
declare(strict_types=1);

namespace App\Middleware;

require_once __DIR__ . '/../config/env.php';

use function App\Config\applyEnv;

/**
 * Apply CORS headers and handle OPTIONS requests.
 *
 * @return void
 */
function applyCors(): void
{
    applyEnv();

    $origin = defined('ALLOWED_ORIGIN') && ALLOWED_ORIGIN !== ''
        ? ALLOWED_ORIGIN
        : 'https://doubleddoge.github.io';

    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    header('Content-Type: application/json');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    // Enforce X-API-Key on every request past the OPTIONS preflight.
    // This runs for every endpoint since applyCors() is the first call
    // in each one.
    $provided = isset($_SERVER['HTTP_X_API_KEY']) ? $_SERVER['HTTP_X_API_KEY'] : '';

    if (!defined('API_KEY') || API_KEY === '' || !hash_equals(API_KEY, $provided)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or missing API key.']);
        exit;
    }
}
