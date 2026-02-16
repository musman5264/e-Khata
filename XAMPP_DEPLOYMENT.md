# Deploying e-Khata on XAMPP (Local Development)

This guide explains how to run e-Khata on your local Windows machine using XAMPP.

## Important Notes

- **XAMPP is primarily for PHP applications** - While you can run Node.js alongside XAMPP, Node.js doesn't require XAMPP at all
- **Recommended approach**: Use Node.js directly without XAMPP for better performance
- **This guide covers both options**: Using XAMPP's PostgreSQL OR using standalone PostgreSQL

## Prerequisites

### Required Software

1. **XAMPP** (if you prefer using it)
   - Download from: https://www.apachefriends.org/
   - Install with PostgreSQL addon (or use standalone PostgreSQL)

2. **Node.js** (Required - XAMPP doesn't include this)
   - Download from: https://nodejs.org/ (v18.x or higher)
   - Install with default settings
   - Verify installation: `node --version` and `npm --version`

3. **Git** (Optional - for cloning)
   - Download from: https://git-scm.com/

## Deployment Methods

### Method 1: Using XAMPP PostgreSQL (Simpler)

This method uses XAMPP's built-in PostgreSQL database.

#### Step 1: Install XAMPP with PostgreSQL

1. Download XAMPP from https://www.apachefriends.org/
2. During installation, ensure PostgreSQL addon is selected
3. Install to default location (C:\xampp)

#### Step 2: Start PostgreSQL from XAMPP

1. Open XAMPP Control Panel
2. Start "PostgreSQL" service
3. Note: Apache and MySQL are NOT needed for this application
4. Default PostgreSQL credentials:
   - Host: `localhost`
   - Port: `5432`
   - Username: `postgres`
   - Password: (empty or `postgres`)

#### Step 3: Create Database

Open Command Prompt and run:

```cmd
cd C:\xampp\postgresql\bin
psql -U postgres

-- In PostgreSQL prompt:
CREATE DATABASE ekhata;
\q
```

#### Step 4: Set Up Application

1. **Clone or download the project**
   ```cmd
   cd C:\xampp\htdocs
   git clone https://github.com/musman5264/e-Khata.git
   cd e-Khata
   ```
   
   Or download and extract ZIP to `C:\xampp\htdocs\e-Khata`

2. **Install Node.js dependencies**
   ```cmd
   npm install
   ```

3. **Create environment file**
   
   Copy `.env.example` to `.env`:
   ```cmd
   copy .env.example .env
   ```
   
   Edit `.env` file with Notepad or any text editor:
   ```env
   NODE_ENV=development
   PORT=3000
   APP_NAME=e-Khata

   # Database (XAMPP PostgreSQL)
   DB_TYPE=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=
   DB_DATABASE=ekhata

   # Security (Required - Generate random strings)
   JWT_SECRET=your-secret-key-at-least-32-characters-long
   JWT_EXPIRATION=7d
   SESSION_SECRET=your-session-secret-at-least-32-characters-long

   # Firebase (Optional - leave empty for now)
   FIREBASE_PROJECT_ID=
   FIREBASE_PRIVATE_KEY=
   FIREBASE_CLIENT_EMAIL=

   # Payment Gateways (Optional - leave empty for now)
   EASYPAISA_MERCHANT_ID=
   EASYPAISA_STORE_ID=
   EASYPAISA_API_KEY=
   JAZZCASH_MERCHANT_ID=
   JAZZCASH_PASSWORD=
   JAZZCASH_INTEGRITY_SALT=
   ```

   **Generate secure secrets**:
   ```cmd
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Run this twice and use the outputs for JWT_SECRET and SESSION_SECRET

4. **Build the application**
   ```cmd
   npm run build
   ```

5. **Seed demo data (Optional)**
   ```cmd
   npm run seed
   ```
   
   This creates:
   - Demo tenant
   - Admin user: `03001234567` / `admin123`
   - Regular user: `03009876543` / `user123`
   - Sample ledgers and transactions

6. **Start the application**
   
   For development (auto-reload on changes):
   ```cmd
   npm run start:dev
   ```
   
   For production mode:
   ```cmd
   npm run start:prod
   ```

#### Step 5: Access the Application

Open your browser and go to:
- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api

### Method 2: Without XAMPP (Recommended for Production)

If you don't need XAMPP, you can use standalone PostgreSQL which is more efficient.

#### Step 1: Install PostgreSQL

1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for `postgres` user
4. Default port: 5432

#### Step 2: Create Database

Open SQL Shell (psql) from Start Menu:

```sql
-- Enter password when prompted
CREATE DATABASE ekhata;
\q
```

#### Step 3: Set Up Application

1. **Create project folder**
   ```cmd
   cd C:\
   mkdir Projects
   cd Projects
   git clone https://github.com/musman5264/e-Khata.git
   cd e-Khata
   ```

2. **Install dependencies**
   ```cmd
   npm install
   ```

3. **Configure environment**
   
   Copy and edit `.env`:
   ```cmd
   copy .env.example .env
   notepad .env
   ```
   
   Update database password if you set one during PostgreSQL installation:
   ```env
   DB_PASSWORD=your_postgres_password
   ```

4. **Build and run**
   ```cmd
   npm run build
   npm run start:dev
   ```

## Managing the Application

### Starting the Application

**Development mode** (auto-reloads on code changes):
```cmd
cd C:\xampp\htdocs\e-Khata
npm run start:dev
```

**Production mode**:
```cmd
cd C:\xampp\htdocs\e-Khata
npm run start:prod
```

### Stopping the Application

- Press `Ctrl+C` in the command prompt where it's running

### Running in Background (Production)

For keeping the application running even when you close the terminal:

1. **Install PM2**:
   ```cmd
   npm install -g pm2
   ```

2. **Start with PM2**:
   ```cmd
   cd C:\xampp\htdocs\e-Khata
   pm2 start dist/main.js --name ekhata
   ```

3. **PM2 Commands**:
   ```cmd
   pm2 status           # Check status
   pm2 logs ekhata      # View logs
   pm2 restart ekhata   # Restart
   pm2 stop ekhata      # Stop
   pm2 delete ekhata    # Remove
   ```

4. **Start PM2 on Windows startup**:
   ```cmd
   pm2 startup
   pm2 save
   ```

## Accessing from Other Devices on Your Network

To access the application from other devices (phone, tablet, other computers) on your local network:

1. **Find your computer's IP address**:
   ```cmd
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.100`)

2. **Allow Node.js through Windows Firewall**:
   - Windows will prompt you when you first run the app
   - Or manually: Control Panel → Windows Defender Firewall → Allow an app

3. **Update `.env` to listen on all interfaces**:
   ```env
   # Leave PORT as is, Node.js will bind to 0.0.0.0 by default
   PORT=3000
   ```

4. **Access from other devices**:
   - From other devices: http://192.168.1.100:3000
   - From same computer: http://localhost:3000

## Troubleshooting

### Port 3000 Already in Use

Change the port in `.env`:
```env
PORT=3001
```

### PostgreSQL Connection Error

1. Check if PostgreSQL is running in XAMPP Control Panel
2. Verify credentials in `.env`
3. Test connection:
   ```cmd
   cd C:\xampp\postgresql\bin
   psql -U postgres -d ekhata
   ```

### "Cannot find module" Errors

Reinstall dependencies:
```cmd
cd C:\xampp\htdocs\e-Khata
rmdir /s node_modules
npm install
```

### "nest: command not found"

Install NestJS CLI globally:
```cmd
npm install -g @nestjs/cli
```

### Build Errors

1. Make sure Node.js version is 18.x or higher: `node --version`
2. Clear npm cache: `npm cache clean --force`
3. Delete and reinstall: 
   ```cmd
   rmdir /s /q node_modules
   del package-lock.json
   npm install
   ```

### Application Crashes on Startup

Check the error message. Common issues:
- Missing environment variables in `.env`
- Database not running
- Port already in use
- Missing JWT_SECRET or SESSION_SECRET

View logs:
```cmd
npm run start:dev
# Or with PM2:
pm2 logs ekhata
```

## Development Workflow

### Making Code Changes

1. Edit files in `src/` folder
2. If running with `npm run start:dev`, changes auto-reload
3. For new dependencies, restart: `Ctrl+C` then `npm run start:dev`

### Viewing Logs

Application logs are saved in `logs/` folder:
- `logs/application-YYYY-MM-DD.log` - General logs
- `logs/error-YYYY-MM-DD.log` - Error logs

### Database Management

**View tables**:
```cmd
cd C:\xampp\postgresql\bin
psql -U postgres -d ekhata
\dt
```

**Reset database** (deletes all data):
```sql
DROP DATABASE ekhata;
CREATE DATABASE ekhata;
\q
```
Then restart the app to recreate tables.

### Testing the API

1. Open browser: http://localhost:3000/api
2. Use Swagger UI to test endpoints
3. Or use Postman/Insomnia/Thunder Client

## Next Steps

### For Learning/Development

1. Explore the Swagger API docs: http://localhost:3000/api
2. Test the demo accounts (if you ran seed script)
3. Try creating tenants, users, and ledgers
4. Check the logs in `logs/` folder

### For Production Deployment

When you're ready to deploy to a real server:
- See `SHARED_HOSTING.md` for shared hosting
- See `README.md` for VPS/cloud deployment

## Common Questions

**Q: Do I need XAMPP's Apache or MySQL?**
A: No. This is a Node.js application with PostgreSQL. Apache (for PHP) and MySQL are not used.

**Q: Can I use MySQL instead of PostgreSQL?**
A: The application is designed for PostgreSQL. While TypeORM supports MySQL, you'd need to modify configurations and test thoroughly.

**Q: Can I deploy this online from XAMPP?**
A: XAMPP is for local development only. For online deployment, see `SHARED_HOSTING.md` or `README.md`.

**Q: Why use Node.js with XAMPP?**
A: You don't need XAMPP at all for this application. Node.js runs independently. XAMPP is only used if you want to use its PostgreSQL installation.

**Q: How do I stop the application?**
A: Press `Ctrl+C` in the terminal, or use `pm2 stop ekhata` if using PM2.

## Support

For issues:
1. Check this guide's Troubleshooting section
2. Review logs in `logs/` folder
3. Check the main `README.md`
4. Contact Esystematic Technologies

## Alternative: Docker Desktop for Windows

If you prefer containerization:
1. Install Docker Desktop for Windows
2. Use the docker-compose.yml in the project
3. Run: `docker-compose up -d`

This is more advanced but provides a cleaner environment.
