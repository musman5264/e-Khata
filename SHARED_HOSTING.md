# Deploying e-Khata on Shared Hosting

This guide explains how to deploy e-Khata on shared hosting environments without Docker.

## Prerequisites

- Shared hosting account with:
  - Node.js support (18.x or higher)
  - PostgreSQL database access
  - SSH access (for installation)
  - File upload capability (FTP/SFTP)

## Common Shared Hosting Providers

This guide works with popular providers like:
- Hostinger
- Bluehost
- SiteGround
- A2 Hosting
- DreamHost
- InMotion Hosting
- Any cPanel/Plesk-based hosting

## Step-by-Step Deployment

### 1. Prepare Your Files

On your local machine:

```bash
# Clone the repository
git clone https://github.com/musman5264/e-Khata.git
cd e-Khata

# Remove unnecessary files before upload
rm -rf node_modules/
rm -rf .git/
rm -rf dist/
rm -rf logs/
rm Dockerfile
rm docker-compose.yml
```

### 2. Upload Files

Using FTP/SFTP client (FileZilla, WinSCP, etc.):

1. Connect to your hosting server
2. Navigate to your application directory (e.g., `/home/username/e-Khata` or `/var/www/html/e-Khata`)
3. Upload all files from your local e-Khata folder

### 3. Set Up Database

Using your hosting control panel (cPanel/Plesk):

1. Create a new PostgreSQL database
2. Create a database user
3. Grant all privileges to the user
4. Note down:
   - Database name
   - Database user
   - Database password
   - Database host (usually `localhost`)

### 4. Configure Environment Variables

Connect via SSH and create `.env` file:

```bash
cd /path/to/e-Khata

cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
APP_NAME=e-Khata

# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

# Security (REQUIRED - Generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRATION=7d
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Firebase (Optional - for push notifications)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Payment Gateways (Optional)
EASYPAISA_MERCHANT_ID=
EASYPAISA_STORE_ID=
EASYPAISA_API_KEY=
EASYPAISA_API_URL=https://easypay.easypaisa.com.pk/easypay

JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=
JAZZCASH_API_URL=https://payments.jazzcash.com.pk
EOF
```

**Important:** Generate secure random strings for JWT_SECRET and SESSION_SECRET:
```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Install Dependencies

```bash
cd /path/to/e-Khata

# Install dependencies
npm install --production

# Build the application
npm run build
```

### 6. Start the Application

#### Option A: Using PM2 (Recommended)

PM2 keeps your application running and restarts it if it crashes.

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/main.js --name ekhata

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system reboot
pm2 startup
# Follow the instructions provided by the command above
```

**PM2 Common Commands:**
```bash
pm2 status          # Check application status
pm2 logs ekhata     # View logs
pm2 restart ekhata  # Restart application
pm2 stop ekhata     # Stop application
pm2 delete ekhata   # Remove from PM2
```

#### Option B: Using cPanel/Plesk Node.js Manager

Most shared hosting control panels have a Node.js application manager:

1. Log in to your control panel (cPanel/Plesk)
2. Find "Node.js" or "Node.js App" section
3. Create a new application:
   - **Application Root:** `/home/username/e-Khata`
   - **Application URL:** Your domain or subdomain
   - **Application Startup File:** `dist/main.js`
   - **Node.js Version:** 18.x or higher
4. Add environment variables from your `.env` file
5. Start the application

#### Option C: Using forever

```bash
# Install forever
npm install -g forever

# Start the application
forever start dist/main.js

# View logs
forever logs

# Stop the application
forever stop dist/main.js
```

### 7. Configure Web Server (Reverse Proxy)

#### For Apache (.htaccess)

Create `.htaccess` in your domain's public folder:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

#### For Nginx

Add to your site configuration:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

### 8. Set Up SSL Certificate

Most hosting providers offer free SSL certificates through Let's Encrypt:

1. Go to your control panel SSL/TLS section
2. Install Let's Encrypt certificate
3. Force HTTPS redirect

Or use your hosting's SSL management interface.

### 9. Test the Application

Visit your domain:
- API: https://yourdomain.com
- Swagger Docs: https://yourdomain.com/api

### 10. Seed Demo Data (Optional)

```bash
cd /path/to/e-Khata
npm run seed
```

This creates demo tenant and users for testing.

## Maintenance

### Updating the Application

```bash
cd /path/to/e-Khata

# Pull latest changes (if using git)
git pull origin main

# Or upload new files via FTP/SFTP

# Reinstall dependencies
npm install --production

# Rebuild
npm run build

# Restart the application
pm2 restart ekhata
# Or restart via your control panel
```

### Viewing Logs

```bash
# PM2 logs
pm2 logs ekhata

# Application logs
tail -f logs/application-*.log
tail -f logs/error-*.log
```

### Backup

Regular backups should include:
1. Database dump
2. `.env` file
3. `logs/` directory
4. Uploaded files (if any)

```bash
# Database backup
pg_dump -U your_db_user your_db_name > backup.sql

# Backup .env and logs
tar -czf ekhata-backup-$(date +%Y%m%d).tar.gz .env logs/
```

## Troubleshooting

### Application Won't Start

1. Check Node.js version: `node --version` (should be 18.x+)
2. Check `.env` file exists and has correct values
3. Check database connection
4. View logs: `pm2 logs ekhata`

### Database Connection Error

1. Verify database credentials in `.env`
2. Check if PostgreSQL service is running
3. Confirm database user has proper permissions
4. Test connection: `psql -U your_db_user -d your_db_name -h localhost`

### Port Already in Use

Change PORT in `.env` to a different value (e.g., 3001, 3002)

### Permission Issues

```bash
# Fix permissions
chmod -R 755 /path/to/e-Khata
chown -R your_user:your_group /path/to/e-Khata
```

### Out of Memory

Shared hosting typically has memory limits. Optimize by:
1. Using `--max-old-space-size` flag: `node --max-old-space-size=512 dist/main.js`
2. Disabling development features in production
3. Upgrading to a plan with more resources

## Performance Tips

1. **Enable gzip compression** in your web server
2. **Set up caching** for static assets
3. **Use CDN** for static files
4. **Enable HTTP/2** if available
5. **Monitor resource usage** regularly
6. **Set up database connection pooling** (already configured in TypeORM)

## Security Checklist

- [x] Strong JWT_SECRET (32+ characters)
- [x] Strong SESSION_SECRET (32+ characters)
- [x] Database user with limited privileges
- [x] SSL certificate installed
- [x] Firewall rules configured
- [x] Regular backups scheduled
- [x] Keep Node.js and dependencies updated
- [x] Monitor logs for suspicious activity

## Support

For hosting-specific issues, contact:
- Your hosting provider's support
- Esystematic Technologies (for application-specific help)

For application issues, see the main README.md file.

## Alternative: Serverless Deployment

If your shared hosting doesn't work well, consider:
- **Heroku** - Free tier available
- **Railway** - Simple deployment
- **Render** - Good for Node.js apps
- **DigitalOcean App Platform** - $5/month
- **AWS Lightsail** - VPS starting at $5/month

These platforms provide better Node.js support than traditional shared hosting.
