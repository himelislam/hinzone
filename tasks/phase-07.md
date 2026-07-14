# Phase 07 — Stock Management System

## Goal

Build the complete Stock Management Module that allows administrators to manage all investment products (stocks) available on the platform.

This phase **does not implement stock trading**. It only creates and manages the stock catalog that will be used by the Trading Module in the next phase.

All stock behavior must be configurable through the **Settings Service**.

---

# Objectives

- Stock Catalog
- Stock Categories
- Stock CRUD
- Stock Pricing
- Stock Availability
- Stock Images
- Stock Performance History
- Admin Stock Management
- Public Stock APIs
- Audit Logging

---

# Backend Tasks

## Stock Module

Create

```
modules/

stock/

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

# Stock Schema

Fields

- Stock Symbol
- Stock Name
- Company Name
- Description
- Category
- Industry
- Logo URL
- Current Price
- Previous Price
- Currency
- Daily Change
- Daily Change Percentage
- Total Shares
- Available Shares
- Minimum Purchase
- Maximum Purchase
- Allow Fractional Shares
- Dividend Enabled
- Status
- Featured
- Display Order
- Created At
- Updated At

---

# Stock Status

Supported values

```
ACTIVE

INACTIVE

SUSPENDED

ARCHIVED
```

Only

```
ACTIVE
```

stocks can be traded.

---

# Stock Categories

Examples

```
Technology

Finance

Healthcare

Energy

Telecommunication

Manufacturing

Consumer Goods

Industrial

ETF

Crypto ETF

Index Fund
```

Categories should be stored separately or managed dynamically.

---

# Stock Symbol Rules

Examples

```
AAPL

GOOGL

MSFT

TSLA

META
```

Must be unique.

---

# Settings Integration

Load stock configuration from the Settings Service.

Required settings

- Stock Trading Enabled
- Auto Sell Enabled
- Minimum Purchase
- Maximum Purchase
- Fractional Shares
- Price Update Mode
- Auto Sell Interval

Never hardcode these values.

---

# Stock Price History

Create a dedicated collection

```
MarketHistory
```

Fields

- Stock ID
- Previous Price
- New Price
- Change
- Percentage Change
- Source
- Updated By
- Created At

This collection enables future charting and analytics.

---

# Stock Image Upload

Use

```
Cloudinary
```

Supported

- JPG
- PNG
- SVG
- WEBP

Store only Cloudinary URLs.

---

# Stock Service

Create

```
StockService
```

Methods

```
createStock()

updateStock()

deleteStock()

archiveStock()

changeStatus()

updatePrice()

getStock()

getStocks()

getFeaturedStocks()

getCategories()

searchStocks()

recordPriceHistory()
```

---

# Price Update

Workflow

```
Admin

↓

Update Price

↓

Validate

↓

Save New Price

↓

Record Previous Price

↓

Calculate Change

↓

Create Market History

↓

Audit Log
```

No trading logic should occur yet.

---

# Featured Stocks

Support

```
Featured = true
```

Used on

- Homepage
- Dashboard
- Investment Page

---

# Search & Filtering

Support

- Stock Name
- Company
- Symbol
- Category
- Industry
- Status
- Featured

Sorting

- Name
- Symbol
- Price
- Daily Gain
- Daily Loss
- Recently Updated

---

# Pagination

Support server-side pagination.

---

# Stock Availability

Track

```
Total Shares

Available Shares
```

Do not decrease available shares in this phase.

That occurs in Trading.

---

# Validation

Validate

- Unique Symbol
- Positive Price
- Positive Shares
- Valid Category
- Image Type
- Active Settings

---

# Audit Logs

Log

- Stock Created
- Stock Updated
- Price Updated
- Status Changed
- Stock Archived
- Stock Deleted

Include

- Previous Value
- New Value
- Admin
- Timestamp

---

# API Endpoints

Public

```
GET /api/v1/stocks

GET /api/v1/stocks/featured

GET /api/v1/stocks/categories

GET /api/v1/stocks/:id

GET /api/v1/stocks/:id/history
```

Admin

```
POST   /api/v1/admin/stocks

GET    /api/v1/admin/stocks

GET    /api/v1/admin/stocks/:id

PUT    /api/v1/admin/stocks/:id

PATCH  /api/v1/admin/stocks/:id/status

PATCH  /api/v1/admin/stocks/:id/price

DELETE /api/v1/admin/stocks/:id
```

---

# Frontend Tasks

## Public Pages

Create

- Stock Listing
- Stock Details
- Featured Stocks

---

# Stock Listing

Display

- Logo
- Company
- Symbol
- Current Price
- Daily Change
- Category

Support

- Search
- Filters
- Sorting
- Pagination

---

# Stock Details

Display

- Company Information
- Description
- Current Price
- Daily Change
- Historical Prices
- Category
- Industry

Prepare layout for future trading actions.

---

# Admin Pages

Create

- Stock Dashboard
- Create Stock
- Edit Stock
- Price Management
- Stock Categories
- Stock History

---

# Admin Stock Form

Fields

- Company Name
- Symbol
- Description
- Category
- Industry
- Logo
- Price
- Shares
- Featured
- Status

---

# Price Update Screen

Display

- Current Price
- Previous Price
- Percentage Change

Actions

- Update Price

Require confirmation before saving.

---

# Components

Create reusable

```
StockCard

StockTable

StockForm

StockStatusBadge

StockPriceCard

PriceHistoryTable

FeaturedStockCard

CategoryFilter

StockSearch
```

---

# React Query Hooks

Create

```
useStocks()

useStock()

useFeaturedStocks()

useStockHistory()

useCreateStock()

useUpdateStock()

useUpdateStockPrice()

useDeleteStock()
```

---

# Security

Only authenticated users may access protected endpoints.

Only

```
ADMIN

SUPER_ADMIN
```

may

- Create Stocks
- Update Stocks
- Delete Stocks
- Update Prices

Public users may only view active stocks.

---

# Performance

Indexes

- Symbol
- Category
- Industry
- Status
- Featured
- Created At

Optimize

- Listing
- Search
- Filtering
- Price History

---

# Testing

Backend

- Stock CRUD
- Price Updates
- Validation
- Status Changes
- Search
- Filtering
- Pagination
- Market History
- Authorization

Frontend

- Stock Listing
- Stock Details
- Filters
- Admin CRUD
- Price Updates
- Validation
- Error Handling

---

# Deliverables

Backend

- Stock Module
- Market History Module
- CRUD APIs
- Price Update Engine
- Search & Filtering
- Audit Logging

Frontend

- Stock Listing
- Stock Details
- Admin Stock Management
- Price Management
- React Query Hooks

Infrastructure

- Cloudinary Integration
- Dynamic Settings Integration
- Market History Tracking

---

# Exit Criteria

Before moving to Phase 08:

- Administrators can create, update, archive, and delete stocks.
- Stock prices can be updated and historical price records are created automatically.
- Featured stocks and categories work correctly.
- Search, filtering, sorting, and pagination are fully functional.
- Public users can view only active stocks.
- Stock rules are loaded from the Settings Service.
- Audit logs record every administrative action.
- No trading, portfolio, or wallet balance changes occur in this phase.
- No TypeScript or ESLint errors exist.
- Unit and integration tests pass successfully.
