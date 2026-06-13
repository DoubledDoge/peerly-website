<?php

declare(strict_types=1);

namespace App\Models;

use function App\Config\getDB;

class Listing
{
    public static function findById(int $id): ?array
    {
        $stmt = getDB()->prepare("
            SELECT l.*,
                   u.name  AS seller_name,
                   u.email AS seller_email,
                   u.city  AS seller_city,
                   u.bio   AS seller_bio
            FROM   listings l
            JOIN   users u ON u.id = l.seller_id
            WHERE  l.id = ?
            LIMIT  1
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        $row['seller_rating'] = User::getSellerRating((int) $row['seller_id']);
        return $row;
    }

    public static function list(array $filters = []): array
    {
        $page    = max(1, (int) ($filters['page']     ?? 1));
        $perPage = min(50, max(1, (int) ($filters['per_page'] ?? 20)));
        $offset  = ($page - 1) * $perPage;

        $where  = ['1=1'];
        $params = [];

        $status = $filters['status'] ?? 'active';
        if ($status !== 'all') {
            $where[]  = 'l.status = ?';
            $params[] = $status;
        }

        if (!empty($filters['category'])) {
            $where[]  = 'l.category = ?';
            $params[] = $filters['category'];
        }

        if (!empty($filters['seller_id'])) {
            $where[]  = 'l.seller_id = ?';
            $params[] = (int) $filters['seller_id'];
        }

        if (!empty($filters['search'])) {
            $where[]  = '(l.title LIKE ? OR l.description LIKE ?)';
            $term     = '%' . $filters['search'] . '%';
            $params[] = $term;
            $params[] = $term;
        }

        $orderBy = match ($filters['sort'] ?? 'newest') {
            'price_asc'  => 'l.price ASC',
            'price_desc' => 'l.price DESC',
            default      => 'l.created_at DESC',
        };

        $whereStr = implode(' AND ', $where);
        $pdo      = getDB();

        $stmt = $pdo->prepare("
            SELECT l.id, l.seller_id, l.title, l.price, l.category,
                   l.status, l.photo_url, l.created_at,
                   u.name  AS seller_name,
                   u.email AS seller_email,
                   u.city  AS seller_city
            FROM   listings l
            JOIN   users u ON u.id = l.seller_id
            WHERE  {$whereStr}
            ORDER  BY {$orderBy}
            LIMIT  ? OFFSET ?
        ");
        $stmt->execute([...$params, $perPage, $offset]);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$row) {
            $row['seller_rating'] = User::getSellerRating((int) $row['seller_id']);
        }
        unset($row);

        $countStmt = $pdo->prepare(
            "SELECT COUNT(*) FROM listings l WHERE {$whereStr}"
        );
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        return [
            'data'     => $rows,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $perPage,
        ];
    }

    public static function create(int $sellerId, array $data): int
    {
        $stmt = getDB()->prepare("
            INSERT INTO listings
                (seller_id, title, description, price, category, photo_url)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $sellerId,
            $data['title'],
            $data['description'],
            $data['price'],
            $data['category'],
            $data['photo_url'] ?? null,
        ]);

        $id = (int) getDB()->lastInsertId();

        User::upgradeToSeller($sellerId);

        return $id;
    }

    public static function update(int $id, int $sellerId, array $fields): bool
    {
        $allowed = ['title', 'description', 'price', 'category', 'status', 'photo_url'];
        $set     = [];
        $values  = [];

        foreach ($allowed as $col) {
            if (array_key_exists($col, $fields)) {
                $set[]    = "{$col} = ?";
                $values[] = $fields[$col];
            }
        }

        if (empty($set)) {
            return false;
        }

        $values[] = $id;
        $values[] = $sellerId;

        $stmt = getDB()->prepare(
            "UPDATE listings SET " . implode(', ', $set) . " WHERE id = ? AND seller_id = ?"
        );
        $stmt->execute($values);
        return $stmt->rowCount() > 0;
    }

    public static function adminRemove(int $id): bool
    {
        $stmt = getDB()->prepare(
            "UPDATE listings SET status = 'removed' WHERE id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Delete a listing owned by a seller.
     *
     * @param int $id       The listing ID.
     * @param int $sellerId The seller ID.
     * @return bool True if listing was deleted, false otherwise.
     */
    public static function delete(int $id, int $sellerId): bool
    {
        $stmt = getDB()->prepare(
            "UPDATE listings SET status = 'removed' WHERE id = ? AND seller_id = ?"
        );
        $stmt->execute([$id, $sellerId]);
        return $stmt->rowCount() > 0;
    }
}
