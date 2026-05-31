<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Report.php';

applyCors();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole(['moderator', 'admin']);

    $result = Report::list(
        status:  $_GET['status']   ?? 'open',
        page:    (int) ($_GET['page']     ?? 1),
        perPage: (int) ($_GET['per_page'] ?? 20)
    );

    http_response_code(200);
    echo json_encode($result);
    exit;
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $listingId = (int) ($body['listing_id'] ?? 0);
    $reason    = trim($body['reason']    ?? '');
    $details   = trim($body['details']   ?? '');

    if (!$listingId || !$reason) {
        http_response_code(422);
        echo json_encode(['error' => 'listing_id and reason are required.']);
        exit;
    }

    $id = Report::create((int) $user['id'], $listingId, $reason, $details);

    http_response_code(201);
    echo json_encode(['report_id' => $id, 'message' => 'Report submitted.']);
    exit;
}

if ($method === 'PUT') {
    $user = requireRole(['moderator', 'admin']);

    $id     = (int) ($_GET['id'] ?? 0);
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $status = trim($body['status'] ?? '');

    if (!$id || !$status) {
        http_response_code(422);
        echo json_encode(['error' => 'Report ID and status are required.']);
        exit;
    }

    $updated = Report::resolve($id, (int) $user['id'], $status);

    if (!$updated) {
        http_response_code(400);
        echo json_encode(['error' => 'Could not update report. Check ID and status value.']);
        exit;
    }

    http_response_code(200);
    echo json_encode(['message' => 'Report updated.']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
