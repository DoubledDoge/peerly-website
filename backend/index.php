<?php

declare(strict_types=1);

\App\Middleware\applyCors();

$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (
    $_SERVER['REQUEST_METHOD'] === 'GET'
    && ($requestPath === '/' || $requestPath === '/index.php')
) {
    http_response_code(200);
    echo json_encode(
        [
            'status'  => 'ok',
            'service' => 'Peerly API',
            'version' => '1.0.0',
        ]
    );
    exit;
}
