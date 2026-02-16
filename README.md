# e-Khata

A modern digital ledger and bookkeeping application for mobile and web platforms.

Developed by [Esystematic Technologies](https://www.esystematics.com) — Gujranwala, Pakistan.

## About

e-Khata is a comprehensive digital khata (ledger) system designed to simplify financial record-keeping for businesses and individuals. It provides a complete solution for managing business transactions with a traditional debit/credit mechanism, party management, and modern payment integrations.

## Features

### Core Features
- **Multi-Tenant Architecture**: Isolated data for multiple businesses with subdomain-based access
- **User Management**: Role-based access control (Super Admin, Admin, Manager, Accountant, User)
- **Authentication & Security**: JWT-based authentication with Firebase OTP integration
- **Party Management**: Complete customer and supplier management with unique mobile numbers
- **Ledger System**: Flawless debit/credit transaction recording with real-time balance updates
- **Session Management**: Device tracking and session management for security

### Payment Integration
- **Easypaisa**: Complete payment gateway integration
- **JazzCash**: Complete payment gateway integration

### Advanced Features
- **Audit Logging**: Comprehensive logging of all system activities
- **Notification System**: Push notifications, email, and SMS support
- **Device Information**: Track user devices, IP addresses, and user agents
- **Real-time Updates**: Live transaction updates and notifications

## Project Structure

```
e-Khata/
├── backend/           # Node.js/Express backend API
│   ├── src/
│   │   ├── config/    # Configuration files
│   │   ├── models/    # Database models
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/    # API routes
│   │   ├── middleware/ # Custom middleware
│   │   ├── services/  # Business logic
│   │   └── utils/     # Utility functions
│   └── package.json
├── frontend/          # React web application
│   ├── src/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **OTP Service**: Firebase Admin SDK
- **Payment Gateways**: Easypaisa, JazzCash
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router
- **HTTP Client**: Axios
- **Authentication**: Firebase

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- Firebase Project (for OTP and push notifications)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with proper values

5. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## API Documentation

The backend provides RESTful APIs for:
- Authentication (register, login, logout, OTP)
- Tenant management
- User management
- Party (customer/supplier) management
- Transaction management
- Payment gateway integration
- Notifications

See [backend/README.md](backend/README.md) for detailed API documentation.

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Session management with expiry tracking
- Rate limiting on API endpoints
- Device information tracking
- Comprehensive audit logging
- CORS protection
- Security headers with Helmet

## Database Models

- **Tenant**: Multi-tenant organization data
- **User**: User accounts with role-based access
- **Party**: Business parties (customers/suppliers)
- **Transaction**: Debit/credit transactions
- **Session**: User session management
- **AuditLog**: System audit logs
- **Notification**: User notifications

## Deployment

Both backend and frontend can be deployed to:
- Backend: Heroku, AWS, DigitalOcean, Railway
- Frontend: Vercel, Netlify, AWS S3

## License

ISC

## Contact

- **Company:** [Esystematic Technologies](https://www.esystematics.com)
- **Managing Director:** Muhammad Usman
- **Phone:** 0311-3999345 | 0334-5266444
- **Location:** Gujranwala, Pakistan
