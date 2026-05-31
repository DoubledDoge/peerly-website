<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../models/User.php';

applyCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$body     = json_decode(file_get_contents('php://input'), true) ?? [];
$email    = trim($body['email']    ?? '');
$password =      $body['password'] ?? '';

if (!$email || !$password) {
    http_response_code(422);
    echo json_encode(['error' => 'Email and password are required.']);
    exit;
}

$user = User::findByEmail($email);

$dummyHash = '$2y$12$invalidhashfortimingprevention000000000000000000000000000';
$valid     = $user
    ? password_verify($password, $user['password_hash'])
    : password_verify($password, $dummyHash);

if (!$user || !$valid) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid email or password.']);
    exit;
}

if (!$user['is_active']) {
    http_response_code(403);
    echo json_encode(['error' => 'Your account has been suspended.']);
    exit;
}

getDB()->prepare(
    "DELETE FROM sessions WHERE user_id = ? AND expires_at <= NOW()"
)->execute([$user['id']]);
$token     = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $token);
$expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));

getDB()->prepare("
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
")->execute([$user['id'], $tokenHash, $expiresAt]);

unset($user['password_hash']);

http_response_code(200);
echo json_encode([
    'token' => $token,
    'user'  => $user,
]);
