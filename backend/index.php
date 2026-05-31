<?php

declare(strict_types=1);

require_once __DIR__ . '/middleware/cors.php';

applyCors();

if (
    $_SERVER['REQUEST_METHOD'] === 'GET'
    && ($_SERVER['REQUEST_URI'] === '/' || $_SERVER['REQUEST_URI'] === '/index.php')
) {
    http_response_code(200);
    echo json_encode([
        'status'  => 'ok',
        'service' => 'Peerly API',
        'version' => '1.0.0',
    ]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint not found.']);
