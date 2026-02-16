# e-Khata Backend API

A comprehensive digital ledger and bookkeeping backend API system with multi-tenant architecture.

## Features

- **Multi-Tenant Architecture**: Isolated data for multiple organizations
- **User Authentication**: JWT-based authentication with role-based access control
- **Firebase OTP Integration**: Phone number verification using Firebase
- **Session Management**: Device tracking and session management
- **Party Management**: Manage customers and suppliers with unique phone numbers
- **Ledger System**: Complete debit/credit transaction management
- **Payment Gateway Integration**: Easypaisa and JazzCash payment support
- **Audit Logging**: Comprehensive logging of all system activities
- **Notification System**: Push notifications, email, and SMS support
- **Device Information Tracking**: Track user devices and IP addresses

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **OTP Service**: Firebase Admin SDK
- **Payment Gateways**: Easypaisa, JazzCash
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- Firebase Project (for OTP)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure your `.env` file with proper values

4. Build the project:
```bash
npm run build
```

5. Start development server:
```bash
npm run dev
```

6. Start production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/me` - Get current user

### Tenants
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/subdomain/:subdomain` - Get tenant by subdomain

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)
- `PUT /api/users/:id/notification-settings` - Update notification settings

### Parties
- `GET /api/parties` - Get all parties
- `GET /api/parties/:id` - Get party by ID
- `POST /api/parties` - Create party
- `PUT /api/parties/:id` - Update party
- `DELETE /api/parties/:id` - Delete party
- `GET /api/parties/:id/ledger` - Get party ledger

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/payment/initiate` - Initiate payment
- `POST /api/transactions/payment/callback` - Payment callback
- `GET /api/transactions/summary/stats` - Get transaction summary

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

## User Roles

- `super_admin` - Full system access
- `admin` - Tenant-level admin access
- `manager` - Management access
- `accountant` - Financial access
- `user` - Basic user access

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Session management with expiry
- Rate limiting on API endpoints
- Device information tracking
- Audit logging for all actions
- CORS protection
- Helmet security headers

## Logging

The system maintains comprehensive logs:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/auth.log` - Authentication logs

## License

ISC

## Author

Esystematic Technologies
Gujranwala, Pakistan
