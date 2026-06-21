<?php

declare(strict_types=1);

namespace App\Config;

/**
 * Apply environment variables from the .env file.
 *
 * Looks for a `.env` file one directory above this file.
 * Falls back to safe (non-functional) defaults if the file is missing so
 * that errors surface clearly instead of failing silently.
 *
 * @return void
 */
function applyEnv(): void
{
    if (defined('DB_HOST')) {
        return;
    }

    $envPath = __DIR__ . '/../.env';

    if (!\file_exists($envPath) || !\is_readable($envPath)) {
        \error_log("[Env] .env file not found or not readable at: {$envPath}");
        \http_response_code(500);
        header('Content-Type: application/json');
        echo \json_encode(['error' => 'Server is misconfigured. Please contact the administrator.']);
        exit;
    }

    $env = \parse_ini_file($envPath, false, INI_SCANNER_RAW);

    if ($env === false) {
        \error_log("[Env] Failed to parse .env file at: {$envPath}");
        \http_response_code(500);
        header('Content-Type: application/json');
        echo \json_encode(['error' => 'Server is misconfigured. Please contact the administrator.']);
        exit;
    }

    define('DB_HOST', $env['DB_HOST'] ?? '127.0.0.1');
    define('DB_PORT', $env['DB_PORT'] ?? '3306');
    define('DB_NAME', $env['DB_NAME'] ?? '');
    define('DB_USER', $env['DB_USER'] ?? '');
    define('DB_PASS', $env['DB_PASS'] ?? '');
    define('ALLOWED_ORIGIN', $env['ALLOWED_ORIGIN'] ?? '');
    define('API_KEY', $env['API_KEY'] ?? '');
}
