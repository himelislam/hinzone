# Business Rules

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 2.0

---

# 1. Overview

This document defines the core business rules that govern the entire platform.

Business rules determine how every module behaves, including:

- User Management
- Wallet
- Deposits
- Withdrawals
- Stocks
- Trading
- MLM
- Notifications
- Security
- Platform Settings

A key architectural principle of this platform is:

> **No business rule may be hardcoded inside the application.**

Every configurable business rule must be stored in the **Settings Collection** and loaded through the **Settings Service**.

---

# 2. General Principles

The platform follows these principles:

- Business rules belong in the database.
- Controllers never contain business logic.
- Services execute business rules.
- Settings determine platform behavior.
- Administrators can modify business rules without deployment.

---

# 3. Settings-Driven Architecture

Every business rule should follow this workflow:

```
Client Request

↓

Business Service

↓

Settings Service

↓

Load Configuration

↓

Validate Rules

↓

Execute Business Logic

↓

Database
```

Services must never use hardcoded values.

---

# 4. User Rules

A user can:

- Register
- Login
- Deposit Funds
- Withdraw Funds
- Buy Stocks
- Sell Stocks
- Invite Referrals
- Earn MLM Commissions

Only active users may perform financial operations.

Blocked or suspended users cannot:

- Login
- Deposit
- Withdraw
- Trade
- Receive commissions

---

# 5. Wallet Rules

Every user owns exactly one wallet.

Wallet balances can only be modified by:

- Deposit Approval
- Withdrawal Completion
- Stock Trading
- MLM Commissions
- Administrative Adjustments

Wallet balances must never be edited directly in MongoDB.

---

# 6. Currency Rules

Currency configuration is stored in Settings.

Fields include:

- Default Currency
- Currency Symbol
- Exchange Rate
- Conversion Precision

Example

```
120 BDT = 1 USD
```

All conversions use the latest configured rate.

---

# 7. Deposit Rules

Deposit rules are configurable.

Fields include:

- Deposits Enabled
- Deposit Packages
- Minimum Deposit
- Maximum Deposit
- Accepted Payment Methods
- Deposit Instructions

Users may only select active deposit packages.

---

# 8. Deposit Approval Rules

A deposit is credited only after:

- Payment Verified
- Screenshot Validated
- Administrator Approval

Approval triggers:

- Wallet Credit
- Transaction Creation
- MLM Bonus Check
- Notification

Rejected deposits never affect wallet balances.

---

# 9. Withdrawal Rules

Withdrawal rules are configurable.

Fields include:

- Withdrawals Enabled
- Minimum Withdrawal
- Maximum Withdrawal
- Waiting Period
- Processing Time
- Withdrawal Fee

Users cannot withdraw more than their available balance.

---

# 10. Withdrawal Validation

Before creating a withdrawal request:

Validate:

- User Status
- Wallet Balance
- Waiting Period
- Withdrawal Limits
- Payment Method

Failure of any validation rejects the request.

---

# 11. Stock Rules

Stock configuration includes:

- Trading Enabled
- Auto Sell Enabled
- Purchase Limits
- Fractional Shares
- Price Update Mode

Inactive stocks cannot be purchased.

---

# 12. Trading Rules

Trading validation includes:

- Trading Enabled
- Maintenance Mode
- User Status
- Stock Status
- Wallet Balance

All trading calculations occur on the backend.

---

# 13. Portfolio Rules

Every purchase creates or updates a portfolio position.

Every sale:

- Reduces quantity
- Updates profit
- Creates transaction

Zero quantity automatically closes the position.

---

# 14. Profit Rules

Profit is calculated using:

```
(Current Price

-

Purchase Price)

×

Quantity
```

Profit is never supplied by the client.

---

# 15. Auto Sell Rules

If Auto Sell is enabled:

```
Target Price Reached

↓

Automatic Sale

↓

Wallet Updated

↓

Transaction Created

↓

Notification Sent
```

Auto Sell behavior is configurable.

---

# 16. MLM Rules

The MLM engine follows configurable rules.

Fields include:

- Maximum Direct Referrals
- Referral Levels
- Commission Percentages
- Deposit Packages
- Rank Requirements
- Rank Rewards

No MLM rule is hardcoded.

---

# 17. Referral Rules

Each user has:

- One Sponsor
- One Referral Code

Referral codes:

- Must be unique
- Cannot change
- Cannot be reused

---

# 18. Commission Rules

Commission is paid only after:

- First Deposit
- Approved Deposit
- Valid Sponsor

Commission percentages are loaded from Settings.

---

# 19. Rank Rules

Rank evaluation occurs after:

- New Referral
- Deposit Approval
- Team Growth

Requirements are loaded dynamically.

---

# 20. Notification Rules

Notifications are generated only if enabled.

Categories include:

- Deposits
- Withdrawals
- Trading
- Stocks
- MLM
- Security

Notification preferences are controlled through Settings.

---

# 21. Homepage Rules

Homepage content includes:

- Banner Images
- Promotional Text
- Announcements
- Market News

All content is editable from the Admin Panel.

---

# 22. Security Rules

Configurable fields include:

- JWT Expiration
- Password Policy
- Session Timeout
- Maximum Login Attempts
- Maintenance Mode

Security settings are loaded through the Settings Service.

---

# 23. Administrative Rules

Only:

```
ADMIN

SUPER_ADMIN
```

may:

- Approve Deposits
- Approve Withdrawals
- Update Settings
- Manage Stocks
- Modify Wallets

Every administrative action creates an Audit Log.

---

# 24. Transaction Rules

Every financial operation creates an immutable transaction.

Examples

- Deposit
- Withdrawal
- Buy
- Sell
- Referral Bonus
- Rank Bonus
- Wallet Adjustment

Transactions cannot be edited after creation.

---

# 25. Audit Rules

Audit Logs record:

- User
- Action
- Module
- Timestamp
- Previous Value
- New Value
- IP Address

Audit records cannot be deleted.

---

# 26. Validation Rules

Every request must pass:

- Authentication
- Authorization
- Input Validation
- Business Validation

Invalid requests never reach the database layer.

---

# 27. Settings Rules

The Settings Collection is the single source of truth.

Business rules include:

- Exchange Rates
- Deposit Packages
- Withdrawal Limits
- Trading Rules
- MLM Rules
- Notification Rules
- Security Rules
- Homepage Content

Settings changes apply immediately after cache refresh.

---

# 28. Cache Rules

Settings are cached in memory.

Workflow

```
Administrator Updates Settings

↓

Database Updated

↓

Cache Refreshed

↓

New Rules Applied
```

Applications must never require a restart for settings changes.

---

# 29. Database Rules

Financial operations must use MongoDB transactions.

Affected modules

- Wallet
- Deposits
- Withdrawals
- Trading
- MLM
- Transactions

Partial updates are not allowed.

---

# 30. Error Handling Rules

Business rule violations return standardized responses.

Examples

```
Trading Disabled

Maintenance Mode

Deposit Disabled

Withdrawal Disabled

Insufficient Balance

Maximum Withdrawal Exceeded

Invalid Referral

Unauthorized
```

Business errors should never expose internal implementation details.

---

# 31. Future Rule Expansion

The architecture should support additional rules such as:

- Regional Trading Restrictions
- Dynamic Trading Fees
- Tax Calculation
- Multiple Wallets
- Multiple Currencies
- Multiple MLM Plans
- Feature Flags
- Subscription Plans
- Promotional Campaigns

No architectural redesign should be required.

---

# 32. Non-Negotiable Business Rules

The following rules are mandatory and must never be violated.

### Platform Rules

- No business rule may be hardcoded.
- The Settings Collection is the single source of truth.
- Business Services must always load configuration from the Settings Service.

### Wallet Rules

- Users have only one wallet.
- Wallet balances can only be modified through the Wallet Service.

### Deposit Rules

- Deposits require administrator approval before wallet credit.
- Rejected deposits never affect balances.

### Withdrawal Rules

- Users cannot withdraw more than their available balance.
- Withdrawal limits and waiting periods come from Settings.

### Trading Rules

- Trading is blocked during maintenance mode.
- All trading calculations occur on the backend.
- Trading operations execute as MongoDB transactions.

### MLM Rules

- Commission percentages come from Settings.
- Rank requirements come from Settings.
- Referral limits come from Settings.

### Security Rules

- Every protected endpoint requires JWT authentication.
- Administrative actions require role authorization.
- Sensitive operations generate Audit Logs.

### Notification Rules

- Notifications are generated only when enabled.
- Notification preferences come from Settings.

### Database Rules

- Financial operations are atomic.
- Transactions are immutable.
- Audit Logs are immutable.

---

# 33. Development Rules

The following implementation rules are mandatory.

- Never hardcode exchange rates, commissions, limits, fees, or platform configuration.
- All configurable values must be retrieved from the Settings Service.
- Business validation must occur in the service layer only.
- Controllers should remain thin and contain no business logic.
- Every financial operation must execute within a MongoDB transaction.
- Every successful financial operation must generate a Transaction record.
- Every administrative action must generate an Audit Log.
- Business rule violations should return standardized API error responses.
- New business rules should be introduced through the Settings Collection whenever possible.
- The platform should remain configurable enough that administrators can change operational behavior without code changes or server redeployment.
