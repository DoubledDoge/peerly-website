<?php

namespace App\Config;

function applyEnv(): void
{
    if (defined('DB_HOST')) {
        return;
    }

    define('DB_HOST', '');
    define('DB_PORT', '');
    define('DB_NAME', '');
    define('DB_USER', '');
    define('DB_PASS', ''); // Password
    define('ALLOWED_ORIGIN', ''); // Frontend URL
    define('API_KEY', ''); // Generate your own
}
