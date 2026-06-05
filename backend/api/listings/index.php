<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/Listing.php';

\App\Middleware\applyCors();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $result = \App\Models\Listing::list([
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
    $user = \App\Middleware\requireAuth();

    $errors = [];

    $title       = trim($_POST['title']       ?? '');
    $description = trim($_POST['description'] ?? '');
    $price       =      $_POST['price']       ?? null;
    $category    = trim($_POST['category']    ?? '');

    $photoUrl    = null;

    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../../../frontend/public/uploads/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileExtension = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
        $fileName = uniqid('listing_') . '.' . $fileExtension;
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['photo']['tmp_name'], $targetPath)) {
            $photoUrl = '/uploads/' . $fileName;
        } else {
            $errors['photo'] = 'Failed to save the uploaded image.';
        }
    } else {
        $errors['photo'] = 'A product photo is required.';
    }

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

    if (!empty($errors)) {
        http_response_code(422);
        echo json_encode(['errors' => $errors]);
        exit;
    }

    $id = \App\Models\Listing::create((int) $user['id'], [
        'title'       => $title,
        'description' => $description,
        'price'       => (float) $price,
        'category'    => $category,
        'photo_url'   => $photoUrl,
    ]);

    $listing = \App\Models\Listing::findById($id);

    http_response_code(201);
    echo json_encode(['listing' => $listing]);
    exit;
}
