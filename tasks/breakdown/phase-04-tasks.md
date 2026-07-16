# Phase 04 — Wallet & Transaction System: Task Breakdown

Source: [tasks/phase-04.md](../phase-04.md)

Conventions followed (matching the existing repo, e.g. `modules/settings/*`, `modules/users/*`): each module is a flat set of `wallet.*.ts` / `transaction.*.ts` files inside `apps/server/src/modules/wallet/` — **not** the nested `controllers/services/routes/...` sub-folder layout literally shown in phase-04.md, since that's not how `settings` or `users` were actually built.

Each task lists **Depends on** (task numbers that must be done first) and **Layer** (Backend / Frontend / Shared / Test / Docs).

---

## A. Shared Foundations

### 1. Define shared Wallet & Transaction types

Add `Wallet`, `WalletStatus`, `Transaction`, `TransactionType`, `TransactionCategory`, `TransactionStatus` interfaces/enums to `packages/shared-types`.
**Depends on:** none
**Layer:** Shared

### 2. Define shared Wallet validation schemas

Add Zod schemas (e.g. wallet adjustment request: amount, reason, category) to `packages/shared-validation`, reusable by both client and server.
**Depends on:** 1
**Layer:** Shared

---

## B. Backend — Data Layer

### 3. Scaffold `wallet` module folder

Create `apps/server/src/modules/wallet/` with empty placeholder files matching repo convention: `wallet.types.ts`, `wallet.model.ts`, `wallet.repository.ts`, `wallet.service.ts`, `wallet.controller.ts`, `wallet.routes.ts`, `wallet.validation.ts`, `transaction.model.ts`, `transaction.repository.ts`, `transaction.types.ts`.
**Depends on:** none
**Layer:** Backend

### 4. Wallet Mongoose model

Define `wallet.model.ts`: userId (unique ref), availableBalance, pendingBalance, totalDeposited, totalWithdrawn, totalProfit, totalInvestment, currency, status (`ACTIVE`/`LOCKED`/`FROZEN`), timestamps. Add unique index on `userId`.
**Depends on:** 1, 3
**Layer:** Backend

### 5. Transaction Mongoose model

Define `transaction.model.ts`: transactionNumber (unique), walletId, userId, type (`CREDIT`/`DEBIT`), category (enum, extensible), amount, balanceBefore, balanceAfter, currency, status (`PENDING`/`COMPLETED`/`FAILED`/`CANCELLED`), description, referenceId, metadata, createdBy, createdAt. Add indexes: transactionNumber, walletId, userId, category, type, status, createdAt (compound `userId+createdAt`, `status+createdAt`).
**Depends on:** 1, 3
**Layer:** Backend

### 6. Transaction number generator utility

Implement collision-resistant sequential ID generator producing `TRX-YYYYMMDD-NNNNNN` format (mirrors `DEP-`/`WD-` pattern used elsewhere). Place in `wallet/wallet.utils.ts` or `shared/helpers`.
**Depends on:** 5
**Layer:** Backend

### 7. Wallet-specific error classes

Add `InsufficientBalanceError`, `WalletNotFoundError`, `WalletNotActiveError` (covers LOCKED/FROZEN) extending existing `BusinessRuleError`/`NotFoundError` in `shared/errors/`.
**Depends on:** none
**Layer:** Backend

### 8. Wallet repository

Implement `wallet.repository.ts`: `create`, `findById`, `findByUserId`, `updateBalance` (atomic `$inc` within a session), `updateStatus`, `list` (paginated, for admin).
**Depends on:** 4
**Layer:** Backend

### 9. Transaction repository

Implement `transaction.repository.ts`: `create` (within session), `findById`, `findByWalletId` with filter/sort/pagination (date range, type, category, amount, status; sort latest/oldest/highest/lowest), `list` (admin, cross-user).
**Depends on:** 5, 6
**Layer:** Backend

---

## C. Backend — Service Layer

### 10. Wallet validation schemas (Zod, server-side)

`wallet.validation.ts`: positive-amount validation, valid category enum, adjustment payload (amount, category, reason), transaction-query filter params.
**Depends on:** 2, 4, 5
**Layer:** Backend

### 11. `WalletService.createWallet()`

Creates a wallet for a given userId with zeroed balances, status `ACTIVE`. Idempotent (reject/no-op if wallet already exists for user).
**Depends on:** 8
**Layer:** Backend

### 12. `WalletService.getWallet()` / `getWalletByUser()`

Read accessors with `WalletNotFoundError` handling.
**Depends on:** 8, 7
**Layer:** Backend

### 13. `WalletService.credit()`

Implements: validate wallet is ACTIVE → validate amount > 0 → start Mongo session/transaction → generate transaction number → create Transaction (status COMPLETED) → increase `availableBalance` → commit → return updated wallet. Roll back entirely on any failure.
**Depends on:** 6, 7, 8, 9, 10, 11
**Layer:** Backend

### 14. `WalletService.debit()`

Same workflow as credit, plus: check `availableBalance >= amount` before committing, reject with `InsufficientBalanceError` otherwise. Never allow negative balance.
**Depends on:** 13
**Layer:** Backend

### 15. `WalletService.freeze()` / `unfreeze()` / `lock()` / `unlock()`

Status-transition methods; only ACTIVE wallets may perform credit/debit (enforced in 13/14 via status check, not re-implemented here).
**Depends on:** 8, 12
**Layer:** Backend

### 16. `WalletService.calculateBalance()` / `getWalletSummary()`

Summary aggregation: current balance, pending balance, total deposits, total withdrawals, total investment, total profit.
**Depends on:** 12
**Layer:** Backend

### 17. `WalletService.getTransactionHistory()`

Wraps transaction repository query with filtering (date/type/category/amount/status), sorting, and server-side pagination.
**Depends on:** 9, 10
**Layer:** Backend

### 18. Wallet event hooks

Emit `WalletCredited`, `WalletDebited`, `WalletLocked`, `WalletUnlocked` events (in-process EventEmitter for now; documented as future queue/WebSocket integration point). Wire emit calls into credit/debit/lock/unlock.
**Depends on:** 13, 14, 15
**Layer:** Backend

### 19. Auto-create wallet on user registration

Hook `WalletService.createWallet()` into the registration flow (`auth.service.ts` or `users.service.ts`), inside the same transaction as user creation where feasible.
**Depends on:** 11
**Layer:** Backend

---

## D. Backend — API Layer

### 20. User wallet controller + routes

`GET /api/v1/wallet`, `GET /api/v1/wallet/summary`, `GET /api/v1/wallet/transactions`, `GET /api/v1/wallet/transactions/:id` — authenticated user, scoped to own wallet only.
**Depends on:** 12, 16, 17
**Layer:** Backend

### 21. Admin wallet read controller + routes

`GET /api/v1/admin/wallets` (paginated list), `GET /api/v1/admin/wallets/:id`, `GET /api/v1/admin/wallets/user/:userId` — ADMIN/SUPER_ADMIN only.
**Depends on:** 8, 12
**Layer:** Backend

### 22. Admin wallet adjustment endpoint

`POST /api/v1/admin/wallets/:id/adjust` — credit/debit with mandatory `reason`, ADMIN/SUPER_ADMIN only. Flow: validate → WalletService credit/debit → Audit Log entry (balanceBefore, balanceAfter, reason, admin, timestamp) → notification hook (stub, since notification module doesn't exist yet) → response. Never silently changes balances outside this audited path.
**Depends on:** 13, 14, 21, 23
**Layer:** Backend

### 23. Audit-log integration for wallet adjustments

Wire `modules/audit-log` repository/helpers into the adjustment flow (module already exists in repo — reuse, don't reinvent).
**Depends on:** 7
**Layer:** Backend

### 24. Register wallet routes centrally

Mount `wallet.routes.ts` and admin wallet routes in `apps/server/src/routes/index.ts`.
**Depends on:** 20, 21, 22
**Layer:** Backend

### 25. Apply DB indexes

Confirm/apply indexes from task 4 & 5 (walletId, userId, transactionNumber, category, type, status, createdAt) via `database/indexes.ts` or model-level index declarations.
**Depends on:** 4, 5
**Layer:** Backend

---

## E. Backend — Tests

### 26. Unit tests: WalletService credit/debit/balance

Cover: wallet creation, credit success, debit success, insufficient-balance rejection, non-ACTIVE wallet rejection, balance calculation correctness.
**Depends on:** 13, 14, 16
**Layer:** Test

### 27. Unit test: transaction rollback

Force a mid-transaction failure (e.g. mock repository throw after transaction doc created) and assert wallet balance and transaction state both roll back atomically.
**Depends on:** 13, 14
**Layer:** Test

### 28. Integration tests: user wallet API

`GET /wallet`, `/wallet/summary`, `/wallet/transactions` (+ filters/sort/pagination), `/wallet/transactions/:id`, including auth-required and cross-user access denial.
**Depends on:** 20
**Layer:** Test

### 29. Integration tests: admin wallet API + adjustment

List/get endpoints, RBAC enforcement (USER forbidden), adjustment endpoint success + audit log written + insufficient-balance debit rejection.
**Depends on:** 22
**Layer:** Test

---

## F. Frontend — Data Layer

### 30. Wallet API service

`apps/client/src/services/wallet.service.ts` — thin Axios wrapper calling the endpoints from tasks 20/21/22 (API calls only, no business logic).
**Depends on:** 20, 21, 22 (contracts), 1
**Layer:** Frontend

### 31. React Query hooks

`useWallet()`, `useWalletSummary()`, `useTransactions()` (with filter/sort/pagination params), `useWalletTransaction()` (single by id).
**Depends on:** 30
**Layer:** Frontend

---

## G. Frontend — Components

### 32. `BalanceCard` + `WalletCard` components

Reusable presentational cards for balance figures.
**Depends on:** 1
**Layer:** Frontend

### 33. `WalletStatusBadge` + `TransactionBadge` components

Status/category/type badge components using the existing status-color convention (green/orange/red/blue/gray).
**Depends on:** 1
**Layer:** Frontend

### 34. `TransactionFilter` component

Filter controls for date range, type, category, amount, status + sort selector (latest/oldest/highest/lowest).
**Depends on:** 1
**Layer:** Frontend

### 35. `TransactionTable` component

Table with columns (Transaction ID, Date, Category, Type, Amount, Status, Description), integrates `TransactionBadge`, pagination controls, empty/loading states.
**Depends on:** 33
**Layer:** Frontend

### 36. `WalletSummary` component

Renders summary block (available/pending balance, totals) consuming `useWalletSummary()` shape.
**Depends on:** 32
**Layer:** Frontend

---

## H. Frontend — Pages

### 37. Wallet Dashboard page

Assembles `WalletCard`/`BalanceCard`/`WalletSummary`/`WalletStatusBadge` wired to `useWallet()`/`useWalletSummary()`.
**Depends on:** 31, 32, 33, 36
**Layer:** Frontend

### 38. Transaction History page

Assembles `TransactionTable` + `TransactionFilter` wired to `useTransactions()`, with search, filters, pagination; export button present but disabled/future-ready.
**Depends on:** 31, 34, 35
**Layer:** Frontend

### 39. Route registration

Add Wallet Dashboard and Transaction History routes into `apps/client/src/routes/AppRoutes.tsx` (and nav link if applicable).
**Depends on:** 37, 38
**Layer:** Frontend

---

## I. Frontend — Tests

### 40. Component/page tests

Wallet dashboard render, transaction table render, filters behavior, pagination behavior, API-error state handling.
**Depends on:** 37, 38
**Layer:** Test

---

## J. Closeout

### 41. Verify exit criteria against phase-04.md

Manually confirm: auto wallet creation on register, WalletService-only balance mutation (no stray `wallet.balance +=` anywhere), atomicity, transaction immutability, admin adjustment audit trail, filtering/sorting/pagination, no hardcoded business rules, no TS/ESLint errors, full test suite green.
**Depends on:** 24, 25, 26, 27, 28, 29, 39, 40
**Layer:** Docs / QA

---

## Dependency Overview (rough execution order)

```
1 → 2 ─────────────────────────────────────────────────────────┐
1,3 → 4,5 → 6,7 → 8,9 → 10 → 11 → 12,13 → 14 → 15,16,17 → 18,19 │
                                                                  │
20,21 → 22,23 → 24,25 → 26,27,28,29                              │
                                                                  │
30 (needs 1 + backend contracts) → 31                            │
32,33 → 34 → 35 ; 32 → 36                                        │
37,38 → 39 → 40                                                  │
                                                                  │
41 (final gate) ◄─────────────────────────────────────────────────┘
```

Backend (tasks 3–29) can largely proceed independently of frontend scaffolding (30–39) once shared types (1) exist — the two tracks only truly converge at task 30, since the frontend needs real API contracts. Task 41 is the phase-exit gate and depends on everything.
