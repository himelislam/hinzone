# Database Schema

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 1.0

**Database:** MongoDB

**ODM:** Mongoose

---

# 1. Overview

The platform uses **MongoDB** as its primary database.

The database is designed around business domains instead of pages.

Every major feature has its own collection to ensure:

- Scalability
- Data Integrity
- Separation of Concerns
- Easier Maintenance
- Better Performance

The database is optimized for:

- Financial Transactions
- Investment History
- MLM Relationships
- Administrative Reporting
- Future Expansion

---

# 2. Database Principles

The database follows these principles.

- Every document has timestamps.
- Financial records are immutable.
- Soft deletion is preferred over permanent deletion.
- Every collection uses ObjectId references.
- Frequently queried fields are indexed.
- Business rules are stored in the Settings collection.
- Audit logs are never deleted.
- No business configuration is hardcoded.

---

# 3. Collections Overview

```
Users

Wallets

Transactions

Deposits

Withdrawals

Stocks

Portfolios

ReferralTrees

MLMRanks

Notifications

Settings

Homepage

AuditLogs

Sessions

RefreshTokens
```

---

# 4. Users Collection

Purpose

Stores user accounts.

Main Fields

```
_id

username

phoneNumber

password

role

status

profileImage

referralId

referrerId

joinDate

email (optional)

isVerified

lastLogin

createdAt

updatedAt
```

Indexes

```
username

phoneNumber

referralId

role
```

Relationships

```
1 User

↓

1 Wallet

↓

Many Transactions

↓

Many Deposits

↓

Many Withdrawals

↓

Many Portfolio Items

↓

Many Notifications
```

---

# 5. Wallet Collection

Purpose

Stores wallet balances.

Main Fields

```
_id

userId

balance

totalDeposited

totalWithdrawn

totalInvestment

totalProfit

totalReferralBonus

totalRankBonus

currency

createdAt

updatedAt
```

Indexes

```
userId
```

Relationship

```
User

↓

Wallet
```

---

# 6. Transactions Collection

Purpose

Stores every financial activity.

Transaction Types

```
Deposit

Withdrawal

Wallet Credit

Wallet Debit

Stock Purchase

Stock Sale

Referral Bonus

Rank Bonus

Admin Adjustment
```

Main Fields

```
_id

transactionId

userId

type

amount

currency

status

referenceId

description

balanceBefore

balanceAfter

createdBy

createdAt
```

Indexes

```
transactionId

userId

type

status

createdAt
```

This collection is immutable.

---

# 7. Deposits Collection

Purpose

Stores manual deposit requests.

Main Fields

```
_id

userId

packageAmount

walletCredit

transactionId

paymentMethod

paymentScreenshot

status

reviewedBy

reviewedAt

remarks

createdAt
```

Status

```
Pending

Approved

Rejected
```

Indexes

```
userId

status

createdAt
```

---

# 8. Withdrawals Collection

Purpose

Stores withdrawal requests.

Main Fields

```
_id

userId

amount

convertedAmount

paymentMethod

paymentNumber

status

reviewedBy

completedAt

remarks

createdAt
```

Indexes

```
userId

status

createdAt
```

---

# 9. Stocks Collection

Purpose

Stores virtual stocks.

Main Fields

```
_id

symbol

name

description

currentPrice

previousPrice

status

isVisible

displayOrder

createdAt

updatedAt
```

Indexes

```
symbol

status
```

---

# 10. Portfolio Collection

Purpose

Stores purchased stocks.

Main Fields

```
_id

userId

stockId

purchasePrice

quantity

currentPrice

profitLoss

autoSellEnabled

targetPrice

targetProfit

status

createdAt

updatedAt
```

Indexes

```
userId

stockId

status
```

---

# 11. ReferralTrees Collection

Purpose

Stores MLM relationships.

Main Fields

```
_id

userId

parentId

leftChildId

rightChildId

level

position

teamSize

leftCount

rightCount

currentRank

createdAt
```

Indexes

```
userId

parentId

currentRank
```

---

# 12. MLMRanks Collection

Purpose

Stores user rank progress.

Main Fields

```
_id

userId

rankName

rewardPercentage

achievedAt

createdAt
```

Indexes

```
userId

rankName
```

---

# 13. Notifications Collection

Purpose

Stores user notifications.

Main Fields

```
_id

userId

title

message

type

isRead

metadata

createdAt
```

Indexes

```
userId

isRead

createdAt
```

---

# 14. Homepage Collection

Purpose

Stores homepage content.

Main Fields

```
_id

bannerImages

announcements

promotions

marketNews

maintenanceMessage

updatedBy

updatedAt
```

---

# 15. Settings Collection

## Purpose

This is the **most important collection** in the system.

Every configurable business rule is stored here.

No configurable value should ever be hardcoded inside the backend.

Every business module loads configuration through the **Settings Service**.

---

## Document Structure

Each settings category is stored as its own document.

```
{
    category: "currency",
    values: { ... }
}
```

---

## Currency Settings

```
category

exchangeRateBDTToUSD

exchangeRateUSDToBDT

currency

currencySymbol
```

---

## Deposit Settings

```
category

enabled

packages

minimumDeposit

maximumDeposit

paymentMethods

companyAccounts

instructions
```

Packages

```
[
    {
        amount:3000,
        walletCredit:25
    }
]
```

---

## Withdrawal Settings

```
category

enabled

minimumWithdrawal

maximumWithdrawal

waitingPeriod

processingTime

withdrawalFee

paymentMethods
```

---

## Stock Settings

```
category

stockEnabled

autoSellEnabled

minimumPurchase

maximumPurchase

fractionalShares

priceUpdateMode

autoSellInterval
```

---

## Trading Settings

```
category

enabled

maintenanceMode

demoBalance

demoTradingEnabled
```

---

## MLM Settings

```
category

maximumDirectReferrals

firstDepositBonus

profitBonus

rankRequirements
```

---

## Notification Settings

```
category

enabled

depositNotifications

withdrawNotifications

stockNotifications

mlmNotifications

emailNotifications

smsNotifications

pushNotifications
```

---

## Homepage Settings

```
category

bannerImages

announcement

marketNews

maintenanceNotice
```

---

## Security Settings

```
category

jwtExpiration

loginAttempts

passwordPolicy

sessionTimeout
```

---

## General Settings

```
category

platformName

platformLogo

supportEmail

supportPhone

supportWhatsapp

privacyPolicy

termsAndConditions
```

Indexes

```
category
```

---

# 16. AuditLogs Collection

Purpose

Stores every administrator action.

Main Fields

```
_id

userId

action

entity

entityId

before

after

ipAddress

userAgent

createdAt
```

Nothing in this collection should ever be deleted.

---

# 17. Sessions Collection

Purpose

Stores active user sessions.

Main Fields

```
_id

userId

device

browser

ipAddress

expiresAt

createdAt
```

---

# 18. RefreshTokens Collection

Purpose

Stores refresh tokens.

Main Fields

```
_id

userId

token

expiresAt

revoked

createdAt
```

---

# 19. Collection Relationships

```
User
├── Wallet
├── Deposits
├── Withdrawals
├── Transactions
├── Portfolio
├── Notifications
├── Sessions
├── RefreshTokens
└── ReferralTree

Stock
└── Portfolio

Settings
└── Used by Every Module

Homepage
└── Public Website

AuditLogs
└── Admin Activities
```

---

# 20. Index Strategy

Indexes should exist on:

- username
- phoneNumber
- referralId
- transactionId
- userId
- status
- category
- stock symbol
- createdAt
- role

Compound indexes should be created where appropriate for reporting and filtering.

---

# 21. Soft Delete Policy

The following collections support soft deletion:

- Users
- Stocks
- Homepage Content

Financial collections **must never** be deleted:

- Transactions
- Deposits
- Withdrawals
- Wallet History
- Audit Logs

---

# 22. Database Standards

The following rules are mandatory.

- Every document uses ObjectId.
- Every document includes `createdAt` and `updatedAt`.
- Every financial action creates a Transaction record.
- Every configurable business rule comes from the Settings collection.
- Every admin action creates an Audit Log.
- Never duplicate financial data unnecessarily.
- Never hardcode business configuration.
- Optimize frequently queried fields with indexes.
- Design schemas for future expansion without breaking compatibility.
