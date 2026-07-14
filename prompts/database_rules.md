# Claude Code - Database Rules

## Purpose

These rules define the database architecture, schema design principles, indexing strategy, transaction handling, and data integrity requirements for the **Stock Investment, Trading & MLM Platform**.

The database is the foundation of the platform. It must remain:

- Scalable
- Secure
- Performant
- Consistent
- Maintainable
- Extensible

The platform uses:

- MongoDB Atlas
- Mongoose
- TypeScript

---

# 1. Database Principles

Always follow these principles:

- Normalize where appropriate
- Denormalize only when justified
- Maintain data integrity
- Avoid duplicated data
- Use indexes wisely
- Keep documents focused
- Prefer references over embedding for large datasets

---

# 2. Database Architecture

```
Application

↓

Services

↓

Mongoose Models

↓

MongoDB Atlas
```

The database should never be accessed directly from controllers.

---

# 3. Collections

The platform should contain the following primary collections.

```
users

wallets

transactions

deposits

withdrawals

stocks

portfolios

portfolioTransactions

mlmNodes

mlmCommissions

notifications

settings

auditLogs

sessions

refreshTokens (optional)

marketHistory

systemLogs (future)
```

Each collection should represent a single business entity.

---

# 4. Collection Naming

Use:

```
camelCase
```

Examples

```
auditLogs

portfolioTransactions

mlmCommissions
```

Avoid inconsistent naming.

---

# 5. Document IDs

Use MongoDB ObjectId for all primary keys.

Never expose internal ObjectIds to users when a public identifier is more appropriate.

Examples

```
DEP-20260712-000001

TRX-20260712-000145

WD-20260712-000024
```

---

# 6. Base Schema Fields

Every collection should include:

```ts
createdAt;

updatedAt;
```

Most business collections should also include:

```ts
createdBy;

updatedBy;
```

Administrative resources should additionally support:

```ts
isDeleted;

deletedAt;

deletedBy;
```

where soft deletion is required.

---

# 7. Schema Design

Schemas should contain only:

- Field definitions
- Validation
- Indexes
- Virtuals
- Lightweight middleware

Never place business logic inside schemas.

---

# 8. Relationships

Use references between collections.

Example

```
Wallet

↓

User
```

```
Deposit

↓

User

↓

Wallet
```

```
Portfolio

↓

User

↓

Stock
```

Avoid deeply nested documents.

---

# 9. Settings Collection

The platform uses a centralized Settings collection.

Every configurable business rule must be stored here.

Examples

- Currency
- Deposit
- Withdrawal
- Trading
- Stock
- MLM
- Notifications
- Homepage
- Security
- Platform

Never hardcode configuration values in the database schema or application.

---

# 10. Indexing Strategy

Create indexes for:

- Email
- Username
- Phone
- Referral Code
- Transaction Number
- Deposit Number
- Withdrawal Number
- User ID
- Wallet ID
- Stock Symbol
- Status
- Created Date

Compound indexes should be used for common query patterns.

Example

```
userId + createdAt

status + createdAt

userId + status
```

---

# 11. Unique Constraints

The following fields should be unique.

- Email
- Username
- Phone
- Referral Code
- Transaction Number
- Deposit Number
- Withdrawal Number
- Stock Symbol

Enforce uniqueness at the database level.

---

# 12. Transactions

Every financial operation must use MongoDB transactions.

Required for

- Deposit Approval
- Withdrawal Approval
- Wallet Adjustments
- Stock Purchases
- Stock Sales
- MLM Commissions

No partial updates are allowed.

---

# 13. Wallet Integrity

Wallet balances should never be edited directly.

Allowed updates only through:

```
WalletService
```

Every balance change must create:

- Transaction record
- Audit log (if administrative)

Wallet balances must never become negative.

---

# 14. Data Integrity

Maintain referential consistency.

Examples

Deposit

```
User Exists

Wallet Exists
```

Portfolio

```
User Exists

Stock Exists
```

MLM

```
Sponsor Exists

Referral Exists
```

---

# 15. Soft Deletes

Use soft deletes for:

- Users
- Stocks
- Notifications
- Homepage Content
- Platform Settings History (optional)

Fields

```ts
isDeleted;

deletedAt;

deletedBy;
```

Financial records must **never** be soft deleted.

---

# 16. Immutable Records

The following collections should be immutable after creation.

- Transactions
- MLM Commissions
- Deposit History
- Withdrawal History
- Audit Logs

Status updates are allowed where applicable, but historical financial values must never change.

---

# 17. Audit Logs

Administrative operations should generate audit log entries.

Examples

- User Suspension
- Deposit Approval
- Withdrawal Approval
- Wallet Adjustment
- Settings Update
- Stock Update

Audit logs should never be modified or deleted.

---

# 18. Data Validation

Use Mongoose validation for:

- Required fields
- Enums
- Number ranges
- References
- String lengths

Business rule validation belongs in the service layer.

---

# 19. Enums

Use enums for fixed values.

Examples

User Role

```
USER

ADMIN

SUPER_ADMIN
```

Deposit Status

```
PENDING

APPROVED

REJECTED
```

Trading Status

```
OPEN

CLOSED

AUTO_SOLD
```

Avoid storing arbitrary strings.

---

# 20. Decimal Values

Financial values should use Decimal128 where high precision is required, or store monetary values consistently using a fixed precision strategy agreed across the application.

Never use floating-point calculations for business logic without consistent rounding rules.

---

# 21. Currency

Store monetary values in the platform's base currency strategy.

Currency conversion must use exchange rates from the Settings Service.

Never duplicate exchange rate values across collections.

---

# 22. Query Performance

Always:

- Project only required fields
- Paginate large datasets
- Filter on indexed fields
- Sort using indexes where possible

Avoid loading unnecessary documents.

---

# 23. Pagination

Large collections must always support pagination.

Examples

- Users
- Deposits
- Withdrawals
- Transactions
- Notifications
- Audit Logs

Cursor-based pagination may be introduced later for high-volume datasets.

---

# 24. Aggregations

Use MongoDB aggregation pipelines for:

- Dashboard statistics
- Reports
- Revenue summaries
- MLM statistics
- Portfolio analytics

Avoid performing heavy calculations in application code when aggregation is more efficient.

---

# 25. Backup Strategy

MongoDB Atlas should provide:

- Daily backups
- Weekly backups
- Monthly backups

Backups should be encrypted and tested periodically.

---

# 26. Security

Never store:

- Plaintext passwords
- API secrets
- JWT secrets
- Payment credentials

Passwords must always be hashed using bcrypt.

Sensitive fields should be excluded from default queries when appropriate.

---

# 27. Migration Strategy

Schema changes should be version-controlled.

Migration workflow

```
Deploy Code

↓

Run Migration

↓

Verify Data

↓

Application Ready
```

Never manually modify production data without a documented migration.

---

# 28. Future Scalability

Design the database to support future features.

Examples

- Redis Cache
- Queue Workers
- Event Sourcing
- Multi-Currency
- Multi-Tenant
- Multiple Wallet Types
- Mobile Applications
- White-Label Deployments

Future additions should not require redesigning existing collections.

---

# 29. Documentation

Each collection should be documented with:

- Purpose
- Fields
- Relationships
- Indexes
- Validation Rules
- Example Document

Database documentation should remain synchronized with implementation.

---

# 30. Monitoring

Monitor database health.

Key metrics

- Query Performance
- Slow Queries
- Index Usage
- Connection Count
- Storage Growth
- Replication Status
- Transaction Success Rate

Optimize based on observed metrics rather than assumptions.

---

# 31. Non-Negotiable Rules

The following rules must always be followed:

- Controllers must never access MongoDB directly.
- Every configurable business rule must be stored in the Settings collection.
- Financial operations must always use MongoDB transactions.
- Wallet balances must only be updated through the WalletService.
- Financial history records must be immutable.
- Database indexes must be created for all frequently queried fields.
- Sensitive information must never be stored in plaintext.
- Schema validation should complement, not replace, service-layer validation.
- Soft deletes should never be used for financial transaction records.
- All collections must include timestamps.
- Database schema changes must be implemented through controlled migrations.
- The database architecture should always prioritize consistency, performance, and long-term scalability.
