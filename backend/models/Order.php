<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

class Order
{
    public static function findById(int $id): ?array
    {
        $stmt = getDB()->prepare("
            SELECT o.*,
                   l.title      AS listing_title,
                   l.photo_url  AS listing_photo,
                   u.name       AS buyer_name,
                   u.email      AS buyer_email
            FROM   orders o
            JOIN   listings l ON l.id = o.listing_id
            JOIN   users    u ON u.id = o.buyer_id
            WHERE  o.id = ?
            LIMIT  1
        ");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public static function listForUser(int $buyerId): array
    {
        $stmt = getDB()->prepare("
            SELECT o.id, o.status, o.price_at_sale, o.created_at,
                   l.title     AS listing_title,
                   l.photo_url AS listing_photo
            FROM   orders o
            JOIN   listings l ON l.id = o.listing_id
            WHERE  o.buyer_id = ?
            ORDER  BY o.created_at DESC
        ");
        $stmt->execute([$buyerId]);
        return $stmt->fetchAll();
    }


    public static function listAll(int $page = 1, int $perPage = 50): array
    {
        $offset = ($page - 1) * $perPage;
        $pdo    = getDB();

        $stmt = $pdo->prepare("
            SELECT o.id, o.status, o.price_at_sale, o.created_at,
                   o.listing_id,
                   l.title      AS listing_title,
                   u.id         AS buyer_id,
                   u.name       AS buyer_name,
                   u.email      AS buyer_email
            FROM   orders o
            JOIN   listings l ON l.id = o.listing_id
            JOIN   users    u ON u.id = o.buyer_id
            ORDER  BY o.created_at DESC
            LIMIT  ? OFFSET ?
        ");
        $stmt->execute([$perPage, $offset]);
        return $stmt->fetchAll();
    }

    public static function create(
        int $buyerId,
        int $listingId,
        float $priceAtSale
    ): int {
        $pdo = getDB();
        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare("
                INSERT INTO orders (buyer_id, listing_id, price_at_sale)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$buyerId, $listingId, $priceAtSale]);
            $orderId = (int) $pdo->lastInsertId();

            $pdo->prepare("
                UPDATE listings SET status = 'sold' WHERE id = ?
            ")->execute([$listingId]);

            $pdo->commit();
            return $orderId;
        } catch (PDOException $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function updateStatus(int $id, string $status): bool
    {
        $allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            return false;
        }

        $stmt = getDB()->prepare(
            "UPDATE orders SET status = ? WHERE id = ?"
        );
        $stmt->execute([$status, $id]);
        return $stmt->rowCount() > 0;
    }
}
