<?php

declare(strict_types=1);

namespace App\Models;

use function App\Config\getDB;

class Report
{
    public static function list(
        string $status = 'open',
        int $page = 1,
        int $perPage = 20
    ): array {
        $offset = ($page - 1) * $perPage;
        $pdo    = getDB();

        $where  = $status !== 'all' ? "WHERE r.status = ?" : "";
        $params = $status !== 'all' ? [$status, $perPage, $offset]
                                    : [$perPage, $offset];

        $stmt = $pdo->prepare("
            SELECT r.id, r.reason, r.status, r.created_at,
                   l.title      AS listing_title,
                   u.name       AS reporter_name,
                   u.email      AS reporter_email
            FROM   reports r
            JOIN   listings l ON l.id = r.listing_id
            JOIN   users    u ON u.id = r.reporter_id
            {$where}
            ORDER  BY r.created_at DESC
            LIMIT  ? OFFSET ?
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $countStmt = $pdo->prepare(
            "SELECT COUNT(*) FROM reports r {$where}"
        );
        $countStmt->execute($status !== 'all' ? [$status] : []);
        $total = (int) $countStmt->fetchColumn();

        return ['data' => $rows, 'total' => $total, 'page' => $page];
    }

    public static function create(
        int $reporterId,
        int $listingId,
        string $reason,
        string $details = ''
    ): int {
        $stmt = getDB()->prepare("
            INSERT INTO reports (reporter_id, listing_id, reason, details)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$reporterId, $listingId, $reason, $details]);
        return (int) getDB()->lastInsertId();
    }

    public static function resolve(
        int $id,
        int $resolvedBy,
        string $status
    ): bool {
        $allowed = ['reviewed', 'resolved', 'dismissed'];
        if (!in_array($status, $allowed, true)) {
            return false;
        }

        $stmt = getDB()->prepare("
            UPDATE reports
            SET    status = ?, resolved_by = ?
            WHERE  id = ?
        ");
        $stmt->execute([$status, $resolvedBy, $id]);
        return $stmt->rowCount() > 0;
    }
}
