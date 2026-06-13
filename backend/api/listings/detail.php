<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/Listing.php';

\App\Middleware\applyCors();

$id = (int) ($_GET['id'] ?? 0);
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Listing ID is required.']);
    exit;
}

$listing = \App\Models\Listing::findById($id);
if (!$listing) {
    http_response_code(404);
    echo json_encode(['error' => 'Listing not found.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    http_response_code(200);
    echo json_encode(['listing' => $listing]);
    exit;
}

if ($method === 'PUT') {
    $user = \App\Middleware\requireAuth();
    $isOwner = (int) $listing['seller_id'] === (int) $user['id'];
    $isAdmin = in_array($user['role'], ['admin'], true);

    if (!$isOwner && !$isAdmin) {
        http_response_code(403);
        echo json_encode(['error' => 'You can only edit your own listings.']);
        exit;
    }

    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $fields = array_intersect_key(
        $body,
        array_flip(
            [
                'title', 'description', 'price', 'category', 'photo_url', 'status'
            ]
        )
    );

    if (isset($fields['price']) && ((float) $fields['price'] <= 0)) {
        http_response_code(422);
        echo json_encode(['errors' => ['price' => 'Price must be a positive number.']]);
        exit;
    }

    $updated = $isAdmin
        ? \App\Models\Listing::update($id, (int) $listing['seller_id'], $fields)
        : \App\Models\Listing::update($id, (int) $user['id'], $fields);

    if (!$updated) {
        http_response_code(400);
        echo json_encode(['error' => 'No changes made.']);
        exit;
    }

    http_response_code(200);
    echo json_encode(['listing' => \App\Models\Listing::findById($id)]);
    exit;
}

if ($method === 'DELETE') {
    $user    = \App\Middleware\requireAuth();
    $isOwner = (int) $listing['seller_id'] === (int) $user['id'];
    $isAdmin = in_array($user['role'], ['admin', 'moderator'], true);

    if (!$isOwner && !$isAdmin) {
        http_response_code(403);
        echo json_encode(['error' => 'You can only remove your own listings.']);
        exit;
    }

    $removed = $isAdmin
        ? \App\Models\Listing::adminRemove($id)
        : \App\Models\Listing::delete($id, (int) $user['id']);

    if (!$removed) {
        http_response_code(400);
        echo json_encode(['error' => 'Could not remove listing.']);
        exit;
    }

    http_response_code(200);
    echo json_encode(['message' => 'Listing removed.']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
