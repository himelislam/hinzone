# Dashboard Pages

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 2.0

---

# 1. Overview

The Dashboard is the primary interface for both **Users** and **Administrators**.

The application contains two separate dashboard experiences:

- User Dashboard
- Admin Dashboard

Each dashboard provides role-specific pages, widgets, analytics, and management tools.

All dashboard data is retrieved through secured APIs and respects Role-Based Access Control (RBAC).

---

# 2. Dashboard Principles

The dashboard should be:

- Fast
- Responsive
- Mobile Friendly
- Modern UI
- Reusable Components
- Real-time Ready
- Modular
- Role Based

---

# 3. User Dashboard Navigation

```
Dashboard

Portfolio

Stocks

Trading

Wallet

Deposits

Withdrawals

Transactions

MLM

Notifications

Profile

Settings
```

---

# 4. User Dashboard Home

The Dashboard Home displays a complete financial overview.

Widgets include:

- Wallet Balance
- Total Investment
- Current Portfolio Value
- Total Profit / Loss
- Total Deposits
- Total Withdrawals
- Referral Earnings
- Rank Earnings
- Current Rank
- Team Size
- Recent Notifications

---

# 5. Dashboard Cards

Example Cards

```
Wallet Balance

$350
```

```
Portfolio Value

$1,250
```

```
Today's Profit

+$35
```

```
Current Rank

Silver
```

Cards should support:

- Loading State
- Empty State
- Error State

---

# 6. Dashboard Charts

Charts include:

### Portfolio Growth

```
Line Chart
```

---

### Deposit History

```
Bar Chart
```

---

### Withdrawal History

```
Bar Chart
```

---

### Trading Profit

```
Area Chart
```

---

### Referral Growth

```
Line Chart
```

---

### Monthly Earnings

```
Column Chart
```

---

# 7. Portfolio Page

Route

```
/dashboard/portfolio
```

Displays:

- Holdings
- Purchase Price
- Current Price
- Profit
- ROI
- Quantity
- Investment Amount

Actions:

- Sell Stock
- View Details

---

# 8. Stocks Page

Route

```
/dashboard/stocks
```

Features:

- Stock List
- Search
- Filter
- Buy Stock
- View Price
- View Details

---

# 9. Trading Page

Route

```
/dashboard/trading
```

Displays:

- Open Positions
- Closed Positions
- Trade History
- Today's Profit
- ROI

Actions:

- Buy
- Sell

---

# 10. Wallet Page

Route

```
/dashboard/wallet
```

Displays:

- Wallet Balance
- Total Deposits
- Total Withdrawals
- Total Bonuses
- Total Investment
- Total Profit

---

# 11. Deposit Page

Route

```
/dashboard/deposits
```

Features:

- Create Deposit
- Upload Screenshot
- Deposit History
- Deposit Status

---

# 12. Withdrawal Page

Route

```
/dashboard/withdrawals
```

Features:

- Create Withdrawal
- Withdrawal History
- Waiting Period
- Withdrawal Status

---

# 13. Transaction Page

Route

```
/dashboard/transactions
```

Displays:

- Deposits
- Withdrawals
- Purchases
- Sales
- Bonuses

Supports:

- Search
- Date Filter
- Pagination

---

# 14. MLM Dashboard

Route

```
/dashboard/mlm
```

Displays:

- Referral Link
- Binary Tree
- Current Rank
- Referral Earnings
- Rank Bonus
- Team Statistics
- Referral List

---

# 15. Referral Tree Page

Displays:

- Parent
- Left Team
- Right Team
- Team Growth

Supports recursive loading.

---

# 16. Commission History

Displays:

- Commission Type
- Deposit Package
- Referral Level
- Commission Amount
- Date

---

# 17. Notifications Page

Displays:

- Unread Notifications
- Notification History
- Read Status

Actions:

- Mark Read
- Mark All Read

---

# 18. User Profile Page

Displays:

- Personal Information
- Username
- Phone Number
- Referral Code
- Rank
- Registration Date

Actions:

- Update Profile
- Change Password

---

# 19. User Settings Page

Displays:

- Password
- Security
- Notification Preferences (Future)

---

# 20. Admin Dashboard Navigation

```
Dashboard

Users

Wallets

Deposits

Withdrawals

Stocks

Trading

Portfolio

MLM

Settings

Notifications

Reports

Audit Logs

Roles

Profile
```

---

# 21. Admin Dashboard Home

Widgets

- Total Users
- Active Users
- Total Deposits
- Total Withdrawals
- Wallet Balance
- Pending Deposits
- Pending Withdrawals
- Total Trades
- Revenue
- Current Maintenance Mode

---

# 22. Admin Analytics

Charts

- Daily Registrations
- Deposit Volume
- Withdrawal Volume
- Trading Volume
- Revenue Growth
- MLM Growth
- Rank Distribution
- User Growth

---

# 23. Users Page

Route

```
/admin/users
```

Features

- Search
- Filter
- View Details
- Suspend
- Activate
- Block
- Reset Password

---

# 24. Wallet Management

Route

```
/admin/wallets
```

Features

- View Wallet
- Credit
- Debit
- Wallet History

---

# 25. Deposit Management

Route

```
/admin/deposits
```

Actions

- Approve
- Reject
- View Screenshot
- View Transaction ID

---

# 26. Withdrawal Management

Route

```
/admin/withdrawals
```

Actions

- Approve
- Reject
- Mark Processing
- Mark Completed

---

# 27. Stock Management

Route

```
/admin/stocks
```

Features

- Create Stock
- Edit Stock
- Delete Stock
- Update Price
- Archive Stock

---

# 28. Trading Management

Route

```
/admin/trading
```

Displays

- Trading Volume
- Open Trades
- Closed Trades
- Trading Status

Actions

- Enable Trading
- Disable Trading

---

# 29. MLM Management

Route

```
/admin/mlm
```

Displays

- Referral Tree
- Commission History
- Team Statistics
- Rank Distribution

Actions

- Recalculate Ranks
- Rebuild Tree

---

# 30. Settings Page

Route

```
/admin/settings
```

The Settings page manages every configurable business rule.

Categories

```
General

Currency

Deposits

Withdrawals

Stocks

Trading

MLM

Notifications

Security

Homepage
```

Every form validates input before saving.

Changes become effective immediately after cache refresh.

---

# 31. Reports Page

Route

```
/admin/reports
```

Reports

- Users
- Deposits
- Withdrawals
- Wallet
- Trading
- MLM
- Revenue

Exports

- PDF
- Excel
- CSV

---

# 32. Audit Logs

Route

```
/admin/audit-logs
```

Displays

- User
- Action
- Module
- Previous Value
- New Value
- IP Address
- Timestamp

Supports:

- Search
- Filters
- Pagination

---

# 33. Notification Management

Route

```
/admin/notifications
```

Features

- Broadcast Announcement
- View Notifications
- Notification Statistics

---

# 34. Dashboard Layout

The application should use a consistent layout.

```
Sidebar

↓

Top Navbar

↓

Breadcrumb

↓

Content

↓

Footer
```

The sidebar should support collapsing.

---

# 35. Global Components

Reusable components include:

- Sidebar
- Navbar
- Breadcrumb
- Page Header
- Statistic Card
- Data Table
- Charts
- Search Bar
- Filter Panel
- Pagination
- Confirmation Dialog
- Loading Skeleton
- Empty State
- Error State
- Toast Notifications

---

# 36. Data Tables

Every table should support:

- Pagination
- Search
- Sorting
- Column Filters
- Bulk Selection (Future)
- CSV Export

---

# 37. Responsive Design

Supported devices

- Desktop
- Laptop
- Tablet
- Mobile

Sidebar behavior

Desktop

```
Expanded
```

Tablet

```
Collapsed
```

Mobile

```
Drawer Navigation
```

---

# 38. Permissions

Dashboard pages are protected using RBAC.

User Pages

```
USER
```

Admin Pages

```
ADMIN

SUPER_ADMIN
```

Unauthorized users receive a 403 response.

---

# 39. Performance

Dashboard pages should:

- Lazy-load routes
- Cache dashboard summaries
- Paginate large datasets
- Use optimistic UI where appropriate
- Minimize API requests

---

# 40. Future Dashboard Features

Future releases may include:

- Dark Mode
- Custom Dashboard Widgets
- Widget Drag & Drop
- Saved Filters
- Live Market Updates
- WebSocket Notifications
- AI Insights
- Personalized Dashboard
- Multi-Language Support
- Theme Customization

---

# 41. Development Rules

The following rules are mandatory.

- All dashboard pages must consume REST APIs only.
- Business logic must never exist in React components.
- Shared UI elements should be implemented as reusable components.
- Every page must support loading, empty, and error states.
- Large datasets must implement server-side pagination.
- Dashboard widgets should use optimized summary APIs.
- Role-based authorization must protect every route.
- Settings changes must be reflected immediately after cache refresh.
- Charts should consume aggregated API endpoints instead of raw data.
- The dashboard must remain modular so additional pages can be added without restructuring the application.
