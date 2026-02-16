# API Usage Examples

## Prerequisites

1. MongoDB running on localhost:27017
2. Environment variables configured in `.env`
3. Backend server running on port 5000

## 1. Create a Tenant

```bash
curl -X POST http://localhost:5000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Business",
    "subdomain": "mybusiness",
    "businessName": "My Business Ltd",
    "contactPerson": "John Doe",
    "contactPhone": "03001234567",
    "contactEmail": "john@mybusiness.com",
    "adminPassword": "SecurePass123!"
  }'
```

## 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Subdomain: mybusiness" \
  -H "X-Device-Id: web-browser-123" \
  -d '{
    "email": "john@mybusiness.com",
    "password": "SecurePass123!"
  }'
```

Response will include:
- `token`: Use this for authenticated requests
- `refreshToken`: Use this to get a new token when expired

## 3. Create a Party (Customer/Supplier)

```bash
curl -X POST http://localhost:5000/api/parties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-Subdomain: mybusiness" \
  -d '{
    "name": "ABC Suppliers",
    "phone": "03119876543",
    "email": "contact@abc.com",
    "partyType": "supplier",
    "address": "123 Main St, Lahore",
    "openingBalance": 0
  }'
```

## 4. Create a Transaction

```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-Subdomain: mybusiness" \
  -d '{
    "partyId": "PARTY_ID_FROM_STEP_3",
    "type": "debit",
    "amount": 5000,
    "paymentMethod": "cash",
    "description": "Payment for goods"
  }'
```

## 5. Get Party Ledger

```bash
curl -X GET "http://localhost:5000/api/parties/PARTY_ID/ledger?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-Subdomain: mybusiness"
```

## 6. Initiate Payment (Easypaisa/JazzCash)

```bash
curl -X POST http://localhost:5000/api/transactions/payment/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-Subdomain: mybusiness" \
  -d '{
    "partyId": "PARTY_ID",
    "amount": 1000,
    "paymentGateway": "easypaisa",
    "orderId": "ORD123456",
    "description": "Payment for invoice",
    "callbackUrl": "https://yourapp.com/payment/callback"
  }'
```

## 7. Get Notifications

```bash
curl -X GET "http://localhost:5000/api/notifications?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-Subdomain: mybusiness"
```

## 8. Send OTP

```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Subdomain: mybusiness" \
  -d '{
    "phone": "03001234567"
  }'
```

## 9. Verify OTP

```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-Subdomain: mybusiness" \
  -d '{
    "otp": "123456"
  }'
```

## 10. Get Transaction Summary

```bash
curl -X GET "http://localhost:5000/api/transactions/summary/stats?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-Subdomain: mybusiness"
```

## Notes

- Replace `YOUR_JWT_TOKEN` with the actual token received from login
- Replace `PARTY_ID` with actual party IDs
- Replace `mybusiness` with your actual tenant subdomain
- All dates should be in ISO 8601 format
- Pakistani mobile numbers should be in format: 03XXXXXXXXX
