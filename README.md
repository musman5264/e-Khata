# e-Khata

A modern digital ledger and bookkeeping application with multi-tenant architecture.

Developed by [Esystematic Technologies](https://www.esystematics.com) — Gujranwala, Pakistan.

## About

e-Khata is a comprehensive digital khata (ledger) system designed to simplify financial record-keeping for businesses and individuals. It features a robust backend built with NestJS, TypeScript, and PostgreSQL, with support for mobile and web platforms.

## Features

### Core Features
- ✅ **Multi-tenant Architecture** - Support for multiple businesses/organizations
- ✅ **User Authentication & Authorization** - JWT-based authentication with role-based access control
- ✅ **Unique Mobile Number Validation** - Pakistani mobile number format validation
- ✅ **Digital Ledger System** - Complete debit/credit transaction management
- ✅ **Customer Management** - Track customer accounts and balances
- ✅ **Transaction History** - Detailed transaction logs with audit trail

### Advanced Features
- ✅ **Session Management** - Track user sessions with device information
- ✅ **Comprehensive Logging** - Winston-based logging with daily rotation
- ✅ **Firebase Notifications** - Push notifications for transactions and updates
- ✅ **Payment Integration Ready** - Placeholder for Easypaisa and JazzCash integration
- ✅ **RESTful API** - Complete REST API with Swagger documentation
- ✅ **Device Information Gathering** - Track device details for security

## Technology Stack

### Backend
- **Framework:** NestJS 10.x
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Authentication:** JWT with Passport
- **Documentation:** Swagger/OpenAPI
- **Logging:** Winston
- **Validation:** class-validator

### Architecture
- Multi-tenant database design
- Role-based access control (RBAC)
- Transaction-based ledger operations
- Session management with device tracking

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL 15.x or higher (or access to a PostgreSQL database)
- npm or yarn

**Note:** Docker is optional and only needed for VPS/dedicated servers. For shared hosting, see [Shared Hosting Deployment Guide](./SHARED_HOSTING.md).

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/musman5264/e-Khata.git
   cd e-Khata
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the values:
   - Database credentials
   - JWT secret
   - Session secret
   - Firebase credentials (optional)
   - Payment gateway credentials (optional)

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb ekhata

   # The application will auto-sync tables in development mode
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

6. **Access the application**
   - API: http://localhost:3000
   - Swagger Documentation: http://localhost:3000/api

### Local Development with XAMPP

**For Windows users who want to use XAMPP:**

See the complete [XAMPP Deployment Guide](./XAMPP_DEPLOYMENT.md) for step-by-step instructions including:
- Using XAMPP's PostgreSQL database
- Setting up Node.js alongside XAMPP
- Running the application locally
- Accessing from other devices on your network
- Troubleshooting common issues

Quick start:
```bash
# From XAMPP htdocs folder
cd C:\xampp\htdocs\e-Khata
npm install
npm run build
npm run start:dev
```

### Deployment on Shared Hosting

**Important:** This application is designed to work on shared hosting environments. Docker is **optional** and only needed if you have VPS/dedicated server access.

#### Shared Hosting Deployment Steps:

1. **Upload files via FTP/SFTP**
   - Upload all files except `node_modules/`, `.git/`, and `dist/`
   
2. **Install dependencies via SSH**
   ```bash
   cd /path/to/e-Khata
   npm install --production
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

4. **Configure environment**
   - Create `.env` file with your hosting database credentials
   - Most shared hosts provide PostgreSQL or you can use their database service

5. **Start the application**
   ```bash
   # Use PM2 or your hosting's Node.js manager
   npm run start:prod
   
   # Or with PM2 (recommended for shared hosting)
   pm2 start dist/main.js --name ekhata
   ```

6. **Set up process manager**
   - Most shared hosting control panels (cPanel, Plesk) have Node.js application managers
   - Configure it to run: `node dist/main.js`
   - Set environment variables in the control panel

### Using Docker (Optional - VPS/Dedicated Server Only)

**Note:** Docker is NOT compatible with shared hosting. Use the shared hosting deployment method above instead.

For VPS or dedicated servers with Docker support:

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - API: http://localhost:3000
   - Swagger Documentation: http://localhost:3000/api

3. **View logs**
   ```bash
   docker-compose logs -f api
   ```

4. **Stop the application**
   ```bash
   docker-compose down
   ```

## API Documentation

Once the application is running, visit http://localhost:3000/api to access the interactive Swagger documentation.

### Main API Endpoints

#### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with mobile number and password
- `POST /auth/logout` - Logout current user
- `GET /auth/profile` - Get current user profile

#### Tenants
- `POST /tenants` - Create a new tenant
- `GET /tenants` - Get all tenants
- `GET /tenants/:id` - Get tenant by ID
- `PATCH /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Delete tenant

#### Users
- `POST /users` - Create a new user
- `GET /users` - Get all users in tenant
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Ledger
- `POST /ledger` - Create a new ledger for a customer
- `GET /ledger` - Get all ledgers in tenant
- `GET /ledger/:id` - Get ledger by ID
- `GET /ledger/:id/balance` - Get ledger balance
- `PATCH /ledger/:id` - Update ledger
- `DELETE /ledger/:id` - Delete ledger

#### Transactions
- `POST /transactions` - Create a new transaction (debit or credit)
- `GET /transactions?ledgerId=xxx` - Get all transactions for a ledger
- `GET /transactions/:id` - Get transaction by ID
- `GET /transactions/statistics?ledgerId=xxx` - Get transaction statistics

#### Payments
- `POST /payments` - Create a new payment
- `GET /payments?ledgerId=xxx` - Get all payments
- `GET /payments/:id` - Get payment by ID
- `PATCH /payments/:id/status` - Update payment status

#### Notifications
- `POST /notifications/register-token` - Register FCM device token
- `POST /notifications/send` - Send notification to user

## Database Schema

### Tables
- **tenants** - Multi-tenant organization data
- **users** - User accounts with authentication
- **ledgers** - Customer ledger accounts
- **transactions** - Debit/Credit transactions
- **payments** - Payment records
- **sessions** - User sessions with device info

### User Roles
- `super_admin` - Full system access
- `admin` - Tenant administration
- `manager` - Ledger and transaction management
- `user` - Basic user access
- `viewer` - Read-only access

## Development

### Project Structure
```
e-Khata/
├── src/
│   ├── config/              # Configuration files
│   ├── modules/             # Feature modules
│   │   ├── auth/           # Authentication & authorization
│   │   ├── users/          # User management
│   │   ├── tenants/        # Multi-tenant management
│   │   ├── ledger/         # Ledger management
│   │   ├── transactions/   # Transaction management
│   │   ├── payments/       # Payment processing
│   │   ├── sessions/       # Session management
│   │   ├── logging/        # Logging service
│   │   └── notifications/  # Push notifications
│   ├── app.module.ts       # Root module
│   └── main.ts             # Application entry point
├── logs/                    # Application logs
├── scripts/                 # Utility scripts
├── docker-compose.yml      # Docker configuration (optional)
├── Dockerfile              # Docker image definition (optional)
├── SHARED_HOSTING.md       # Shared hosting deployment guide
├── XAMPP_DEPLOYMENT.md     # XAMPP/local development guide
└── package.json            # Dependencies
```

## Deployment Options

### Option 1: Local Development with XAMPP (Windows)

For local development on Windows using XAMPP:
- See [XAMPP Deployment Guide](./XAMPP_DEPLOYMENT.md)
- Uses XAMPP's PostgreSQL or standalone PostgreSQL
- Perfect for learning and testing
- Access from your local network

### Option 2: Shared Hosting (Recommended for Production)

See the [Shared Hosting Deployment Guide](./SHARED_HOSTING.md) for detailed instructions on deploying to:
- Hostinger, Bluehost, SiteGround, A2 Hosting
- Any cPanel/Plesk-based hosting
- Shared hosting with Node.js support

### Option 3: VPS/Dedicated Server with Docker

Docker deployment is only suitable if you have root access and Docker installed.
See the "Using Docker" section above.

### Option 4: Cloud Platforms

Alternative deployment options:
- Heroku
- Railway  
- Render
- DigitalOcean App Platform
- AWS Lightsail

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Linting and Formatting
```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Session tracking with device information
- SQL injection prevention with TypeORM
- Input validation with class-validator

## Future Enhancements

- [ ] Complete Easypaisa payment gateway integration
- [ ] Complete JazzCash payment gateway integration
- [ ] Mobile application (React Native)
- [ ] Web frontend (React/Next.js)
- [ ] Invoice generation
- [ ] SMS notifications
- [ ] Report generation (PDF/Excel)
- [ ] Data analytics dashboard
- [ ] Backup and restore functionality
- [ ] cPanel/Plesk plugin for easier deployment

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary software developed by Esystematic Technologies.

## Contact

- **Company:** [Esystematic Technologies](https://www.esystematics.com)
- **Managing Director:** Muhammad Usman
- **Phone:** 0311-3999345 | 0334-5266444
- **Location:** Gujranwala, Pakistan

## Support

For support, please contact us at the above details or visit our website.
