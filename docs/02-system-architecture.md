# System Architecture

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 1.1

**Architecture Style:** Modular Monolithic with Database-Driven Configuration

**Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)

---

# 1. Architecture Overview

Version 1 of the platform follows a **Modular Monolithic Architecture**.

Although deployed as a single backend application, every business domain is isolated into its own module with dedicated controllers, services, repositories, models, validations, and routes.

The architecture is designed to be:

- Modular
- Scalable
- Maintainable
- Secure
- API-first
- Database-driven
- Future-ready for Microservices

One of the core architectural principles is that **no business rule is hardcoded inside the application.**

Instead, every configurable value is loaded from a centralized **Settings Collection**.

---

# 2. High-Level Architecture

```
                        Internet
                            │
                            ▼
                  React Frontend (SPA)
                     React + Vite
                            │
                    HTTPS REST API
                            │
                            ▼
                  Express.js Backend API
                            │
        ┌──────────────────────────────────────────┐
        │                                          │
        │ Authentication Module                    │
        │ User Module                              │
        │ Wallet Module                            │
        │ Deposit Module                           │
        │ Withdrawal Module                        │
        │ Stock Module                             │
        │ Portfolio Module                         │
        │ MLM Module                               │
        │ Notification Module                      │
        │ Report Module                            │
        │ Settings Module                          │
        │ Admin Module                             │
        └──────────────────────────────────────────┘
                            │
                 Settings Service (Cached)
                            │
             Memory Cache / Redis (Future)
                            │
                            ▼
                     MongoDB Database
                            │
                            ▼
                  Cloudinary File Storage
```

---

# 3. Core Architecture Principles

The platform follows the following architectural principles.

- Modular Monolith
- Service-Oriented Design
- API-First Development
- Database-Driven Configuration
- Thin Controllers
- Fat Services
- Repository Pattern
- Centralized Configuration
- Audit-First Financial Operations
- Secure by Default
- Highly Configurable Business Rules

---

# 4. Layered Architecture

Every request flows through multiple layers.

```
Presentation Layer

↓

API Layer

↓

Authentication

↓

Authorization

↓

Validation

↓

Controller

↓

Service

↓

Repository

↓

MongoDB

↓

Response Formatter

↓

Client
```

Each layer has one responsibility.

---

# 5. Frontend Architecture

The frontend is responsible only for presentation.

Responsibilities include:

- UI Rendering
- Form Validation
- API Communication
- Routing
- Authentication State
- Loading States
- Error Handling
- Responsive Design

Business logic must never exist in the frontend.

---

## Frontend Modules

```
Authentication

Dashboard

Wallet

Stocks

Portfolio

Trading

Referral

History

Notifications

Profile

Settings

Admin
```

---

# 6. Backend Architecture

The backend contains every business rule.

Responsibilities include:

- Authentication
- Authorization
- Wallet Calculations
- Financial Transactions
- Deposit Processing
- Withdrawal Processing
- Stock Investment
- Portfolio Management
- MLM Engine
- Notification Engine
- Reports
- Settings Management

---

# 7. Backend Module Structure

Each module follows the same structure.

```
module/

controller/

service/

repository/

model/

validation/

routes/

types/

utils/
```

Example

```
wallet/

wallet.controller.ts

wallet.service.ts

wallet.repository.ts

wallet.model.ts

wallet.routes.ts

wallet.validation.ts

wallet.types.ts
```

Every module should be independently maintainable.

---

# 8. Request Lifecycle

Every request follows the same lifecycle.

```
Client Request

↓

Authentication Middleware

↓

Authorization Middleware

↓

Validation Middleware

↓

Controller

↓

Service

↓

Repository

↓

MongoDB

↓

Response

↓

Client
```

Controllers never communicate directly with MongoDB.

---

# 9. Controller Layer

Controllers are responsible for:

- Receiving requests
- Validating inputs
- Calling services
- Returning standardized responses

Controllers must never contain business logic.

---

# 10. Service Layer

The Service Layer contains all business logic.

Examples:

- Wallet calculations
- Commission calculations
- Stock purchasing
- Auto Sell
- Deposit approval
- Withdrawal approval
- Rank calculation
- Notification generation

Services communicate with other services when necessary.

---

# 11. Repository Layer

Repositories are responsible for database access.

Responsibilities include:

- CRUD operations
- Aggregations
- Transactions
- Pagination
- Filtering
- Index optimization

Repositories never contain business logic.

---

# 12. Database Architecture

MongoDB is the primary database.

Collections include:

```
Users

Wallets

Transactions

Deposits

Withdrawals

Stocks

Portfolios

Notifications

ReferralTrees

Ranks

Settings

AuditLogs

Sessions

RefreshTokens
```

Relationships use MongoDB ObjectIds.

---

# 13. Configuration Management Architecture

One of the most important architectural components is the **Settings Module**.

Every configurable business rule is stored in a centralized **Settings Collection**.

The backend loads settings whenever business logic executes.

No configurable values are hardcoded.

---

## Settings Categories

The Settings collection manages:

```
General

Currency

Deposits

Withdrawals

Stocks

Trading

MLM

Notifications

Homepage

Security
```

---

## Examples of Configurable Values

Examples include:

- Exchange Rate
- Deposit Packages
- Withdrawal Waiting Period
- Company Payment Numbers
- Minimum Withdrawal
- Maximum Withdrawal
- Stock Purchase Limits
- Auto Sell Interval
- Trading Enabled
- Maintenance Mode
- Demo Balance
- MLM Commission Percentages
- Rank Requirements
- Notification Preferences
- Homepage Banner
- Platform Name
- Support Information

Every business module reads configuration through the Settings Service.

---

# 14. Settings Service

A dedicated **Settings Service** provides configuration to every business module.

Architecture:

```
Business Service

↓

Settings Service

↓

Cache

↓

MongoDB Settings Collection
```

Example:

```
DepositService

↓

SettingsService.getDepositSettings()

↓

Deposit Validation
```

No module queries the Settings collection directly.

---

# 15. Settings Cache

To minimize database reads, configuration is cached.

Version 1:

- In-Memory Cache

Future:

- Redis

Whenever an administrator updates a setting:

```
Admin Updates Setting

↓

Database Updated

↓

Cache Invalidated

↓

Cache Reloaded

↓

Changes Available Immediately
```

No application restart is required.

---

# 16. Financial Architecture

Every financial action generates permanent transaction records.

Examples:

- Deposit
- Withdrawal
- Wallet Credit
- Wallet Debit
- Stock Purchase
- Stock Sale
- Referral Commission
- Profit Bonus
- Admin Adjustment

Financial history is immutable.

Records may change status but are never deleted.

---

# 17. Business Flow Example

Example:

Buying Stock

```
Buy Stock

↓

Authenticate User

↓

Load Stock Settings

↓

Load Wallet

↓

Validate Purchase Limits

↓

Calculate Cost

↓

Deduct Wallet

↓

Create Portfolio

↓

Create Transaction

↓

Generate Notification

↓

Return Response
```

Notice that purchase limits come from the Settings Service.

---

# 18. Authentication Architecture

Authentication flow:

```
Login

↓

Credential Validation

↓

JWT Access Token

↓

Refresh Token

↓

Authenticated Requests
```

Supported Roles:

```
Guest

User

Admin

Super Admin
```

---

# 19. Authorization

Role-Based Access Control (RBAC) is implemented.

Examples:

User:

- Buy Stocks
- Deposit
- Withdraw

Admin:

- Manage Users
- Approve Deposits
- Update Settings

Super Admin:

- Full Platform Control

---

# 20. API Architecture

RESTful APIs are versioned.

Example:

```
/api/v1/auth

/api/v1/users

/api/v1/wallet

/api/v1/deposits

/api/v1/withdrawals

/api/v1/stocks

/api/v1/portfolio

/api/v1/mlm

/api/v1/history

/api/v1/settings

/api/v1/admin
```

---

# 21. Settings API

The Settings module exposes dedicated APIs.

Public:

```
GET /api/v1/settings

GET /api/v1/settings/:category
```

Admin:

```
PUT /api/v1/admin/settings/general

PUT /api/v1/admin/settings/currency

PUT /api/v1/admin/settings/deposit

PUT /api/v1/admin/settings/withdraw

PUT /api/v1/admin/settings/stocks

PUT /api/v1/admin/settings/trading

PUT /api/v1/admin/settings/mlm

PUT /api/v1/admin/settings/notifications

PUT /api/v1/admin/settings/security

PUT /api/v1/admin/settings/homepage
```

Only **Admin** and **Super Admin** can modify settings.

---

# 22. Notification Architecture

Business events generate notifications.

```
Business Event

↓

Notification Service

↓

Notification Collection

↓

User Dashboard
```

Future notification channels:

- Email
- SMS
- Push Notifications

The business logic remains unchanged regardless of delivery channel.

---

# 23. File Storage

Uploaded files are stored externally.

Examples:

- Deposit Screenshots
- Profile Pictures

Cloudinary stores files.

MongoDB stores metadata and URLs.

---

# 24. Error Handling

A centralized error handler provides standardized API responses.

```
Repository

↓

Service

↓

Controller

↓

Global Error Handler

↓

JSON Response
```

Example:

```json
{
  "success": false,
  "message": "Withdrawal amount exceeds the configured limit.",
  "errorCode": "WITHDRAW_LIMIT_EXCEEDED"
}
```

---

# 25. Logging & Audit

Critical events are permanently logged.

Examples:

- User Login
- Password Changes
- Deposit Approval
- Withdrawal Approval
- Wallet Adjustments
- Stock Price Updates
- Settings Updates
- Commission Distribution
- Rank Promotions

Audit logs cannot be deleted.

---

# 26. Scalability Strategy

The modular architecture allows future extraction into independent services.

Possible future services:

- Authentication Service
- Wallet Service
- Investment Service
- MLM Service
- Notification Service
- Reporting Service
- Settings Service

Version 1 remains a modular monolith for simpler deployment and maintenance.

---

# 27. Security Architecture

Security is enforced at every layer.

Features include:

- JWT Authentication
- Refresh Tokens
- Password Hashing (bcrypt)
- Request Validation
- Role-Based Authorization
- Rate Limiting
- Helmet Security Headers
- CORS Configuration
- Secure File Uploads
- Input Sanitization
- Audit Logging

Every financial endpoint requires authentication and authorization.

---

# 28. Development Guidelines

The architecture follows these mandatory development rules.

- Controllers must remain thin.
- Business logic belongs only in Services.
- Repositories only access the database.
- Business modules communicate through Services.
- No configurable value may be hardcoded.
- Every configurable value must be loaded through the Settings Service.
- Settings should be cached for performance.
- Financial records must never be deleted.
- Every critical action must be auditable.
- Every module should remain independent and reusable.
- Build Version 1 with future expansion in mind.
