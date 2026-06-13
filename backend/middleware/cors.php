<?php
/**
 * CORS (Cross-Origin Resource Sharing) middleware.
 */

declare(strict_types=1);

namespace App\Middleware;

/**
 * Apply CORS headers and handle OPTIONS requests.
 *
 * @return void
 */
function applyCors(): void
{
    header('Access-Control-Allow-Origin: https://doubleddoge.github.io');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    header('Content-Type: application/json');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
