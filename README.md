# Peerly

<div align="center">

![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-7.4-777BB4?style=flat-square&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-2.x-60A5FA?style=flat-square&logo=biome&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Hosted-GitHub%20Pages-222222?style=flat-square&logo=github&logoColor=white)

A peer-to-peer marketplace built for people, not businesses. Buy and sell directly with others in your local area - no corporate middlemen, no listing fees.

</div>

## Table of Contents

- [Repository Structure](#repository-structure)
- [Deployment](#deployment)
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
│   │   └── reviews/
│   ├── models/             # User, Listing, Order, Review, Report
│   ├── middleware/         # auth.php, cors.php
│   ├── config/             # db.php, env.php
│   └── .htaccess
├── database/
│   └── schema.sql          # Full database schema
├── .github/
│   └── workflows/
│       ├── ci-cd.yml       # Biome + PHPCS
│       ├── codeql.yml      # JS security scanning
│       ├── deploy.yml      # GitHub Pages + FTP deploy
│       └── release.yml     # git-cliff changelog + GitHub Release
└── backend/.env.example    # Template for backend/.env and frontend/.env
```

---

## Deployment

This project deploys to two separate platforms that do not share infrastructure:

| Component | Platform | Notes |
|---|---|---|
| Frontend | GitHub Pages | Static build output from `frontend/`, deployed via `.github/workflows/deploy.yml` |
| Backend | InfinityFree (shared hosting) | PHP 7.4, no shell access, deployed via FTP |

Because the two are on different origins, **all API requests are cross-origin**. The backend's CORS middleware (`middleware/cors.php`) reads an allowed origin from `ALLOWED_ORIGIN` in `backend/.env` and sends it back as `Access-Control-Allow-Origin`. If you fork this project or change domains, update that value — a mismatch here is the most common cause of "it works locally but not when deployed" issues.

---

## Local Development

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

The dev server starts at `http://localhost:5173`. API requests to `/api/*` are proxied to `http://localhost:8080` automatically via the Vite config and can be adjusted as needed.

You'll also need a `VITE_API_KEY` value available at build time, without it, requests to the backend will be rejected.

A `frontend/.env/` file is optional for local development, but if you want to test the deployed backend, you can create one with the following contents:
```
### Backend

Start a PHP server rooted at the `backend/` directory on port 8080:

```bash
cd backend
php -S localhost:8080
```

Before doing this, create `backend/.env` (copy `backend/.env.example` and fill in real values) - `config/env.php` reads credentials from this file at runtime. The server will return a `500` on every request if `.env` is missing.

---

## Database Setup

1. Create a MySQL database.
2. Import the schema:

```bash
mysql -u your_user -p your_database < database/schema.sql
```

---

## Environment Variables

Refer to `backend/.env.example` for all required variables. These live in `backend/.env` and are **never committed** - on InfinityFree this file is uploaded directly via FTP, and locally it sits in your own `backend/` directory.

| Variable | Used by
|---|---|
| `DB_HOST` | `config/db.php`
| `DB_PORT` | `config/db.php`
| `DB_NAME` | `config/db.php`
| `DB_USER` | `config/db.php`
| `DB_PASS` | `config/db.php`
| `ALLOWED_ORIGIN` | `middleware/cors.php`
| `API_KEY` | `middleware/cors.php`

The frontend additionally needs a build-time variable, set via GitHub Actions secrets (or a local `.env` inside `frontend/` for local dev):

| Variable | Used by | Notes |
|---|---|---|
| `VITE_API_KEY` | `frontend/src/utils/api.js` | Must match `API_KEY` in `backend/.env`. Sent as the `X-API-Key` header on every request. Since this ships in the static frontend build, treat it as a shared app identifier rather than a true secret — it's visible to anyone who inspects the deployed JS bundle. |
| `VITE_API_BASE_URL` | `frontend/src/utils/api.js` | The deployed backend's base URL when not using the local Vite proxy |

---
