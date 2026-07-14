# Admin Panel

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 2.0

---

# 1. Overview

The Admin Panel is the central management system of the platform.

It allows administrators to manage every aspect of the application without modifying source code or accessing the database directly.

The Admin Panel is responsible for:

- User Management
- Platform Settings
- Deposit Management
- Withdrawal Management
- Stock Management
- Trading Management
- MLM Management
- Wallet Management
- Notifications
- Reports
- Audit Logs
- Dashboard Analytics

The Admin Panel is only accessible to users with **Admin** or **Super Admin** privileges.

---

# 2. Objectives

The Admin Panel should provide:

- Complete platform administration
- Real-time monitoring
- Financial management
- Business configuration
- Security controls
- Reporting tools
- Audit history
- Role-based permissions

---

# 3. Architecture

```
Admin Dashboard

↓

Admin API

↓

Admin Controller

↓

Business Services

↓

Settings Service

↓

MongoDB
```

The Admin Panel should never communicate directly with the database.

Every operation must go through the appropriate service layer.

---

# 4. Dashboard Overview

The dashboard displays real-time platform statistics.

Widgets include:

- Total Users
- Active Users
- Total Deposits
- Total Withdrawals
- Wallet Balance
- Total Investments
- Total Trades
- Pending Deposits
- Pending Withdrawals
- Today's Registrations
- Today's Revenue
- Current Maintenance Status

---

# 5. Dashboard Charts

Charts include:

- Daily Registrations
- Deposit Trends
- Withdrawal Trends
- Trading Activity
- Commission Distribution
- Rank Distribution
- Revenue Growth
- Monthly Financial Summary

Charts support:

- Daily
- Weekly
- Monthly
- Yearly

---

# 6. Admin Navigation

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

Roles & Permissions

Profile
```

Navigation should support desktop and mobile layouts.

---

# 7. User Management

Administrators can:

- View Users
- Search Users
- Filter Users
- Suspend Users
- Activate Users
- Block Users
- Reset Passwords
- View Wallet
- View Deposits
- View Withdrawals
- View Portfolio
- View MLM Tree
- View Audit Logs

---

# 8. User Details

Each user profile displays:

- Personal Information
- Referral Information
- Wallet Summary
- Portfolio
- Deposits
- Withdrawals
- Transactions
- Login History
- Sessions
- Notifications
- Rank Information

---

# 9. Wallet Management

Administrators may:

- View Wallet
- Credit Wallet
- Debit Wallet
- Freeze Wallet (Future)
- View Transaction History

Every adjustment requires:

- Reason
- Audit Log

---

# 10. Deposit Management

Features:

- View Deposits
- Search Deposits
- Filter Deposits
- Approve Deposits
- Reject Deposits
- View Screenshots
- View Payment Details

Approval triggers:

- Wallet Credit
- Transaction Creation
- MLM Commission
- Notifications

---

# 11. Withdrawal Management

Features:

- View Requests
- Filter Requests
- Approve
- Reject
- Mark Processing
- Mark Completed

Completion triggers:

- Wallet Update
- Transaction Creation
- Notification

---

# 12. Stock Management

Administrators can:

- Create Stock
- Edit Stock
- Change Price
- Archive Stock
- Activate Stock
- Hide Stock
- View Price History

Future:

- Bulk Price Updates
- CSV Import

---

# 13. Trading Management

Administrators may:

- Enable Trading
- Disable Trading
- Enable Demo Mode
- Configure Trading Hours
- View Trades
- View Trading Statistics

---

# 14. Portfolio Management

Administrators may:

- View User Portfolios
- Search Holdings
- View Profit/Loss
- View Closed Positions
- View Open Positions

Portfolio records are read-only unless special administrative actions are introduced.

---

# 15. MLM Management

Administrators can:

- View Referral Tree
- View Team Structure
- View Commissions
- View Rank Distribution
- Recalculate Ranks
- Rebuild Referral Tree
- View Referral Statistics

---

# 16. Settings Management

The Admin Panel contains a centralized Settings page.

Categories include:

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

Every setting is editable using forms.

Changes become effective immediately after saving.

No server restart is required.

---

# 17. General Settings

Editable fields:

- Platform Name
- Platform Logo
- Platform Email
- Support Phone
- WhatsApp
- Privacy Policy
- Terms & Conditions
- Maintenance Mode

---

# 18. Currency Settings

Editable fields:

- Default Currency
- Currency Symbol
- USD ⇄ BDT Exchange Rates

Changing exchange rates affects all future calculations.

---

# 19. Deposit Settings

Administrators can configure:

- Enable Deposits
- Deposit Packages
- Wallet Credit Values
- Minimum Deposit
- Maximum Deposit
- Payment Methods
- Company Accounts
- Deposit Instructions

---

# 20. Withdrawal Settings

Administrators can configure:

- Enable Withdrawals
- Waiting Period
- Minimum Withdrawal
- Maximum Withdrawal
- Withdrawal Fee
- Processing Time
- Payment Methods

---

# 21. Stock Settings

Administrators can configure:

- Stock Trading Enabled
- Auto Sell
- Minimum Purchase
- Maximum Purchase
- Fractional Shares
- Price Update Mode
- Auto Sell Interval

---

# 22. Trading Settings

Administrators can configure:

- Trading Enabled
- Maintenance Mode
- Demo Trading
- Demo Balance
- Trading Hours

---

# 23. MLM Settings

Administrators can configure:

- Maximum Direct Referrals
- Deposit Packages
- Commission Percentages
- Rank Requirements
- Rank Rewards

No MLM configuration is hardcoded.

---

# 24. Notification Settings

Administrators can enable or disable:

- Deposit Notifications
- Withdrawal Notifications
- MLM Notifications
- Stock Notifications
- Push Notifications (Future)
- Email Notifications (Future)
- SMS Notifications (Future)

---

# 25. Security Settings

Administrators can configure:

- JWT Expiration
- Session Timeout
- Password Policy
- Login Attempts
- Two-Factor Authentication (Future)

---

# 26. Homepage Management

Editable content:

- Banner Images
- Promotional Text
- Market News
- Announcement
- Maintenance Notice

Media uploads should use Cloudinary.

---

# 27. Reports

Available reports:

- User Reports
- Deposit Reports
- Withdrawal Reports
- Wallet Reports
- Trading Reports
- MLM Reports
- Revenue Reports
- Financial Reports

Reports support:

- CSV Export
- Excel Export
- PDF Export

---

# 28. Audit Logs

Every administrative action creates an immutable audit log.

Examples:

- User Updated
- Wallet Adjusted
- Deposit Approved
- Withdrawal Completed
- Stock Edited
- Settings Updated

Audit log fields:

- Administrator
- Action
- Module
- Timestamp
- IP Address
- Previous Value
- New Value

---

# 29. Notifications Center

Administrators can view:

- System Notifications
- Failed Jobs
- Deposit Alerts
- Withdrawal Alerts
- Security Alerts
- Error Logs

Future versions may support live notifications using WebSockets.

---

# 30. Roles & Permissions

Supported roles:

```
SUPER_ADMIN

ADMIN
```

Future roles:

```
Finance Manager

Support Agent

Content Manager

Moderator
```

Permissions should be granular.

Examples:

```
users.read

users.update

wallet.credit

wallet.debit

settings.update

stocks.manage

withdrawals.approve
```

---

# 31. Search & Filtering

Every admin page should support:

- Search
- Pagination
- Sorting
- Status Filters
- Date Filters
- Export

---

# 32. Dashboard Performance

The dashboard should:

- Load quickly
- Cache summary statistics
- Use aggregated queries
- Lazy-load charts
- Paginate large datasets

---

# 33. Security

The Admin Panel requires:

- JWT Authentication
- Active Session
- Role Authorization
- Audit Logging
- CSRF Protection (if cookies are used)
- Rate Limiting
- Secure HTTPS Connections

Sensitive operations require server-side validation.

---

# 34. Settings Integration

The Admin Panel is the only interface for modifying platform configuration.

Every business rule should be stored in the **Settings Collection**, including:

- Exchange Rates
- Deposit Packages
- Withdrawal Rules
- Trading Rules
- Stock Rules
- MLM Rules
- Security Rules
- Notification Rules
- Homepage Content

After a setting is updated:

```
Save Settings

↓

Refresh Settings Cache

↓

Apply Immediately
```

No application restart is required.

---

# 35. Future Features

Future versions may support:

- Multi-Admin Dashboard
- Team Management
- Real-Time Monitoring
- AI Analytics
- System Health Dashboard
- Job Queue Monitoring
- Scheduled Reports
- Feature Flags
- Localization
- White-Label Branding
- Dark Mode
- Plugin System

---

# 36. Development Rules

The following rules are mandatory.

- Every administrative action must pass through the service layer.
- Controllers must never contain business logic.
- Every configurable platform rule must be managed through the Settings Service.
- No business rule may be hardcoded.
- Every administrative action must create an Audit Log.
- Wallet modifications must use the Wallet Service.
- Financial operations must use MongoDB transactions.
- Settings changes must refresh the in-memory cache immediately.
- Role-based authorization must protect every administrative endpoint.
- Dashboard statistics should use optimized aggregation queries.
- Large datasets must support pagination and filtering.
- The Admin Panel must be modular so new management sections can be added without restructuring the application.
