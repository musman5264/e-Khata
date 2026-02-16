# Deployment Guide for e-Khata

This guide provides instructions for deploying the e-Khata application to production.

## Prerequisites

- Node.js v18 or higher
- MongoDB v6 or higher
- Domain name (for production)
- Firebase project (for OTP and push notifications)
- SSL certificate (recommended)

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb://your-mongodb-host:27017/e-khata

# JWT Configuration
JWT_SECRET=your-very-secure-secret-key-here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-very-secure-refresh-secret-key-here
JWT_REFRESH_EXPIRE=30d

# Session Configuration
SESSION_SECRET=your-very-secure-session-secret-key-here

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Payment Gateway Configuration
EASYPAISA_MERCHANT_ID=your-easypaisa-merchant-id
EASYPAISA_API_KEY=your-easypaisa-api-key
EASYPAISA_HASH_KEY=your-easypaisa-hash-key

JAZZCASH_MERCHANT_ID=your-jazzcash-merchant-id
JAZZCASH_PASSWORD=your-jazzcash-password
JAZZCASH_INTEGRITY_SALT=your-jazzcash-integrity-salt

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables

Create a `.env.production` file in the frontend directory:

```env
REACT_APP_API_URL=https://api.your-domain.com/api
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
```

## Deployment Options

### Option 1: Traditional Server (VPS/Dedicated)

#### 1. Install Dependencies

```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB (if not already installed)
# Follow MongoDB installation guide for your OS
```

#### 2. Deploy Backend

```bash
# Clone repository
git clone https://github.com/musman5264/e-Khata.git
cd e-Khata/backend

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Set up environment variables
cp .env.example .env
# Edit .env with production values

# Install PM2 for process management
sudo npm install -g pm2

# Start the application
pm2 start dist/index.js --name e-khata-backend

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup
```

#### 3. Deploy Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

# The build folder can be served with any static server
# Example with nginx:
sudo cp -r build /var/www/e-khata
```

#### 4. Configure Nginx

```nginx
# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/e-khata;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 5. Set up SSL with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### Option 2: Docker Deployment

#### 1. Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

#### 2. Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: your-password

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:your-password@mongodb:27017/e-khata?authSource=admin
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

#### 4. Run with Docker Compose

```bash
docker-compose up -d
```

### Option 3: Cloud Platforms

#### Heroku

```bash
# Backend
cd backend
heroku create e-khata-backend
heroku addons:create mongolab
heroku config:set NODE_ENV=production
# Set other environment variables
git push heroku main

# Frontend
cd ../frontend
heroku create e-khata-frontend
heroku buildpacks:set mars/create-react-app
git push heroku main
```

#### Railway

1. Connect your GitHub repository
2. Create new project
3. Add MongoDB database
4. Configure environment variables
5. Deploy automatically on push

#### DigitalOcean App Platform

1. Connect repository
2. Select Node.js environment
3. Configure build command: `npm run build`
4. Configure run command: `npm start`
5. Add environment variables
6. Deploy

## Database Setup

### MongoDB Atlas (Cloud)

1. Create account at mongodb.com/cloud/atlas
2. Create a new cluster
3. Add database user
4. Whitelist IP addresses
5. Get connection string
6. Update MONGODB_URI in .env

### Local MongoDB

```bash
# Install MongoDB
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
> use e-khata
> db.createUser({
  user: "ekhata",
  pwd: "secure-password",
  roles: ["readWrite"]
})
```

## Monitoring

### Set up Logging

Logs are stored in the `logs` directory:
- `combined.log` - All logs
- `error.log` - Error logs
- `auth.log` - Authentication logs

### Monitor with PM2

```bash
# View logs
pm2 logs e-khata-backend

# Monitor resources
pm2 monit

# View process list
pm2 list
```

## Backup

### Database Backup

```bash
# Backup MongoDB
mongodump --uri="your-mongodb-uri" --out=/backup/$(date +%Y%m%d)

# Restore MongoDB
mongorestore --uri="your-mongodb-uri" /backup/20240101
```

### Automated Backups

Create a cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * mongodump --uri="your-mongodb-uri" --out=/backup/$(date +\%Y\%m\%d)
```

## Security Checklist

- [ ] Use strong, unique secrets for JWT and session
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall to allow only necessary ports
- [ ] Keep Node.js and dependencies updated
- [ ] Set up rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Regular security audits with `npm audit`
- [ ] Monitor logs for suspicious activity
- [ ] Set up backup strategy
- [ ] Configure CORS properly
- [ ] Use secure headers (Helmet)

## Maintenance

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Rebuild
npm run build

# Restart application
pm2 restart e-khata-backend
```

### Monitor Performance

```bash
# Check server resources
htop

# Check application logs
pm2 logs

# Monitor database
mongo --eval "db.stats()"
```

## Troubleshooting

### Application Won't Start

1. Check logs: `pm2 logs`
2. Verify environment variables
3. Check MongoDB connection
4. Verify port availability

### Database Connection Issues

1. Check MongoDB status: `sudo systemctl status mongodb`
2. Verify connection string
3. Check network/firewall settings
4. Verify database credentials

### High Memory Usage

1. Check PM2 metrics: `pm2 monit`
2. Restart application: `pm2 restart e-khata-backend`
3. Consider scaling horizontally

## Support

For issues and questions:
- GitHub Issues: https://github.com/musman5264/e-Khata/issues
- Email: contact@esystematics.com
- Phone: 0311-3999345 | 0334-5266444
