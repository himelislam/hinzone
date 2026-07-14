# Notification System

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 2.0

---

# 1. Overview

The Notification System is responsible for delivering important platform events to users and administrators.

Version 1 primarily supports **in-app notifications**, while the architecture is designed to support future delivery channels such as:

- Push Notifications
- Email Notifications
- SMS Notifications
- WhatsApp Notifications
- Telegram Notifications

The Notification System is event-driven and integrates with every major module of the platform.

---

# 2. Objectives

The Notification System is responsible for:

- Delivering real-time user notifications
- Sending administrative alerts
- Tracking notification history
- Managing read/unread status
- Supporting multiple delivery channels
- Respecting notification preferences
- Providing future extensibility

---

# 3. Module Architecture

```
Application Event

↓

Notification Service

↓

Settings Service

↓

Notification Repository

↓

MongoDB

↓

User
```

Every notification rule is controlled through the **Settings Service**.

---

# 4. Notification Flow

```
Business Event

↓

Notification Service

↓

Load Notification Settings

↓

Validate Notification Enabled

↓

Create Notification

↓

Save Notification

↓

Deliver To User

↓

Mark As Read (Later)
```

---

# 5. Notification Collection

```json
{
  "_id": "...",
  "userId": "...",
  "title": "Deposit Approved",
  "message": "Your deposit has been approved successfully.",
  "type": "Deposit",
  "priority": "Normal",
  "isRead": false,
  "deliveryChannels": ["IN_APP"],
  "metadata": {
    "referenceId": "DEP100001"
  },
  "createdAt": "...",
  "readAt": null
}
```

---

# 6. Notification Types

Supported notification types

```
General

Deposit

Withdrawal

Wallet

Stock

Trading

MLM

Rank

Referral

Security

System

Announcement
```

Future notification types can be added without database changes.

---

# 7. Notification Priorities

```
Low

Normal

High

Critical
```

Priority affects:

- Display order
- Future push delivery
- Future email delivery

---

# 8. Notification Settings

Notification behavior is loaded from:

```
Settings

↓

Notification Settings
```

Example

```json
{
  "notificationsEnabled": true,
  "depositNotifications": true,
  "withdrawalNotifications": true,
  "mlmNotifications": true,
  "stockNotifications": true,
  "pushNotifications": false,
  "emailNotifications": false,
  "smsNotifications": false
}
```

Administrators can update these settings without deployment.

---

# 9. Events That Generate Notifications

### Authentication

- Registration Successful
- Login From New Device (Future)
- Password Changed
- Account Suspended

---

### Wallet

- Wallet Credited
- Wallet Debited
- Manual Wallet Adjustment

---

### Deposits

- Deposit Submitted
- Deposit Approved
- Deposit Rejected

---

### Withdrawals

- Withdrawal Requested
- Withdrawal Approved
- Withdrawal Rejected
- Withdrawal Completed

---

### Stocks

- Stock Purchased
- Stock Sold
- Auto Sell Executed

---

### Trading

- Trade Completed
- Position Closed
- Trading Disabled
- Maintenance Started

---

### MLM

- New Referral
- Referral Registered
- Commission Earned
- Rank Upgraded
- Rank Reward Credited

---

### Admin

- Platform Maintenance
- Important Announcement
- Policy Updates
- Scheduled Maintenance

---

# 10. Notification APIs

## Get Notifications

```
GET /api/v1/notifications
```

Supports:

- Pagination
- Read Status
- Notification Type
- Date Range

---

## Get Notification

```
GET /api/v1/notifications/:id
```

---

## Mark As Read

```
PATCH /api/v1/notifications/:id/read
```

---

## Mark All As Read

```
PATCH /api/v1/notifications/read-all
```

---

## Delete Notification

```
DELETE /api/v1/notifications/:id
```

Deletion performs a soft delete for audit purposes.

---

# 11. Admin Notification APIs

```
GET /api/v1/admin/notifications

POST /api/v1/admin/notifications/broadcast

DELETE /api/v1/admin/notifications/:id
```

Administrators can:

- Broadcast announcements
- Send system messages
- View notification statistics

---

# 12. Notification Categories

Categories improve filtering.

Examples

```
Financial

Trading

Referral

System

Security

Announcement
```

---

# 13. Notification Preferences

Future versions may allow users to control:

- Deposit Alerts
- Withdrawal Alerts
- Trading Alerts
- MLM Alerts
- Promotional Messages

Global defaults are loaded from the Settings Service.

---

# 14. Notification Delivery Channels

Version 1

```
IN_APP
```

Future versions

```
PUSH

EMAIL

SMS

WHATSAPP

TELEGRAM
```

The Notification Service should support multiple channels simultaneously.

---

# 15. Read Status

Each notification tracks:

```
Unread

↓

Read

↓

Archived (Future)
```

Unread notification count appears in the application header.

---

# 16. Notification Badge

The frontend displays:

- Total Unread Count
- Recent Notifications
- Priority Indicators

Unread count updates after every notification action.

---

# 17. Broadcast Notifications

Administrators may broadcast:

- Maintenance Notices
- New Features
- Security Alerts
- Marketing Messages

Example

```
Admin

↓

Create Broadcast

↓

Notification Service

↓

Create Notification For All Users
```

Broadcast operations should be processed using background jobs for scalability.

---

# 18. Notification Templates

Templates should be centralized.

Example

```
Deposit Approved

↓

Title

Deposit Approved

↓

Message

Your deposit has been approved successfully.
```

Templates simplify localization and future customization.

---

# 19. Notification Service Responsibilities

The Notification Service is responsible for:

- Creating notifications
- Validating notification settings
- Selecting delivery channels
- Saving notification history
- Future integration with external providers

No controller should create notifications directly.

---

# 20. Security Notifications

Examples

- Password Changed
- Account Locked
- New Login Device
- Too Many Login Attempts
- Session Expired

These notifications should have **High** priority.

---

# 21. Notification Timeline

Notifications are ordered by:

```
Created Date

↓

Newest First
```

Pagination is required for large histories.

---

# 22. Data Retention

Notification history should remain available.

Future settings may define:

```
Delete Notifications After

365 Days
```

Retention policies should be configurable.

---

# 23. Audit Logging

Administrative notification actions create Audit Logs.

Examples

- Broadcast Sent
- Notification Deleted
- Template Updated
- Notification Settings Changed

---

# 24. Performance

The Notification Module should:

- Index userId
- Index isRead
- Index createdAt
- Cache notification settings
- Paginate notification history

Broadcast notifications should use asynchronous processing.

---

# 25. Error Handling

Example errors

```
Notification Not Found

Notifications Disabled

Unauthorized

Broadcast Failed

Invalid Notification Type
```

All responses follow the standard API response format.

---

# 26. Future Features

Future releases may support:

- Firebase Push Notifications
- Email Notifications
- SMS Integration
- WhatsApp Notifications
- Telegram Bot Notifications
- Rich Media Notifications
- Scheduled Notifications
- Notification Templates Editor
- User Notification Preferences
- WebSocket Real-Time Notifications
- Multi-Language Notifications

The architecture should support these additions without major redesign.

---

# 27. Reporting

The Notification Module provides data for:

- Total Notifications
- Read Rate
- Unread Count
- Broadcast Statistics
- Delivery Statistics
- User Engagement
- Notification Trends

---

# 28. Settings Integration

The Notification Module depends on the Settings Service.

Dynamic configuration includes:

- Global Notification Toggle
- Deposit Notifications
- Withdrawal Notifications
- MLM Notifications
- Stock Notifications
- Push Notifications
- Email Notifications
- SMS Notifications

Changes take effect immediately after administrators update settings.

---

# 29. Development Rules

The following rules are mandatory.

- Notification creation must occur only through the Notification Service.
- Notification behavior must be controlled by the Settings Service.
- No notification rule may be hardcoded.
- Every major business event should generate a notification when enabled.
- Controllers must never create notifications directly.
- Notifications should support multiple delivery channels.
- Notification history should remain immutable except for read status.
- Administrative broadcasts must generate Audit Logs.
- Notification settings should be cached for performance.
- Large broadcast operations should execute using background jobs.
- APIs must support pagination, filtering, and search.
- The Notification System must be extensible enough to support real-time delivery and third-party notification providers in future versions.
