<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/Listing.php';

applyCors();

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int) $_GET['id'] : null;

if ($method === 'GET' && $id === null) {
    requireRole('admin');

    $result = User::list(
        page:    (int) ($_GET['page']     ?? 1),
        perPage: (int) ($_GET['per_page'] ?? 20),
        role:         ($_GET['role']      ?? '')
    );

    http_response_code(200);
    echo json_encode($result);
    exit;
}

if ($method === 'GET' && $id !== null) {
    $user = User::findById($id);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found.']);
        exit;
    }

    $user['seller_rating'] = User::getSellerRating($id);
    $user['listings']      = Listing::list([
        'seller_id' => $id,
        'status'    => 'active',
        'per_page'  => 12,
    ])['data'];

    http_response_code(200);
    echo json_encode(['user' => $user]);
    exit;
}

if ($method === 'PUT' && $id !== null) {
    $authUser = requireAuth();
    $isSelf   = (int) $authUser['id'] === $id;
    $isAdmin  = $authUser['role'] === 'admin';

    if (!$isSelf && !$isAdmin) {
        http_response_code(403);
        echo json_encode(['error' => 'You can only update your own profile.']);
        exit;
    }

    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $fields = array_intersect_key($body, array_flip([
        'name', 'city', 'bio', 'avatar_url'
    ]));

    if ($isAdmin) {
        if (isset($body['role'])) {
            $allowed = ['buyer','seller','moderator','admin'];
            if (!in_array($body['role'], $allowed, true)) {
                http_response_code(422);
                echo json_encode(['error' => 'Invalid role.']);
                exit;
            }
            User::setRole($id, $body['role']);
        }
        if (isset($body['is_active'])) {
            User::setActive($id, (bool) $body['is_active']);
        }
    }

    if (!empty($fields)) {
        User::update($id, $fields);
    }

    $updated = User::findById($id);

    http_response_code(200);
    echo json_encode(['user' => $updated]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
