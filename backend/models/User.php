<?php

declare(strict_types=1);

namespace App\Models;

use function App\Config\getDB;

class User
{
    public static function findById(int $id): ?array
    {
        $stmt = getDB()->prepare("
            SELECT id, name, email, role, city, bio, avatar_url,
                   is_active, created_at
            FROM   users
            WHERE  id = ?
            LIMIT  1
        ");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public static function findByEmail(string $email): ?array
    {
        $stmt = getDB()->prepare("
            SELECT id, name, email, password_hash, role, city,
                   bio, avatar_url, is_active, created_at
            FROM   users
            WHERE  email = ?
            LIMIT  1
        ");
        $stmt->execute([$email]);
        return $stmt->fetch() ?: null;
    }

    public static function list(
        int $page = 1,
        int $perPage = 20,
        string $role = ''
    ): array {
        $offset = ($page - 1) * $perPage;
        $pdo    = getDB();

        $where  = $role ? "WHERE role = ?" : "";
        $params = $role ? [$role, $perPage, $offset] : [$perPage, $offset];

        $stmt = $pdo->prepare("
            SELECT id, name, email, role, city, is_active, created_at
            FROM   users
            {$where}
            ORDER  BY created_at DESC
            LIMIT  ? OFFSET ?
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM users {$where}");
        $countStmt->execute($role ? [$role] : []);
        $total = (int) $countStmt->fetchColumn();

        return [
            'data'     => $rows,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $perPage,
        ];
    }

    public static function getSellerRating(int $sellerId): float
    {
        $stmt = getDB()->prepare("
            SELECT ROUND(AVG(rating), 1)
            FROM   reviews
            WHERE  seller_id = ?
        ");
        $stmt->execute([$sellerId]);
        return (float) ($stmt->fetchColumn() ?: 0);
    }

    public static function create(
        string $name,
        string $email,
        string $passwordHash
    ): int {
        $stmt = getDB()->prepare("
            INSERT INTO users (name, email, password_hash)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$name, $email, $passwordHash]);
        return (int) getDB()->lastInsertId();
    }

    public static function update(int $id, array $fields): bool
    {
        $allowed = ['name', 'city', 'bio', 'avatar_url'];
        $set     = [];
        $values  = [];

        foreach ($allowed as $col) {
            if (\array_key_exists($col, $fields)) {
                $set[]    = "{$col} = ?";
                $values[] = $fields[$col];
            }
        }

        if (empty($set)) {
            return false;
        }

        $values[] = $id;
        $stmt = getDB()->prepare(
            "UPDATE users SET " . \implode(', ', $set) . " WHERE id = ?"
        );
        $stmt->execute($values);
        return $stmt->rowCount() > 0;
    }

    public static function setRole(int $id, string $role): bool
    {
        $stmt = getDB()->prepare("UPDATE users SET role = ? WHERE id = ?");
        $stmt->execute([$role, $id]);
        return $stmt->rowCount() > 0;
    }

    public static function setActive(int $id, bool $active): bool
    {
        $stmt = getDB()->prepare("UPDATE users SET is_active = ? WHERE id = ?");
        $stmt->execute([$active ? 1 : 0, $id]);
        return $stmt->rowCount() > 0;
    }

    public static function upgradeToSeller(int $id): void
    {
        getDB()->prepare("
            UPDATE users SET role = 'seller'
            WHERE  id = ? AND role = 'buyer'
        ")->execute([$id]);
    }
}
