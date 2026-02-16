# Quick Start Guide

Get e-Khata up and running in minutes!

## Prerequisites

- Node.js v18+ installed
- MongoDB v6+ installed and running
- Git installed

## 1. Clone the Repository

```bash
git clone https://github.com/musman5264/e-Khata.git
cd e-Khata
```

## 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configurations
# Minimum required: MONGODB_URI, JWT_SECRET, SESSION_SECRET

# Build the project
npm run build

# Start development server
npm run dev
```

The backend server will start on `http://localhost:5000`

## 3. Frontend Setup (in a new terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:3000`

## 4. Test the API

### Health Check

```bash
curl http://localhost:5000/health
```

### Create a Tenant

```bash
curl -X POST http://localhost:5000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Business",
    "subdomain": "testbiz",
    "businessName": "Test Business Ltd",
    "contactPerson": "Test User",
    "contactPhone": "03001234567",
    "contactEmail": "test@testbiz.com",
    "adminPassword": "Test@123"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Subdomain: testbiz" \
  -H "X-Device-Id: test-device" \
  -d '{
    "email": "test@testbiz.com",
    "password": "Test@123"
  }'
```

## 5. What's Next?

- **Configure Payment Gateways**: Add your Easypaisa and JazzCash credentials to `.env`
- **Set up Firebase**: Configure Firebase for OTP and push notifications
- **Customize Frontend**: Build your UI based on the provided React structure
- **Deploy**: See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions
- **API Documentation**: Check [API_EXAMPLES.md](API_EXAMPLES.md) for more API examples

## Common Issues

### MongoDB Connection Error

- Ensure MongoDB is running: `sudo systemctl status mongodb`
- Check your MONGODB_URI in `.env`

### Port Already in Use

- Backend: Change PORT in `.env`
- Frontend: The React app will prompt you to use another port

### Dependencies Installation Failed

- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

## Project Structure

```
e-Khata/
├── backend/          # Backend API
│   ├── src/
│   │   ├── config/   # Configuration
│   │   ├── models/   # Database models
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/   # API routes
│   │   ├── middleware/   # Middleware
│   │   ├── services/ # Business logic
│   │   └── utils/    # Utilities
│   └── dist/         # Compiled JavaScript
├── frontend/         # React frontend
│   ├── src/
│   └── build/        # Production build
└── docs/             # Documentation
```

## Available Scripts

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Features Overview

✅ Multi-tenant architecture
✅ User authentication (JWT)
✅ Role-based access control
✅ Party management
✅ Transaction ledger
✅ Payment integration (Easypaisa/JazzCash)
✅ Firebase OTP
✅ Session management
✅ Device tracking
✅ Audit logging
✅ Notifications

## Need Help?

- 📖 Read the [full documentation](README.md)
- 🚀 Check [deployment guide](DEPLOYMENT.md)
- 💻 See [API examples](API_EXAMPLES.md)
- 🤝 Read [contributing guidelines](CONTRIBUTING.md)
- 📧 Contact: contact@esystematics.com
- 📱 Phone: 0311-3999345 | 0334-5266444

## License

ISC - See [LICENSE](LICENSE) for details

---

Developed by [Esystematic Technologies](https://www.esystematics.com) - Gujranwala, Pakistan
