<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Listing.php';

applyCors();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $result = Listing::list([
        'category' => $_GET['category'] ?? '',
        'search'   => $_GET['search']   ?? '',
        'sort'     => $_GET['sort']     ?? 'newest',
        'status'   => $_GET['status']   ?? 'active',
        'page'     => (int) ($_GET['page']     ?? 1),
        'per_page' => (int) ($_GET['per_page'] ?? 20),
    ]);

    http_response_code(200);
    echo json_encode($result);
    exit;
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $errors = [];

    $title       = trim($body['title']       ?? '');
    $description = trim($body['description'] ?? '');
    $price       =      $body['price']       ?? null;
    $category    = trim($body['category']    ?? '');
    $photoUrl    = trim($body['photo_url']   ?? '');

    if (strlen($title) < 3) {
        $errors['title'] = 'Title must be at least 3 characters.';
    }
    if (strlen($description) < 10) {
        $errors['description'] = 'Description must be at least 10 characters.';
    }
    if (!is_numeric($price) || (float) $price <= 0) {
        $errors['price'] = 'Price must be a positive number.';
    }
    if (!$category) {
        $errors['category'] = 'Category is required.';
    }
    if ($photoUrl && !filter_var($photoUrl, FILTER_VALIDATE_URL)) {
        $errors['photo_url'] = 'Photo must be a valid URL.';
    }

    if (!empty($errors)) {
        http_response_code(422);
        echo json_encode(['errors' => $errors]);
        exit;
    }

    $id = Listing::create((int) $user['id'], [
        'title'       => $title,
        'description' => $description,
        'price'       => (float) $price,
        'category'    => $category,
        'photo_url'   => $photoUrl ?: null,
    ]);

    $listing = Listing::findById($id);

    http_response_code(201);
    echo json_encode(['listing' => $listing]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
