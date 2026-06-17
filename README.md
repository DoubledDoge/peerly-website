# Peerly

<div align="center">

![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.5-777BB4?style=flat-square&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-2.x-60A5FA?style=flat-square&logo=biome&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Hosted-GitHub%20Pages-222222?style=flat-square&logo=github&logoColor=white)

A peer-to-peer marketplace built for people, not businesses. Buy and sell directly with others in your local area — no corporate middlemen, no listing fees.

</div>

## Table of Contents

- [Repository Structure](#repository-structure)
- [Local Development](#local-development)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)

---

## Repository Structure

```
peerly-website/
├── frontend/               # Vite frontend application
│   └── src/
│       ├── index.html      # Home page
│       ├── index.js
│       ├── components/     # Navbar, footer, cards, etc.
│       ├── pages/          # All page HTML + JS pairs
│       │   └── admin/      # Admin dashboard pages
│       ├── services/       # API service layer
│       ├── utils/          # Auth guard, storage, validators
│       ├── styles/         # Global and per-page CSS
│       └── assets/         # SVG icons
├── backend/                # PHP REST API
│   ├── api/                # Endpoint files
│   │   ├── auth/           # login, register, logout, me
│   │   ├── listings/       # index, detail
│   │   ├── users/
│   │   ├── orders/
│   │   ├── reports/
│   │   └── Reviews/
│   ├── models/             # User, Listing, Order, Review, Report
│   ├── middleware/         # auth.php, cors.php
│   ├── config/             # db.php
│   └── .htaccess
├── database/
│   └── schema.sql          # Full database schema
├── .github/
│   └── workflows/
│       ├── ci-cd.yml       # Biome + PHPCS
│       ├── codeql.yml      # JS security scanning
│       ├── deploy.yml      # GitHub Pages + FTP deploy
│       └── release.yml     # git-cliff changelog + GitHub Release
└── .env.example            # Environment variable reference
```

---

## Local Development

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

The dev server starts at `http://localhost:5173`. API requests to `/api/*` are proxied to `http://localhost:8080` automatically via the Vite config and can be adjusted as needed.

### Backend

Start a PHP server rooted at the `backend/` directory on port 8080:

```bash
cd backend
php -S localhost:8080
```

Make sure `env.php` is present in the `backend/` directory with your local credentials.

---

## Database Setup

1. Create a MySQL database
2. Import the schema:

```bash
mysql -u your_user -p your_database < database/schema.sql
```

---

## Environment Variables

Refer to `.env.example` from the root for all required variables that may need to be set as part of GitHub secrets and elsewhere.

### Backend

This file lives only on the server and is never committed to the repository:

```php
<?php
namespace App\Config;

function applyEnv(): void
{
    if (defined('DB_HOST')) {
        return;
    }
    define('DB_HOST', 'your_db_host');
    define('DB_PORT', '3306');
    define('DB_NAME', 'your_db_name');
    define('DB_USER', 'your_db_user');
    define('DB_PASS', 'your_db_password');
    define('ALLOWED_ORIGIN', 'https://yourusername.github.io');
    define('API_KEY',  'your_api_key_here');
}
```
