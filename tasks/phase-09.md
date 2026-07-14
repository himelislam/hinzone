# Phase 09 — MLM & Referral System

## Goal

Build the complete Multi-Level Marketing (MLM) and Referral System.

The MLM module is responsible for:

- Referral registration
- Binary tree management
- Referral placement
- First Deposit Commission
- Rank Calculation
- Rank Rewards
- Team Statistics
- MLM Dashboard

All MLM business rules **must** be loaded from the **Settings Service**.

Nothing regarding commission percentages, ranks, team sizes, referral limits, or bonuses should be hardcoded.

---

# Objectives

- Referral System
- Binary MLM Tree
- Team Placement
- First Deposit Commission
- Rank Calculation
- Rank Rewards
- Team Statistics
- MLM Wallet Integration
- Notification Integration
- Audit Logging

---

# Backend Tasks

## MLM Module

Create

```
modules/

mlm/

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

# MLM Node Schema

Each registered user should have one MLM node.

Fields

- User ID
- Sponsor ID
- Parent ID
- Position
- Left Child
- Right Child
- Level
- Team Size
- Left Team Count
- Right Team Count
- Direct Referral Count
- Rank
- Status
- Created At
- Updated At

---

# Node Status

```
ACTIVE

INACTIVE

BLOCKED
```

---

# Binary Tree

Each member can have

```
Maximum Left Child

1

Maximum Right Child

1
```

The maximum direct referrals must come from the Settings Service.

Example

```
Maximum Direct Referrals

2
```

---

# Settings Integration

Load MLM rules dynamically.

Required settings

- Maximum Direct Referrals
- First Deposit Bonus
- Commission Percentages
- Rank Structure
- Rank Rewards
- Team Requirements

Never hardcode any MLM configuration.

---

# Referral Registration

During registration

```
Referral Code

↓

Find Sponsor

↓

Validate Sponsor

↓

Validate Referral Limit

↓

Create User

↓

Create MLM Node

↓

Place In Tree
```

---

# Placement Algorithm

Implement automatic placement.

Priority

```
Left

↓

Right

↓

Breadth First Search
```

The algorithm should automatically find the next available position beneath the sponsor.

Future-proof the implementation for manual placement if required later.

---

# Team Statistics

Maintain

- Direct Referrals
- Total Team
- Left Team
- Right Team
- Active Members
- Inactive Members

Automatically update ancestor nodes after placement.

---

# Commission Structure

Support dynamic commission configuration.

Example

Level 1

```
3000 → 5%

6000 → 7%

12000 → 10%
```

Level 2

```
3000 → 2%

6000 → 4%

12000 → 6%
```

Values must come from the Settings Service.

---

# Commission Rules

Only the user's **first approved deposit** qualifies.

Workflow

```
Deposit Approved

↓

Is First Deposit?

↓

Load MLM Settings

↓

Find Sponsor

↓

Calculate Level 1

↓

WalletService.credit()

↓

Transaction

↓

Notification

↓

Audit Log
```

Then

```
Find Level 2 Sponsor

↓

Calculate

↓

WalletService.credit()

↓

Transaction

↓

Notification
```

No commission should be issued for later deposits unless the settings support it in the future.

---

# MLM Commission Schema

Fields

- Commission Number
- User ID
- Source User ID
- Deposit ID
- Wallet Transaction ID
- Level
- Package Amount
- Percentage
- Commission Amount
- Status
- Created At

---

# Wallet Integration

Every commission must use

```
WalletService.credit()
```

Category

```
MLM_BONUS
```

Never update balances directly.

---

# Rank Engine

Create

```
RankService
```

Responsibilities

- Evaluate Team Size
- Evaluate Left Team
- Evaluate Right Team
- Evaluate Total Team
- Upgrade Rank

---

# Rank Rules

Load dynamically.

Example

Branch

```
2 Direct Referrals
```

Silver

```
Left 8

Right 8
```

Gold

```
Left 32

Right 32
```

Diamond

```
150 Team Members
```

The system should support any number of ranks without code changes.

---

# Rank Upgrade

Workflow

```
MLM Tree Updated

↓

Rank Engine

↓

Eligible?

↓

Upgrade Rank

↓

Reward

↓

Notification

↓

Audit Log
```

---

# Rank Reward

When a rank reward includes a financial bonus

```
WalletService.credit()
```

Category

```
RANK_REWARD
```

---

# MLM Dashboard Statistics

Calculate

- Current Rank
- Team Size
- Direct Referrals
- Left Team
- Right Team
- Commission Earned
- Rank Rewards
- Pending Earnings

---

# Search & Filtering

Support

- User
- Sponsor
- Rank
- Team Size
- Commission Status
- Date

Pagination required.

---

# API Endpoints

Referral

```
GET /api/v1/mlm/tree

GET /api/v1/mlm/team

GET /api/v1/mlm/referrals
```

Commissions

```
GET /api/v1/mlm/commissions

GET /api/v1/mlm/commissions/:id
```

Dashboard

```
GET /api/v1/mlm/dashboard
```

Admin

```
GET /api/v1/admin/mlm/tree

GET /api/v1/admin/mlm/users

GET /api/v1/admin/mlm/commissions

GET /api/v1/admin/mlm/ranks

POST /api/v1/admin/mlm/recalculate
```

---

# Frontend Tasks

## MLM Dashboard

Display

- Current Rank
- Referral Code
- Referral Link
- Team Statistics
- Commission Summary
- Rank Progress

---

# Referral Page

Display

- Referral Code
- Copy Referral Link
- QR Code (future-ready)
- Direct Referrals

---

# Binary Tree View

Display

- User Node
- Left Child
- Right Child
- Team Expansion

Support

- Zoom
- Expand
- Collapse

Prepare for large trees using lazy loading.

---

# Commission History

Display

- Source User
- Deposit Package
- Commission Percentage
- Amount
- Level
- Date

---

# Rank Progress

Display

- Current Rank
- Next Rank
- Remaining Requirements
- Progress Bars

---

# Components

Create reusable

```
MLMTree

MLMNode

ReferralCard

ReferralLinkCard

CommissionTable

CommissionBadge

RankCard

RankProgress

TeamStatistics

MLMDashboardSummary
```

---

# React Query Hooks

Create

```
useMLMDashboard()

useMLMTree()

useReferralList()

useCommissionHistory()

useRankProgress()
```

---

# Notification Integration

Notify users when

- Referral Joins
- First Deposit Commission Earned
- Rank Upgraded
- Rank Reward Received

Respect Notification Settings.

---

# Audit Logs

Record

- Referral Registration
- Tree Placement
- Commission Distribution
- Rank Upgrade
- Rank Reward
- Manual Recalculation

Include

- Previous Values
- New Values
- Administrator (if applicable)
- Timestamp

---

# Security

Users may only access their own MLM data.

Administrators may access all MLM records.

Only

```
ADMIN

SUPER_ADMIN
```

may execute recalculations.

---

# Performance

Indexes

- User ID
- Sponsor ID
- Parent ID
- Rank
- Commission Status
- Created At

Optimize

- Tree Traversal
- Team Statistics
- Dashboard Queries

---

# Testing

Backend

- Referral Registration
- Placement Algorithm
- Binary Tree Integrity
- Commission Calculation
- First Deposit Validation
- Rank Engine
- Wallet Integration
- Authorization
- MongoDB Transactions

Frontend

- MLM Dashboard
- Referral Page
- Tree Rendering
- Rank Progress
- Commission History
- Error Handling

---

# Deliverables

Backend

- MLM Module
- Binary Tree Engine
- Referral Engine
- Commission Engine
- Rank Engine
- Wallet Integration
- Audit Logging

Frontend

- MLM Dashboard
- Binary Tree Viewer
- Referral Management
- Commission History
- Rank Progress
- React Query Hooks

Infrastructure

- Dynamic Settings Integration
- Atomic Commission Distribution
- Automatic Rank Calculation

---

# Exit Criteria

Before moving to Phase 10:

- Users can register using referral codes.
- The binary tree places new members correctly.
- Team statistics update automatically.
- First deposit commissions are distributed according to Settings.
- Commission percentages are never hardcoded.
- Wallet credits occur only through WalletService.
- Rank calculations are fully dynamic.
- Rank upgrades and rewards work correctly.
- Notifications are generated according to platform settings.
- Audit logs are created for all MLM activities.
- No TypeScript or ESLint errors exist.
- Unit, integration, and transaction rollback tests pass successfully.
