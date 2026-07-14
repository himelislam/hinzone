# Deposit Module

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 2.0

---

# 1. Overview

The Deposit Module allows users to add funds to their investment wallet through administrator-approved manual deposits.

Version 1 supports manual payment methods such as:

- bKash
- Nagad
- Bank Transfer (Future)
- Other payment methods configured by administrators

Unlike hardcoded systems, every deposit rule is dynamically loaded from the **Settings Service**.

The Deposit Module integrates with:

- Wallet Module
- Transactions Module
- Notification Module
- Audit Module
- Settings Module
- MLM Module

A deposit is not considered successful until an administrator approves it.

---

# 2. Objectives

The Deposit Module is responsible for:

- Accepting deposit requests
- Validating deposit rules
- Uploading payment proof
- Allowing administrators to review deposits
- Crediting user wallets
- Creating transaction records
- Triggering MLM first-deposit bonuses
- Sending notifications
- Creating audit logs

---

# 3. Module Architecture

```
User

↓

Deposit Controller

↓

Deposit Service

↓

Settings Service

↓

Wallet Service

↓

Transaction Service

↓

Notification Service

↓

MLM Service

↓

Audit Service

↓

MongoDB
```

Every business rule comes from the **Settings Service**.

---

# 4. Deposit Workflow

```
User Selects Package

↓

Load Deposit Settings

↓

Validate Package

↓

Upload Screenshot

↓

Submit Deposit

↓

Status = Pending

↓

Admin Reviews

↓

Approve / Reject

↓

Wallet Updated

↓

Transaction Created

↓

MLM Bonus (if eligible)

↓

Notification

↓

Audit Log
```

---

# 5. Deposit Collection

```json
{
  "_id": "...",
  "depositId": "DEP100001",
  "userId": "...",
  "packageAmount": 3000,
  "walletCredit": 25,
  "paymentMethod": "bkash",
  "transactionId": "9AX82DF",
  "paymentScreenshot": "cloudinary-url",
  "status": "Pending",
  "reviewedBy": null,
  "reviewedAt": null,
  "remarks": "",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

# 6. Deposit Status

Supported statuses:

```
Pending

Approved

Rejected

Cancelled (Future)

Expired (Future)
```

Only **Approved** deposits affect wallet balances.

---

# 7. Deposit Settings Integration

The Deposit Module loads configuration from:

```
Settings

↓

Deposit Settings
```

Example configuration:

```json
{
  "enabled": true,
  "packages": [
    {
      "amount": 3000,
      "walletCredit": 25
    },
    {
      "amount": 6000,
      "walletCredit": 50
    },
    {
      "amount": 12000,
      "walletCredit": 100
    }
  ],
  "minimumDeposit": 3000,
  "maximumDeposit": 12000,
  "paymentMethods": ["bkash", "nagad"],
  "companyAccounts": {
    "bkash": "017XXXXXXXX",
    "nagad": "018XXXXXXXX"
  },
  "instructions": "Send money and upload the payment screenshot."
}
```

Administrators can modify these values without deploying a new version.

---

# 8. Deposit Packages

Deposit packages are configurable.

Example:

| Deposit    | Wallet Credit |
| ---------- | ------------: |
| 3,000 BDT  |        25 USD |
| 6,000 BDT  |        50 USD |
| 12,000 BDT |       100 USD |

Administrators may:

- Add packages
- Remove packages
- Change values
- Disable packages

No code modification is required.

---

# 9. Payment Methods

Available payment methods are loaded from the Settings Service.

Examples:

- bKash
- Nagad
- Bank Transfer (Future)

Each method may contain:

- Account Number
- Account Name
- QR Code (Future)
- Instructions

---

# 10. Deposit Validation

Before accepting a deposit, the system validates:

- Deposits are enabled.
- User account is active.
- Selected package exists.
- Package is enabled.
- Payment method is allowed.
- Screenshot uploaded.
- Transaction ID provided.
- Duplicate transaction ID does not exist.

If validation fails, the request is rejected.

---

# 11. Create Deposit API

```
POST /api/v1/deposits
```

Example Request

```json
{
  "packageAmount": 3000,
  "paymentMethod": "bkash",
  "transactionId": "9AX82DF",
  "paymentScreenshot": "cloudinary-url"
}
```

Response

```json
{
  "success": true,
  "message": "Deposit submitted successfully.",
  "data": {
    "status": "Pending"
  }
}
```

---

# 12. Deposit History

```
GET /api/v1/deposits
```

Supports:

- Pagination
- Date Range
- Status
- Payment Method

---

# 13. Deposit Details

```
GET /api/v1/deposits/:id
```

Returns:

- Deposit Information
- Package
- Screenshot
- Review Status
- Admin Remarks

---

# 14. Admin Review Process

```
Pending Deposit

↓

Review Screenshot

↓

Verify Transaction

↓

Approve / Reject

↓

Save Decision

↓

Generate Notification

↓

Create Audit Log
```

---

# 15. Approve Deposit

When approved:

```
Update Deposit

↓

Credit Wallet

↓

Create Transaction

↓

Check First Deposit

↓

Generate MLM Bonus

↓

Send Notification

↓

Audit Log
```

The entire operation must execute inside a MongoDB transaction.

---

# 16. Reject Deposit

When rejected:

- Status becomes **Rejected**
- Wallet remains unchanged
- User receives notification
- Audit log is created

---

# 17. Wallet Integration

Approved deposits trigger:

```
Wallet Service

↓

Increase Balance

↓

Update Lifetime Deposits

↓

Create Transaction
```

Wallet updates must never occur directly inside the Deposit Controller.

---

# 18. Transaction Integration

Every approved deposit creates an immutable transaction.

Example

```json
{
  "type": "Deposit",
  "amount": 25,
  "currency": "USD",
  "referenceId": "DEP100001",
  "status": "Completed"
}
```

Rejected deposits do not create wallet transactions.

---

# 19. MLM Integration

When a user's **first approved deposit** is completed:

The MLM Module checks:

- Referrer
- Referral placement
- Commission settings

Commission values come from:

```
Settings

↓

MLM

↓

First Deposit Bonus
```

No commission percentages are hardcoded.

---

# 20. Notification Integration

Deposit events generate notifications.

Examples:

- Deposit Submitted
- Deposit Approved
- Deposit Rejected
- First Deposit Bonus Earned

Notification behavior is configurable through the Settings Service.

---

# 21. Audit Logging

The following actions create audit logs.

- Deposit Submitted
- Deposit Approved
- Deposit Rejected
- Admin Remarks Updated

Audit logs cannot be edited or deleted.

---

# 22. File Upload

Payment screenshots are uploaded to Cloudinary.

Supported formats:

- JPG
- PNG
- WEBP
- PDF (Future)

The database stores only the file URL and metadata.

---

# 23. Security

The Deposit Module requires:

- JWT Authentication
- Active User
- Valid Session
- Server-side Validation
- File Validation
- Duplicate Transaction Detection

Only Admin and Super Admin can approve or reject deposits.

---

# 24. Performance

The Deposit Module should:

- Index status and userId
- Paginate history
- Cache deposit settings
- Optimize admin queries
- Compress uploaded images where appropriate

---

# 25. Error Handling

Example errors:

```
Deposits Disabled

Invalid Deposit Package

Package Not Available

Unsupported Payment Method

Duplicate Transaction ID

Screenshot Required

Deposit Not Found

Deposit Already Reviewed

Unauthorized
```

All errors follow the standard API response format.

---

# 26. Future Features

Future releases may support:

- Automatic Payment Verification
- Payment Gateway Integration
- Bank Transfers
- Cryptocurrency Deposits
- QR Code Payments
- Deposit Expiration
- OCR Verification
- AI Fraud Detection

The architecture should allow these features without major refactoring.

---

# 27. Development Rules

The following rules are mandatory.

- Deposits must be enabled through the Settings Service.
- Deposit packages must be loaded dynamically.
- Payment methods must be loaded dynamically.
- Company payment accounts must come from the Settings Service.
- Controllers must never update wallet balances directly.
- Every approved deposit must create a wallet transaction.
- Every approved deposit must update the wallet through the Wallet Service.
- First-deposit MLM commissions must be calculated through the MLM Service.
- All configurable business rules must come from the Settings Service.
- Deposit approval must execute as a single atomic database transaction.
- Payment screenshots must be stored in Cloudinary.
- Every administrative action must generate an Audit Log.
- Deposit history must remain permanently available for reporting and auditing.
- No deposit-related business rule may be hardcoded anywhere in the application.
