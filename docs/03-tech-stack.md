# Tech Stack

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 1.0

---

# 1. Overview

The platform will be built using the **MERN Stack** with a modern, scalable, and maintainable architecture.

The technology stack has been selected based on the following goals:

- High Performance
- Scalability
- Security
- Maintainability
- Rapid Development
- Large Ecosystem Support
- Easy Future Expansion

The entire application will use **TypeScript** to improve type safety and reduce runtime errors.

---

# 2. Technology Stack Overview

| Layer            | Technology      |
| ---------------- | --------------- |
| Frontend         | React 19        |
| Build Tool       | Vite            |
| Language         | TypeScript      |
| Styling          | Tailwind CSS    |
| UI Components    | shadcn/ui       |
| Icons            | Lucide React    |
| Backend          | Node.js         |
| Framework        | Express.js      |
| Database         | MongoDB         |
| ODM              | Mongoose        |
| Authentication   | JWT             |
| Password Hashing | bcrypt          |
| Validation       | Zod             |
| API Client       | Axios           |
| State Management | TanStack Query  |
| Forms            | React Hook Form |
| File Upload      | Multer          |
| Image Storage    | Cloudinary      |
| Logging          | Winston         |
| Environment      | dotenv          |
| Process Manager  | PM2             |
| Containerization | Docker          |
| Reverse Proxy    | Nginx           |
| Package Manager  | pnpm            |

---

# 3. Frontend Technologies

## React

The frontend is built using React.

Responsibilities:

- User Interface
- Routing
- State Management
- API Communication
- Component Rendering

---

## Vite

Vite is used for development and production builds.

Benefits:

- Extremely fast startup
- Fast HMR
- Optimized production builds
- Lightweight configuration

---

## TypeScript

TypeScript is used throughout the frontend and backend.

Benefits:

- Type Safety
- Better IDE Support
- Easier Refactoring
- Improved Maintainability
- Reduced Runtime Errors

---

## Tailwind CSS

Tailwind CSS provides utility-first styling.

Benefits:

- Fast UI development
- Consistent design
- Responsive layouts
- Easy customization

---

## shadcn/ui

Used for reusable UI components.

Examples:

- Buttons
- Tables
- Cards
- Dialogs
- Dropdowns
- Forms
- Tabs
- Toasts

---

## Lucide React

Provides modern SVG icons.

Reasons:

- Lightweight
- Tree-shakable
- Consistent design

---

## React Router

Used for:

- Page Routing
- Protected Routes
- Nested Layouts
- Lazy Loading

---

## TanStack Query

Handles server state.

Responsibilities:

- API caching
- Automatic refetching
- Cache invalidation
- Optimistic updates
- Request deduplication

---

## React Hook Form

Used for every form.

Examples:

- Login
- Registration
- Deposits
- Withdrawals
- Profile
- Admin Forms
- Settings

---

## Zod

Used for frontend validation.

Benefits:

- Schema validation
- Shared validation with backend
- Better developer experience

---

## Axios

Used for API communication.

Responsibilities:

- Authentication
- API Requests
- Token Refresh
- Error Handling
- Request Interceptors

---

# 4. Backend Technologies

## Node.js

Runs the backend server.

Responsibilities:

- Execute business logic
- Handle API requests
- Manage asynchronous operations

---

## Express.js

Provides REST API functionality.

Responsibilities:

- Routing
- Middleware
- Authentication
- Error Handling

---

## Mongoose

Provides MongoDB object modeling.

Responsibilities:

- Schema Definition
- Validation
- Relationships
- Queries
- Transactions

---

## JWT

Provides authentication.

Features:

- Access Tokens
- Refresh Tokens
- Secure Authorization

---

## bcrypt

Used for password hashing.

Passwords are never stored in plain text.

---

## Multer

Handles multipart file uploads.

Examples:

- Deposit Screenshots
- Profile Pictures

---

## Cloudinary

Stores uploaded images.

Examples:

- Profile Pictures
- Deposit Proofs
- Homepage Banners

MongoDB stores only file metadata.

---

## Winston

Handles application logging.

Examples:

- Errors
- Warnings
- API Logs
- System Events

---

# 5. Database

## MongoDB

MongoDB is the primary database.

Reasons:

- Flexible Schema
- High Performance
- Easy Scaling
- Excellent TypeScript Support

Collections include:

- Users
- Wallets
- Transactions
- Deposits
- Withdrawals
- Stocks
- Portfolios
- Referral Trees
- Notifications
- Settings
- Audit Logs

---

# 6. Configuration Management

One of the most important technologies in the platform is the **Settings Collection**.

Instead of storing business rules in code, every configurable value is stored inside MongoDB.

Examples include:

- Exchange Rates
- Deposit Packages
- Withdrawal Rules
- MLM Commission Rates
- Rank Requirements
- Trading Status
- Notification Settings
- Homepage Content
- Platform Information

Every business module retrieves configuration through the **Settings Service**.

No business logic should contain hardcoded values.

---

# 7. Caching

Version 1 uses:

- In-Memory Cache

Future versions may use:

- Redis

Cached data includes:

- Platform Settings
- Currency Settings
- MLM Configuration
- Deposit Rules
- Withdrawal Rules

Whenever an administrator updates a setting, the cache is refreshed automatically.

---

# 8. Authentication Stack

Authentication uses:

- JWT Access Tokens
- Refresh Tokens
- bcrypt Password Hashing
- Role-Based Access Control (RBAC)

Supported Roles:

- Guest
- User
- Admin
- Super Admin

---

# 9. Validation Stack

Validation is performed on both frontend and backend.

Frontend:

- React Hook Form
- Zod

Backend:

- Zod
- Mongoose Validation

Every API request must be validated before reaching business logic.

---

# 10. File Storage

Uploaded files are stored in Cloudinary.

Supported uploads include:

- Deposit Screenshots
- User Profile Pictures
- Homepage Banners

Future uploads may include:

- KYC Documents
- Marketing Assets

---

# 11. API Architecture

The backend exposes RESTful APIs.

Versioned API format:

```
/api/v1/auth

/api/v1/users

/api/v1/wallet

/api/v1/deposits

/api/v1/withdrawals

/api/v1/stocks

/api/v1/portfolio

/api/v1/mlm

/api/v1/settings

/api/v1/admin
```

All responses use a standardized JSON format.

---

# 12. Development Tools

## pnpm

Package manager for all projects.

Benefits:

- Faster installs
- Efficient disk usage
- Better workspace support

---

## ESLint

Maintains consistent code quality.

Responsibilities:

- Detect code issues
- Enforce coding standards
- Prevent common mistakes

---

## Prettier

Automatically formats code.

Benefits:

- Consistent style
- Cleaner code reviews

---

## Husky

Runs Git hooks.

Examples:

- Lint before commit
- Run tests before push

---

## lint-staged

Runs linting only on modified files.

---

# 13. Deployment Stack

Production deployment uses:

- Docker
- Docker Compose
- Nginx
- PM2
- Ubuntu Linux

Future deployments may use:

- Kubernetes
- AWS ECS
- DigitalOcean App Platform

---

# 14. Monitoring

Version 1 includes:

- Winston Logging
- Audit Logs
- API Error Logs

Future monitoring may include:

- Sentry
- Prometheus
- Grafana

---

# 15. Security Stack

Security technologies include:

- JWT Authentication
- bcrypt Password Hashing
- Helmet
- CORS
- Rate Limiting
- Input Validation
- Environment Variables
- Audit Logging

Every financial endpoint requires authentication and authorization.

---

# 16. Future Technology Roadmap

Future versions may introduce:

- Redis
- Socket.IO
- BullMQ
- RabbitMQ
- Elasticsearch
- Kubernetes
- AI Services
- Firebase Cloud Messaging
- Email Services
- SMS Gateway
- Payment Gateway Integration

The current architecture has been designed to support these technologies without major structural changes.

---

# 17. Technology Standards

The following standards are mandatory throughout development.

- Use TypeScript for every project.
- Never use JavaScript for production code.
- Use pnpm as the package manager.
- Use Tailwind CSS for styling.
- Use shadcn/ui for reusable components.
- Use TanStack Query for server state.
- Use React Hook Form with Zod for forms.
- Use MongoDB with Mongoose.
- Use JWT for authentication.
- Use the Settings Service for every configurable business rule.
- Never hardcode exchange rates, commissions, limits, or business settings.
- Cache frequently used settings for optimal performance.
- Follow a modular architecture with clear separation of concerns.

```

```
