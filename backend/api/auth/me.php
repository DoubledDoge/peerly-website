<?php
/**
 * Get current user endpoint.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/User.php';

\App\Middleware\applyCors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$user = \App\Middleware\requireAuth();

$fresh = \App\Models\User::findById((int) $user['id']);

if (!$fresh) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'User not found.']);
    exit;
}

if (in_array($fresh['role'], ['seller', 'admin'], true)) {
    $fresh['seller_rating'] = \App\Models\User::getSellerRating((int) $fresh['id']);
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['user' => $fresh]);
exit;
