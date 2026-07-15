# Authentication System

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 1.0

---

# 1. Overview

The Authentication System is responsible for:

- User Registration
- User Login
- Session Management
- JWT Authentication
- Refresh Token Management
- Role-Based Authorization
- Password Security
- Device Session Tracking

The authentication system must be secure, scalable, and easy to extend for future features such as:

- Email Verification
- OTP Verification
- Two-Factor Authentication (2FA)
- Social Login

---

# 2. Authentication Principles

The authentication module follows these principles.

- JWT-based authentication
- Stateless API authentication
- Secure password hashing
- Refresh Token rotation
- Session tracking
- Role-Based Access Control (RBAC)
- Secure logout
- Audit logging
- Future-ready for 2FA

---

# 3. Authentication Flow

```
User

↓

Register

↓

Account Created

↓

Login

↓

Verify Credentials

↓

Generate Access Token

↓

Generate Refresh Token

↓

Store Refresh Token

↓

Return Tokens

↓

Access Protected APIs
```

---

# 4. Authentication Architecture

```
Client

↓

Auth API

↓

Validation

↓

Auth Controller

↓

Auth Service

↓

User Repository

↓

MongoDB
```

---

# 5. Authentication Module Structure

```
modules/

auth/

auth.controller.ts

auth.service.ts

auth.repository.ts

auth.routes.ts

auth.validation.ts

auth.middleware.ts

auth.types.ts

auth.dto.ts

jwt.service.ts

password.service.ts

refresh-token.service.ts
```

---

# 6. User Registration

## Endpoint

```
POST /api/v1/auth/register
```

---

## Required Fields

```
fullName

username

phoneNumber

password

confirmPassword
```

Optional

```
email

referrerId
```

---

## Validation Rules

### Username

- Required
- Unique
- 4–30 characters
- Letters
- Numbers
- Underscore

---

### Phone Number

- Required
- Unique
- Bangladesh format
- Numbers only

---

### Password

Minimum requirements:

- 8 characters
- One uppercase letter
- One lowercase letter
- One number
- One special character

Password rules are loaded from the **Security Settings**.

---

### Referrer ID

Optional.

If provided:

- Must exist.
- Must belong to an active user.
- MLM placement rules are validated.

---

# 7. Registration Process

```
Receive Request

↓

Validate Input

↓

Check Username

↓

Check Phone Number

↓

Load Security Settings

↓

Hash Password

↓

Generate Referral ID

↓

Create User

↓

Create Wallet

↓

Create Referral Tree

↓

Generate Audit Log

↓

Return Success
```

---

# 8. Referral ID Generation

Each user receives a unique referral ID.

Example:

```
REF100001

REF100002

REF100003
```

Requirements:

- Unique
- Immutable
- Used throughout MLM

---

# 9. Password Security

Passwords are hashed using:

```
bcrypt
```

Configuration:

```
Salt Rounds = 12
```

This value should be configurable through **Security Settings**.

Passwords are never stored in plain text.

---

# 10. User Login

## Endpoint

```
POST /api/v1/auth/login
```

Users may login using:

- Username
- Phone Number
- Email

---

## Request

```json
{
  "login": "john123",
  "password": "Password123!"
}
```

---

## Login Process

```
Receive Request

↓

Validate Input

↓

Find User

↓

Check Account Status

↓

Verify Password

↓

Load Security Settings

↓

Generate Access Token

↓

Generate Refresh Token

↓

Store Refresh Token

↓

Create Session

↓

Update Last Login

↓

Audit Log

↓

Return Tokens
```

---

# 11. JWT Authentication

Authentication uses:

```
JWT Access Token

JWT Refresh Token
```

---

## Access Token

Purpose:

- API Authentication

Expiration:

Loaded from:

```
Security Settings

JWT Expiration Time
```

Example:

```
15 Minutes
```

---

## Refresh Token

Purpose:

Generate new Access Tokens.

Example expiration:

```
30 Days
```

Stored securely inside:

```
RefreshTokens Collection
```

---

# 12. JWT Payload

```json
{
  "userId": "...",
  "role": "USER",
  "username": "john123"
}
```

Never include:

- Password
- Wallet Balance
- Financial Data

---

# 13. Refresh Token Flow

```
Access Token Expired

↓

POST /auth/refresh

↓

Validate Refresh Token

↓

Generate New Access Token

↓

Rotate Refresh Token

↓

Return New Tokens
```

---

# 14. Logout

## Endpoint

```
POST /api/v1/auth/logout
```

Process:

```
Validate Token

↓

Delete Refresh Token

↓

Delete Session

↓

Audit Log

↓

Success
```

---

# 15. Session Management

Every successful login creates a session.

Stored information:

```
User ID

Browser

Device

Operating System

IP Address

Login Time

Last Activity

Expires At
```

Sessions are stored in:

```
Sessions Collection
```

---

# 16. Remember Me

Optional.

If enabled:

- Longer Refresh Token
- Extended Session Lifetime

Duration comes from **Security Settings**.

---

# 17. Authentication Middleware

Every protected endpoint uses:

```
authenticate()
```

Responsibilities:

- Verify JWT
- Check expiration
- Load user
- Attach user to request

---

# 18. Authorization Middleware

Uses Role-Based Access Control.

Example:

```
authorize(

ADMIN,

SUPER_ADMIN

)
```

Supported Roles:

```
USER

ADMIN

SUPER_ADMIN
```

---

# 19. Route Protection

Public Routes

```
Register

Login

Refresh Token

Homepage

Public Settings
```

Protected Routes

```
Wallet

Deposits

Withdrawals

Portfolio

Notifications

MLM
```

Admin Routes

```
Users

Reports

Settings

Stocks

Audit Logs
```

---

# 20. Password Change

Endpoint

```
PUT /api/v1/auth/change-password
```

Process

```
Validate Current Password

↓

Load Security Settings

↓

Validate New Password

↓

Hash Password

↓

Save

↓

Revoke Existing Sessions

↓

Audit Log
```

---

# 21. Forgot Password

## Endpoints

```
POST /api/v1/auth/forgot-password

POST /api/v1/auth/reset-password
```

Flow

```
Forgot Password (email)

↓

Generate Reset Token

↓

Store Token Hash

↓

Deliver Reset Link (email delivery is stubbed - no notification module yet)

↓

Reset Password (token + new password)

↓

Invalidate All Sessions

↓

Audit Log
```

`POST /auth/forgot-password` always returns the same generic success message regardless of
whether the email matches an account, so the endpoint cannot be used to enumerate registered
emails. A raw, high-entropy token (not an OTP) is generated, hashed, and stored with an
expiration loaded from **Security Settings** (`passwordResetTokenExpirationMinutes`).
The raw token is never returned by the API or persisted in plain text.

`POST /auth/reset-password` validates the token against its stored hash, rejects it if expired
or already used, updates the password, marks the token used, and invalidates every existing
session for that user (docs/07-authentication.md #20's "Revoke Existing Sessions" behavior).

---

# 22. Account Status

Supported statuses:

```
Active

Inactive

Suspended

Blocked
```

Blocked users cannot authenticate.

---

# 23. Failed Login Protection

Loaded from:

```
Security Settings
```

Example:

```
Maximum Login Attempts

5
```

Process

```
5 Failed Attempts

↓

Temporary Lock

↓

Unlock After Timeout
```

---

# 24. Password Policy

Loaded dynamically from:

```
Security Settings
```

Example:

```
Minimum Length

Require Uppercase

Require Lowercase

Require Numbers

Require Symbols
```

Administrators may change the policy without code deployment.

---

# 25. Session Timeout

Loaded from:

```
Security Settings
```

Example:

```
30 Minutes

60 Minutes

120 Minutes
```

Inactive sessions expire automatically.

---

# 26. Security Headers

Backend should use:

- Helmet
- CORS
- Secure Cookies (if applicable)
- HTTPS
- Rate Limiting

---

# 27. Rate Limiting

Authentication endpoints should be rate limited.

Example:

```
10 Requests

Per Minute

Per IP
```

Configured in the backend.

---

# 28. Audit Logging

The following events create Audit Logs.

- Registration
- Login
- Logout
- Password Change
- Failed Login
- Account Lock
- Refresh Token Rotation
- Session Revocation

Audit logs are immutable.

---

# 29. Future Authentication Features

Future versions may support:

- Email Verification
- SMS Verification
- Google Login
- Apple Login
- Facebook Login
- GitHub Login
- Two-Factor Authentication
- OTP Login
- Magic Links
- Biometric Authentication (Mobile)

---

# 30. Development Rules

The following rules are mandatory.

- Passwords must always be hashed using bcrypt.
- JWT expiration is loaded from the Settings Service.
- Password policy is loaded from the Settings Service.
- Login attempt limits are loaded from the Settings Service.
- Session timeout is loaded from the Settings Service.
- Every login creates a Session record.
- Every refresh token is stored securely.
- Refresh tokens should be rotated after use.
- Sensitive authentication events create Audit Logs.
- Controllers must never contain authentication logic.
- Authentication logic belongs exclusively in the Auth Service.
- Authorization is handled by dedicated middleware.
- Never expose sensitive user information in JWT payloads.
- Never trust client-side authentication data.
- All authentication APIs must use HTTPS in production.
- The authentication module should be designed for future 2FA and social login integration without major architectural changes.
