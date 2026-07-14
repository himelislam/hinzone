# Phase 02 — Authentication & User Management

## Goal

Build the complete authentication and user management system that serves as the foundation for every secured feature in the platform.

This phase should implement secure authentication, authorization, user profiles, session management, and role-based access control (RBAC).

No wallet, deposit, trading, or MLM functionality should be implemented in this phase.

---

# Objectives

- User Registration
- User Login
- JWT Authentication
- Refresh Token Authentication
- Logout
- Password Hashing
- Forgot Password
- Reset Password
- Change Password
- Email Verification (architecture ready)
- Role-Based Access Control (RBAC)
- User Profile
- User Management
- Session Management
- Audit Logging for Authentication Events

---

# Backend Tasks

## User Module

Create the complete **User** module.

Structure

```
modules/

user/

├── controllers
├── services
├── routes
├── validations
├── types
├── interfaces
├── models
└── dto
```

---

## User Model

Implement the User schema.

Core fields

- Full Name
- Username
- Email
- Phone Number
- Password (hashed)
- Referral Code
- Sponsor ID (optional)
- Profile Image
- Role
- Status
- Email Verified
- Last Login
- Last Active
- Login Attempts
- Account Locked Until
- Created At
- Updated At

Create indexes for

- Email
- Username
- Phone
- Referral Code

---

## Roles

Implement RBAC.

Supported roles

```
USER

ADMIN

SUPER_ADMIN
```

Role middleware should protect administrative APIs.

---

## Account Status

Supported statuses

```
ACTIVE

INACTIVE

PENDING

SUSPENDED

BLOCKED
```

Suspended or blocked users must not be able to authenticate.

---

## Password Security

Use

```
bcrypt
```

Requirements

- Minimum length from Settings (future-ready)
- Strong hashing
- Never store plaintext passwords

---

## JWT Authentication

Implement

Access Token

Refresh Token

Token expiration should be configurable via the Settings Service (fallback to environment variables during initial setup).

---

## Authentication Module

Create

```
modules/auth/

├── controllers
├── services
├── routes
├── validations
├── middleware
└── dto
```

---

## Registration

Implement

```
POST /api/v1/auth/register
```

Validation

- Unique email
- Unique username
- Valid phone
- Password confirmation
- Optional referral code

If a referral code is provided, validate that the sponsor exists.

Do **not** create MLM tree logic yet.

---

## Login

Implement

```
POST /api/v1/auth/login
```

Requirements

- Email or Username
- Password
- Account Status Validation
- Update Last Login
- Generate Tokens

---

## Refresh Token

Implement

```
POST /api/v1/auth/refresh
```

Issue a new access token using a valid refresh token.

---

## Logout

Implement

```
POST /api/v1/auth/logout
```

Invalidate the refresh token/session.

---

## Forgot Password

Implement

```
POST /api/v1/auth/forgot-password
```

Generate a reset token.

Email sending can be mocked or abstracted for now.

---

## Reset Password

Implement

```
POST /api/v1/auth/reset-password
```

Requirements

- Validate reset token
- Update password
- Invalidate previous sessions

---

## Change Password

Implement

```
PATCH /api/v1/auth/change-password
```

Requirements

- Current password verification
- New password validation
- Revoke other sessions (optional, architecture ready)

---

## Current User

Implement

```
GET /api/v1/auth/me
```

Return authenticated user information.

---

## User Profile

Implement

```
GET /api/v1/users/profile

PUT /api/v1/users/profile
```

Editable fields

- Name
- Phone
- Profile Image

Restricted fields

- Role
- Wallet
- Referral Code

---

## Profile Image Upload

Use

```
Cloudinary
```

Supported

- JPG
- PNG
- WEBP

Validate file type and size.

---

## Admin User Management

Implement

```
GET /api/v1/admin/users

GET /api/v1/admin/users/:id

PATCH /api/v1/admin/users/:id

PATCH /api/v1/admin/users/:id/status

DELETE /api/v1/admin/users/:id
```

Admin capabilities

- View users
- Search users
- Filter users
- Suspend users
- Activate users
- Block users
- Reset passwords (future-ready endpoint)

---

## Search & Filtering

Support

- Name
- Email
- Username
- Phone
- Role
- Status
- Registration Date

Include pagination and sorting.

---

## Authentication Middleware

Implement reusable middleware.

- authenticate()
- authorize(...roles)
- optionalAuth()

---

## Audit Logging

Log authentication events.

Examples

- Registration
- Login
- Logout
- Password Change
- Password Reset
- Account Suspension
- Account Activation

---

# Frontend Tasks

## Authentication Pages

Create

- Login
- Register
- Forgot Password
- Reset Password

---

## Dashboard Entry

Create a basic authenticated dashboard.

Display

- Welcome message
- User profile summary
- Navigation placeholders for future modules

---

## User Profile

Create

- View Profile
- Edit Profile
- Upload Avatar
- Change Password

---

## Route Protection

Implement

- Public Routes
- Protected Routes
- Admin Routes

Unauthorized users should be redirected appropriately.

---

## Authentication State

Implement

- Login persistence
- Token refresh flow
- Logout
- Current user query

Use TanStack Query where appropriate.

---

## Forms

Use

- React Hook Form
- Zod

Provide inline validation and user-friendly error messages.

---

## UI Components

Create reusable authentication components.

- Login Form
- Registration Form
- Password Field
- Avatar Upload
- Profile Card

---

# Security Tasks

Implement

- Password hashing
- JWT validation
- Secure cookies (if applicable)
- Rate limiting for authentication routes
- Brute-force protection using login attempt tracking
- Input sanitization

---

# API Endpoints

Authentication

```
POST   /api/v1/auth/register

POST   /api/v1/auth/login

POST   /api/v1/auth/logout

POST   /api/v1/auth/refresh

POST   /api/v1/auth/forgot-password

POST   /api/v1/auth/reset-password

PATCH  /api/v1/auth/change-password

GET    /api/v1/auth/me
```

Users

```
GET    /api/v1/users/profile

PUT    /api/v1/users/profile
```

Admin

```
GET    /api/v1/admin/users

GET    /api/v1/admin/users/:id

PATCH  /api/v1/admin/users/:id

PATCH  /api/v1/admin/users/:id/status

DELETE /api/v1/admin/users/:id
```

---

# Testing

Backend

- Registration tests
- Login tests
- JWT tests
- Refresh token tests
- Password reset tests
- Authorization tests
- User CRUD tests
- Validation tests

Frontend

- Authentication flow
- Protected routes
- Form validation
- Profile updates

---

# Deliverables

Backend

- User Module
- Auth Module
- JWT Authentication
- RBAC
- User CRUD
- Authentication Middleware
- Audit Logging

Frontend

- Login Page
- Registration Page
- Forgot Password
- Reset Password
- User Profile
- Protected Routing
- Authentication State Management

Security

- Password Hashing
- JWT
- Rate Limiting
- Input Validation
- Role-Based Authorization

---

# Exit Criteria

Before moving to Phase 03:

- Users can register successfully.
- Users can log in and receive JWT tokens.
- Refresh tokens work correctly.
- Password reset flow is functional.
- Protected routes enforce authentication.
- Admin-only routes enforce RBAC.
- User profiles can be viewed and updated.
- Authentication events are logged.
- All endpoints return standardized API responses.
- No TypeScript or ESLint errors exist.
- Unit and integration tests pass.
- No wallet, financial, trading, or MLM logic has been implemented yet.
