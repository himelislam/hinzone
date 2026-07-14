# Claude Code Project Rules

## Project Overview

You are building a **production-ready Stock Investment, Trading & MLM Platform** using the MERN Stack.

This is **NOT** a demo project.

Everything must be production-quality, scalable, maintainable, and enterprise-ready.

The goal is to build software that could realistically be deployed for thousands of users.

---

# Tech Stack

Frontend

- React 19
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- React Query (TanStack Query)
- React Hook Form
- Zod
- Axios
- Recharts
- Lucide Icons

Backend

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT
- Bcrypt
- Multer
- Cloudinary
- Winston
- Docker

Database

- MongoDB Atlas

Future

- Redis
- BullMQ
- Socket.io

---

# Architecture Rules

Always follow:

- Clean Architecture
- Feature-based architecture
- SOLID Principles
- DRY
- KISS
- Separation of Concerns

Controllers should be very small.

Business logic belongs inside Services.

Database access belongs inside Repositories (or Services if repository pattern is unnecessary).

Never place business logic inside:

- Controllers
- Routes
- React Components

---

# Settings System

This project is completely configuration driven.

No business rule may ever be hardcoded.

Everything must come from the Settings Collection.

Examples

❌ Bad

```ts
const MIN_DEPOSIT = 3000;
```

✅ Good

```ts
const settings = await SettingsService.getDepositSettings();

const minDeposit = settings.minimumDeposit;
```

The following must always come from Settings:

- Deposit Packages
- Withdrawal Limits
- Waiting Periods
- Exchange Rates
- Trading Enabled
- Auto Sell
- Commission Percentages
- MLM Levels
- Rank Requirements
- Maintenance Mode
- Notification Settings
- Security Policies

---

# Wallet Rules

Every user has exactly one wallet.

Wallet balances must never be manually edited.

All wallet updates happen through WalletService.

Allowed operations

- Deposit
- Withdrawal
- Buy Stock
- Sell Stock
- MLM Bonus
- Admin Adjustment

Every balance change creates a Transaction.

---

# Financial Rules

Every financial operation must use MongoDB Transactions.

Examples

- Deposit Approval
- Withdrawal Approval
- Stock Purchase
- Stock Sale
- MLM Commission

Never allow partial updates.

---

# Business Logic Rules

Business rules belong only in Services.

Example

```
DepositService

↓

WalletService

↓

TransactionService
```

Never inside controllers.

---

# Validation Rules

Frontend

React Hook Form

-

Zod

Backend

Zod

or

Joi

Never trust frontend validation.

Everything must be validated again on the backend.

---

# Authentication

Use

JWT

-

Refresh Token

Passwords

- bcrypt
- never plaintext

RBAC

Roles

- USER
- ADMIN
- SUPER_ADMIN

---

# API Rules

Always use

```
/api/v1/
```

Standard responses

Success

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Error

```json
{
  "success": false,
  "message": "...",
  "errors": []
}
```

---

# Error Handling

Use one Global Error Handler.

Never expose:

- stack traces
- database errors
- internal implementation

Always log unexpected exceptions.

---

# Logging

Use Winston.

Log

- Errors
- Startup
- Shutdown
- Authentication
- Financial Events

Never log

- Passwords
- JWT
- Secrets

---

# File Uploads

Images only.

Use

Cloudinary

Never store uploads locally in production.

---

# Database Rules

Use MongoDB Atlas.

Collections

- Users
- Wallets
- Transactions
- Deposits
- Withdrawals
- Stocks
- Portfolios
- MLM
- Notifications
- Settings
- AuditLogs

Always use indexes.

---

# Admin Rules

Only

ADMIN

SUPER_ADMIN

can

- Approve Deposits
- Approve Withdrawals
- Edit Settings
- Modify Wallets
- Manage Stocks

Every action creates an Audit Log.

---

# Settings Cache

Settings must be cached.

Workflow

Application Starts

↓

Load Settings

↓

Cache

↓

Serve Requests

When settings update

↓

Refresh Cache

↓

Immediately Apply

---

# UI Rules

Use

shadcn/ui

Never build duplicate components.

Use reusable components.

Support

- Loading
- Error
- Empty State

Every page must be responsive.

---

# Naming Rules

Use

PascalCase

for

- Components
- Interfaces
- Classes

camelCase

for

- Variables
- Functions

UPPER_CASE

for

Environment Variables

---

# Folder Rules

Never create random folders.

Always follow the documented folder structure.

Group code by feature.

---

# Code Quality

Always

- TypeScript
- Strict Mode
- ESLint
- Prettier

Avoid

- any
- duplicated code
- magic numbers
- deeply nested logic

---

# Security Rules

Use

- Helmet
- Rate Limiting
- Input Sanitization
- HTTPS
- RBAC

Never trust client input.

---

# Testing Rules

Every Service

↓

Unit Tests

Every API

↓

Integration Tests

Critical User Flows

↓

E2E Tests

---

# Performance Rules

Use

- Pagination
- Lazy Loading
- React Query
- Settings Cache

Avoid unnecessary database queries.

---

# Documentation

Every new module should include

- README
- API documentation
- Types
- Validation
- Tests

---

# Development Workflow

Whenever implementing a feature:

1. Read the documentation first.
2. Create the database model.
3. Create validation schema.
4. Create repository/service.
5. Create controller.
6. Create routes.
7. Add authentication.
8. Add authorization.
9. Add tests.
10. Update documentation.

Never skip steps.

---

# Important

Assume every feature will eventually support:

- Redis
- Queue Workers
- WebSockets
- Mobile Apps
- Microservices

Design code so future expansion requires minimal changes.

---

# Final Rule

When unsure about implementation:

- Prefer scalability over shortcuts.
- Prefer readability over cleverness.
- Prefer reusable architecture over quick fixes.
- Never hardcode configurable values.
- Always follow the project documentation before generating code.
