# Phase 01 — Project Foundation & Initial Setup

## Goal

Create the complete project foundation before implementing any business features.

Everything created in this phase should serve as the base for the rest of the project.

No wallet, trading, MLM, or financial logic should be implemented yet.

---

# Objectives

- Initialize frontend and backend
- Configure TypeScript
- Setup Docker
- Configure MongoDB
- Configure ESLint & Prettier
- Setup folder architecture
- Configure environment variables
- Setup logging
- Setup global error handling
- Setup validation framework
- Setup API response helpers
- Setup authentication foundation
- Configure Settings Service skeleton
- Configure project documentation

---

# Backend Tasks

## Create Express Project

- Initialize Node.js
- Configure TypeScript
- Configure tsconfig
- Configure path aliases
- Configure nodemon
- Configure dotenv

---

## Install Backend Packages

Core

- express
- mongoose
- dotenv
- cors
- helmet
- compression
- morgan
- cookie-parser

Authentication

- jsonwebtoken
- bcrypt

Validation

- zod

Logging

- winston

Upload

- multer
- cloudinary

Development

- typescript
- ts-node
- nodemon
- eslint
- prettier
- husky
- lint-staged

Testing

- jest
- supertest

---

## Folder Structure

Create the complete backend folder structure exactly as documented in:

```
04-folder-structure.md
```

---

## Shared Modules

Create

```
config/

constants/

middleware/

utils/

types/

interfaces/

helpers/

validators/

services/

lib/
```

---

## Global Error Handler

Implement

- AppError
- ValidationError
- AuthenticationError
- AuthorizationError
- NotFoundError
- BusinessRuleError

Global middleware

```
errorHandler.ts
```

---

## Logger

Configure Winston

Logs

- API
- Startup
- Shutdown
- Errors

---

## Response Helpers

Create

```
successResponse()

errorResponse()

paginationResponse()
```

---

## Environment Variables

Create

```
.env.example
```

Include

- MongoDB
- JWT
- Cloudinary
- Client URL
- Server URL

---

## Database Connection

Configure

MongoDB Atlas

Retry strategy

Connection health

---

## Base Middleware

Implement

- Helmet
- CORS
- Compression
- JSON Parser
- Cookie Parser
- Request Logger

---

## API Versioning

All APIs begin with

```
/api/v1/
```

---

## Health Route

Create

```
GET /health
```

---

# Frontend Tasks

## Create React Project

Using

- React
- Vite
- TypeScript

---

## Install Packages

React Router

TanStack Query

Axios

Tailwind

shadcn/ui

React Hook Form

Zod

Lucide React

Recharts

Framer Motion

---

## Configure

Tailwind

ESLint

Prettier

Absolute Imports

---

## Folder Structure

Generate the frontend structure exactly as documented.

---

## Theme

Setup

- Tailwind
- shadcn
- CSS Variables

---

## Routing

Create

Public Routes

Protected Routes

Admin Routes

---

## Layouts

Create

- Public Layout
- Dashboard Layout
- Admin Layout

---

## Global Components

Create reusable

- Button
- Input
- Card
- Modal
- Table
- Empty State
- Error State
- Loading State

---

# Docker

Create

```
Dockerfile

docker-compose.yml

.dockerignore
```

---

# Git

Initialize

```
.gitignore
```

Configure

Husky

Lint Staged

---

# Documentation

Verify Claude has access to

```
00-25 documentation
```

and

```
prompts/
```

---

# Deliverables

Backend

✅ Express configured

✅ MongoDB connected

✅ Docker configured

✅ Winston configured

✅ Global Error Handler

✅ Validation framework

✅ Shared architecture

---

Frontend

✅ React configured

✅ Tailwind configured

✅ shadcn installed

✅ Layouts

✅ Routing

✅ Theme

---

Infrastructure

✅ Docker

✅ Environment Variables

✅ Logging

✅ Health Check

---

# Exit Criteria

Before moving to Phase 02:

- Project builds successfully
- Docker starts successfully
- MongoDB connects
- React runs
- API responds
- Logger works
- Error Handler works
- Folder structure matches documentation
- No TypeScript errors
- No ESLint errors
- No hardcoded business rules
