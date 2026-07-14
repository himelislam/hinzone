# Wallet Module

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 1.0

---

# 1. Overview

The Wallet Module is the financial core of the platform.

Every monetary operation passes through the wallet system.

Examples include:

- Deposits
- Withdrawals
- Stock Purchases
- Stock Sales
- Referral Bonuses
- Rank Bonuses
- Admin Adjustments
- Future Trading Profits

The wallet is the single source of truth for a user's available balance.

---

# 2. Objectives

The Wallet Module is responsible for:

- Managing wallet balances
- Recording all financial transactions
- Preventing invalid balance updates
- Maintaining complete financial history
- Supporting future financial modules
- Providing accurate reporting
- Ensuring auditability

---

# 3. Architecture

```
Client

↓

Wallet Controller

↓

Wallet Service

↓

Transaction Service

↓

Settings Service

↓

Wallet Repository

↓

Transaction Repository

↓

MongoDB
```

The Wallet Service never performs business calculations using hardcoded values.

All configurable financial rules are loaded from the **Settings Service**.

---

# 4. Responsibilities

The Wallet Module manages:

- Current Balance
- Lifetime Deposits
- Lifetime Withdrawals
- Total Investments
- Total Profit
- Referral Income
- Rank Income
- Manual Adjustments
- Transaction History

---

# 5. Wallet Collection

Each user has exactly one wallet.

Example

```json
{
  "_id": "...",
  "userId": "...",
  "balance": 150.5,
  "currency": "USD",
  "totalDeposited": 500,
  "totalWithdrawn": 120,
  "totalInvestment": 250,
  "totalProfit": 45,
  "totalReferralBonus": 30,
  "totalRankBonus": 15,
  "createdAt": "...",
  "updatedAt": "..."
}
```

The Wallet collection stores only the latest balance snapshot.

Every financial event is recorded separately in the Transactions collection.

---

# 6. Wallet Balance

The wallet balance is updated by the following events.

## Credit Operations

- Deposit Approval
- Stock Sale
- Referral Bonus
- Rank Bonus
- Admin Credit
- Future Trading Profit

---

## Debit Operations

- Stock Purchase
- Withdrawal Approval
- Admin Debit
- Future Trading Loss

---

# 7. Wallet Currency

Version 1 uses a single wallet currency.

```
USD
```

Exchange rates are loaded dynamically from the **Currency Settings**.

Example:

```
120 BDT = 1 USD
```

No exchange rate should be hardcoded.

---

# 8. Wallet Summary

Users can view:

- Current Balance
- Total Deposits
- Total Withdrawals
- Total Investments
- Total Profit
- Total Referral Earnings
- Total Rank Earnings

---

# 9. Wallet Transactions

Every balance change creates a Transaction record.

Transaction Types

```
Deposit

Withdrawal

Stock Purchase

Stock Sale

Referral Bonus

Rank Bonus

Admin Credit

Admin Debit

Trading Profit (Future)

Trading Loss (Future)
```

Transactions are immutable.

---

# 10. Wallet APIs

## Get Wallet

```
GET /api/v1/wallet
```

Returns:

- Current Balance
- Summary
- Currency

---

## Transaction History

```
GET /api/v1/wallet/transactions
```

Supports:

- Pagination
- Date Filter
- Type Filter
- Status Filter

---

## Wallet Statistics

```
GET /api/v1/wallet/statistics
```

Returns:

- Deposits
- Withdrawals
- Investments
- Profit
- Bonuses

---

# 11. Credit Wallet Flow

Example:

Deposit Approved

```
Admin Approves Deposit

↓

Deposit Service

↓

Wallet Service

↓

Increase Wallet Balance

↓

Create Transaction

↓

Generate Notification

↓

Create Audit Log
```

---

# 12. Debit Wallet Flow

Example:

Buy Stock

```
User Requests Purchase

↓

Stock Service

↓

Load Wallet

↓

Validate Balance

↓

Deduct Balance

↓

Create Transaction

↓

Create Portfolio

↓

Generate Notification
```

---

# 13. Wallet Validation Rules

Before every debit operation:

Validate:

- Wallet Exists
- User Active
- Sufficient Balance
- Platform Not in Maintenance
- Trading Enabled (if applicable)

No negative balances are allowed.

---

# 14. Atomic Transactions

Every financial operation must be executed atomically.

Example:

```
Decrease Wallet

+

Create Transaction

+

Create Portfolio

=

Single Database Transaction
```

If any operation fails:

Everything is rolled back.

---

# 15. Balance Calculation

Wallet balance must never be calculated on the client.

Only the backend may:

- Credit Balance
- Debit Balance
- Calculate Profit
- Calculate Bonuses

The frontend only displays results.

---

# 16. Financial Ledger

The Transactions collection serves as the immutable financial ledger.

The Wallet collection stores:

- Current Balance
- Lifetime Totals

The ledger stores:

- Every balance movement
- Balance Before
- Balance After
- Reference Entity
- Timestamp

---

# 17. Transaction Record

Example

```json
{
  "transactionId": "TXN100001",
  "userId": "...",
  "type": "Stock Purchase",
  "amount": -50,
  "currency": "USD",
  "balanceBefore": 200,
  "balanceAfter": 150,
  "referenceId": "...",
  "description": "Purchased ABC Stock",
  "status": "Completed",
  "createdAt": "..."
}
```

---

# 18. Wallet Service

Responsibilities:

- Credit Wallet
- Debit Wallet
- Validate Balance
- Generate Ledger Entries
- Update Lifetime Totals
- Return Wallet Summary

No controller may modify wallet balances directly.

---

# 19. Settings Integration

The Wallet Module depends on the **Settings Service**.

The following configuration is loaded dynamically.

### Currency Settings

- Default Currency
- Currency Symbol
- Exchange Rate

---

### Deposit Settings

- Deposit Enabled

---

### Withdrawal Settings

- Withdrawal Enabled
- Minimum Withdrawal
- Maximum Withdrawal
- Waiting Period
- Withdrawal Fee

---

### Trading Settings

- Trading Enabled
- Maintenance Mode

---

### Stock Settings

- Minimum Purchase
- Maximum Purchase

The Wallet Module must never hardcode any financial limits.

---

# 20. Error Handling

Example errors.

```
Insufficient Balance

Wallet Not Found

Currency Configuration Missing

Wallet Locked

Trading Disabled

Maintenance Mode
```

Responses follow the standard API format.

---

# 21. Notifications

Wallet events generate notifications.

Examples:

- Deposit Approved
- Withdrawal Approved
- Stock Purchased
- Stock Sold
- Referral Bonus Received
- Rank Bonus Received
- Wallet Adjusted

Notification settings are controlled through the **Settings Service**.

---

# 22. Audit Logging

The following actions generate Audit Logs.

- Manual Wallet Credit
- Manual Wallet Debit
- Deposit Approval
- Withdrawal Approval
- Balance Correction
- Failed Financial Operations

Audit logs cannot be modified or deleted.

---

# 23. Reporting

The Wallet Module provides data for:

- Wallet Summary
- Daily Revenue
- Deposit Reports
- Withdrawal Reports
- Profit Reports
- User Financial Reports
- Admin Dashboard

---

# 24. Security

Wallet operations require:

- JWT Authentication
- Active User Account
- Valid Session
- Role Authorization (Admin operations)
- Server-side Validation

The client is never allowed to modify balances directly.

---

# 25. Performance

The Wallet Module should:

- Use indexed queries
- Paginate transaction history
- Cache currency settings
- Cache frequently accessed configuration
- Avoid unnecessary aggregation queries

---

# 26. Future Features

The Wallet Module is designed to support:

- Multi-Currency Wallets
- Cryptocurrency Wallets
- Live Currency Conversion
- Trading Margin Accounts
- Interest Earnings
- Cashback Rewards
- Wallet Transfers
- Automated Payouts

These features should integrate without major architectural changes.

---

# 27. Development Rules

The following rules are mandatory.

- Every user owns exactly one wallet.
- Every financial operation creates a Transaction record.
- The Wallet collection stores only the latest balance snapshot.
- Transactions act as the immutable financial ledger.
- Wallet balances must never become negative.
- Financial calculations are performed only on the backend.
- Controllers must never modify wallet balances directly.
- Business logic belongs exclusively in the Wallet Service.
- Every configurable financial rule is loaded through the **Settings Service**.
- Exchange rates, withdrawal limits, deposit availability, and purchase limits must never be hardcoded.
- Every manual balance adjustment requires an Audit Log.
- Financial operations must be executed atomically using MongoDB transactions.
- Failed operations must roll back all related database changes.
- Wallet APIs must always return the latest committed balance.
- The Wallet Module must remain the central financial component used by all current and future investment features.
