# cPanel Deployment Guide — e-Khata

This guide walks through deploying the **e-Khata** application (Laravel 11 backend + Expo/React Native web frontend) on a shared hosting server using **cPanel**.

---

## Prerequisites

| Requirement | Minimum Version |
|---|---|
| PHP | 8.2+ |
| MySQL / MariaDB | 5.7+ / 10.3+ |
| Node.js (local build) | 18+ |
| Composer (local) | 2.x |
| cPanel Hosting | Any with Terminal or SSH access |

---

## 1. Prepare the Laravel Backend (Local)

### 1.1 Install Dependencies

```bash
cd backend
composer install --optimize-autoloader --no-dev
```

### 1.2 Configure `.env` for Production

Create/copy `.env` and update these values:

```env
APP_NAME=e-Khata
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Database — use values from cPanel MySQL
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=cpaneluser_ekhata
DB_USERNAME=cpaneluser_ekhata
DB_PASSWORD=your_strong_password

# Session / Cache
SESSION_DRIVER=file
CACHE_DRIVER=file
QUEUE_CONNECTION=sync

# Sanctum
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
```

### 1.3 Generate App Key & Clear Cache

```bash
php artisan key:generate
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 2. Prepare the Frontend (Local Build)

### 2.1 Update API Base URL

In `frontend/services/api.ts`, ensure the production API URL is set:

```ts
const BASE_URL = 'https://yourdomain.com/api/v1';
```

Or use environment variables via Expo:

```ts
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://yourdomain.com/api/v1';
```

### 2.2 Build the Web App

```bash
cd frontend
npm install
npx expo export:web
```

This generates the `frontend/web-build/` directory with static assets.

> **Alternative (if `expo export:web` is not available):**
> ```bash
> npx expo export --platform web
> ```
> Output will be in `frontend/dist/`.

---

## 3. cPanel — Create Database

1. Log into **cPanel** → **MySQL Databases**
2. Create a new database: `cpaneluser_ekhata`
3. Create a new MySQL user: `cpaneluser_ekhata` with a strong password
4. **Add user to database** with **ALL PRIVILEGES**
5. Note down the database name, username, and password for `.env`

---

## 4. Upload Files to cPanel

### 4.1 Directory Structure

```
/home/cpaneluser/
├── ekhata/                    ← Laravel app (OUTSIDE public_html)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env
│   └── artisan
│
├── public_html/
│   ├── api/                   ← Symlink or copy of Laravel's public/
│   │   ├── index.php          ← Modified to point to ../ekhata
│   │   ├── .htaccess
│   │   └── storage → ../../ekhata/storage/app/public
│   │
│   ├── index.html             ← React/Expo web-build
│   ├── static/                ← Web build assets
│   ├── asset-manifest.json
│   └── ...
```

### 4.2 Upload Backend

**Option A — File Manager (ZIP upload):**
1. ZIP the entire `backend/` folder (excluding `node_modules/`, `.git/`)
2. Upload ZIP via **cPanel → File Manager** to `/home/cpaneluser/`
3. Extract and rename to `ekhata/`

**Option B — SSH / Terminal:**
```bash
cd /home/cpaneluser
# Upload via SCP or Git
git clone https://github.com/musman5264/e-Khata.git ekhata-repo
cp -r ekhata-repo/backend ekhata
```

### 4.3 Upload Frontend (Web Build)

1. Upload contents of `frontend/web-build/` (or `frontend/dist/`) into `public_html/`
2. This places `index.html`, `static/`, etc. directly in the web root

### 4.4 Set Up the API Directory

Create `public_html/api/` directory and set up Laravel's entry point:

```bash
mkdir -p /home/cpaneluser/public_html/api
```

Create `public_html/api/index.php`:

```php
<?php

// Point to the Laravel application
require __DIR__ . '/../../ekhata/vendor/autoload.php';

$app = require_once __DIR__ . '/../../ekhata/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

$response->send();

$kernel->terminate($request, $response);
```

Copy the `.htaccess` from Laravel's `public/` folder:

```bash
cp /home/cpaneluser/ekhata/public/.htaccess /home/cpaneluser/public_html/api/.htaccess
```

### 4.5 Create Storage Symlink

```bash
cd /home/cpaneluser/public_html/api
ln -s ../../ekhata/storage/app/public storage
```

---

## 5. Configure Permissions

```bash
cd /home/cpaneluser/ekhata

# Storage and cache must be writable
chmod -R 775 storage
chmod -R 775 bootstrap/cache

# Ensure proper ownership
chown -R cpaneluser:cpaneluser storage bootstrap/cache
```

---

## 6. Run Migrations

Via **cPanel → Terminal** or SSH:

```bash
cd /home/cpaneluser/ekhata
php artisan migrate --force
php artisan db:seed --force    # If seeding is needed
php artisan storage:link       # May not work on shared hosting — use manual symlink above
```

---

## 7. Configure `.htaccess` for SPA Routing

The React/Expo web app uses client-side routing. Add this to `public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Don't rewrite API requests — pass to api/ subdirectory
    RewriteRule ^api/ - [L]

    # Don't rewrite existing files/directories
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d

    # Rewrite everything else to index.html (SPA routing)
    RewriteRule ^ index.html [L]
</IfModule>
```

---

## 8. Update Laravel Route Prefix

If your API is served from `/api/` subdirectory, ensure the Laravel routes in `routes/api.php` work correctly. The routes are already prefixed with `/api/v1`, so requests to `https://yourdomain.com/api/api/v1/...` would be wrong.

**Fix:** In `ekhata/app/Providers/RouteServiceProvider.php` (or `bootstrap/app.php` for Laravel 11), set:

```php
// In bootstrap/app.php
->withRouting(
    api: __DIR__.'/../routes/api.php',
    apiPrefix: 'v1',  // Remove the 'api/' prefix since we're already in /api/ directory
)
```

Or adjust the frontend API base URL to:
```ts
const BASE_URL = 'https://yourdomain.com/api';
```

---

## 9. SSL Certificate

1. Go to **cPanel → SSL/TLS** or **Let's Encrypt**
2. Install a free SSL certificate for your domain
3. Force HTTPS redirect in `public_html/.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 10. Cron Jobs (Optional)

If you use Laravel's task scheduler:

1. **cPanel → Cron Jobs**
2. Add: `* * * * * cd /home/cpaneluser/ekhata && php artisan schedule:run >> /dev/null 2>&1`

---

## 11. Troubleshooting

| Issue | Solution |
|---|---|
| 500 Internal Server Error | Check `storage/logs/laravel.log`, ensure permissions on `storage/` and `bootstrap/cache/` |
| API returns 404 | Verify `.htaccess` is enabled (`mod_rewrite`), check API prefix configuration |
| CORS errors | Add your domain to `SANCTUM_STATEFUL_DOMAINS` in `.env` and configure CORS in `config/cors.php` |
| Database connection refused | Verify DB credentials in `.env`, ensure MySQL user has privileges |
| Frontend blank page | Check browser console for JS errors, verify `index.html` exists in `public_html/` |
| Assets not loading | Check base URL in frontend build config, ensure static files are uploaded |
| PHP version wrong | cPanel → MultiPHP Manager → Select PHP 8.2+ for your domain |

---

## 12. Updating the Application

### Backend Update
```bash
cd /home/cpaneluser/ekhata
git pull origin eKhata
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Frontend Update
```bash
# Build locally
cd frontend
npx expo export:web

# Upload web-build/ contents to public_html/ via File Manager or SCP
```

---

## Quick Checklist

- [ ] Database created with user & privileges
- [ ] Backend uploaded to `/home/cpaneluser/ekhata/`
- [ ] `.env` configured with production values
- [ ] `storage/` and `bootstrap/cache/` permissions set (775)
- [ ] `public_html/api/index.php` pointing to Laravel
- [ ] Frontend web-build uploaded to `public_html/`
- [ ] `.htaccess` configured for SPA routing
- [ ] SSL certificate installed
- [ ] Migrations run successfully
- [ ] API endpoints accessible from browser
- [ ] Frontend loads and connects to API

---

**e-Khata** &copy; [Esystematic Technologies](https://esystematics.com) | 0311-3999345 | 0334-5266444
