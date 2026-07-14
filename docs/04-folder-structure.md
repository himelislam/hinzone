# Folder Structure

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 1.0

---

# 1. Overview

The project follows a **Modular Monolithic Architecture** with a clear separation between the frontend, backend, shared resources, and documentation.

The folder structure is designed to be:

- Modular
- Scalable
- Easy to navigate
- Easy to maintain
- Team-friendly
- Ready for future microservices

Every module should remain independent and reusable.

---

# 2. Project Structure

```text
stock-investment-platform/

├── apps/
│
│   ├── client/                # User Application
│   ├── admin/                 # Admin Dashboard
│   └── server/                # Backend API
│
├── packages/
│
│   ├── shared-types/
│   ├── shared-utils/
│   ├── shared-constants/
│   └── shared-validation/
│
├── docs/
│
├── docker/
│
├── scripts/
│
├── .github/
│
├── .env.example
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

# 3. Monorepo Architecture

The project uses a **pnpm Workspace Monorepo**.

Benefits:

- Shared code
- Shared validation
- Shared types
- Easier maintenance
- Independent applications
- Better scalability

---

# 4. Apps Directory

```
apps/

client/

admin/

server/
```

Each application is independent.

---

# 5. Client Application

```
apps/client/

src/

public/

components/

pages/

layouts/

hooks/

services/

contexts/

store/

types/

utils/

styles/

assets/

routes/

validators/

constants/
```

---

## Purpose

Contains the entire User Dashboard.

Responsibilities:

- Authentication
- Dashboard
- Wallet
- Stocks
- Portfolio
- Trading
- Referral
- Notifications
- Settings

---

# 6. Client Source Structure

```
src/

assets/

components/

layouts/

pages/

hooks/

services/

routes/

types/

utils/

validators/

contexts/

constants/
```

---

## Components

```
components/

ui/

common/

forms/

tables/

cards/

dialogs/

charts/

navigation/
```

Only reusable UI components belong here.

---

## Pages

```
pages/

auth/

dashboard/

wallet/

stocks/

portfolio/

history/

refer/

profile/

settings/

notifications/

trade/
```

Each page owns its own logic.

---

## Services

Contains API communication only.

Example:

```
services/

auth.service.ts

wallet.service.ts

stock.service.ts

deposit.service.ts

withdraw.service.ts

mlm.service.ts

settings.service.ts
```

Services never contain business logic.

---

## Hooks

Custom React Hooks.

Examples:

```
useAuth()

useWallet()

useSettings()

useNotifications()

useStocks()
```

---

## Contexts

Global Context Providers.

Examples:

```
AuthContext

ThemeContext

NotificationContext
```

---

# 7. Admin Application

```
apps/admin/

src/

components/

pages/

layouts/

hooks/

services/

routes/

validators/

types/

utils/

contexts/
```

---

## Purpose

Contains the complete Admin Dashboard.

Responsibilities:

- User Management
- Deposit Approval
- Withdrawal Approval
- Stock Management
- MLM Configuration
- Reports
- Settings Management
- Homepage Management

---

## Admin Pages

```
dashboard/

users/

wallet/

deposits/

withdrawals/

stocks/

mlm/

reports/

notifications/

settings/

homepage/

audit-logs/
```

---

# 8. Server Application

```
apps/server/

src/

config/

modules/

shared/

middlewares/

routes/

database/

jobs/

types/

utils/

app.ts

server.ts
```

---

## Purpose

Contains the backend API.

Responsibilities:

- Business Logic
- Authentication
- Database
- Financial Operations
- API Endpoints

---

# 9. Server Source Structure

```
src/

config/

database/

middlewares/

modules/

shared/

jobs/

routes/

utils/

types/
```

---

# 10. Modules Directory

Every business feature has its own module.

```
modules/

auth/

users/

wallet/

deposit/

withdraw/

stock/

portfolio/

trading/

mlm/

notifications/

history/

settings/

homepage/

reports/

admin/
```

Modules must never directly depend on each other.

Communication happens through Services.

---

# 11. Module Structure

Every module follows the exact same structure.

```
module/

controller/

service/

repository/

model/

routes/

validation/

types/

dto/

utils/
```

Example:

```
wallet/

wallet.controller.ts

wallet.service.ts

wallet.repository.ts

wallet.model.ts

wallet.routes.ts

wallet.validation.ts

wallet.dto.ts

wallet.types.ts
```

---

# 12. Config Directory

```
config/

database.ts

jwt.ts

cloudinary.ts

cors.ts

helmet.ts

logger.ts

cache.ts

environment.ts
```

Contains system-wide configuration.

No business logic belongs here.

---

# 13. Database Directory

```
database/

connection.ts

indexes.ts

seed/

migration/
```

Responsibilities:

- MongoDB Connection
- Seed Scripts
- Migrations
- Database Utilities

---

# 14. Shared Directory

Contains reusable backend utilities.

```
shared/

errors/

response/

constants/

helpers/

validators/

middlewares/

cache/

logger/
```

These utilities should not contain business-specific code.

---

# 15. Jobs Directory

Background jobs.

```
jobs/

auto-sell.job.ts

notification.job.ts

cache-refresh.job.ts

cleanup.job.ts
```

Future jobs may include:

- Trading Engine
- Scheduled Reports
- Email Queue
- SMS Queue

---

# 16. Settings Module

The **Settings Module** is a core module used by every business service.

```
modules/settings/

settings.controller.ts

settings.service.ts

settings.repository.ts

settings.model.ts

settings.routes.ts

settings.validation.ts
```

Responsibilities:

- Load configuration
- Cache settings
- Update configuration
- Refresh cache

Every module retrieves configuration through the **Settings Service**.

No module should query the Settings collection directly.

---

# 17. Packages Directory

Reusable code shared across applications.

```
packages/

shared-types/

shared-utils/

shared-validation/

shared-constants/
```

---

## shared-types

Shared TypeScript interfaces.

Examples:

```
User

Wallet

Deposit

Withdrawal

Stock

Notification

Settings
```

---

## shared-validation

Shared validation schemas.

Examples:

```
LoginSchema

RegisterSchema

DepositSchema

WithdrawalSchema
```

---

## shared-utils

Reusable helper functions.

Examples:

```
Date Helpers

Currency Formatter

Percentage Calculator

UUID Generator
```

---

## shared-constants

Application constants.

Only **technical constants** belong here.

Examples:

```
API Routes

Route Names

Pagination Defaults

Storage Keys
```

Business rules such as exchange rates or commission percentages **must not** be stored here.

---

# 18. Documentation Directory

```
docs/

00-project-overview.md

01-product-requirements.md

02-system-architecture.md

...

25-roadmap.md
```

Contains all project documentation used by developers and AI assistants.

---

# 19. Scripts Directory

Contains utility scripts.

Examples:

```
seed-admin.ts

seed-settings.ts

seed-demo-data.ts

create-indexes.ts

backup.ts
```

---

# 20. Docker Directory

```
docker/

client/

admin/

server/

nginx/
```

Contains all Docker configuration.

---

# 21. GitHub Directory

```
.github/

workflows/

ISSUE_TEMPLATE/

PULL_REQUEST_TEMPLATE/
```

Used for CI/CD and project management.

---

# 22. Environment Variables

Environment variables should never be committed.

Example:

```
.env

.env.local

.env.production

.env.example
```

Variables include:

- MongoDB URI
- JWT Secret
- Cloudinary Credentials
- Application URL
- API URL

Business settings must never be stored in environment variables.

---

# 23. Folder Naming Conventions

Use:

- lowercase
- kebab-case for folders
- descriptive names

Examples:

```
stock-management

user-profile

notification-center
```

Avoid abbreviations unless universally recognized.

---

# 24. File Naming Conventions

Use descriptive file names.

Examples:

```
wallet.service.ts

wallet.controller.ts

wallet.repository.ts

wallet.validation.ts

wallet.dto.ts

wallet.types.ts
```

Maintain the same naming convention across every module.

---

# 25. Development Rules

The following rules are mandatory.

### Project Structure

- Every feature belongs to its own module.
- Every module follows the same internal structure.
- Never place business logic inside controllers.
- Never access MongoDB directly from controllers.
- Services communicate with other services when needed.

### Shared Code

- Share types through `packages/shared-types`.
- Share validation schemas through `packages/shared-validation`.
- Share utilities through `packages/shared-utils`.

### Configuration

- Never hardcode configurable business rules.
- Every configurable value must come from the **Settings Service**.
- The Settings Service should cache frequently used configuration.

### Components

- Keep components small and reusable.
- Avoid duplicate UI components.
- Prefer composition over inheritance.

### Maintainability

- Keep modules independent.
- Keep folder depth reasonable.
- Follow consistent naming conventions.
- Build every feature with future scalability in mind.
