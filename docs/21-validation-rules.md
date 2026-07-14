# Validation Rules

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 2.0

---

# 1. Overview

Validation is one of the most important layers of the platform.

Every request received by the backend must pass through multiple validation stages before any business logic is executed.

The platform follows the principle:

> **Never trust client input.**

Validation must occur on both the frontend and backend, with the backend serving as the final authority.

---

# 2. Validation Layers

Every request passes through the following pipeline:

```
Client

↓

Frontend Validation

↓

API Request

↓

Authentication

↓

Authorization

↓

Request Validation

↓

Business Rule Validation

↓

Database Validation

↓

Business Logic

↓

MongoDB
```

---

# 3. Validation Principles

The platform follows these rules:

- Validate every input
- Sanitize user input
- Reject invalid requests early
- Never trust client-side calculations
- Return standardized validation errors
- Keep validation centralized
- Use reusable validation schemas

---

# 4. Frontend Validation

Frontend validation improves user experience but is **not** considered secure.

The frontend should validate:

- Required fields
- Email format
- Password strength
- Number ranges
- Date formats
- File size
- File type

Technology

```
React Hook Form

+

Zod
```

---

# 5. Backend Validation

The backend performs the final validation.

Technology

```
Zod

or

Joi
```

Validation occurs before reaching controllers or service logic.

---

# 6. Authentication Validation

Protected endpoints require:

- Valid JWT
- Active Session
- Token Not Expired

Failure returns:

```
401 Unauthorized
```

---

# 7. Authorization Validation

After authentication:

Validate:

- User Role
- Required Permission
- Account Status

Failure returns:

```
403 Forbidden
```

---

# 8. Request Validation

Every request validates:

- Required Fields
- Data Types
- Length
- Format
- Range
- Enums
- Nested Objects

Example

```json
{
  "amount": 3000
}
```

Amount must be:

- Number
- Positive
- Within configured limits

---

# 9. General User Validation

Registration requires:

- First Name
- Last Name
- Username
- Email
- Phone
- Password

Validation rules:

First Name

- Required
- 2–50 characters

Last Name

- Required
- 2–50 characters

Username

- Required
- Unique
- 4–30 characters
- Letters, numbers, underscore only

Email

- Required
- Valid format
- Unique

Phone

- Required
- Valid format
- Unique

Password

- Required
- Configurable policy from Settings

---

# 10. Login Validation

Required

- Email or Username
- Password

Validate

- Account Exists
- Password Correct
- Account Active
- Login Attempts
- Session Limits (Future)

---

# 11. Password Validation

Password rules come from the Settings Service.

Example

```json
{
  "minimumLength": 8,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireNumber": true,
  "requireSpecialCharacter": true
}
```

Passwords are validated on both frontend and backend.

---

# 12. Wallet Validation

Before wallet operations:

Validate

- Wallet Exists
- User Active
- Wallet Not Locked (Future)

Negative balances are never allowed.

---

# 13. Deposit Validation

Validate:

- Deposits Enabled
- Active User
- Deposit Package Exists
- Amount Within Limits
- Supported Payment Method
- Screenshot Uploaded
- Valid Screenshot Type

Deposit packages are loaded from the Settings Service.

---

# 14. Withdrawal Validation

Validate:

- Withdrawals Enabled
- Wallet Balance
- Waiting Period
- Minimum Amount
- Maximum Amount
- Payment Method
- User Status

All limits come from the Settings Service.

---

# 15. Stock Validation

Before purchasing:

Validate

- Trading Enabled
- Stock Exists
- Stock Active
- Purchase Limits
- Wallet Balance

---

# 16. Trading Validation

Validate:

- Trading Enabled
- Maintenance Mode
- User Active
- Stock Active
- Wallet Balance
- Market Hours
- Purchase Limits

Trading rules come from the Settings Service.

---

# 17. Portfolio Validation

Selling requires:

- Portfolio Exists
- User Owns Portfolio
- Quantity Available
- Stock Active

Users cannot sell more shares than owned.

---

# 18. MLM Validation

Validate:

- Referral Code Exists
- Sponsor Exists
- Referral Tree Integrity
- Maximum Direct Referrals
- Commission Configuration
- Rank Configuration

All MLM rules come from the Settings Service.

---

# 19. Settings Validation

Administrators may update settings only if values are valid.

Examples

Exchange Rate

```
Greater Than Zero
```

Commission

```
0%

↓

100%
```

Deposit

```
Minimum

≤

Maximum
```

Withdrawal

```
Minimum

≤

Maximum
```

---

# 20. File Upload Validation

Supported uploads:

- Deposit Screenshot
- Avatar
- Homepage Images

Validate:

- File Type
- File Size
- MIME Type
- Image Dimensions (Future)

Unsupported files are rejected.

---

# 21. Image Validation

Allowed types

```
jpg

jpeg

png

webp
```

Maximum size should be configurable.

Example

```
5 MB
```

---

# 22. Numeric Validation

Validate:

- Positive Numbers
- Decimal Precision
- Currency Values
- Percentage Values

Examples

Commission

```
0

↓

100
```

Exchange Rate

```
> 0
```

---

# 23. Date Validation

Validate:

- Valid Date
- Future Date
- Past Date
- Date Range

Used in:

- Reports
- Withdrawals
- Trading Sessions
- Analytics

---

# 24. Business Rule Validation

Examples

Deposits

```
Amount

↓

Within Limits
```

Withdrawals

```
Waiting Period Completed
```

Trading

```
Trading Enabled
```

MLM

```
Referral Level Exists
```

Business validation occurs only in the service layer.

---

# 25. Database Validation

Mongoose validates:

- Required Fields
- Schema Types
- Enums
- References
- Unique Indexes

Database validation is the final layer before persistence.

---

# 26. Error Response Format

Every validation error follows a standard format.

Example

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Email address is invalid."
    }
  ]
}
```

---

# 27. Sanitization

Sanitize all user input.

Prevent:

- HTML Injection
- XSS
- MongoDB Operator Injection
- Script Injection

Sanitized values are used throughout the application.

---

# 28. Duplicate Validation

Prevent duplicate:

- Email
- Username
- Phone Number
- Referral Code
- Transaction IDs

Database indexes should enforce uniqueness.

---

# 29. Validation Middleware

Every endpoint should use reusable middleware.

Example

```
Request

↓

Authentication

↓

Authorization

↓

Validation Middleware

↓

Controller

↓

Service
```

Validation logic should never be duplicated.

---

# 30. Performance

Validation should:

- Use reusable schemas
- Avoid duplicate database queries
- Cache frequently used settings
- Validate before expensive operations

---

# 31. Future Validation Features

Future versions may support:

- AI Fraud Detection
- Device Validation
- Geo-location Validation
- IP Reputation Checks
- CAPTCHA
- OTP Validation
- WebAuthn Validation
- Risk Scoring

The architecture should allow these features to be added without major changes.

---

# 32. Development Rules

The following rules are mandatory.

- Every request must be validated before business logic executes.
- Frontend validation improves UX but never replaces backend validation.
- Controllers must receive only validated data.
- Validation schemas should be reusable and centralized.
- Business rule validation must occur in the service layer.
- All configurable limits and rules must be loaded from the Settings Service.
- File uploads must validate file type and size before storage.
- Duplicate values must be prevented using both validation and database constraints.
- Validation errors must follow a consistent API response format.
- User input must always be sanitized before processing.
- The validation architecture should remain extensible for future security and compliance requirements.
