# MLM Module

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 2.0

---

# 1. Overview

The MLM (Multi-Level Marketing) Module manages the platform's referral system, binary tree structure, commission engine, rank progression, and team rewards.

Unlike traditional MLM systems with hardcoded business rules, this platform loads **every commission percentage, referral rule, rank requirement, and reward configuration from the Settings Service**.

This allows administrators to modify the compensation plan without redeploying the application.

The MLM Module integrates with:

- Authentication Module
- Deposit Module
- Wallet Module
- Transaction Module
- Notification Module
- Settings Module
- Audit Module

---

# 2. Objectives

The MLM Module is responsible for:

- Referral registration
- Binary tree management
- First deposit bonuses
- Rank calculations
- Team statistics
- Commission payouts
- Referral reporting
- Reward management

---

# 3. Module Architecture

```
User

↓

MLM Controller

↓

MLM Service

↓

Settings Service

↓

Referral Service

↓

Wallet Service

↓

Transaction Service

↓

Notification Service

↓

Audit Service

↓

MongoDB
```

Every commission and business rule must be loaded from the Settings Service.

---

# 4. MLM Workflow

```
User Registers

↓

Referral Validation

↓

Binary Placement

↓

Create Referral Tree

↓

User Makes First Deposit

↓

Load MLM Settings

↓

Calculate Commission

↓

Credit Wallet

↓

Create Transaction

↓

Notification

↓

Audit Log
```

---

# 5. Binary Referral Structure

The platform uses a configurable binary tree.

Example

```
              Root

          /          \

      User A        User B

     /     \        /     \

   C        D      E       F
```

The maximum number of direct referrals is configurable.

Default:

```
2 Direct Referrals
```

Loaded from:

```
Settings

↓

MLM

↓

Maximum Direct Referrals
```

---

# 6. Referral Registration

During registration:

```
Register

↓

Validate Referral Code

↓

Validate Sponsor

↓

Find Available Position

↓

Insert Into Tree

↓

Create User

↓

Create Referral Record
```

If no referral code is supplied, the user joins without a sponsor.

---

# 7. Referral Tree Collection

Example

```json
{
  "_id": "...",
  "userId": "...",
  "parentId": "...",
  "leftChildId": "...",
  "rightChildId": "...",
  "position": "Left",
  "level": 3,
  "teamSize": 42,
  "leftCount": 18,
  "rightCount": 23,
  "currentRank": "Silver",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

# 8. Referral Link

Each user receives a referral URL.

Example

```
https://platform.com/register?ref=REF100245
```

The referral ID is generated during registration and never changes.

---

# 9. First Deposit Bonus

The first approved deposit triggers MLM commission calculation.

Commission values are loaded from:

```
Settings

↓

MLM

↓

First Deposit Bonus
```

Example

Level 1

| Deposit Package | Commission |
| --------------- | ---------: |
| 3000            |         5% |
| 6000            |         7% |
| 12000           |        10% |

Level 2

| Deposit Package | Commission |
| --------------- | ---------: |
| 3000            |         2% |
| 6000            |         4% |
| 12000           |         6% |

Administrators may:

- Add packages
- Remove packages
- Change percentages
- Change supported levels

without modifying backend code.

---

# 10. Commission Calculation

Example

```
Deposit Package

6000 BDT

↓

Wallet Credit

50 USD

↓

Level 1 Commission

7%

↓

Reward

3.5 USD
```

All calculations occur on the backend.

---

# 11. Commission Flow

```
Deposit Approved

↓

Check First Deposit

↓

Load MLM Settings

↓

Find Sponsor

↓

Calculate Commission

↓

Credit Wallet

↓

Create Transaction

↓

Notification

↓

Audit Log
```

---

# 12. MLM Rank Settings

Rank requirements are configurable.

Example

```
Branch

↓

2 Direct Referrals

↓

Reward

3%
```

```
Silver

↓

8 Left

8 Right

↓

Reward

5%
```

```
Gold

↓

32 Left

32 Right

↓

Reward

7%
```

```
Diamond

↓

150 Team Members

↓

Reward

10%
```

Administrators can edit:

- Rank Name
- Left Requirement
- Right Requirement
- Total Team
- Reward Percentage

without deployment.

---

# 13. Rank Evaluation

Whenever:

- New Referral
- Approved Deposit
- Team Growth

the MLM Service recalculates ranks.

```
User Updated

↓

Load Rank Settings

↓

Evaluate Requirements

↓

Upgrade Rank

↓

Create Notification

↓

Audit Log
```

---

# 14. Rank Rewards

When a user reaches a new rank:

```
Rank Achieved

↓

Load Reward %

↓

Credit Wallet

↓

Create Transaction

↓

Notification
```

Reward percentages come from the Settings Service.

---

# 15. Referral Dashboard

```
GET /api/v1/mlm/dashboard
```

Returns:

- Direct Referrals
- Left Team
- Right Team
- Total Team
- Current Rank
- Total Earnings
- Referral Income
- Rank Income

---

# 16. Referral Tree API

```
GET /api/v1/mlm/tree
```

Returns:

- Parent
- Children
- Team Structure
- Position
- Levels

Supports recursive tree loading.

---

# 17. Referral Statistics

```
GET /api/v1/mlm/statistics
```

Returns:

- Total Team
- Active Team
- Total Commissions
- Total Bonuses
- Today's Growth
- Monthly Growth

---

# 18. Commission History

```
GET /api/v1/mlm/commissions
```

Supports:

- Pagination
- Date Range
- Commission Type
- Referral Level

---

# 19. Wallet Integration

Every MLM reward credits the wallet through the Wallet Service.

```
Commission

↓

Wallet Service

↓

Increase Balance

↓

Transaction
```

The MLM Module never updates balances directly.

---

# 20. Transaction Integration

Every reward creates an immutable transaction.

Examples

```
Referral Bonus

Rank Bonus
```

---

# 21. Notification Integration

Notifications include:

- New Referral
- Referral Registered
- Commission Received
- Rank Upgraded
- Team Milestone
- Reward Credited

Notification settings are loaded from the Settings Service.

---

# 22. Admin APIs

```
GET /api/v1/admin/mlm/tree

GET /api/v1/admin/mlm/users

GET /api/v1/admin/mlm/commissions

GET /api/v1/admin/mlm/ranks

POST /api/v1/admin/mlm/recalculate

POST /api/v1/admin/mlm/rebuild-tree
```

Administrators may:

- View referral trees
- Recalculate ranks
- Rebuild tree relationships
- View commissions
- Monitor team growth

---

# 23. Security

MLM APIs require:

- JWT Authentication
- Active User
- Valid Session

Administrative APIs require:

- Admin Role
- Audit Logging

---

# 24. Atomic Transactions

The following operations execute together.

```
Credit Wallet

+

Create Transaction

+

Update MLM Data

+

Notification

+

Audit Log
```

If any operation fails:

Everything is rolled back.

---

# 25. Error Handling

Example errors

```
Invalid Referral Code

Referral Not Found

Maximum Direct Referrals Reached

Commission Configuration Missing

Rank Configuration Missing

Circular Referral Detected

Duplicate Referral

Unauthorized
```

Responses follow the standard API format.

---

# 26. Performance

The MLM Module should:

- Cache MLM Settings
- Cache Rank Settings
- Index Referral IDs
- Index Parent IDs
- Optimize tree traversal
- Use aggregation pipelines for reporting

Large binary trees should support efficient recursive queries.

---

# 27. Reporting

The MLM Module provides data for:

- Referral Reports
- Commission Reports
- Rank Reports
- Team Growth Reports
- Referral Conversion Reports
- Top Earners
- Binary Tree Analytics

---

# 28. Future Features

Future versions may support:

- Unlimited Referral Levels
- Dynamic Compensation Plans
- Weekly Matching Bonuses
- Leadership Bonuses
- Auto Placement Rules
- Spillover Placement
- Compression Rules
- Rank Expiration
- Team Volume Bonuses
- Achievement Badges
- Referral Contests
- AI Referral Analytics

The architecture should support these features without major redesign.

---

# 29. Settings Integration

The MLM Module depends entirely on the Settings Service.

Dynamic configuration includes:

- Maximum Direct Referrals
- Referral Levels
- Deposit Packages
- Commission Percentages
- Rank Requirements
- Rank Rewards
- Bonus Types
- Notification Rules

No MLM business rule may be hardcoded.

---

# 30. Development Rules

The following rules are mandatory.

- Every referral relationship must be stored in the Referral Tree.
- Every referral code must be unique and immutable.
- Binary placement rules must come from the Settings Service.
- Commission percentages must come from the Settings Service.
- Deposit package mappings must come from the Settings Service.
- Rank requirements must come from the Settings Service.
- Rank rewards must come from the Settings Service.
- Wallet balances must only be updated through the Wallet Service.
- Every MLM payout must create a Transaction record.
- Every administrative MLM action must create an Audit Log.
- Commission calculations must occur only on the backend.
- MLM payouts must execute as atomic MongoDB transactions.
- Tree consistency must be maintained at all times.
- The MLM Module must remain scalable enough to support millions of users and future compensation plans without architectural changes.
