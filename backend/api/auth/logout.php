<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';

applyCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$token = getBearerToken();

if ($token) {
    $hash = hash('sha256', $token);
    getDB()->prepare(
        "DELETE FROM sessions WHERE token_hash = ?"
    )->execute([$hash]);
}

http_response_code(200);
echo json_encode(['message' => 'Logged out successfully.']);
