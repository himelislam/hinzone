# Settings System

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 2.0

---

# 1. Overview

The Settings System is one of the most critical components of the platform.

Instead of hardcoding business rules throughout the backend, every configurable value is stored inside a centralized **Settings Collection** in MongoDB.

Every module retrieves its configuration through the **Settings Service**, making the platform fully dynamic and allowing administrators to change business behavior without modifying source code or restarting the server.

The Settings System serves as the **Single Source of Truth (SSOT)** for all platform-wide configuration.

---

# 2. Objectives

The Settings System is responsible for:

- Centralized platform configuration
- Dynamic business rules
- Runtime configuration updates
- Cache management
- Configuration validation
- Secure administration
- Future scalability

---

# 3. Design Principles

The Settings System follows these principles:

- No hardcoded business rules
- Configuration-driven architecture
- Single source of truth
- Runtime updates
- Immediate effect after saving
- Secure administration
- Extensible structure

---

# 4. Architecture

```
Admin Panel

↓

Settings API

↓

Settings Controller

↓

Settings Service

↓

Settings Cache

↓

MongoDB
```

Every module loads configuration from the Settings Service instead of directly querying MongoDB.

---

# 5. Settings Flow

```
Application Request

↓

Business Service

↓

Settings Service

↓

Check Cache

↓

Cache Exists?

↓

YES → Return Cached Settings

↓

NO

↓

Load From MongoDB

↓

Cache Settings

↓

Return Configuration
```

---

# 6. Settings Categories

The Settings Collection stores multiple configuration sections.

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

Each category is independently editable.

---

# 7. Settings Document Structure

Example

```json
{
  "_id": "...",
  "category": "deposit",
  "data": {
    "enabled": true,
    "minimumDeposit": 3000,
    "maximumDeposit": 100000,
    "packages": [
      {
        "amount": 3000
      },
      {
        "amount": 6000
      }
    ]
  },
  "updatedBy": "...",
  "updatedAt": "..."
}
```

Each category is stored separately for easier maintenance.

---

# 8. General Settings

Fields

- Platform Name
- Platform Logo
- Platform Email
- Support Email
- Support Phone
- WhatsApp Number
- Maintenance Mode
- Terms & Conditions
- Privacy Policy

---

# 9. Currency Settings

Fields

- Default Currency
- Currency Symbol
- USD → BDT Rate
- BDT → USD Rate
- Decimal Precision

Example

```
120 BDT

=

1 USD
```

Every financial calculation uses these values.

---

# 10. Deposit Settings

Fields

- Deposits Enabled
- Deposit Packages
- Minimum Deposit
- Maximum Deposit
- Payment Methods
- Company bKash Number
- Company Nagad Number
- Deposit Instructions

Administrators may:

- Add Packages
- Remove Packages
- Change Package Amounts

without code changes.

---

# 11. Withdrawal Settings

Fields

- Withdrawals Enabled
- Minimum Withdrawal
- Maximum Withdrawal
- Waiting Period
- Withdrawal Fee
- Processing Time
- Payment Methods

Waiting period example

```
15 Days
```

---

# 12. Stock Settings

Fields

- Stock Trading Enabled
- Auto Sell Enabled
- Minimum Purchase
- Maximum Purchase
- Fractional Shares
- Price Update Mode
- Auto Sell Interval

---

# 13. Trading Settings

Fields

- Trading Enabled
- Maintenance Mode
- Demo Trading Enabled
- Demo Balance
- Market Open Time
- Market Close Time

Example

```json
{
  "enabled": true,
  "maintenanceMode": false,
  "demoBalance": 1000
}
```

---

# 14. MLM Settings

Contains:

- Maximum Direct Referrals
- Deposit Packages
- Commission Structure
- Rank Configuration

Example

```
Maximum Direct Referrals

2
```

---

# 15. Commission Settings

Example

Level 1

| Deposit | Commission |
| ------- | ---------: |
| 3000    |         5% |
| 6000    |         7% |
| 12000   |        10% |

Level 2

| Deposit | Commission |
| ------- | ---------: |
| 3000    |         2% |
| 6000    |         4% |
| 12000   |         6% |

Administrators may:

- Change percentages
- Add levels
- Remove levels
- Modify packages

---

# 16. Rank Settings

Example

```
Branch

2 Direct Referrals

Reward 3%
```

```
Silver

8 Left

8 Right

Reward 5%
```

```
Gold

32 Left

32 Right

Reward 7%
```

```
Diamond

150 Total Users

Reward 10%
```

Administrators can edit every requirement.

---

# 17. Notification Settings

Fields

- Enable Notifications
- Deposit Notifications
- Withdrawal Notifications
- Trading Notifications
- MLM Notifications
- Push Notifications
- Email Notifications
- SMS Notifications

---

# 18. Homepage Settings

Fields

- Banner Images
- Promotional Text
- Announcements
- Market News
- Maintenance Notice

---

# 19. Security Settings

Fields

- JWT Expiration
- Refresh Token Expiration
- Password Policy
- Maximum Login Attempts
- Session Timeout
- Two-Factor Authentication

---

# 20. Admin Settings Page

The Admin Panel contains one centralized Settings module.

Navigation

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

Every section uses dynamic forms.

---

# 21. API Endpoints

Public

```
GET /api/v1/settings

GET /api/v1/settings/:category
```

Admin

```
PUT /api/v1/admin/settings/general

PUT /api/v1/admin/settings/currency

PUT /api/v1/admin/settings/deposit

PUT /api/v1/admin/settings/withdrawal

PUT /api/v1/admin/settings/stocks

PUT /api/v1/admin/settings/trading

PUT /api/v1/admin/settings/mlm

PUT /api/v1/admin/settings/notifications

PUT /api/v1/admin/settings/security

PUT /api/v1/admin/settings/homepage
```

Only **Admin** and **Super Admin** users may update settings.

---

# 22. Validation

Every settings update must be validated.

Examples

Deposit

```
Minimum

≤

Maximum
```

Withdrawal

```
Waiting Period

≥

0
```

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

---

# 23. Cache System

The Settings Service maintains an in-memory cache.

Workflow

```
Application Starts

↓

Load Settings

↓

Cache Memory

↓

Serve Requests
```

---

# 24. Cache Refresh

Whenever an administrator updates settings:

```
Save Settings

↓

Update MongoDB

↓

Refresh Cache

↓

Return Success
```

The new values become active immediately.

---

# 25. Business Rule Integration

Every module retrieves configuration from the Settings Service.

Examples

Wallet

```
Currency Settings
```

Deposits

```
Deposit Settings
```

Withdrawals

```
Withdrawal Settings
```

Trading

```
Trading Settings
```

MLM

```
Commission Settings

↓

Rank Settings
```

Notifications

```
Notification Settings
```

---

# 26. Settings Service Responsibilities

The Settings Service is responsible for:

- Loading settings
- Caching settings
- Refreshing cache
- Validation
- Returning typed configuration
- Preventing duplicate queries

No controller or business service should query the Settings collection directly.

---

# 27. Audit Logging

Every settings update creates an Audit Log.

Audit fields

- Administrator
- Category
- Previous Value
- New Value
- Timestamp
- IP Address

Settings history must remain traceable.

---

# 28. Security

Settings updates require:

- JWT Authentication
- Admin Role
- Server-side Validation
- Audit Logging

Unauthorized users cannot access update endpoints.

---

# 29. Performance

The Settings System should:

- Cache all categories
- Avoid repeated database reads
- Load settings once during startup
- Refresh cache only when changes occur
- Return configuration in constant time

---

# 30. Future Features

Future enhancements may include:

- Redis Cache
- Versioned Settings
- Rollback Support
- Environment Overrides
- Feature Flags
- A/B Testing Configuration
- Scheduled Configuration Changes
- Configuration Import/Export
- Settings Backup
- Multi-Tenant Settings

The architecture should support these features without major redesign.

---

# 31. Development Rules

The following rules are mandatory.

- The Settings Collection is the single source of truth for all configurable platform behavior.
- No exchange rates, commission percentages, limits, waiting periods, package values, or rank requirements may be hardcoded.
- Every business module must retrieve configuration through the Settings Service.
- The Settings Service must cache configuration for performance.
- Cache must refresh immediately after a settings update.
- Controllers must never access the Settings collection directly.
- Every settings update must be validated before persistence.
- Every settings update must generate an immutable Audit Log.
- Only Admin and Super Admin users may modify settings.
- The Settings System must remain modular so new configuration categories can be added without changing existing architecture.
- The platform must continue operating correctly even as business rules evolve through administrator-controlled configuration.
