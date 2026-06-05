<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/db.php';

\App\Middleware\applyCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$token = \App\Middleware\getBearerToken();

if ($token) {
    $hash = hash('sha256', $token);
    \App\Config\getDB()->prepare(
        "DELETE FROM sessions WHERE token_hash = ?"
    )->execute([$hash]);
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['message' => 'Logged out successfully.']);
exit;
