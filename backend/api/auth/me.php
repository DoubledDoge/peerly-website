<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/User.php';

applyCors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$user = requireAuth();

$fresh = User::findById((int) $user['id']);

if (!$fresh) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found.']);
    exit;
}

if (in_array($fresh['role'], ['seller', 'admin'], true)) {
    $fresh['seller_rating'] = User::getSellerRating((int) $fresh['id']);
}

http_response_code(200);
echo json_encode(['user' => $fresh]);