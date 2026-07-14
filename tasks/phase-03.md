# Phase 03 — Settings System & Core Platform Configuration

## Goal

Build the centralized **Settings System**, which becomes the backbone of the entire platform.

This phase must be completed **before implementing Wallet, Deposit, Trading, MLM, or any financial module**, because every business rule throughout the platform depends on the Settings Service.

After this phase, **no configurable business rule should be hardcoded anywhere in the application.**

---

# Objectives

- Create Settings Collection
- Create Settings Service
- Create Settings Cache
- Create Settings API
- Create Admin Settings Panel
- Create Validation
- Create Default Seeder
- Create Cache Refresh Mechanism
- Create Settings Hooks
- Build Dynamic Configuration System

---

# Backend Tasks

## Settings Module

Create the complete module.

```
modules/

settings/

├── controllers
├── services
├── routes
├── validations
├── dto
├── models
├── interfaces
├── types
└── cache
```

---

# Settings Collection

Create a single Settings collection.

Each category should be stored separately.

Example

```
General

Currency

Deposit

Withdrawal

Trading

Stock

MLM

Homepage

Notification

Security
```

---

# General Settings

Fields

- Platform Name
- Platform Logo
- Platform Email
- Support Email
- Support Phone
- WhatsApp
- Terms & Conditions
- Privacy Policy
- Maintenance Mode

---

# Currency Settings

Fields

- Default Currency
- Currency Symbol
- USD → BDT
- BDT → USD
- Decimal Places

Example

```
USD

$

120

0.00833
```

---

# Deposit Settings

Fields

- Deposit Enabled
- Minimum Deposit
- Maximum Deposit
- Deposit Packages
- Payment Methods
- Company bKash
- Company Nagad
- Deposit Instructions

Deposit Packages

```
3000

6000

12000
```

Admin must be able to

- Add package
- Delete package
- Edit package

without code changes.

---

# Withdrawal Settings

Fields

- Withdrawal Enabled
- Minimum Withdrawal
- Maximum Withdrawal
- Waiting Period
- Processing Time
- Withdrawal Fee
- Payment Methods

---

# Trading Settings

Fields

- Trading Enabled
- Maintenance Mode
- Demo Trading Enabled
- Demo Balance

---

# Stock Settings

Fields

- Stock Enabled
- Auto Sell Enabled
- Minimum Purchase
- Maximum Purchase
- Fractional Shares
- Price Update Mode
- Auto Sell Interval

---

# MLM Settings

## Referral Structure

Fields

- Maximum Direct Referrals

---

## Commission Structure

Level 1

Packages

Commission

Level 2

Packages

Commission

Admin should edit

- package
- percentage
- add/remove package

---

## Rank Structure

Each rank

Fields

- Name
- Left Team
- Right Team
- Total Team
- Reward Percentage

---

# Homepage Settings

Fields

- Banner Images
- Announcement
- Promotional Text
- Market News
- Maintenance Notice

---

# Notification Settings

Fields

- Deposit Notifications
- Withdrawal Notifications
- MLM Notifications
- Trading Notifications
- Push
- Email
- SMS

---

# Security Settings

Fields

- JWT Expiration
- Refresh Expiration
- Password Policy
- Session Timeout
- Login Attempts
- Two Factor Enabled

---

# Settings Service

Create

```
SettingsService
```

Public methods

```
getGeneral()

getCurrency()

getDeposit()

getWithdrawal()

getTrading()

getStock()

getMLM()

getHomepage()

getNotification()

getSecurity()

updateGeneral()

updateDeposit()

...
```

All modules in the project must use this service.

---

# Settings Cache

Implement memory cache.

Startup

```
MongoDB

↓

Settings

↓

Memory

↓

Application Ready
```

---

When settings update

```
Admin

↓

Update DB

↓

Refresh Cache

↓

Immediately Available
```

Never restart the server.

---

# Default Seeder

Create

```
seedSettings.ts
```

Populate default settings.

If Settings already exist

Skip.

---

# Settings Validation

Validate every category using Zod.

Examples

Deposit

```
minimumDeposit

maximumDeposit

packages
```

Trading

```
demoBalance

enabled

maintenance
```

---

# Settings Middleware

Create middleware for

```
loadSettings()

refreshSettings()

```

---

# API Endpoints

Public

```
GET /api/v1/settings

GET /api/v1/settings/general

GET /api/v1/settings/currency

GET /api/v1/settings/deposit

GET /api/v1/settings/withdrawal

GET /api/v1/settings/trading

GET /api/v1/settings/stocks

GET /api/v1/settings/mlm

GET /api/v1/settings/security

GET /api/v1/settings/homepage

GET /api/v1/settings/notification
```

---

Admin

```
PUT /api/v1/admin/settings/general

PUT /api/v1/admin/settings/currency

PUT /api/v1/admin/settings/deposit

PUT /api/v1/admin/settings/withdrawal

PUT /api/v1/admin/settings/trading

PUT /api/v1/admin/settings/stocks

PUT /api/v1/admin/settings/mlm

PUT /api/v1/admin/settings/security

PUT /api/v1/admin/settings/homepage

PUT /api/v1/admin/settings/notification
```

Only

```
ADMIN

SUPER_ADMIN
```

may update settings.

---

# Audit Logs

Log every settings update.

Include

- Previous Value
- New Value
- Updated By
- Timestamp
- Category

---

# Frontend Tasks

## Settings Pages

Create

```
General

Currency

Deposit

Withdrawal

Trading

Stocks

MLM

Homepage

Notification

Security
```

---

# Admin Dashboard

Settings should appear under

```
Administration

↓

Settings
```

---

# Forms

Every category should have

- Validation
- Save Button
- Reset Button
- Loading State
- Success Toast
- Error Toast

---

# Components

Create reusable

```
SettingsCard

SettingsSection

SettingsForm

PackageTable

CommissionTable

RankTable

CurrencyInput

ToggleSwitch
```

---

# React Query

Create hooks

```
useSettings()

useGeneralSettings()

useDepositSettings()

useTradingSettings()

useUpdateSettings()
```

---

# Security

Only Admins

may access

```
/admin/settings
```

Unauthorized users

↓

403

---

# Testing

Backend

- Settings CRUD
- Cache Refresh
- Seeder
- Validation
- Authorization

Frontend

- Settings Forms
- API Integration
- Validation
- UI Rendering

---

# Deliverables

Backend

- Settings Module
- Settings Service
- Settings Cache
- Seeder
- CRUD APIs
- Validation
- Audit Logging

Frontend

- Settings Dashboard
- Settings Forms
- React Query Hooks
- Validation
- Responsive UI

Infrastructure

- Cache Refresh
- Dynamic Configuration
- Zero Hardcoded Business Rules

---

# Exit Criteria

Before moving to Phase 04:

- Every settings category is stored in MongoDB.
- Default settings are automatically seeded.
- Settings are cached in memory.
- Updating a setting refreshes the cache immediately.
- All APIs are secured with RBAC.
- Admin can edit every configuration through the UI.
- Audit logs record every settings change.
- No configurable business rule is hardcoded anywhere in the project.
- All modules are prepared to consume the Settings Service in future phases.
- No TypeScript or ESLint errors remain.
- Unit and integration tests pass successfully.
