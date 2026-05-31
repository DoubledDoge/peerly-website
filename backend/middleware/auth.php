<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

function getBearerToken(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION']
           ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
           ?? '';

    if (str_starts_with($header, 'Bearer ')) {
        $token = trim(substr($header, 7));
        return $token !== '' ? $token : null;
    }

    return null;
}

function resolveUser(): ?array
{
    $token = getBearerToken();

    if (!$token) {
        return null;
    }

    $hash = hash('sha256', $token);
    $pdo  = getDB();

    $stmt = $pdo->prepare("
        SELECT u.id, u.name, u.email, u.role, u.city, u.is_active,
               s.expires_at
        FROM   sessions s
        JOIN   users u ON u.id = s.user_id
        WHERE  s.token_hash = ?
          AND  s.expires_at > NOW()
          AND  u.is_active = 1
        LIMIT  1
    ");
    $stmt->execute([$hash]);
    $row = $stmt->fetch();

    return $row ?: null;
}

function requireAuth(): array
{
    $user = resolveUser();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required.']);
        exit;
    }

    return $user;
}

function requireRole(string|array $roles): array
{
    $user  = requireAuth();
    $roles = (array) $roles;

    if (!in_array($user['role'], $roles, true)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: insufficient permissions.']);
        exit;
    }

    return $user;
}

function optionalAuth(): ?array
{
    return resolveUser();
}
