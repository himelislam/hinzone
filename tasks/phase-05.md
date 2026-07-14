# Phase 05 — Deposit Management System

## Goal

Build the complete Deposit Module that allows users to fund their wallets using administrator-approved deposit requests.

The deposit system must be fully configurable through the **Settings Service**. No deposit rules, payment methods, packages, or limits should be hardcoded.

Wallet balances must **only** be credited after an administrator approves a deposit.

---

# Objectives

- Deposit Request System
- Deposit Packages
- Payment Methods
- Screenshot Upload
- Deposit Verification
- Admin Approval Workflow
- Wallet Credit Integration
- Transaction Integration
- Notification Integration
- Audit Logging

---

# Backend Tasks

## Deposit Module

Create

```
modules/

deposit/

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

# Deposit Schema

Fields

- Deposit Number
- User ID
- Wallet ID
- Package Amount
- Deposit Amount
- Currency
- Payment Method
- Sender Account Number
- Company Account Number
- Transaction ID
- Screenshot URL
- Status
- Admin Note
- Rejection Reason
- Approved By
- Approved At
- Created At
- Updated At

---

# Deposit Status

Supported statuses

```
PENDING

APPROVED

REJECTED

CANCELLED
```

Only **APPROVED** deposits affect wallet balances.

---

# Deposit Number Generator

Generate unique IDs.

Example

```
DEP-20260712-000001
```

---

# Settings Integration

Load all deposit rules from the Settings Service.

Required settings

- Deposits Enabled
- Minimum Deposit
- Maximum Deposit
- Deposit Packages
- Accepted Payment Methods
- Company bKash Number
- Company Nagad Number
- Deposit Instructions

Never hardcode these values.

---

# Deposit Validation

Before creating a deposit

Validate

- Deposits Enabled
- Package Exists
- Amount Allowed
- Payment Method Allowed
- Wallet Exists
- User Exists

Reject invalid requests before database operations.

---

# Deposit Screenshot Upload

Use

```
Cloudinary
```

Supported formats

- JPG
- PNG
- WEBP

Validate

- File size
- MIME type

Store only the Cloudinary URL.

---

# Create Deposit Request

Workflow

```
User

↓

Validate Settings

↓

Upload Screenshot

↓

Create Deposit

↓

Status = PENDING

↓

Notify Admin
```

Wallet balance must remain unchanged.

---

# Deposit Approval Workflow

Workflow

```
Admin

↓

Open Pending Deposit

↓

Verify Information

↓

Approve

↓

MongoDB Transaction

↓

WalletService.credit()

↓

Transaction Created

↓

Deposit Status Updated

↓

Audit Log

↓

User Notification
```

All steps must succeed or rollback together.

---

# Deposit Rejection Workflow

Workflow

```
Admin

↓

Reject Deposit

↓

Provide Reason

↓

Update Status

↓

Audit Log

↓

Notify User
```

No wallet changes occur.

---

# Deposit Cancellation

Users may cancel only deposits that are still

```
PENDING
```

Cancelled deposits cannot be restored.

---

# Wallet Integration

On approval

Call

```
WalletService.credit()
```

Category

```
DEPOSIT
```

Never modify wallet balances directly.

---

# Transaction Integration

Create a wallet transaction

Type

```
CREDIT
```

Category

```
DEPOSIT
```

Reference ID

```
Deposit ID
```

---

# Notification Integration

Notify

User

- Deposit Submitted
- Deposit Approved
- Deposit Rejected

Admin

- New Deposit Request

Respect Notification Settings from the Settings Service.

---

# Audit Logs

Record

- Previous Status
- New Status
- Admin
- Timestamp
- Notes

---

# Search & Filtering

Support

- Deposit Number
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
POST /api/v1/deposits

GET /api/v1/deposits

GET /api/v1/deposits/:id

DELETE /api/v1/deposits/:id
```

Admin

```
GET   /api/v1/admin/deposits

GET   /api/v1/admin/deposits/:id

PATCH /api/v1/admin/deposits/:id/approve

PATCH /api/v1/admin/deposits/:id/reject
```

---

# Frontend Tasks

## User Pages

Create

- Deposit Dashboard
- Create Deposit
- Deposit History
- Deposit Details

---

## Deposit Form

Fields

- Deposit Package
- Payment Method
- Sender Account
- Transaction ID
- Screenshot Upload

Display dynamically from Settings

- Deposit Packages
- Company Payment Numbers
- Deposit Instructions

---

## Deposit History

Display

- Deposit Number
- Date
- Amount
- Status
- Payment Method

Features

- Search
- Filters
- Pagination

---

## Admin Pages

Create

- Pending Deposits
- Deposit Details
- Deposit Approval
- Deposit Rejection
- Deposit History

---

## Admin Approval Screen

Display

- User Information
- Deposit Details
- Screenshot Preview
- Transaction ID
- Submitted Date

Actions

- Approve
- Reject

Require confirmation before approval.

---

# Components

Create reusable

```
DepositCard

DepositTable

DepositStatusBadge

DepositForm

DepositPackageSelector

PaymentMethodCard

ScreenshotUploader

DepositDetailsCard
```

---

# React Query Hooks

Create

```
useDeposits()

useDeposit()

useCreateDeposit()

useApproveDeposit()

useRejectDeposit()
```

---

# Security

Only authenticated users may create deposits.

Only

```
ADMIN

SUPER_ADMIN
```

may approve or reject deposits.

Every request must validate ownership and permissions.

---

# Performance

Indexes

- User ID
- Wallet ID
- Deposit Number
- Status
- Payment Method
- Created At

Optimize queries with pagination and projections.

---

# Testing

Backend

- Deposit creation
- Validation rules
- Screenshot upload
- Approval workflow
- Rejection workflow
- MongoDB transaction rollback
- Wallet integration
- Authorization
- Notification triggering

Frontend

- Deposit form
- Dynamic settings loading
- Upload validation
- Deposit history
- Approval workflow
- Error handling

---

# Deliverables

Backend

- Deposit Module
- Deposit APIs
- Cloudinary Integration
- Approval Workflow
- Wallet Integration
- Transaction Integration
- Audit Logging

Frontend

- Deposit Dashboard
- Deposit Form
- Deposit History
- Admin Deposit Management
- React Query Hooks

Infrastructure

- MongoDB transactions
- Dynamic Settings integration
- Notification hooks

---

# Exit Criteria

Before moving to Phase 06:

- Users can submit deposit requests successfully.
- Deposit rules are loaded entirely from the Settings Service.
- Deposit screenshots upload successfully to Cloudinary.
- Deposits remain pending until administrator approval.
- Approving a deposit credits the wallet only through WalletService.
- Every approved deposit creates a wallet transaction.
- Rejecting or cancelling a deposit never affects wallet balances.
- Notifications are generated according to platform settings.
- Audit logs are created for every administrative action.
- No configurable values are hardcoded.
- No TypeScript or ESLint errors exist.
- Unit, integration, and transaction rollback tests pass successfully.
