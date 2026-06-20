<?php
// phpcs:ignorefile PSR1.Files.SideEffects.FoundWithSymbols
declare(strict_types=1);

namespace App\Middleware;

require_once __DIR__ . '/../config/env.php';

use function App\Config\applyEnv;

/**
 * Apply CORS headers, handle method overriding, and validate the API key.
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

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['_method'])) {
        $override = strtoupper((string) $_GET['_method']);
        if (in_array($override, ['PUT', 'DELETE'], true)) {
            $_SERVER['REQUEST_METHOD'] = $override;
        }
    }

    $provided = isset($_SERVER['HTTP_X_API_KEY'])
        ? $_SERVER['HTTP_X_API_KEY']
        : (isset($_GET['api_key']) ? (string) $_GET['api_key'] : '');

    if (!defined('API_KEY') || API_KEY === '' || !hash_equals(API_KEY, $provided)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or missing API key.']);
        exit;
    }
}
