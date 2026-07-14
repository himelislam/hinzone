# API Specification

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 1.0

**API Style:** RESTful

**Authentication:** JWT + Refresh Token

**Response Format:** JSON

---

# 1. API Overview

The backend exposes a RESTful API consumed by:

- User Dashboard
- Admin Dashboard
- Future Mobile Applications
- Future Third-Party Integrations

All APIs are versioned.

Example:

```
/api/v1/
```

---

# 2. API Design Principles

The API follows these principles:

- RESTful endpoints
- Stateless authentication
- JSON request/response
- Consistent error format
- Role-Based Authorization (RBAC)
- Input validation using Zod
- Business rules loaded from the Settings Service
- Standard HTTP status codes

---

# 3. Authentication

Authentication uses:

- JWT Access Token
- Refresh Token

Header

```
Authorization: Bearer <token>
```

---

# 4. Standard Response Format

## Success

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

---

## Error

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [],
  "errorCode": "VALIDATION_ERROR"
}
```

---

# 5. Authentication APIs

## Register

```
POST /api/v1/auth/register
```

Body

```json
{
  "fullName": "",
  "username": "",
  "phoneNumber": "",
  "password": "",
  "confirmPassword": "",
  "email": "",
  "referrerId": ""
}
```

`email` and `referrerId` are optional; every other field is required.

---

## Login

```
POST /api/v1/auth/login
```

Accepts a username, phone number, or email in the `login` field.

---

## Logout

```
POST /api/v1/auth/logout
```

---

## Refresh Token

```
POST /api/v1/auth/refresh
```

---

## Forgot Password

```
POST /api/v1/auth/forgot-password
```

Always responds with the same generic message regardless of whether the email is registered
(see docs/07-authentication.md #21).

---

## Reset Password

```
POST /api/v1/auth/reset-password
```

Invalidates every existing session for the user on success.

---

## Get Current User

```
GET /api/v1/auth/me
```

---

## Change Password

```
PUT /api/v1/auth/change-password
```

Invalidates every existing session for the user, including the one making the request.

---

# 6. User APIs

## Get Profile

```
GET /api/v1/users/profile
```

---

## Update Profile

```
PUT /api/v1/users/profile
```

---

## Upload Profile Image

```
POST /api/v1/users/profile/image
```

---

## Get Dashboard

```
GET /api/v1/users/dashboard
```

Returns:

- Wallet Summary
- Portfolio Summary
- Referral Summary
- Notifications
- Statistics

---

# 7. Wallet APIs

## Wallet Summary

```
GET /api/v1/wallet
```

---

## Wallet Transactions

```
GET /api/v1/wallet/transactions
```

Supports:

- Pagination
- Date Filter
- Transaction Type
- Status

---

## Wallet Statistics

```
GET /api/v1/wallet/statistics
```

---

# 8. Deposit APIs

## Deposit Settings

```
GET /api/v1/deposits/settings
```

Returns dynamic values from the Settings Service.

---

## Create Deposit

```
POST /api/v1/deposits
```

Body

```json
{
  "packageAmount": 3000,
  "paymentMethod": "bkash",
  "transactionId": "",
  "paymentScreenshot": ""
}
```

---

## Deposit History

```
GET /api/v1/deposits
```

---

## Deposit Details

```
GET /api/v1/deposits/:id
```

---

# 9. Withdrawal APIs

## Withdrawal Settings

```
GET /api/v1/withdrawals/settings
```

---

## Create Withdrawal

```
POST /api/v1/withdrawals
```

---

## Withdrawal History

```
GET /api/v1/withdrawals
```

---

## Withdrawal Details

```
GET /api/v1/withdrawals/:id
```

---

# 10. Stock APIs

## Stock List

```
GET /api/v1/stocks
```

---

## Stock Details

```
GET /api/v1/stocks/:id
```

---

## Buy Stock

```
POST /api/v1/stocks/buy
```

---

## Sell Stock

```
POST /api/v1/stocks/sell
```

---

## Auto Sell

```
POST /api/v1/stocks/auto-sell
```

---

## Portfolio

```
GET /api/v1/portfolio
```

---

## Portfolio Details

```
GET /api/v1/portfolio/:id
```

---

# 11. Trading APIs

## Trading Settings

```
GET /api/v1/trading/settings
```

---

## Trading Dashboard

```
GET /api/v1/trading/dashboard
```

---

## Trading Chart

```
GET /api/v1/trading/chart
```

Version 1 is read-only.

---

# 12. MLM APIs

## Referral Dashboard

```
GET /api/v1/mlm/dashboard
```

---

## Referral Tree

```
GET /api/v1/mlm/tree
```

---

## Referral Link

```
GET /api/v1/mlm/link
```

---

## Referral Statistics

```
GET /api/v1/mlm/statistics
```

---

## Commission History

```
GET /api/v1/mlm/commissions
```

---

## Rank History

```
GET /api/v1/mlm/ranks
```

---

# 13. Notification APIs

## Notification List

```
GET /api/v1/notifications
```

---

## Mark Read

```
PUT /api/v1/notifications/:id/read
```

---

## Mark All Read

```
PUT /api/v1/notifications/read-all
```

---

## Delete Notification

```
DELETE /api/v1/notifications/:id
```

---

# 14. Public Settings APIs

These endpoints expose only safe configuration required by the client.

## Platform Settings

```
GET /api/v1/settings/general
```

---

## Currency Settings

```
GET /api/v1/settings/currency
```

---

## Deposit Settings

```
GET /api/v1/settings/deposit
```

---

## Withdrawal Settings

```
GET /api/v1/settings/withdrawal
```

---

## Trading Settings

```
GET /api/v1/settings/trading
```

---

## Homepage Settings

```
GET /api/v1/settings/homepage
```

---

# 15. Admin Authentication APIs

```
POST /api/v1/admin/login

POST /api/v1/admin/logout

POST /api/v1/admin/refresh

GET /api/v1/admin/me
```

---

# 16. Admin User APIs

```
GET /api/v1/admin/users

GET /api/v1/admin/users/:id

PUT /api/v1/admin/users/:id

PATCH /api/v1/admin/users/:id/status

DELETE /api/v1/admin/users/:id

POST /api/v1/admin/users/:id/reset-password
```

`DELETE` performs a soft delete (database_rules.md) and forces the account status to `BLOCKED`.

`POST /:id/reset-password` is the "future-ready" admin-triggered password reset - it reuses the
same token flow as the self-service forgot-password endpoint (§5) rather than a separate one.

---

# 17. Admin Deposit APIs

```
GET /api/v1/admin/deposits

GET /api/v1/admin/deposits/:id

PATCH /api/v1/admin/deposits/:id/approve

PATCH /api/v1/admin/deposits/:id/reject
```

---

# 18. Admin Withdrawal APIs

```
GET /api/v1/admin/withdrawals

GET /api/v1/admin/withdrawals/:id

PATCH /api/v1/admin/withdrawals/:id/approve

PATCH /api/v1/admin/withdrawals/:id/reject

PATCH /api/v1/admin/withdrawals/:id/complete
```

---

# 19. Admin Stock APIs

```
GET /api/v1/admin/stocks

POST /api/v1/admin/stocks

PUT /api/v1/admin/stocks/:id

DELETE /api/v1/admin/stocks/:id

PATCH /api/v1/admin/stocks/:id/status
```

---

# 20. Admin Homepage APIs

```
GET /api/v1/admin/homepage

PUT /api/v1/admin/homepage
```

---

# 21. Admin Settings APIs

The Settings module controls every configurable business rule.

## General

```
GET /api/v1/admin/settings/general

PUT /api/v1/admin/settings/general
```

---

## Currency

```
GET /api/v1/admin/settings/currency

PUT /api/v1/admin/settings/currency
```

---

## Deposit

```
GET /api/v1/admin/settings/deposit

PUT /api/v1/admin/settings/deposit
```

---

## Withdrawal

```
GET /api/v1/admin/settings/withdrawal

PUT /api/v1/admin/settings/withdrawal
```

---

## Stocks

```
GET /api/v1/admin/settings/stocks

PUT /api/v1/admin/settings/stocks
```

---

## Trading

```
GET /api/v1/admin/settings/trading

PUT /api/v1/admin/settings/trading
```

---

## MLM

```
GET /api/v1/admin/settings/mlm

PUT /api/v1/admin/settings/mlm
```

---

## Notifications

```
GET /api/v1/admin/settings/notifications

PUT /api/v1/admin/settings/notifications
```

---

## Security

```
GET /api/v1/admin/settings/security

PUT /api/v1/admin/settings/security
```

---

## Homepage

```
GET /api/v1/admin/settings/homepage

PUT /api/v1/admin/settings/homepage
```

---

# 22. Reports APIs

```
GET /api/v1/admin/reports/dashboard

GET /api/v1/admin/reports/users

GET /api/v1/admin/reports/deposits

GET /api/v1/admin/reports/withdrawals

GET /api/v1/admin/reports/wallet

GET /api/v1/admin/reports/stocks

GET /api/v1/admin/reports/mlm

GET /api/v1/admin/reports/revenue
```

Supports:

- Date range
- CSV export (future)
- Excel export (future)

---

# 23. Audit APIs

```
GET /api/v1/admin/audit-logs

GET /api/v1/admin/audit-logs/:id
```

Only Super Admin can access audit logs.

---

# 24. HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Resource Created      |
| 204  | No Content            |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 422  | Validation Error      |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |

---

# 25. Validation Rules

Every endpoint must:

- Validate request body.
- Validate query parameters.
- Validate URL parameters.
- Validate authentication.
- Validate authorization.
- Load business configuration from the Settings Service.
- Return standardized error responses.

---

# 26. Pagination Standard

Endpoints returning collections support:

```
?page=1

&limit=20

&sort=createdAt

&order=desc
```

Response:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 154,
    "totalPages": 8
  }
}
```

---

# 27. Filtering

Supported query parameters where applicable:

```
status

type

dateFrom

dateTo

search

role

paymentMethod

stockId

userId
```

---

# 28. Security Requirements

Every protected endpoint must:

- Require JWT authentication.
- Validate user permissions.
- Perform server-side validation.
- Prevent unauthorized access.
- Record sensitive administrative actions in the Audit Log.
- Never trust client-supplied financial calculations.

---

# 29. Business Rules

The API must enforce the following:

- No financial calculation is performed on the client.
- Wallet balances are calculated on the server.
- Exchange rates come from the Settings Service.
- Deposit packages come from the Settings Service.
- Withdrawal limits come from the Settings Service.
- MLM commissions come from the Settings Service.
- Rank requirements come from the Settings Service.
- Trading status comes from the Settings Service.
- Every successful financial operation creates a Transaction record.
- Every settings update refreshes the configuration cache immediately.

---

# 30. API Standards

The following rules are mandatory:

- Use RESTful endpoint naming.
- Use plural resource names.
- Version all endpoints under `/api/v1`.
- Return consistent JSON responses.
- Use appropriate HTTP status codes.
- Keep controllers thin and delegate business logic to services.
- Validate all inputs before reaching the service layer.
- Never expose sensitive internal configuration to public endpoints.
- Ensure every configurable business rule is retrieved through the Settings Service rather than hardcoded.
