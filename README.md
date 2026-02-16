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
- PostgreSQL 15.x or higher
- npm or yarn

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

### Using Docker

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
├── docker-compose.yml      # Docker configuration
├── Dockerfile              # Docker image definition
└── package.json            # Dependencies
```

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
