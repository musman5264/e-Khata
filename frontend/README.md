# e-Khata Frontend

Web application for e-Khata digital ledger system.

## Features

- User authentication and registration
- Party management (customers/suppliers)
- Transaction recording (debit/credit)
- Ledger view
- Payment gateway integration
- Notifications
- Multi-tenant support

## Tech Stack

- React 18
- TypeScript
- React Router
- Axios
- Firebase (for OTP)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Environment Variables

Create a `.env` file:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_TENANT_SUBDOMAIN=your-subdomain
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
```

## License

ISC
