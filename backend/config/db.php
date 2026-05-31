<?php

declare(strict_types=1);

function getDB(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: 'localhost';
    $port = getenv('DB_PORT') ?: '3306';
    $name = getenv('DB_NAME') ?: '';
    $user = getenv('DB_USER') ?: '';
    $pass = getenv('DB_PASS') ?: '';

    if (!$name || !$user) {
        http_response_code(500);
        echo json_encode(['error' => 'Database not configured.']);
        exit;
    }

    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_PERSISTENT         => false,
        ]);
    } catch (PDOException $e) {
        error_log('[DB] Connection failed: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed.']);
        exit;
    }

    return $pdo;
}
