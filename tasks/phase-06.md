# Phase 06 — Withdrawal Management System

## Goal

Build the complete Withdrawal Module that allows users to securely withdraw funds from their wallets after satisfying all configurable business rules.

The withdrawal system must be fully driven by the **Settings Service**. No withdrawal limits, waiting periods, fees, or payment methods should be hardcoded.

Every approved withdrawal must debit the user's wallet through the **WalletService** using MongoDB transactions.

---

# Objectives

- Withdrawal Request System
- Withdrawal Validation
- Waiting Period Validation
- Withdrawal Fee Calculation
- Admin Approval Workflow
- Wallet Debit Integration
- Transaction Integration
- Notification Integration
- Audit Logging
- Dynamic Configuration

---

# Backend Tasks

## Withdrawal Module

Create

```
modules/

withdrawal/

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

# Withdrawal Schema

Fields

- Withdrawal Number
- User ID
- Wallet ID
- Amount
- Withdrawal Fee
- Net Amount
- Currency
- Payment Method
- Receiver Account Number
- Account Holder Name
- Status
- Admin Note
- Rejection Reason
- Approved By
- Approved At
- Processed At
- Created At
- Updated At

---

# Withdrawal Status

Supported statuses

```
PENDING

APPROVED

PROCESSING

COMPLETED

REJECTED

CANCELLED
```

Only approved withdrawals should debit the wallet.

---

# Withdrawal Number Generator

Generate unique IDs.

Example

```
WD-20260712-000001
```

---

# Settings Integration

Load all withdrawal rules from the Settings Service.

Required settings

- Withdrawals Enabled
- Minimum Withdrawal
- Maximum Withdrawal
- Waiting Period
- Processing Time
- Withdrawal Fee
- Accepted Payment Methods

Never hardcode any of these values.

---

# Withdrawal Validation

Before creating a withdrawal request

Validate

- Withdrawals Enabled
- Wallet Exists
- Wallet Status
- Sufficient Balance
- Minimum Withdrawal
- Maximum Withdrawal
- Waiting Period
- Accepted Payment Method

Reject invalid requests immediately.

---

# Waiting Period Validation

The waiting period should be determined dynamically.

Example

```
Withdrawal Waiting Period

15 Days
```

The service should calculate eligibility using:

```
Current Date

↓

Latest Eligible Deposit

↓

Configured Waiting Period

↓

Withdrawal Allowed?
```

This value must always come from the Settings Service.

---

# Withdrawal Fee Calculation

Load fee configuration.

Example

```
Fee

2%
```

or

```
100 BDT
```

The system should support

- Percentage Fee
- Fixed Fee
- No Fee

Future-proof the implementation.

---

# Create Withdrawal Request

Workflow

```
User

↓

Validate Settings

↓

Validate Wallet

↓

Validate Waiting Period

↓

Calculate Fee

↓

Create Withdrawal

↓

Status = PENDING

↓

Notify Admin
```

Wallet balance remains unchanged.

---

# Withdrawal Approval Workflow

Workflow

```
Admin

↓

Review Withdrawal

↓

Approve

↓

MongoDB Transaction

↓

WalletService.debit()

↓

Transaction Created

↓

Withdrawal Status Updated

↓

Audit Log

↓

Notify User
```

All operations must be atomic.

---

# Withdrawal Rejection Workflow

Workflow

```
Admin

↓

Reject

↓

Provide Reason

↓

Update Status

↓

Audit Log

↓

Notify User
```

Wallet balance remains unchanged.

---

# Processing Workflow

Optional intermediate status

```
APPROVED

↓

PROCESSING

↓

COMPLETED
```

Allows administrators to track payment progress.

---

# Cancellation

Users may cancel only

```
PENDING
```

withdrawals.

Cancelled withdrawals cannot be approved later.

---

# Wallet Integration

Approval

↓

```
WalletService.debit()
```

Category

```
WITHDRAWAL
```

Never update wallet balances directly.

---

# Transaction Integration

Create

Wallet Transaction

Type

```
DEBIT
```

Category

```
WITHDRAWAL
```

Reference

Withdrawal ID

---

# Notification Integration

Notify User

- Withdrawal Submitted
- Withdrawal Approved
- Withdrawal Processing
- Withdrawal Completed
- Withdrawal Rejected

Notify Admin

- New Withdrawal Request

Notification preferences must respect the Settings Service.

---

# Audit Logs

Record

- Previous Status
- New Status
- Previous Balance
- New Balance
- Admin
- Timestamp
- Notes

---

# Search & Filtering

Support

- Withdrawal Number
- User
- Status
- Payment Method
- Date
- Amount

Sorting

- Latest
- Oldest
- Highest Amount
- Lowest Amount

---

# Pagination

Support server-side pagination.

---

# API Endpoints

User

```
POST /api/v1/withdrawals

GET /api/v1/withdrawals

GET /api/v1/withdrawals/:id

DELETE /api/v1/withdrawals/:id
```

Admin

```
GET   /api/v1/admin/withdrawals

GET   /api/v1/admin/withdrawals/:id

PATCH /api/v1/admin/withdrawals/:id/approve

PATCH /api/v1/admin/withdrawals/:id/reject

PATCH /api/v1/admin/withdrawals/:id/processing

PATCH /api/v1/admin/withdrawals/:id/complete
```

---

# Frontend Tasks

## User Pages

Create

- Withdrawal Dashboard
- Request Withdrawal
- Withdrawal History
- Withdrawal Details

---

# Withdrawal Form

Fields

- Amount
- Payment Method
- Receiver Account
- Account Holder Name

Display dynamically

- Minimum Withdrawal
- Maximum Withdrawal
- Processing Time
- Withdrawal Fee
- Waiting Period

All values must come from the Settings API.

---

# Withdrawal History

Display

- Withdrawal Number
- Date
- Amount
- Fee
- Net Amount
- Status

Support

- Search
- Filters
- Pagination

---

# Admin Pages

Create

- Pending Withdrawals
- Withdrawal Details
- Approval Screen
- Processing Queue
- Withdrawal History

---

# Admin Approval Screen

Display

- User Information
- Wallet Balance
- Withdrawal Amount
- Fee
- Net Amount
- Payment Method
- Waiting Period Validation Result

Actions

- Approve
- Reject
- Processing
- Complete

Require confirmation before approval.

---

# Components

Create reusable

```
WithdrawalCard

WithdrawalTable

WithdrawalStatusBadge

WithdrawalForm

FeeCalculator

PaymentMethodSelector

WithdrawalSummary

WithdrawalDetailsCard
```

---

# React Query Hooks

Create

```
useWithdrawals()

useWithdrawal()

useCreateWithdrawal()

useApproveWithdrawal()

useRejectWithdrawal()

useCompleteWithdrawal()
```

---

# Security

Only authenticated users may create withdrawals.

Only

```
ADMIN

SUPER_ADMIN
```

may approve, reject, or complete withdrawals.

Every request must validate ownership and permissions.

---

# Performance

Indexes

- User ID
- Wallet ID
- Withdrawal Number
- Status
- Payment Method
- Created At

Use pagination and optimized queries.

---

# Testing

Backend

- Withdrawal validation
- Waiting period validation
- Fee calculation
- Approval workflow
- Rejection workflow
- Processing workflow
- MongoDB transaction rollback
- Wallet integration
- Authorization
- Notification triggering

Frontend

- Withdrawal form
- Dynamic settings loading
- Fee calculation display
- Waiting period messages
- Withdrawal history
- Admin workflow
- Error handling

---

# Deliverables

Backend

- Withdrawal Module
- Withdrawal APIs
- Waiting Period Engine
- Fee Calculation Engine
- Approval Workflow
- Wallet Integration
- Transaction Integration
- Audit Logging

Frontend

- Withdrawal Dashboard
- Withdrawal Form
- Withdrawal History
- Admin Withdrawal Management
- React Query Hooks

Infrastructure

- MongoDB Transactions
- Dynamic Settings Integration
- Notification Hooks

---

# Exit Criteria

Before moving to Phase 07:

- Users can submit withdrawal requests successfully.
- All withdrawal rules are loaded from the Settings Service.
- Waiting periods are validated dynamically.
- Withdrawal fees are calculated dynamically.
- Wallet balances are only debited through WalletService.
- Every approved withdrawal creates a wallet transaction.
- Rejected and cancelled withdrawals never affect wallet balances.
- Notifications respect platform settings.
- Audit logs are created for every administrative action.
- No configurable business rules are hardcoded.
- No TypeScript or ESLint errors exist.
- Unit, integration, and transaction rollback tests pass successfully.
