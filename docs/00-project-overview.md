# Project Overview

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.0

**Document Version:** 1.1

**Tech Stack:** MERN (MongoDB, Express.js, React.js, Node.js)

**Architecture:** Modular Monolithic with Database-Driven Configuration

---

# 1. Introduction

The Stock Investment, Trading & MLM Platform is a modern web-based investment ecosystem that combines three core business modules into a single application:

- Stock Investment
- Trading (Version 1 UI Only)
- Binary MLM Referral System

The platform enables users to:

- Create an account
- Deposit funds
- Purchase virtual stocks
- Sell investments
- Build an MLM referral network
- Earn referral commissions
- Receive rank-based bonuses
- Request withdrawals
- Monitor investments through a modern dashboard

Unlike traditional stock exchanges, this platform operates entirely on an internally managed virtual investment model. All stock prices, commissions, exchange rates, investment rules, and business logic are controlled by the platform administrator.

Version 1 delivers a complete investment ecosystem while reserving the live Trading Engine for future releases.

---

# 2. Project Vision

To build a scalable, secure, and configurable investment platform where administrators can operate the entire business without modifying application code.

Every configurable business rule—including exchange rates, deposit packages, withdrawal policies, MLM commissions, stock behavior, and platform settings—should be manageable directly from the Admin Panel.

The platform should be capable of evolving into a complete trading ecosystem while maintaining a stable and maintainable architecture.

---

# 3. Project Goals

The platform aims to:

- Provide a secure virtual investment platform.
- Offer a configurable Binary MLM referral system.
- Allow users to invest in administrator-managed virtual stocks.
- Simplify financial management through a centralized wallet.
- Give administrators complete control over platform operations.
- Eliminate hardcoded business rules through centralized configuration management.
- Build a scalable architecture capable of supporting future trading functionality.

---

# 4. Target Users

The platform serves three categories of users.

## 4.1 Visitors

Visitors can:

- Browse the homepage
- View announcements
- Learn about the platform
- Register
- Login

---

## 4.2 Registered Users

Registered users can:

- Manage wallet balance
- Deposit funds
- Request withdrawals
- Buy stocks
- Sell stocks
- Configure Auto Sell
- View investment performance
- Build referral networks
- Earn MLM commissions
- Receive rank bonuses
- View financial history
- Receive notifications
- Update profile settings

---

## 4.3 Administrators

Administrators have complete control over the platform.

They can manage:

- Users
- Wallets
- Deposits
- Withdrawals
- Stocks
- MLM Configuration
- Homepage Content
- Notifications
- Reports
- Platform Settings
- Security Settings
- Financial Configuration
- Audit Logs

The administrator can modify business rules without requiring server redeployment.

---

# 5. Core Modules

Version 1 consists of the following major modules.

## Authentication

- Registration
- Login
- Role-Based Access Control
- Password Management

---

## Wallet

The wallet stores every user's USD balance.

It supports:

- Deposits
- Withdrawals
- Referral commissions
- Profit bonuses
- Admin adjustments
- Transaction history

---

## Stock Investment

Users can:

- Browse stocks
- Purchase stocks
- Sell stocks
- Configure Auto Sell
- Monitor portfolio performance

Stock prices are managed entirely by administrators.

---

## Trading

Version 1 includes:

- Trading Dashboard
- Trading Charts
- Demo Account
- Maintenance Screen

Trading functionality is disabled until a future release.

---

## MLM Referral System

The Binary MLM system allows users to:

- Invite members
- Build referral networks
- Earn first deposit commissions
- Earn recurring profit bonuses
- Achieve higher ranks
- Monitor team performance

Every commission rule and rank requirement is configurable.

---

## Notifications

Users receive notifications for:

- Deposits
- Withdrawals
- Investments
- Stock Sales
- Referral Activities
- MLM Bonuses
- Rank Promotions
- Administrative Announcements

---

## User Dashboard

A centralized dashboard where users manage every aspect of their account.

---

## Admin Panel

A comprehensive administration system providing complete operational control over the platform.

---

## Configuration Management

A centralized Settings Management System controls every configurable business rule.

Administrators can modify platform behavior directly from the Admin Panel without changing application code.

---

# 6. Version 1 Scope

Version 1 includes:

- User Authentication
- Wallet System
- Manual Deposits
- Manual Withdrawals
- Virtual Stock Investment
- Portfolio Management
- Auto Sell
- Binary MLM System
- Referral Commissions
- Rank Bonus System
- Notifications
- Reports
- Admin Panel
- Configuration Management
- Responsive Dashboard

Not included:

- Real Trading Engine
- Live Market API
- Market Orders
- Stop Loss
- Take Profit
- KYC Verification
- Two-Factor Authentication
- Mobile Applications
- Automated Deposits
- Automated Withdrawals

---

# 7. Business Model

The platform operates using administrator-managed virtual assets.

Key business principles include:

- Virtual stock prices are controlled internally.
- Deposits are manually approved.
- Withdrawals are manually processed.
- Wallet balances are maintained in USD.
- Currency conversion is configurable.
- MLM commissions are configurable.
- Rank requirements are configurable.
- Deposit packages are configurable.
- Withdrawal policies are configurable.
- Trading availability is configurable.
- Every financial operation is permanently recorded.
- Every business rule is configurable through the Settings system.

---

# 8. User Journey

A typical user journey is as follows:

1. Register an account.
2. Optionally enter a referrer ID.
3. Login.
4. Submit a deposit request.
5. Wait for admin approval.
6. Receive wallet balance.
7. Purchase virtual stocks.
8. Monitor portfolio growth.
9. Sell stocks manually or automatically.
10. Invite new members.
11. Earn MLM commissions.
12. Reach higher MLM ranks.
13. Request withdrawals.
14. Continue growing investments and referrals.

---

# 9. User Roles

The system uses Role-Based Access Control (RBAC).

## Guest

- View public pages
- Register
- Login

---

## User

- Manage investments
- Manage wallet
- Build referral network
- View reports
- Update profile

---

## Admin

- Full access to every module
- Manage platform settings
- Manage financial operations
- Manage users
- Configure business rules
- Generate reports
- Monitor platform activity

---

# 10. Configuration Management Philosophy

One of the core architectural principles of the platform is **Database-Driven Configuration**.

The application must never hardcode configurable business values.

Instead, the backend loads all business rules from a centralized **Settings** collection.

Configuration categories include:

- General Platform
- Currency
- Deposits
- Withdrawals
- Stocks
- Trading
- MLM
- Notifications
- Homepage
- Security

Examples of configurable values include:

- Exchange rates
- Deposit packages
- Withdrawal waiting periods
- Commission percentages
- MLM rank requirements
- Demo trading balance
- Maintenance mode
- Trading availability
- Payment methods
- Company payment information
- Notification settings

Changes made by administrators should take effect immediately without restarting the application.

---

# 11. System Principles

The platform follows these architectural principles:

- Modular Architecture
- Service-Oriented Business Logic
- API-First Development
- Database-Driven Configuration
- Separation of Concerns
- Secure by Default
- Responsive Design
- Scalable Infrastructure
- Reusable Components
- Audit-Friendly Financial Records

---

# 12. Future Vision

The architecture has been designed for future expansion.

Planned features include:

- Real Trading Engine
- Live Market Integration
- Buy/Sell Orders
- Stop Loss
- Take Profit
- KYC Verification
- Two-Factor Authentication
- Email Notifications
- SMS Notifications
- Push Notifications
- Android Application
- iOS Application
- Dark Mode
- Multi-language Support
- Automated Payment Verification
- Automated Withdrawals
- AI-Powered Investment Insights

The existing architecture should support these features without requiring major structural changes.

---

# 13. Success Criteria

The project will be considered successful when it provides:

- Secure user authentication.
- Reliable wallet management.
- Accurate financial calculations.
- Efficient stock investment workflows.
- A configurable Binary MLM system.
- A complete administration panel.
- Centralized settings management.
- Fully auditable financial records.
- A scalable architecture ready for future trading functionality.

---

# 14. Development Philosophy

The platform will be developed using the following principles:

- Keep controllers lightweight.
- Keep business logic inside services.
- Never hardcode business rules.
- Load all configurable values from the Settings collection.
- Design independent and reusable modules.
- Maintain clear separation of concerns.
- Ensure every financial action is traceable.
- Build for long-term maintainability and scalability.
- Optimize performance through settings caching.
- Ensure administrators can manage business operations without code changes or server redeployment.
