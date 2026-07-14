# Withdrawal Module

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 2.0

---

# 1. Overview

The Withdrawal Module allows users to request withdrawals from their available wallet balance.

Unlike many traditional systems, every withdrawal rule is dynamically loaded from the **Settings Service**, allowing administrators to change withdrawal policies without modifying application code.

The Withdrawal Module integrates with:

- Wallet Module
- Transactions Module
- Notification Module
- Audit Module
- Settings Module

A withdrawal request is not completed until it has been approved and processed by an administrator.

---

# 2. Objectives

The Withdrawal Module is responsible for:

- Accepting withdrawal requests
- Validating withdrawal eligibility
- Enforcing waiting periods
- Validating wallet balance
- Supporting multiple payment methods
- Allowing administrator approval
- Updating wallet balances
- Creating transaction records
- Sending notifications
- Recording audit logs

---

# 3. Module Architecture

```
User

↓

Withdrawal Controller

↓

Withdrawal Service

↓

Settings Service

↓

Wallet Service

↓

Transaction Service

↓

Notification Service

↓

Audit Service

↓

MongoDB
```

No business rule should be hardcoded.

---

# 4. Withdrawal Workflow

```
User Opens Withdrawal Page

↓

Load Withdrawal Settings

↓

Validate Eligibility

↓

Create Withdrawal Request

↓

Status = Pending

↓

Admin Reviews

↓

Approve

↓

Waiting for Payment

↓

Complete Payment

↓

Transaction Created

↓

Notification

↓

Audit Log
```

---

# 5. Withdrawal Collection

```json
{
  "_id": "...",
  "withdrawalId": "WTH100001",
  "userId": "...",
  "amount": 50,
  "currency": "USD",
  "convertedAmount": 6000,
  "exchangeRate": 120,
  "paymentMethod": "bkash",
  "paymentNumber": "017XXXXXXXX",
  "status": "Pending",
  "requestedAt": "...",
  "reviewedBy": null,
  "reviewedAt": null,
  "completedAt": null,
  "remarks": "",
  "transactionId": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

# 6. Withdrawal Status

Supported statuses

```
Pending

Approved

Rejected

Processing

Completed

Cancelled
```

Only **Completed** withdrawals permanently reduce the wallet balance.

---

# 7. Withdrawal Settings

The module loads all configuration from:

```
Settings

↓

Withdrawal Settings
```

Example

```json
{
  "enabled": true,
  "minimumWithdrawal": 25,
  "maximumWithdrawal": 5000,
  "waitingPeriod": 15,
  "processingTime": "24-48 Hours",
  "withdrawalFee": 2,
  "paymentMethods": ["bkash", "nagad"]
}
```

Administrators may change any value without deployment.

---

# 8. Waiting Period

Some platforms require investments to mature before withdrawal.

Example

```
Waiting Period

15 Days
```

The waiting period is configurable.

The Withdrawal Service validates:

```
Current Date

-

First Deposit Date

>= Waiting Period
```

If not satisfied, the withdrawal is rejected.

---

# 9. Withdrawal Validation

Before accepting a request, the system validates:

- Withdrawals enabled
- User account active
- Wallet exists
- Sufficient balance
- Minimum amount
- Maximum amount
- Waiting period completed
- Valid payment method
- Valid payment number
- Platform not in maintenance

---

# 10. Available Balance

Only **available wallet balance** can be withdrawn.

Unavailable funds include:

- Pending deposits
- Pending bonuses
- Locked investment funds (Future)
- Pending settlement amounts (Future)

---

# 11. Withdrawal Fee

Withdrawal fees are optional.

Configuration:

```
Withdrawal Fee

2%
```

or

```
Flat Fee

5 USD
```

Fee calculation comes from the Settings Service.

No fee calculation is hardcoded.

---

# 12. Currency Conversion

Wallet balance uses:

```
USD
```

Payout may use:

```
BDT
```

Example

```
50 USD

↓

Exchange Rate

120

↓

6000 BDT
```

Exchange rates come from Currency Settings.

---

# 13. Create Withdrawal API

```
POST /api/v1/withdrawals
```

Example Request

```json
{
  "amount": 50,
  "paymentMethod": "bkash",
  "paymentNumber": "017XXXXXXXX"
}
```

---

# 14. Withdrawal History

```
GET /api/v1/withdrawals
```

Supports:

- Pagination
- Date Range
- Status
- Payment Method

---

# 15. Withdrawal Details

```
GET /api/v1/withdrawals/:id
```

Returns:

- Request Information
- Status
- Payment Method
- Remarks
- Timeline

---

# 16. Admin Review

```
Pending Withdrawal

↓

Validate Request

↓

Approve

or

Reject
```

Approval does not necessarily mean payment has been sent.

---

# 17. Processing Flow

After approval:

```
Approved

↓

Finance Team Pays User

↓

Admin Confirms Payment

↓

Status = Completed

↓

Wallet Updated

↓

Transaction Created

↓

Notification

↓

Audit Log
```

---

# 18. Wallet Integration

When a withdrawal is completed:

```
Wallet Service

↓

Decrease Balance

↓

Update Lifetime Withdrawals

↓

Save Wallet
```

Wallet updates must occur only through the Wallet Service.

---

# 19. Transaction Integration

Every completed withdrawal creates a financial transaction.

Example

```json
{
  "type": "Withdrawal",
  "amount": -50,
  "currency": "USD",
  "referenceId": "WTH100001",
  "status": "Completed"
}
```

Rejected withdrawals do not create transactions.

---

# 20. Notification Integration

The Notification Module sends alerts for:

- Withdrawal Submitted
- Withdrawal Approved
- Withdrawal Rejected
- Withdrawal Completed

Notification behavior is controlled through the Settings Service.

---

# 21. Audit Logging

Audit logs are created for:

- Withdrawal Submitted
- Approval
- Rejection
- Completion
- Manual Changes
- Remarks Updates

Audit logs cannot be modified.

---

# 22. Admin APIs

```
GET /api/v1/admin/withdrawals

GET /api/v1/admin/withdrawals/:id

PATCH /api/v1/admin/withdrawals/:id/approve

PATCH /api/v1/admin/withdrawals/:id/reject

PATCH /api/v1/admin/withdrawals/:id/complete
```

Only Admin and Super Admin have access.

---

# 23. Security

Withdrawal requests require:

- JWT Authentication
- Active Account
- Valid Session
- Server-side Validation

Administrative actions require:

- Admin Role
- Audit Logging
- Permission Checks

---

# 24. Concurrency Protection

To prevent duplicate withdrawals:

Before processing:

```
Lock Wallet

↓

Validate Balance

↓

Process Withdrawal

↓

Unlock Wallet
```

Only one withdrawal operation may execute against a wallet at a time.

---

# 25. Atomic Transactions

The following operations execute inside a MongoDB transaction.

```
Update Withdrawal

+

Update Wallet

+

Create Transaction

+

Create Notification

+

Create Audit Log
```

If any step fails:

Everything is rolled back.

---

# 26. Error Handling

Example errors

```
Withdrawals Disabled

Insufficient Balance

Waiting Period Not Completed

Invalid Payment Method

Invalid Payment Number

Amount Below Minimum

Amount Above Maximum

Withdrawal Already Processed

Wallet Not Found

Unauthorized
```

All responses follow the platform's standard API format.

---

# 27. Performance

The module should:

- Index userId
- Index status
- Index createdAt
- Paginate history
- Cache withdrawal settings
- Optimize admin filtering

---

# 28. Future Features

Future versions may support:

- Automatic Bank Transfers
- Payment Gateway Withdrawals
- Cryptocurrency Withdrawals
- Scheduled Withdrawals
- Instant Withdrawals
- Multi-Currency Withdrawals
- Withdrawal OTP Verification
- Bulk Withdrawals
- AI Fraud Detection

The architecture should support these features without major redesign.

---

# 29. Reporting

The Withdrawal Module provides data for:

- Daily Withdrawals
- Monthly Withdrawals
- Pending Withdrawals
- Completed Withdrawals
- User Withdrawal History
- Finance Reports
- Revenue Reports

---

# 30. Development Rules

The following rules are mandatory.

- Every withdrawal rule must come from the Settings Service.
- Withdrawal limits must never be hardcoded.
- Waiting periods must never be hardcoded.
- Exchange rates must come from Currency Settings.
- Payment methods must be configurable.
- Controllers must never update wallet balances directly.
- Wallet balance changes must occur only through the Wallet Service.
- Every completed withdrawal must create a Transaction record.
- Every administrative action must generate an Audit Log.
- Every status change must create a Notification when enabled.
- Financial operations must execute as atomic MongoDB transactions.
- Wallet balances must never become negative.
- Duplicate processing of the same withdrawal request must be prevented.
- All validation must occur on the server.
- The Withdrawal Module must be designed to support future automated payout systems without architectural changes.
