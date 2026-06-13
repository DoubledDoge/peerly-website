<?php

declare(strict_types=1);

namespace App\Models;

use function App\Config\getDB;

class Review
{
    public static function listForListing(int $listingId): array
    {
        $stmt = getDB()->prepare("
            SELECT r.id, r.rating, r.comment, r.created_at,
                   u.name AS reviewer_name
            FROM   reviews r
            JOIN   users u ON u.id = r.reviewer_id
            WHERE  r.listing_id = ?
            ORDER  BY r.created_at DESC
        ");
        $stmt->execute([$listingId]);
        return $stmt->fetchAll();
    }

    public static function exists(int $reviewerId, int $listingId): bool
    {
        $stmt = getDB()->prepare("
            SELECT 1 FROM reviews
            WHERE reviewer_id = ? AND listing_id = ?
            LIMIT 1
        ");
        $stmt->execute([$reviewerId, $listingId]);
        return (bool) $stmt->fetchColumn();
    }

    public static function create(
        int $reviewerId,
        int $listingId,
        int $sellerId,
        int $rating,
        string $comment
    ): int {
        $stmt = getDB()->prepare("
            INSERT INTO reviews
                (reviewer_id, listing_id, seller_id, rating, comment)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$reviewerId, $listingId, $sellerId, $rating, $comment]);
        return (int) getDB()->lastInsertId();
    }

    /**
     * Find a review by ID.
     *
     * @param int $id The review ID.
     * @return array|null The review data or null if not found.
     */
    public static function findById(int $id): ?array
    {
        $stmt = getDB()->prepare(
            "SELECT r.id, r.rating, r.comment, r.created_at,
                    u.name AS reviewer_name
             FROM   reviews r
             JOIN   users u ON u.id = r.reviewer_id
             WHERE  r.id = ?
             LIMIT  1"
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
}
