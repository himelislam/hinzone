# Phase 04 — Wallet & Transaction System

## Goal

Build the complete Wallet System, which serves as the financial backbone of the platform.

Every financial operation (Deposit, Withdrawal, Trading, MLM Commission, Admin Adjustment) must pass through the Wallet Service.

The Wallet System must guarantee:

- Atomic transactions
- Accurate balances
- Complete audit trails
- Immutable transaction history

This module must not implement deposits, withdrawals, trading, or MLM logic yet. It only provides the infrastructure those modules will use.

---

# Objectives

- Wallet Management
- Wallet Service
- Transaction Engine
- Transaction History
- Balance Calculation
- Wallet APIs
- Wallet Dashboard
- Transaction Filtering
- Admin Wallet Management
- Audit Logging

---

# Backend Tasks

## Wallet Module

Create

```
modules/

wallet/

├── controllers
├── services
├── routes
├── validations
├── dto
├── models
├── interfaces
├── types
└── utils
```

---

# Wallet Schema

Each user has exactly one wallet.

Fields

- User ID
- Available Balance
- Pending Balance
- Total Deposited
- Total Withdrawn
- Total Profit
- Total Investment
- Currency
- Status
- Created At
- Updated At

Indexes

- User ID

Wallet is automatically created when a new user registers.

---

# Wallet Status

Supported statuses

```
ACTIVE

LOCKED

FROZEN
```

Only ACTIVE wallets may perform financial operations.

---

# Transaction Schema

Create a dedicated transaction collection.

Fields

- Transaction Number
- Wallet ID
- User ID
- Type
- Category
- Amount
- Balance Before
- Balance After
- Currency
- Status
- Description
- Reference ID
- Metadata
- Created By
- Created At

---

# Transaction Types

Supported types

```
CREDIT

DEBIT
```

---

# Transaction Categories

Supported categories

```
DEPOSIT

WITHDRAWAL

BUY_STOCK

SELL_STOCK

MLM_BONUS

RANK_REWARD

ADMIN_ADJUSTMENT

REFUND

REVERSAL
```

Additional categories can be added later without schema redesign.

---

# Transaction Status

```
PENDING

COMPLETED

FAILED

CANCELLED
```

---

# Wallet Service

Create

```
WalletService
```

Core methods

```
createWallet()

getWallet()

getWalletByUser()

credit()

debit()

freeze()

unfreeze()

lock()

unlock()

calculateBalance()

getTransactionHistory()

getWalletSummary()
```

---

# Credit Operation

Workflow

```
Validate Wallet

↓

Validate Amount

↓

Start MongoDB Transaction

↓

Create Transaction

↓

Increase Balance

↓

Commit

↓

Return Updated Wallet
```

---

# Debit Operation

Workflow

```
Validate Wallet

↓

Check Available Balance

↓

Start MongoDB Transaction

↓

Create Transaction

↓

Decrease Balance

↓

Commit
```

Prevent negative balances.

---

# Wallet Rules

Only WalletService may modify balances.

Never allow

```
wallet.balance += amount
```

outside WalletService.

---

# Transaction Number Generator

Generate unique transaction IDs.

Example

```
TRX-20260712-000001
```

IDs should be sequential or collision-resistant.

---

# Wallet Summary

Return

- Current Balance
- Pending Balance
- Total Deposits
- Total Withdrawals
- Total Investment
- Total Profit

---

# Transaction Filtering

Support filtering by

- Date
- Type
- Category
- Amount
- Status

Sorting

- Latest
- Oldest
- Highest Amount
- Lowest Amount

---

# Pagination

Support server-side pagination.

---

# Admin Wallet APIs

Create

```
GET /api/v1/admin/wallets

GET /api/v1/admin/wallets/:id

GET /api/v1/admin/wallets/user/:userId
```

Administrative actions

```
POST /api/v1/admin/wallets/:id/adjust
```

Adjustments

- Credit
- Debit

Every adjustment requires

- Reason
- Admin authentication
- Audit log

---

# Wallet Adjustment Rules

Admin adjustments

↓

Wallet Transaction

↓

Audit Log

↓

Notification

Never silently change balances.

---

# Audit Logs

Record

- Balance Before
- Balance After
- Adjustment Reason
- Admin
- Timestamp

---

# Wallet Events

Prepare event hooks for future modules.

Examples

```
WalletCredited

WalletDebited

WalletLocked

WalletUnlocked
```

These can later integrate with queues or WebSockets.

---

# API Endpoints

User

```
GET /api/v1/wallet

GET /api/v1/wallet/summary

GET /api/v1/wallet/transactions

GET /api/v1/wallet/transactions/:id
```

Admin

```
GET /api/v1/admin/wallets

GET /api/v1/admin/wallets/:id

GET /api/v1/admin/wallets/user/:userId

POST /api/v1/admin/wallets/:id/adjust
```

---

# Frontend Tasks

## Wallet Dashboard

Display

- Available Balance
- Pending Balance
- Total Deposits
- Total Withdrawals
- Total Profit
- Total Investment

---

## Transaction History

Table columns

- Transaction ID
- Date
- Category
- Type
- Amount
- Status
- Description

Features

- Search
- Filters
- Pagination
- Export (future-ready)

---

## Wallet Components

Create reusable

```
WalletCard

BalanceCard

TransactionTable

TransactionFilter

TransactionBadge

WalletSummary

WalletStatusBadge
```

---

## React Query Hooks

Create

```
useWallet()

useWalletSummary()

useTransactions()

useWalletTransaction()
```

---

# Validation

Validate

- Positive amounts
- Existing wallet
- Valid transaction category
- Wallet status
- Sufficient balance

Reject invalid operations before database access where possible.

---

# Security

Only authenticated users can access their wallets.

Admins

↓

Can view all wallets.

Only

```
ADMIN

SUPER_ADMIN
```

may perform manual wallet adjustments.

---

# Performance

Create indexes

- Wallet ID
- User ID
- Transaction Number
- Category
- Type
- Status
- Created At

Use pagination for all transaction queries.

---

# Testing

Backend

- Wallet creation
- Credit operation
- Debit operation
- Balance calculation
- Transaction rollback
- Admin adjustment
- Validation
- Authorization

Frontend

- Wallet dashboard
- Transaction table
- Filters
- Pagination
- Error handling

---

# Deliverables

Backend

- Wallet Module
- Wallet Service
- Transaction Module
- MongoDB Transactions
- Wallet APIs
- Admin Adjustment APIs
- Audit Logging

Frontend

- Wallet Dashboard
- Transaction History
- Wallet Summary
- Wallet Components
- React Query Integration

Infrastructure

- Atomic balance updates
- Immutable transaction history
- Event hooks for future modules

---

# Exit Criteria

Before moving to Phase 05:

- Every registered user automatically has a wallet.
- Wallet balances can only be modified through WalletService.
- Credit and debit operations are atomic using MongoDB transactions.
- Every balance change creates a transaction record.
- Admin adjustments require authorization, a reason, and generate audit logs.
- Users can view wallet summaries and transaction history.
- Transaction filtering, sorting, and pagination work correctly.
- No business rules are hardcoded.
- No TypeScript or ESLint errors exist.
- Unit, integration, and transaction rollback tests pass successfully.
