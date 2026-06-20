<?php

declare(strict_types=1);

namespace App\Middleware;

use function App\Config\getDB;

/**
 * Retrieve the session token from the request.
 *
 * @return string|null
 */
function getBearerToken()
{
    $header = isset($_SERVER['HTTP_AUTHORIZATION'])
        ? $_SERVER['HTTP_AUTHORIZATION']
        : (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])
            ? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            : '');

    if (substr($header, 0, 7) === 'Bearer ') {
        $token = trim(substr($header, 7));
        if ($token !== '') {
            return $token;
        }
    }

    if (isset($_GET['auth_token']) && $_GET['auth_token'] !== '') {
        return (string) $_GET['auth_token'];
    }

    return null;
}

function resolveUser()
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

function requireAuth()
{
    $user = resolveUser();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required.']);
        exit;
    }

    return $user;
}

/**
 * Require the authenticated user to have one of the given roles.
 *
 * @param string|array $roles A single role string or an array of role strings.
 *                             (No type declaration here for broad PHP
 *                             version compatibility — validated at
 *                             runtime via the (array) cast below.)
 */
function requireRole($roles)
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

/**
 * Optionally authenticate the user.
 *
 * @return array|null User data if authenticated, null otherwise.
 */
function optionalAuth()
{
    return resolveUser();
}
