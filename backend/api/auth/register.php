<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../models/User.php';

\App\Middleware\applyCors();

use function App\Config\getDB;
use App\Models\User;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    \http_response_code(405);
    echo \json_encode(['error' => 'Method not allowed.']);
    exit;
}

$body = \json_decode(\file_get_contents('php://input'), true) ?? [];

$name     = \trim($body['name']     ?? '');
$email    = \trim($body['email']    ?? '');
$password =      $body['password'] ?? '';
$city     = \trim($body['city']     ?? '');

$errors = [];

if (\strlen($name) < 2) {
    $errors['name'] = 'Name must be at least 2 characters.';
}

if (!\filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'A valid email address is required.';
}

if (!\preg_match(
    '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\\\|,.<>\/?]).{8,}$/',
    $password
)
) {
    $errors['password'] =
        'Password must be 8+ characters with uppercase, lowercase, number, and symbol.';
}

if (!empty($errors)) {
    \http_response_code(422);
    echo \json_encode(['errors' => $errors]);
    exit;
}

if (User::findByEmail($email)) {
    \http_response_code(409);
    echo \json_encode(['error' => 'An account with this email already exists.']);
    exit;
}

$hash   = \password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
$userId = User::create($name, $email, $hash);

if ($city) {
    User::update($userId, ['city' => $city]);
}

getDB()->prepare(
    "DELETE FROM sessions WHERE user_id = ? AND expires_at <= NOW()"
)->execute([$userId]);

$token     = \bin2hex(\random_bytes(32));
$tokenHash = \hash('sha256', $token);
$expiresAt = \date('Y-m-d H:i:s', \strtotime('+30 days'));

getDB()->prepare(
    "INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)"
)->execute([$userId, $tokenHash, $expiresAt]);

$user = User::findById($userId);

\http_response_code(201);
\header('Content-Type: application/json');
echo \json_encode([
    'token' => $token,
    'user'  => $user,
]);
exit;
