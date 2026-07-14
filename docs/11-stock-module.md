# Stock Module

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 2.0

---

# 1. Overview

The Stock Module is responsible for managing the platform's virtual investment stocks.

Unlike real-world stock exchanges, the platform administrator controls:

- Available stocks
- Stock prices
- Trading availability
- Price update frequency
- Auto-sell behavior
- Trading maintenance

The Stock Module integrates with:

- Wallet Module
- Portfolio Module
- Trading Module
- Transaction Module
- Notification Module
- Settings Module
- Audit Module

Every configurable rule is loaded from the **Settings Service**.

---

# 2. Objectives

The Stock Module is responsible for:

- Displaying available stocks
- Managing stock prices
- Buying stocks
- Selling stocks
- Managing stock availability
- Calculating profit & loss
- Supporting auto-sell
- Updating user portfolios
- Recording financial transactions

---

# 3. Module Architecture

```
User

↓

Stock Controller

↓

Stock Service

↓

Settings Service

↓

Wallet Service

↓

Portfolio Service

↓

Transaction Service

↓

Notification Service

↓

Audit Service

↓

MongoDB
```

---

# 4. Stock Lifecycle

```
Admin Creates Stock

↓

Stock Becomes Active

↓

User Purchases Stock

↓

Portfolio Updated

↓

Price Changes

↓

Profit/Loss Updated

↓

User Sells

↓

Wallet Updated

↓

Transaction Created
```

---

# 5. Stock Collection

```json
{
  "_id": "...",
  "symbol": "ABC",
  "name": "ABC Technologies",
  "description": "Virtual Investment Stock",
  "currentPrice": 15.75,
  "previousPrice": 15.1,
  "status": "Active",
  "isVisible": true,
  "displayOrder": 1,
  "priceHistory": [],
  "createdBy": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

# 6. Stock Status

Supported statuses

```
Active

Inactive

Maintenance

Archived
```

Only **Active** stocks may be traded.

---

# 7. Stock Settings

All stock rules are loaded from:

```
Settings

↓

Stock Settings
```

Example

```json
{
  "stockEnabled": true,
  "autoSellEnabled": true,
  "minimumPurchase": 10,
  "maximumPurchase": 5000,
  "allowFractionalShares": true,
  "priceUpdateMode": "Manual",
  "autoSellInterval": "5 Minutes"
}
```

Administrators may change these values without redeployment.

---

# 8. Trading Availability

Before every purchase or sale, the Stock Module validates:

- Trading Enabled
- Stock Module Enabled
- Platform Maintenance
- Stock Status
- User Account Status

All values come from the Settings Service.

---

# 9. Stock Listing

```
GET /api/v1/stocks
```

Returns:

- Symbol
- Name
- Current Price
- Previous Price
- Daily Change
- Status

Supports:

- Search
- Pagination
- Sorting

---

# 10. Stock Details

```
GET /api/v1/stocks/:id
```

Returns:

- Complete Stock Information
- Current Price
- Historical Prices
- User Holdings
- Profit/Loss

---

# 11. Buy Stock

```
POST /api/v1/stocks/buy
```

Example Request

```json
{
  "stockId": "...",
  "amount": 100
}
```

The amount represents the amount of wallet balance the user wishes to invest.

---

# 12. Buy Flow

```
Receive Request

↓

Load Settings

↓

Validate Trading

↓

Validate Wallet

↓

Validate Purchase Limits

↓

Calculate Shares

↓

Deduct Wallet

↓

Create Portfolio

↓

Create Transaction

↓

Notification

↓

Audit Log
```

---

# 13. Share Calculation

If fractional shares are enabled:

```
Investment Amount

100 USD

Current Price

20 USD

↓

Shares Purchased

5
```

If fractional shares are allowed:

```
Investment

105 USD

Price

20 USD

↓

5.25 Shares
```

Fractional share support is controlled through the Settings Service.

---

# 14. Sell Stock

```
POST /api/v1/stocks/sell
```

Example

```json
{
  "portfolioId": "...",
  "quantity": 2.5
}
```

---

# 15. Sell Flow

```
Receive Request

↓

Load Portfolio

↓

Load Current Price

↓

Calculate Profit

↓

Update Portfolio

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

# 16. Portfolio Integration

Every purchase creates a Portfolio record.

Example

```json
{
  "userId": "...",
  "stockId": "...",
  "purchasePrice": 20,
  "quantity": 5,
  "currentPrice": 22,
  "profitLoss": 10,
  "status": "Holding"
}
```

---

# 17. Price Management

Stock prices may be updated:

### Manual

Administrators edit prices from the Admin Dashboard.

### Scheduled

Future versions may update prices automatically.

Current mode is loaded from:

```
Settings

↓

Price Update Mode
```

---

# 18. Profit Calculation

```
Current Price

-

Purchase Price

×

Quantity

=

Profit/Loss
```

Profit calculations occur only on the server.

---

# 19. Auto Sell

If enabled:

```
Current Price

↓

Target Price Reached

↓

Automatically Sell

↓

Credit Wallet

↓

Create Transaction

↓

Notification
```

Auto-sell behavior is controlled by Stock Settings.

---

# 20. Purchase Limits

Purchase limits come from:

```
Settings

↓

Stock Settings
```

Example

```
Minimum Purchase

10 USD

Maximum Purchase

5000 USD
```

No limits are hardcoded.

---

# 21. Wallet Integration

Buying

```
Wallet

↓

Decrease Balance

↓

Transaction
```

Selling

```
Wallet

↓

Increase Balance

↓

Transaction
```

Only the Wallet Service can update balances.

---

# 22. Transaction Integration

Buying creates:

```
Stock Purchase
```

Selling creates:

```
Stock Sale
```

Every trade creates an immutable financial transaction.

---

# 23. Notifications

Examples

- Stock Purchased
- Stock Sold
- Auto Sell Executed
- Trading Disabled
- Price Alert (Future)

Notification behavior comes from Settings.

---

# 24. Admin APIs

```
GET /api/v1/admin/stocks

POST /api/v1/admin/stocks

PUT /api/v1/admin/stocks/:id

PATCH /api/v1/admin/stocks/:id/status

DELETE /api/v1/admin/stocks/:id
```

Administrators may:

- Create stocks
- Edit stocks
- Hide stocks
- Archive stocks
- Change prices

---

# 25. Stock Price History

Each price update creates a history entry.

Example

```json
{
  "stockId": "...",
  "price": 20.5,
  "updatedBy": "...",
  "updatedAt": "..."
}
```

Historical data is used for:

- Charts
- Reports
- Analytics

---

# 26. Security

Trading operations require:

- JWT Authentication
- Active User
- Valid Session
- Active Stock
- Trading Enabled

Administrative operations require:

- Admin Role
- Audit Logging

---

# 27. Atomic Transactions

Buying stock executes:

```
Update Wallet

+

Create Portfolio

+

Create Transaction

+

Notification

+

Audit Log
```

Selling stock executes:

```
Update Portfolio

+

Update Wallet

+

Create Transaction

+

Notification

+

Audit Log
```

If any operation fails, everything is rolled back.

---

# 28. Performance

The Stock Module should:

- Cache Stock Settings
- Index Stock Symbol
- Cache frequently viewed stocks
- Paginate stock listings
- Optimize portfolio lookups

---

# 29. Error Handling

Example errors

```
Trading Disabled

Stock Not Found

Stock Inactive

Maintenance Mode

Insufficient Wallet Balance

Purchase Below Minimum

Purchase Above Maximum

Fractional Shares Disabled

Portfolio Not Found

Unauthorized
```

All responses follow the platform's standard API format.

---

# 30. Future Features

Future releases may support:

- Live Market Data
- AI Price Simulation
- Dividend Distribution
- Stock Splits
- Stop Loss Orders
- Limit Orders
- Watchlists
- Candlestick Charts
- Portfolio Analytics
- Market Sectors
- Stock Categories
- Price Alerts
- Automated Trading Engine

The architecture should support these features without major redesign.

---

# 31. Reporting

The Stock Module provides data for:

- Trading Reports
- Stock Performance
- Most Purchased Stocks
- Most Sold Stocks
- User Portfolio Reports
- Profit Reports
- Daily Trading Volume

---

# 32. Development Rules

The following rules are mandatory.

- Every stock purchase must create a Portfolio record.
- Every stock purchase must create a Transaction record.
- Every stock sale must create a Transaction record.
- Wallet balances must only be updated through the Wallet Service.
- Trading availability must come from the Settings Service.
- Purchase limits must come from the Settings Service.
- Fractional share support must come from the Settings Service.
- Auto-sell configuration must come from the Settings Service.
- Stock prices must never be trusted from the client.
- Profit calculations must occur exclusively on the server.
- Every financial operation must execute as an atomic MongoDB transaction.
- Administrative changes must generate Audit Logs.
- Price history must be preserved for reporting and analytics.
- The Stock Module must remain extensible for future real-time trading features without significant architectural changes.
