<?php

declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;

use function App\Config\applyEnv;

function getDB(): PDO
{
    applyEnv();

    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host = DB_HOST;
    $port = DB_PORT;
    $name = DB_NAME;
    $user = DB_USER;
    $pass = DB_PASS;

    if (!$name || !$user) {
        \http_response_code(500);
        echo \json_encode(['error' => 'Database not configured.']);
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
        \error_log('[DB] Connection failed: ' . $e->getMessage());
        \http_response_code(500);
        echo \json_encode(['error' => 'Database connection failed.']);
        exit;
    }

    return $pdo;
}
