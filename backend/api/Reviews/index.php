<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Review.php';

applyCors();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $listingId = (int) ($_GET['listing_id'] ?? 0);

    if (!$listingId) {
        http_response_code(400);
        echo json_encode(['error' => 'listing_id is required.']);
        exit;
    }

    $reviews = Review::listForListing($listingId);

    http_response_code(200);
    echo json_encode(['reviews' => $reviews]);
    exit;
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $listingId = (int) ($body['listing_id'] ?? 0);
    $sellerId  = (int) ($body['seller_id']  ?? 0);
    $rating    = (int) ($body['rating']     ?? 0);
    $comment   = trim($body['comment']      ?? '');

    $errors = [];
    if (!$listingId)                       $errors[] = 'listing_id is required.';
    if (!$sellerId)                        $errors[] = 'seller_id is required.';
    if ($rating < 1 || $rating > 5)       $errors[] = 'Rating must be between 1 and 5.';
    if (strlen($comment) < 5)             $errors[] = 'Comment must be at least 5 characters.';

    if (!empty($errors)) {
        http_response_code(422);
        echo json_encode(['errors' => $errors]);
        exit;
    }

    if ((int) $user['id'] === $sellerId) {
        http_response_code(422);
        echo json_encode(['error' => 'You cannot review your own listing.']);
        exit;
    }

    if (Review::exists((int) $user['id'], $listingId)) {
        http_response_code(409);
        echo json_encode(['error' => 'You have already reviewed this listing.']);
        exit;
    }

    $id     = Review::create(
        reviewerId: (int) $user['id'],
        listingId:  $listingId,
        sellerId:   $sellerId,
        rating:     $rating,
        comment:    $comment
    );
    $review = Review::findById($id);

    http_response_code(201);
    echo json_encode(['review' => $review]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
