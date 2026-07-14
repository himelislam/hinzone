# Phase 11 — Notification System & Real-Time Communication

## Goal

Build the complete Notification System that delivers real-time and persistent notifications across the platform.

This module should support in-app notifications immediately while providing a scalable architecture for future Push, Email, SMS, WhatsApp, and WebSocket notifications.

All notification behavior must be controlled through the **Settings Service**.

---

# Objectives

- In-App Notifications
- Notification Center
- Real-Time Notifications
- Notification Preferences
- Notification Templates
- Read/Unread Tracking
- Notification Broadcasting
- Future Email/SMS/Push Support
- Admin Announcement System
- Audit Logging

---

# Backend Tasks

## Notification Module

Create

```
modules/

notification/

├── controllers
├── services
├── routes
├── validations
├── dto
├── models
├── interfaces
├── templates
└── utils
```

---

# Notification Schema

Fields

- Notification Number
- User ID
- Type
- Category
- Title
- Message
- Data
- Icon
- Priority
- Is Read
- Read At
- Delivery Status
- Created By
- Created At
- Updated At

---

# Notification Types

Support

```
SYSTEM

SUCCESS

WARNING

ERROR

INFO
```

---

# Notification Categories

Support

```
GENERAL

DEPOSIT

WITHDRAWAL

TRADING

MLM

SECURITY

SYSTEM

ANNOUNCEMENT

PROMOTION
```

---

# Notification Priority

```
LOW

NORMAL

HIGH

CRITICAL
```

---

# Delivery Status

```
PENDING

DELIVERED

FAILED
```

---

# Settings Integration

Load notification settings from

```
SettingsService
```

Required settings

- Notifications Enabled
- Deposit Notifications
- Withdrawal Notifications
- MLM Notifications
- Trading Notifications
- Push Notifications
- Email Notifications
- SMS Notifications

Never hardcode notification behavior.

---

# Notification Service

Create

```
NotificationService
```

Methods

```
create()

createBulk()

notifyUser()

notifyAdmins()

broadcast()

markAsRead()

markAllAsRead()

deleteNotification()

deleteAllNotifications()

getNotifications()

getUnreadCount()
```

---

# Notification Triggers

Automatically create notifications for

Authentication

- Login
- Password Changed
- Password Reset

Wallet

- Wallet Credited
- Wallet Debited

Deposit

- Deposit Submitted
- Deposit Approved
- Deposit Rejected

Withdrawal

- Withdrawal Submitted
- Withdrawal Approved
- Withdrawal Completed
- Withdrawal Rejected

Trading

- Stock Purchased
- Stock Sold
- Auto Sell Executed

MLM

- Referral Joined
- Commission Earned
- Rank Upgraded
- Rank Reward

Administration

- Settings Updated
- Maintenance Mode Enabled
- System Announcement

---

# Notification Templates

Create reusable templates.

Example

Deposit Approved

```
Title

Deposit Approved

Message

Your deposit of 6,000 BDT has been approved successfully.
```

Do not hardcode template text throughout services.

---

# Announcement System

Administrators should be able to create

- General Announcement
- Maintenance Notice
- Promotional Message
- Emergency Notification

Target

- All Users
- Specific Roles
- Selected Users

---

# Real-Time Architecture

Prepare for

```
Socket.IO
```

or

```
WebSocket
```

Events

```
notification:new

notification:read

notification:delete
```

If WebSockets are not yet enabled, encapsulate all publishing behind a Notification Gateway interface.

---

# Read Status

Support

```
Unread

↓

Read
```

Track

```
Read At
```

---

# Bulk Notifications

Support

```
All Users

Admins

Active Users

Specific Users

Selected Roles
```

Queue processing should be future-ready.

---

# Cleanup

Support automatic cleanup.

Configurable

```
Delete notifications older than

X Days
```

Future scheduled job.

---

# API Endpoints

User

```
GET    /api/v1/notifications

GET    /api/v1/notifications/unread-count

PATCH  /api/v1/notifications/:id/read

PATCH  /api/v1/notifications/read-all

DELETE /api/v1/notifications/:id

DELETE /api/v1/notifications
```

Admin

```
POST   /api/v1/admin/notifications

POST   /api/v1/admin/notifications/broadcast

GET    /api/v1/admin/notifications

DELETE /api/v1/admin/notifications/:id
```

---

# Frontend Tasks

## Notification Center

Display

- Latest Notifications
- Unread Notifications
- Categories
- Priority
- Read Status

---

# Notification Dropdown

Display

- Unread Count
- Latest Notifications
- Quick Actions

Actions

- Mark Read
- View
- Delete

---

# Notification Page

Display

- Search
- Filters
- Categories
- Read Status
- Pagination

---

# Announcement Banner

Display platform-wide announcements.

Examples

- Maintenance
- Promotions
- Market News

Loaded dynamically from Settings and Announcements.

---

# Admin Notification Panel

Create

- Broadcast Notification
- Announcement Management
- Notification History
- User Target Selection

---

# Components

Create reusable

```
NotificationBell

NotificationBadge

NotificationCard

NotificationList

NotificationDropdown

AnnouncementBanner

NotificationFilter

UnreadCounter

NotificationSettingsCard
```

---

# React Query Hooks

Create

```
useNotifications()

useUnreadCount()

useMarkAsRead()

useMarkAllAsRead()

useDeleteNotification()

useBroadcastNotification()
```

---

# Notification Preferences

Allow users to enable or disable

- Deposit Notifications
- Withdrawal Notifications
- Trading Notifications
- MLM Notifications

Global availability must still respect platform Settings.

---

# Security

Users may only access their own notifications.

Only

```
ADMIN

SUPER_ADMIN
```

may create broadcasts or announcements.

Permission validation is required for all administrative notification APIs.

---

# Performance

Indexes

- User ID
- Category
- Priority
- Is Read
- Created At

Optimize

- Unread count
- Notification list
- Recent notifications

Prepare architecture for Redis Pub/Sub if introduced later.

---

# Testing

Backend

- Notification creation
- Bulk notifications
- Broadcasts
- Read/Unread flow
- Settings integration
- Authorization
- Template rendering

Frontend

- Notification center
- Dropdown
- Read status
- Filtering
- Pagination
- Announcement banner
- Error handling

---

# Deliverables

Backend

- Notification Module
- Notification Service
- Notification Templates
- Broadcast Engine
- Announcement APIs
- Real-Time Gateway Interface

Frontend

- Notification Center
- Notification Dropdown
- Announcement Banner
- Notification Management
- React Query Hooks

Infrastructure

- Dynamic Settings Integration
- Future WebSocket Support
- Future Queue Integration

---

# Exit Criteria

Before moving to Phase 12:

- Users receive in-app notifications for all supported platform events.
- Notification templates are centralized and reusable.
- Users can mark notifications as read individually or in bulk.
- Administrators can broadcast announcements to users.
- Notification behavior is fully controlled by the Settings Service.
- Real-time notification architecture is prepared for WebSocket integration.
- Search, filtering, and pagination function correctly.
- Audit logs are created for administrative broadcasts.
- No notification logic is hardcoded throughout the application.
- No TypeScript or ESLint errors exist.
- Unit and integration tests pass successfully.
