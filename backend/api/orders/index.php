<?php

/**
 * Orders list, create, and update endpoint.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/Order.php';
require_once __DIR__ . '/../../models/Listing.php';

\App\Middleware\applyCors();

$method = $_SERVER['REQUEST_METHOD'];
$user   = \App\Middleware\requireAuth();

if ($method === 'GET') {
    if (in_array($user['role'], ['admin', 'moderator'], true)) {
        $page   = (int) ($_GET['page']     ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 50);
        $orders = \App\Models\Order::listAll($page, $perPage);
    } else {
        $orders = \App\Models\Order::listForUser((int) $user['id']);
    }

    http_response_code(200);
    echo json_encode(['orders' => $orders]);
    exit;
}

if ($method === 'POST') {
    $body      = json_decode(file_get_contents('php://input'), true) ?? [];
    $listingId = (int) ($body['listing_id'] ?? 0);

    if (!$listingId) {
        http_response_code(422);
        echo json_encode(['error' => 'listing_id is required.']);
        exit;
    }

    $listing = \App\Models\Listing::findById($listingId);

    if (!$listing) {
        http_response_code(404);
        echo json_encode(['error' => 'Listing not found.']);
        exit;
    }
    if ($listing['status'] !== 'active') {
        http_response_code(409);
        echo json_encode(['error' => 'This listing is no longer available.']);
        exit;
    }
    if ((int) $listing['seller_id'] === (int) $user['id']) {
        http_response_code(422);
        echo json_encode(['error' => 'You cannot purchase your own listing.']);
        exit;
    }

    $orderId = \App\Models\Order::create(
        buyerId:     (int) $user['id'],
        listingId:   $listingId,
        priceAtSale: (float) $listing['price']
    );

    $order = \App\Models\Order::findById($orderId);

    http_response_code(201);
    echo json_encode([
        'order'   => $order,
        'message' => 'Order placed. Payment integration coming soon.',
    ]);
    exit;
}

if ($method === 'PUT') {
    if (!in_array($user['role'], ['admin', 'moderator'], true)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: insufficient permissions.']);
        exit;
    }

    $id   = (int) ($_GET['id'] ?? 0);
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $status = trim($body['status'] ?? '');

    if (!$id || !$status) {
        http_response_code(422);
        echo json_encode(['error' => 'Order ID and status are required.']);
        exit;
    }

    $updated = \App\Models\Order::updateStatus($id, $status);

    if (!$updated) {
        http_response_code(400);
        echo json_encode(['error' => 'Could not update order. Check ID and status value.']);
        exit;
    }

    http_response_code(200);
    echo json_encode(['message' => "Order #{$id} marked as {$status}."]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
