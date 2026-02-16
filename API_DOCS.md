# e-Khata API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require authentication using JWT Bearer token.

### Headers
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Register New User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "mobileNumber": "03001234567",
  "password": "password123",
  "fullName": "John Doe",
  "email": "john@example.com",
  "tenantId": "uuid-here"
}
```

**Response:**
```json
{
  "id": "uuid",
  "mobileNumber": "03001234567",
  "fullName": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 2. Login
**POST** `/auth/login`

Login with mobile number and password.

**Request Body:**
```json
{
  "mobileNumber": "03001234567",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "mobileNumber": "03001234567",
    "fullName": "John Doe",
    "role": "user"
  }
}
```

#### 3. Logout
**POST** `/auth/logout`

Logout current user (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### 4. Get Profile
**GET** `/auth/profile`

Get current user profile (requires authentication).

**Response:**
```json
{
  "userId": "uuid",
  "mobileNumber": "03001234567",
  "role": "user"
}
```

---

### Tenant Endpoints

#### 1. Create Tenant
**POST** `/tenants`

Create a new tenant/organization.

**Request Body:**
```json
{
  "name": "My Business",
  "businessName": "My Business Pvt Ltd",
  "address": "123 Street, City",
  "contactNumber": "03001234567",
  "email": "business@example.com"
}
```

#### 2. Get All Tenants
**GET** `/tenants`

Get list of all tenants.

#### 3. Get Tenant by ID
**GET** `/tenants/:id`

Get specific tenant details.

#### 4. Update Tenant
**PATCH** `/tenants/:id`

Update tenant information.

#### 5. Delete Tenant
**DELETE** `/tenants/:id`

Delete a tenant.

---

### Ledger Endpoints

#### 1. Create Ledger
**POST** `/ledger`

Create a new customer ledger account.

**Request Body:**
```json
{
  "customerName": "Customer Name",
  "customerMobile": "03001234567",
  "customerEmail": "customer@example.com",
  "address": "Customer Address"
}
```

**Response:**
```json
{
  "id": "uuid",
  "customerName": "Customer Name",
  "customerMobile": "03001234567",
  "balance": 0,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 2. Get All Ledgers
**GET** `/ledger`

Get all ledgers for the authenticated user's tenant.

#### 3. Get Ledger by ID
**GET** `/ledger/:id`

Get specific ledger with transaction history.

**Response:**
```json
{
  "id": "uuid",
  "customerName": "Customer Name",
  "customerMobile": "03001234567",
  "balance": 5000,
  "transactions": [
    {
      "id": "uuid",
      "type": "debit",
      "amount": 5000,
      "description": "Purchase",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 4. Get Ledger Balance
**GET** `/ledger/:id/balance`

Get current balance of a ledger.

**Response:**
```json
5000
```

#### 5. Update Ledger
**PATCH** `/ledger/:id`

Update ledger information.

#### 6. Delete Ledger
**DELETE** `/ledger/:id`

Delete a ledger.

---

### Transaction Endpoints

#### 1. Create Transaction
**POST** `/transactions`

Create a new debit or credit transaction.

**Request Body:**
```json
{
  "type": "debit",
  "amount": 1000,
  "description": "Purchase of goods",
  "reference": "INV-001",
  "ledgerId": "uuid"
}
```

**Transaction Types:**
- `debit` - Customer owes money (increases balance)
- `credit` - Customer paid money (decreases balance)

**Response:**
```json
{
  "id": "uuid",
  "type": "debit",
  "amount": 1000,
  "description": "Purchase of goods",
  "balanceAfter": 6000,
  "status": "completed",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 2. Get Transactions
**GET** `/transactions?ledgerId=uuid`

Get all transactions for a specific ledger.

**Query Parameters:**
- `ledgerId` - UUID of the ledger

#### 3. Get Transaction Statistics
**GET** `/transactions/statistics?ledgerId=uuid`

Get transaction statistics for a ledger.

**Response:**
```json
{
  "totalDebit": 10000,
  "totalCredit": 4000,
  "totalTransactions": 25,
  "netBalance": 6000
}
```

#### 4. Get Transaction by ID
**GET** `/transactions/:id`

Get specific transaction details.

---

### Payment Endpoints

#### 1. Create Payment
**POST** `/payments`

Create a new payment record.

**Request Body:**
```json
{
  "method": "easypaisa",
  "amount": 1000,
  "ledgerId": "uuid"
}
```

**Payment Methods:**
- `easypaisa`
- `jazzcash`
- `cash`
- `bank_transfer`

#### 2. Get Payments
**GET** `/payments?ledgerId=uuid`

Get all payments, optionally filtered by ledger.

#### 3. Get Payment by ID
**GET** `/payments/:id`

Get specific payment details.

#### 4. Update Payment Status
**PATCH** `/payments/:id/status`

Update payment status.

**Request Body:**
```json
{
  "status": "completed",
  "gatewayResponse": "Payment successful"
}
```

**Payment Statuses:**
- `pending`
- `processing`
- `completed`
- `failed`
- `refunded`

---

### Notification Endpoints

#### 1. Register Device Token
**POST** `/notifications/register-token`

Register FCM device token for push notifications.

**Request Body:**
```json
{
  "fcmToken": "firebase-cloud-messaging-token"
}
```

#### 2. Send Notification
**POST** `/notifications/send`

Send push notification to a user.

**Request Body:**
```json
{
  "userId": "uuid",
  "title": "Transaction Alert",
  "body": "New transaction recorded",
  "data": {
    "type": "transaction",
    "transactionId": "uuid"
  }
}
```

---

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## User Roles

The system supports the following user roles:

1. **super_admin** - Full system access
2. **admin** - Tenant administration
3. **manager** - Ledger and transaction management
4. **user** - Basic user access
5. **viewer** - Read-only access

---

## Rate Limiting

Currently, no rate limiting is implemented. It's recommended to implement rate limiting in production.

---

## Pagination

Currently, all list endpoints return all results. Pagination should be implemented for production use.

---

## Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api
```

This provides a UI to test all endpoints directly from the browser.
