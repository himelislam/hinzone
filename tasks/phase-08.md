# Phase 08 — Trading & Portfolio Management System

## Goal

Build the complete Trading Engine that allows users to purchase, manage, and sell stocks while maintaining accurate portfolio records and wallet balances.

This phase introduces the core investment functionality of the platform.

All trading rules must be loaded dynamically from the **Settings Service**. No trading rules should ever be hardcoded.

Every financial operation must use MongoDB transactions to guarantee consistency.

---

# Objectives

- Buy Stocks
- Sell Stocks
- Portfolio Management
- Portfolio Transactions
- Profit & Loss Calculation
- Auto Sell Support
- Trading Validation
- Wallet Integration
- Notification Integration
- Audit Logging

---

# Backend Tasks

## Trading Module

Create

```
modules/

trading/

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

# Portfolio Schema

Each purchased stock creates or updates a portfolio record.

Fields

- User ID
- Stock ID
- Total Shares
- Average Purchase Price
- Current Price
- Total Investment
- Current Value
- Unrealized Profit
- Unrealized Loss
- Profit Percentage
- Last Purchase Date
- Last Sell Date
- Status
- Created At
- Updated At

---

# Portfolio Status

```
ACTIVE

CLOSED
```

---

# Portfolio Transaction Schema

Create a dedicated collection.

Fields

- Transaction Number
- Portfolio ID
- User ID
- Stock ID
- Transaction Type
- Share Quantity
- Stock Price
- Total Amount
- Wallet Transaction ID
- Status
- Created At

---

# Trading Types

Supported

```
BUY

SELL

AUTO_SELL
```

---

# Trading Status

```
PENDING

COMPLETED

FAILED

CANCELLED
```

---

# Settings Integration

Trading rules must always come from the Settings Service.

Required settings

- Trading Enabled
- Maintenance Mode
- Demo Trading Enabled
- Auto Sell Enabled
- Minimum Purchase Amount
- Maximum Purchase Amount
- Fractional Shares
- Auto Sell Interval

Never hardcode these values.

---

# Buy Stock Validation

Before purchase

Validate

- Trading Enabled
- Maintenance Mode
- Wallet Status
- Wallet Balance
- Stock Status
- Available Shares
- Minimum Purchase
- Maximum Purchase
- Fractional Share Rule

Reject invalid requests immediately.

---

# Buy Workflow

```
User

↓

Validate Settings

↓

Validate Wallet

↓

Validate Stock

↓

Calculate Total Cost

↓

Start MongoDB Transaction

↓

WalletService.debit()

↓

Reduce Available Shares

↓

Create Portfolio

↓

Create Portfolio Transaction

↓

Create Wallet Transaction

↓

Commit Transaction

↓

Notification

↓

Audit Log
```

Every step must succeed or rollback.

---

# Existing Portfolio Logic

If the user already owns the stock

```
Update Portfolio

↓

Recalculate

Average Purchase Price

↓

Increase Shares

↓

Increase Investment

↓

Update Current Value
```

Do not create duplicate portfolio records.

---

# Sell Stock Validation

Validate

- Trading Enabled
- Stock Status
- Portfolio Exists
- User Owns Shares
- Sufficient Shares
- Wallet Status

---

# Sell Workflow

```
User

↓

Validate

↓

Calculate Sale Value

↓

MongoDB Transaction

↓

WalletService.credit()

↓

Increase Available Shares

↓

Update Portfolio

↓

Create Portfolio Transaction

↓

Create Wallet Transaction

↓

Commit

↓

Notification

↓

Audit Log
```

---

# Portfolio Calculation

Automatically calculate

```
Current Value

=

Current Stock Price

×

Owned Shares
```

---

Calculate

```
Profit

=

Current Value

-

Investment
```

---

Calculate

```
Profit %

```

Automatically after every

- Buy
- Sell
- Price Update

---

# Stock Price Synchronization

Whenever an administrator updates a stock price

```
Stock Updated

↓

Recalculate

↓

All Related Portfolios
```

Portfolio values should always reflect the latest stock price.

---

# Auto Sell Support

Prepare infrastructure for

```
Auto Sell
```

Fields

- Enabled
- Trigger Price
- Stop Loss
- Take Profit

Do not implement scheduler yet.

---

# Wallet Integration

Buying

↓

```
WalletService.debit()
```

Category

```
BUY_STOCK
```

Selling

↓

```
WalletService.credit()
```

Category

```
SELL_STOCK
```

Never modify wallet balances directly.

---

# Portfolio Transaction History

Support filtering

- Buy
- Sell
- Date
- Stock
- Amount

Sorting

- Latest
- Oldest

Pagination required.

---

# Notification Integration

Notify User

- Stock Purchased
- Stock Sold
- Auto Sell Executed (future)

Respect notification settings.

---

# Audit Logs

Record

- Buy
- Sell
- Portfolio Update
- Auto Sell Configuration

Include

- User
- Stock
- Shares
- Amount
- Timestamp

---

# API Endpoints

Trading

```
POST /api/v1/trading/buy

POST /api/v1/trading/sell
```

Portfolio

```
GET /api/v1/portfolio

GET /api/v1/portfolio/:id

GET /api/v1/portfolio/history
```

Admin

```
GET /api/v1/admin/portfolio

GET /api/v1/admin/portfolio/:id
```

---

# Frontend Tasks

## Portfolio Dashboard

Display

- Total Investment
- Current Portfolio Value
- Total Profit
- Total Loss
- ROI
- Active Investments

---

# Stock Purchase Page

Display

- Current Price
- Available Shares
- Estimated Cost
- Wallet Balance

Actions

- Buy

---

# Sell Page

Display

- Owned Shares
- Current Price
- Estimated Return
- Current Profit

Actions

- Sell

---

# Portfolio Page

Display

- Company
- Shares
- Average Price
- Current Price
- Investment
- Current Value
- Profit
- ROI

Support

- Search
- Filters
- Sorting
- Pagination

---

# Portfolio History

Display

- Buy Transactions
- Sell Transactions
- Share Quantity
- Amount
- Date

---

# Components

Create reusable

```
PortfolioCard

PortfolioTable

PortfolioSummary

TradingForm

BuyStockModal

SellStockModal

ProfitBadge

StockHoldingCard

PortfolioHistoryTable
```

---

# React Query Hooks

Create

```
usePortfolio()

usePortfolioDetails()

usePortfolioHistory()

useBuyStock()

useSellStock()
```

---

# Security

Only authenticated users may trade.

Only administrators may access

```
Admin Portfolio APIs
```

All ownership validations must be enforced.

---

# Performance

Indexes

- User ID
- Stock ID
- Portfolio ID
- Transaction Number
- Created At

Optimize

- Portfolio Listing
- Portfolio History
- Stock Holdings

---

# Testing

Backend

- Buy Workflow
- Sell Workflow
- Wallet Integration
- Portfolio Updates
- Average Price Calculation
- Profit Calculation
- MongoDB Transactions
- Validation
- Authorization

Frontend

- Buy Form
- Sell Form
- Portfolio Dashboard
- Portfolio History
- Validation
- Error Handling

---

# Deliverables

Backend

- Trading Module
- Portfolio Module
- Portfolio Transactions
- Wallet Integration
- Profit Calculation Engine
- Audit Logging

Frontend

- Trading Pages
- Portfolio Dashboard
- Buy/Sell UI
- Portfolio History
- React Query Hooks

Infrastructure

- Atomic Trading Transactions
- Dynamic Settings Integration
- Portfolio Recalculation Engine

---

# Exit Criteria

Before moving to Phase 09:

- Users can successfully buy stocks.
- Users can successfully sell owned stocks.
- Wallet balances are updated only through WalletService.
- Portfolio records are created and updated correctly.
- Average purchase price is calculated correctly.
- Profit and ROI calculations are accurate.
- Stock availability updates correctly after trades.
- Portfolio values automatically update when stock prices change.
- Every trade creates wallet and portfolio transaction records.
- Notifications are generated according to Settings.
- Audit logs are created for all trading activities.
- No configurable trading rules are hardcoded.
- No TypeScript or ESLint errors exist.
- Unit, integration, and transaction rollback tests pass successfully.
