SET names utf8mb4; SET foreign_key_checks = 0;

-- USERS
CREATE TABLE IF NOT EXISTS `users`
(
    `id`            INT UNSIGNED NOT NULL auto_increment,
    `name`          VARCHAR(100) NOT NULL,
    `email`         VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role`          ENUM('buyer','seller','moderator','admin') NOT NULL DEFAULT 'buyer',
    `city`          VARCHAR(100) NOT NULL DEFAULT '',
    `bio`           TEXT,
    `avatar_url`    VARCHAR(2048),
    `is_active`     BOOLEAN NOT NULL DEFAULT 1,
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP on
                    UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_email` (`email`),
    KEY `idx_users_role` (`role`),
    KEY `idx_users_is_active` (`is_active`)
)
engine=innodb DEFAULT charset=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SESSIONS
-CREATE TABLE IF NOT EXISTS `sessions`
(
    `id`         INT UNSIGNED NOT NULL auto_increment,
    `user_id`    INT UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_sessions_token` (`token_hash`),
    KEY `idx_sessions_user` (`user_id`),
    KEY `idx_sessions_expires` (`expires_at`),
    CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON
    DELETE CASCADE
)
engine=innodb DEFAULT charset=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LISTINGS
CREATE TABLE IF NOT EXISTS `listings`
(
    `id`            INT UNSIGNED NOT NULL auto_increment,
    `seller_id`     INT UNSIGNED NOT NULL,
    `title`         VARCHAR(255) NOT NULL,
    `description`   TEXT NOT NULL,
    `price`         DECIMAL(10,2) NOT NULL,
    `category`      VARCHAR(100) NOT NULL,
    `status`        ENUM('active','sold','removed') NOT NULL DEFAULT 'active',
    `photo_url`     VARCHAR(2048),
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP on
                    UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_listings_seller` (`seller_id`),
    KEY `idx_listings_status` (`status`),
    KEY `idx_listings_category` (`category`),
    KEY `idx_listings_created` (`created_at`),
    CONSTRAINT `fk_listings_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`)
    ON
    DELETE CASCADE
)
engine=innodb DEFAULT charset=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- REVIEWS
CREATE TABLE IF NOT EXISTS `reviews`
(
    `id`            INT UNSIGNED NOT NULL auto_increment,
    `reviewer_id`   INT UNSIGNED NOT NULL, -- buyer
    `seller_id`     INT UNSIGNED NOT NULL,
    `listing_id`    INT UNSIGNED NOT NULL,
    `rating`        TINYINT NOT NULL check (`rating` BETWEEN 1 AND 5),
    `comment`       text,
    `created_at`    datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_reviews_buyer_listing` (`reviewer_id`, `listing_id`),
    KEY `idx_reviews_seller` (`seller_id`),
    CONSTRAINT `fk_reviews_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON
    DELETE CASCADE,
    CONSTRAINT `fk_reviews_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`)
    ON
    DELETE CASCADE,
    CONSTRAINT `fk_reviews_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`)
    ON
    DELETE CASCADE
)
engine=innodb DEFAULT charset=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ORDERS
CREATE TABLE IF NOT EXISTS `orders`
(
    `id`            INT UNSIGNED NOT NULL auto_increment,
    `buyer_id`      INT UNSIGNED NOT NULL,
    `listing_id`    INT UNSIGNED NOT NULL,
    `status`        ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
    `price_at_sale` DECIMAL(10,2) NOT NULL,
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP on
                    UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_orders_buyer` (`buyer_id`),
    KEY `idx_orders_listing` (`listing_id`),
    KEY `idx_orders_status` (`status`),
    CONSTRAINT `fk_orders_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`)
    ON
    DELETE CASCADE,
    CONSTRAINT `fk_orders_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`)
    ON
    DELETE CASCADE
)
engine=innodb DEFAULT charset=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- REPORTS
CREATE TABLE IF NOT EXISTS `reports`
(
    `id`            INT UNSIGNED NOT NULL auto_increment,
    `reporter_id`   INT UNSIGNED NOT NULL,
    `listing_id`    INT UNSIGNED NOT NULL,
    `reason`        VARCHAR(255) NOT NULL,
    `details`       TEXT,
    `status`        ENUM('open','reviewed','resolved','dismissed') NOT NULL DEFAULT 'open',
    `resolved_by`   INT UNSIGNED DEFAULT NULL,
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP on
                    UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_reports_reporter` (`reporter_id`),
    KEY `idx_reports_listing` (`listing_id`),
    KEY `idx_reports_status` (`status`),
    CONSTRAINT `fk_reports_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`)
    ON
    DELETE CASCADE,
    CONSTRAINT `fk_reports_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`)
    ON
    DELETE CASCADE,
    CONSTRAINT `fk_reports_resolver` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`)
    ON
    DELETE SET NULL
)
engine=innodb DEFAULT charset=utf8mb4 COLLATE=utf8mb4_unicode_ci;
