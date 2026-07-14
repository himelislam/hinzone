# Product Requirements Document (PRD)

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 1.1

**Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)

---

# 1. Purpose

The Stock Investment, Trading & MLM Platform is a web-based investment ecosystem that combines virtual stock investment, wallet management, and a Binary MLM referral system into a single application.

The platform enables users to securely manage investments while giving administrators complete control over business operations through a centralized administration panel.

One of the core principles of the platform is **Database-Driven Configuration**. Every configurable business rule is managed from the Admin Panel through a centralized Settings system rather than being hardcoded into the application.

---

# 2. Product Vision

Create a secure, scalable, and highly configurable investment platform where administrators can manage every business rule without modifying source code or restarting the application.

The system should support future expansion into a complete trading platform while maintaining a clean, modular architecture.

---

# 3. Business Objectives

The platform aims to:

- Provide a secure virtual investment platform.
- Offer a centralized wallet system.
- Allow users to invest in administrator-managed virtual stocks.
- Encourage platform growth through a Binary MLM referral system.
- Provide complete financial transparency.
- Eliminate hardcoded business logic.
- Allow administrators to configure the platform from a centralized Settings page.
- Build a scalable foundation for future trading functionality.

---

# 4. Target Audience

## Primary Users

Individuals interested in:

- Online investing
- Referral marketing
- Passive income
- MLM earnings

---

## Administrators

Platform owners responsible for:

- Managing users
- Managing investments
- Managing finances
- Managing stock prices
- Configuring MLM rules
- Monitoring reports
- Managing platform settings

---

# 5. User Roles

## Guest

Can:

- Browse homepage
- View announcements
- Register
- Login

Cannot:

- Access dashboard
- Invest
- Deposit
- Withdraw

---

## User

Can:

- Access dashboard
- Manage wallet
- Deposit funds
- Request withdrawals
- Buy stocks
- Sell stocks
- Configure Auto Sell
- Build referral network
- Earn MLM commissions
- Receive rank bonuses
- View reports
- Update profile

---

## Admin

Can manage:

- Users
- Wallets
- Deposits
- Withdrawals
- Stocks
- MLM
- Notifications
- Homepage
- Reports
- Platform Settings
- Security
- Audit Logs

---

# 6. Core Product Modules

Version 1 consists of the following modules.

## Authentication

Features:

- User Registration
- Login
- Logout
- Password Management
- Role-Based Authentication

---

## Wallet

Features:

- USD Wallet
- Balance Tracking
- Credits
- Debits
- Wallet History
- Financial Ledger

---

## Deposit Module

Features:

- Fixed Deposit Packages
- Screenshot Upload
- Transaction ID Submission
- Manual Verification
- Wallet Credit
- Status Tracking

---

## Withdrawal Module

Features:

- Withdrawal Requests
- Manual Processing
- Wallet Deduction
- Status Tracking
- Payment Method Selection

---

## Stock Investment

Features:

- Stock Listing
- Buy Stock
- Sell Stock
- Portfolio
- Auto Sell
- Profit Tracking

---

## Trading

Version 1 includes:

- Trading Dashboard
- Demo Balance
- Trading Charts
- Maintenance Screen

Trading functionality is disabled.

---

## MLM Referral System

Features:

- Binary Referral Tree
- Referral Links
- Referral IDs
- First Deposit Bonus
- Profit Bonus
- Rank System
- Team Statistics

---

## Notifications

Supports:

- Deposit Updates
- Withdrawal Updates
- Investment Events
- Referral Events
- Bonus Notifications
- Administrative Messages

---

## Dashboard

Displays:

- Wallet Summary
- Portfolio
- Transactions
- Market Summary
- Notifications
- Quick Actions

---

## Admin Panel

Provides management interfaces for every platform feature.

---

## Configuration Management

Provides centralized management of all configurable business rules.

All business logic values are loaded dynamically from the Settings collection.

---

# 7. Functional Requirements

## Authentication

The system shall allow users to:

- Register using phone number.
- Register using username.
- Create secure passwords.
- Login using phone number or username.
- Logout securely.
- Optionally register with a Referrer User ID.

---

## Wallet

The system shall:

- Maintain wallet balances in USD.
- Track every financial transaction.
- Prevent negative balances.
- Display complete wallet history.

---

## Deposit System

The system shall allow users to:

- Select available deposit packages.
- Upload payment screenshots.
- Submit transaction IDs.
- View deposit status.

The administrator shall:

- Review requests.
- Approve deposits.
- Reject deposits.
- Credit user wallets.

Deposit rules are loaded from Settings.

---

## Withdrawal System

The system shall allow users to:

- Submit withdrawal requests.
- Select payment methods.
- Track request status.

The administrator shall:

- Review requests.
- Approve withdrawals.
- Reject withdrawals.
- Complete payments.

Withdrawal rules are loaded from Settings.

---

## Stock Investment

The system shall allow users to:

- Browse stocks.
- Purchase stocks.
- Sell stocks.
- Configure Auto Sell.
- Track portfolio performance.

The administrator shall:

- Create stocks.
- Update prices.
- Pause stocks.
- Resume stocks.
- Remove stocks.

Stock behavior is controlled through Settings.

---

## Trading Module

Version 1 shall:

- Display trading charts.
- Display demo balance.
- Display maintenance notice.
- Prevent all trading actions.

Trading availability is configurable.

---

## MLM

The system shall:

- Generate referral links.
- Generate referral IDs.
- Maintain Binary Trees.
- Calculate First Deposit Bonuses.
- Calculate Profit Bonuses.
- Calculate User Ranks.

All MLM rules are configurable.

---

## Notifications

The system shall notify users for:

- Deposits
- Withdrawals
- Stock Purchases
- Stock Sales
- Referral Registrations
- Bonus Earnings
- Rank Promotions

Notification settings are configurable.

---

## Reports

The administrator shall access reports for:

- Users
- Deposits
- Withdrawals
- Wallet Activity
- Stock Transactions
- Referral Earnings
- MLM Bonuses
- Revenue
- Growth Metrics

---

# 8. Configuration Management Requirements

The platform shall provide a centralized **Settings Management System**.

The backend must load configuration values whenever business logic is executed.

No configurable business rule may be hardcoded.

Changes made by administrators must take effect immediately.

---

## Currency Settings

The administrator shall configure:

- Exchange Rate
- Currency Symbol
- Default Currency

---

## Deposit Settings

The administrator shall configure:

- Deposit Enabled
- Deposit Packages
- Minimum Deposit
- Maximum Deposit
- Accepted Payment Methods
- Company Payment Accounts
- Deposit Instructions

Packages may be added, updated, or removed without code changes.

---

## Withdrawal Settings

The administrator shall configure:

- Withdrawal Enabled
- Minimum Withdrawal
- Maximum Withdrawal
- Waiting Period
- Processing Time
- Withdrawal Fee
- Accepted Payment Methods

---

## Stock Settings

The administrator shall configure:

- Stock Trading Enabled
- Auto Sell Enabled
- Purchase Limits
- Price Update Mode
- Auto Sell Interval

---

## Trading Settings

The administrator shall configure:

- Trading Enabled
- Maintenance Mode
- Demo Balance
- Demo Trading

---

## MLM Settings

The administrator shall configure:

- Maximum Direct Referrals
- Deposit Packages
- Commission Percentages
- Rank Requirements
- Rank Rewards
- Profit Bonus Percentages

---

## Notification Settings

The administrator shall configure:

- Notification Enable/Disable
- Deposit Notifications
- Withdrawal Notifications
- Stock Notifications
- MLM Notifications
- Email Notifications
- SMS Notifications
- Push Notifications

---

## Homepage Settings

The administrator shall configure:

- Banner Images
- Promotions
- Announcements
- Market News
- Maintenance Notice

---

## Security Settings

The administrator shall configure:

- JWT Expiration
- Password Policy
- Session Timeout
- Login Attempt Limits
- Two-Factor Authentication (Future)

---

## General Platform Settings

The administrator shall configure:

- Platform Name
- Platform Logo
- Support Information
- Terms & Conditions
- Privacy Policy
- Maintenance Mode

---

# 9. Non-Functional Requirements

The platform shall be:

## Secure

- JWT Authentication
- Password Hashing
- Role-Based Authorization
- Request Validation
- Audit Logging

---

## Responsive

Support:

- Desktop
- Tablet
- Mobile

---

## Performant

- Optimized database queries
- Settings caching
- Efficient API responses
- Lazy loading
- Pagination

---

## Scalable

Support future:

- Trading Engine
- Mobile Apps
- Redis
- Microservices
- High user volume

---

## Maintainable

- Modular architecture
- Service-oriented design
- Database-driven configuration
- Reusable components
- Clean folder structure

---

# 10. Business Rules

The platform must enforce the following principles:

- Wallet balances use USD.
- Deposits require administrator approval.
- Withdrawals require administrator approval.
- Virtual stock prices are administrator-controlled.
- Trading is disabled in Version 1.
- Demo balance cannot be withdrawn.
- Binary MLM allows a configurable maximum number of direct referrals.
- Every configurable business rule is loaded from the Settings collection.
- Every financial action is permanently recorded.
- Nothing affecting financial history may be physically deleted.

---

# 11. Success Metrics

The platform is considered successful when it provides:

- Stable authentication.
- Accurate wallet management.
- Reliable financial calculations.
- Configurable investment workflows.
- Accurate MLM commission calculations.
- Fully configurable business rules.
- Responsive user experience.
- Complete administrative control.
- Comprehensive financial reporting.

---

# 12. Constraints

Version 1 intentionally excludes:

- Real Trading Engine
- Live Market APIs
- Stop Loss
- Take Profit
- KYC Verification
- Two-Factor Authentication
- Automated Deposits
- Automated Withdrawals
- Mobile Applications
- Push Notifications
- Email Verification
- SMS Verification

---

# 13. Future Scope

Future releases may include:

- Real Trading Engine
- Live Market Integration
- Order Book
- KYC
- Two-Factor Authentication
- Push Notifications
- Mobile Applications
- AI Investment Analysis
- Automated Payments
- Multi-language Support
- Dark Mode

---

# 14. Acceptance Criteria

Version 1 will be considered complete when:

- Users can register and authenticate successfully.
- Wallet balances are accurately maintained.
- Deposits and withdrawals function correctly.
- Users can buy and sell virtual stocks.
- Auto Sell operates correctly.
- MLM commissions are calculated accurately.
- Referral trees function correctly.
- Administrators can manage every platform setting from the Admin Panel.
- Changes to business settings take effect immediately without code deployment.
- No configurable business rule is hardcoded in the application.
- Every financial action is fully auditable.
- The platform is secure, responsive, scalable, and production-ready.
