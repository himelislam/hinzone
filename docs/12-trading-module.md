# Trading Module

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 2.0

---

# 1. Overview

The Trading Module is responsible for executing all investment trading operations within the platform.

Unlike the Stock Module, which manages stock data, the Trading Module manages the complete trading lifecycle, including:

- Buy Orders
- Sell Orders
- Trade Validation
- Portfolio Updates
- Profit Calculation
- Auto Sell Execution
- Trading Sessions
- Trading Restrictions

The Trading Module acts as the business engine between the Wallet, Portfolio, and Stock modules.

---

# 2. Objectives

The Trading Module is responsible for:

- Executing buy orders
- Executing sell orders
- Validating trading rules
- Calculating profits
- Managing trading sessions
- Supporting auto-sell
- Recording trade history
- Preventing invalid trades

---

# 3. Module Architecture

```
Client

↓

Trading Controller

↓

Trading Service

↓

Settings Service

↓

Stock Service

↓

Portfolio Service

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

The Trading Module never accesses MongoDB directly.

---

# 4. Trading Workflow

```
User Creates Order

↓

Load Trading Settings

↓

Validate User

↓

Validate Stock

↓

Validate Wallet

↓

Execute Trade

↓

Update Portfolio

↓

Update Wallet

↓

Create Transaction

↓

Notification

↓

Audit Log
```

---

# 5. Trading Modes

The platform supports:

### Live Trading

Uses administrator-controlled stock prices.

---

### Demo Trading

Uses virtual funds.

No real wallet balance is affected.

---

Future versions may support:

- Paper Trading
- Tournament Mode
- AI Trading

---

# 6. Trading Settings

The Trading Module loads all rules from:

```
Settings

↓

Trading Settings
```

Example

```json
{
  "enabled": true,
  "maintenanceMode": false,
  "demoTradingEnabled": true,
  "demoBalance": 1000,
  "allowWeekendTrading": true,
  "marketOpenTime": "09:00",
  "marketCloseTime": "18:00"
}
```

Administrators can update these values without deployment.

---

# 7. Trading Validation

Before executing any order, validate:

- Trading Enabled
- Platform Not in Maintenance
- User Active
- Stock Active
- Wallet Exists
- Purchase Limits
- Sufficient Balance

---

# 8. Buy Order

```
POST /api/v1/trading/buy
```

Example

```json
{
  "stockId": "...",
  "amount": 250
}
```

---

# 9. Buy Order Flow

```
Receive Order

↓

Load Settings

↓

Validate Trading

↓

Load Stock

↓

Validate Wallet

↓

Calculate Shares

↓

Deduct Wallet

↓

Create Portfolio Position

↓

Create Transaction

↓

Notification

↓

Audit Log
```

---

# 10. Sell Order

```
POST /api/v1/trading/sell
```

Example

```json
{
  "portfolioId": "...",
  "quantity": 3
}
```

---

# 11. Sell Order Flow

```
Receive Request

↓

Load Portfolio

↓

Load Current Price

↓

Calculate Profit

↓

Credit Wallet

↓

Update Portfolio

↓

Create Transaction

↓

Notification

↓

Audit Log
```

---

# 12. Trading Dashboard

```
GET /api/v1/trading/dashboard
```

Returns:

- Current Portfolio Value
- Total Investment
- Total Profit
- Today's Profit
- Active Positions
- Trading Statistics

---

# 13. Trading History

```
GET /api/v1/trading/history
```

Supports:

- Pagination
- Date Range
- Buy Orders
- Sell Orders
- Stock Filter

---

# 14. Open Positions

```
GET /api/v1/trading/positions
```

Returns:

- Stock
- Quantity
- Purchase Price
- Current Price
- Profit/Loss
- ROI

---

# 15. Closed Positions

```
GET /api/v1/trading/history/closed
```

Returns completed trades.

---

# 16. Profit Calculation

```
(Current Price

-

Purchase Price)

×

Quantity

=

Profit/Loss
```

All calculations occur on the backend.

---

# 17. ROI Calculation

```
(Current Value

-

Investment)

÷

Investment

×

100
```

Example

```
Investment

100 USD

Current Value

120 USD

ROI

20%
```

---

# 18. Auto Sell

If enabled:

```
Current Price

↓

Target Price Reached

↓

Sell Automatically

↓

Wallet Updated

↓

Transaction Created

↓

Notification
```

Auto Sell settings come from the Settings Service.

---

# 19. Trading Sessions

Trading sessions may be configured.

Example

```
Open

09:00

Close

18:00
```

Outside trading hours:

New trades are rejected.

Administrators may disable session restrictions.

---

# 20. Demo Trading

Demo trading uses:

```
Demo Wallet

↓

Virtual Portfolio

↓

Virtual Profit
```

No real wallet data is modified.

Demo balance is configured through:

```
Trading Settings
```

---

# 21. Wallet Integration

Buying

```
Wallet

↓

Decrease Balance
```

Selling

```
Wallet

↓

Increase Balance
```

Wallet updates always occur through the Wallet Service.

---

# 22. Portfolio Integration

Buying creates:

- New Position

Selling updates:

- Existing Position

When quantity reaches zero:

```
Status

↓

Closed
```

---

# 23. Transaction Integration

Every completed trade creates a financial transaction.

Examples

```
Stock Purchase

Stock Sale
```

Transactions are immutable.

---

# 24. Notification Integration

Trading notifications include:

- Buy Completed
- Sell Completed
- Auto Sell Executed
- Trading Disabled
- Position Closed

Notification settings come from the Settings Service.

---

# 25. Admin Controls

Administrators may:

- Enable Trading
- Disable Trading
- Enable Maintenance
- Configure Demo Balance
- Configure Trading Hours
- Configure Market Status

No code changes are required.

---

# 26. Security

Trading requires:

- JWT Authentication
- Active User
- Valid Session
- Active Wallet
- Trading Enabled

Admin actions require:

- Admin Role
- Audit Logging

---

# 27. Concurrency Protection

To prevent duplicate trades:

```
Lock Wallet

↓

Validate Balance

↓

Execute Trade

↓

Unlock Wallet
```

Only one trade may modify a wallet at a time.

---

# 28. Atomic Transactions

Every trade executes as a MongoDB transaction.

```
Wallet

+

Portfolio

+

Transaction

+

Notification

+

Audit Log
```

If any operation fails:

Everything rolls back.

---

# 29. Error Handling

Example errors

```
Trading Disabled

Maintenance Mode

Stock Not Found

Stock Inactive

Insufficient Balance

Portfolio Not Found

Market Closed

Invalid Quantity

Demo Trading Disabled

Unauthorized
```

All errors follow the standard API response format.

---

# 30. Performance

The Trading Module should:

- Cache trading settings
- Cache active stocks
- Index portfolio lookups
- Optimize profit calculations
- Paginate trade history
- Use MongoDB transactions for consistency

---

# 31. Future Features

Future releases may support:

- Live Price Engine
- Stop Loss Orders
- Limit Orders
- Trailing Stop Orders
- Take Profit Orders
- Margin Trading
- Futures Trading
- AI Trading Bots
- Trading Competitions
- Trading Signals
- Real-Time WebSocket Updates
- Multi-Market Support

The module should be designed to support these features without major restructuring.

---

# 32. Reporting

The Trading Module provides data for:

- Trading Volume
- Daily Trades
- User Trading Activity
- Portfolio Performance
- ROI Reports
- Profit Reports
- Trading Leaderboard (Future)

---

# 33. Development Rules

The following rules are mandatory.

- Every trade must be validated on the server.
- Trading availability must come from the Settings Service.
- Trading hours must come from the Settings Service.
- Demo trading configuration must come from the Settings Service.
- Wallet balances must only be modified through the Wallet Service.
- Portfolio updates must only occur through the Portfolio Service.
- Every completed trade must create a Transaction record.
- Profit and ROI calculations must occur only on the backend.
- The client must never submit calculated values such as profit or share quantity as trusted inputs.
- Every trade must execute as an atomic MongoDB transaction.
- Administrative trading changes must generate Audit Logs.
- All configurable business rules must be stored in the Settings collection.
- The Trading Module must remain modular and extensible for future real-time trading capabilities.
