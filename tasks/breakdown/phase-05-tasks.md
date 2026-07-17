# Phase 05 — Deposit Management System: Task Breakdown

Source: [tasks/phase-05.md](../phase-05.md)

Conventions followed (matching the actual repo, not phase-05.md's literal nested
`controllers/services/routes/...` sub-folder listing — same deviation noted in
[phase-04-tasks.md](./phase-04-tasks.md)): `deposit` is a flat set of
`deposit.*.ts` files inside `apps/server/src/modules/deposit/`, mirroring
`modules/wallet/*` and `modules/settings/*`.

Reused as-is from Phase 03/04 (no new work required, only wiring):

- `WalletService.credit()` (`modules/wallet/wallet-balance.service.ts`) — the only
  path allowed to increase a wallet balance. Deposit approval calls this with
  `category: TransactionCategory.DEPOSIT` (enum value already exists) and never
  touches `wallet.availableBalance` directly.
- `settingsService.getDeposit()` (`modules/settings/settings.service.ts`) and the
  `DepositSettings` type (`packages/shared-types/src/settings/deposit-settings.types.ts`:
  `enabled`, `packages: { amount }[]`, `minimumDeposit`, `maximumDeposit`,
  `paymentMethods: string[]`, `companyBkashNumber`, `companyNagadNumber`,
  `depositInstructions`) — already seeded/editable via the existing
  `/admin/settings/deposit` admin page. **No new settings work in this phase.**
- Public read `GET /api/v1/settings/deposit` — already generic
  (`settings.routes.ts`), covers phase-05.md's "load deposit settings" requirement
  with zero new backend code.
- `uploadImage()` (`shared/helpers/upload-image.ts`) + Cloudinary config — generic
  buffer→folder uploader, already used by avatar upload; deposit screenshots reuse
  it with a different folder argument.
- `Counter` / `getNextSequence()` (`database/counter.model.ts`) — already built
  generically ("future DEP-/WD- generators reuse this same collection") for the
  `DEP-YYYYMMDD-NNNNNN` number generator.
- `auditLogRepository` + `AUDIT_ACTIONS` (`modules/audit-log/*`) — reused, only
  needs two new action constants.
- Notification module does **not** exist yet (confirmed: no `modules/notifications`
  directory in the repo). Per the phase-04 precedent, notification integration is
  stubbed as a no-op call site, not built out, so a later Notifications phase can
  fill it in without touching Deposit code.

Each task lists **Depends on** (task numbers that must be done first) and
**Layer** (Shared / Backend / Frontend / Test / Docs).

---

## A. Shared Foundations

### 1. Add `DepositStatus` enum

`packages/shared-types/src/enums/deposit-status.enum.ts`: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. Mirrors the existing `TransactionStatus` enum pattern.
**Depends on:** none
**Layer:** Shared

### 2. Add shared `Deposit` domain type

`packages/shared-types/src/deposit/deposit.types.ts` — a new top-level domain folder (mirrors `auth/`, `user/`, `wallet/`, `settings/`), not nested under `wallet/`, since Deposit is its own backend module (`modules/deposit/`), parallel to `modules/wallet/`. Exports only `Deposit` (the API-facing shape: `id`, `depositNumber`, `userId`, `walletId`, `amount`, `currency`, `paymentMethod`, `senderAccountNumber`, `paymentReference`, `screenshotUrl`, `status`, `adminNote?`, `rejectionReason?`, `reviewedBy?`, `reviewedAt?`, `createdAt`, `updatedAt`) — mirrors `Transaction`'s API-shape convention (dates as ISO strings, refs as plain string ids). **Correction from the original plan:** list/query-param types (e.g. `DepositListParams`) do **not** belong here — confirmed against the actual repo, `TransactionListParams`/`AdminWalletListParams` live client-side only, in `apps/client/src/types/wallet.types.ts`, "duplicated here rather than shared... a single... union with no other coupling." The deposit equivalent belongs in task 29 (client-only), not this task.
**Depends on:** 1
**Layer:** Shared

### 3. Add missing shared Zod field schema(s) for deposit fields

**Correction from the original plan:** `packages/shared-validation` in this repo holds only atomic _field-level_ primitives (`packageAmountSchema`, `phoneNumberSchema`, `amountSchema`, etc.) — composed request-body object schemas (like `walletAdjustmentSchema`, `registerFormSchema`) always live per-app (server's `*.validation.ts`, client's `src/validators/*.validators.ts`), each importing the same field primitives so client and server validate identical fields identically without sharing one object schema. A `createDepositSchema` composed here would be the wrong layer; it's built separately in task 10 (server) and a new client validator task (section G), both reusing this task's primitives. Checking what's already reusable before adding anything new (coding_rules.md #24):

- Deposit amount → reuse the existing `packageAmountSchema` (its own comment already names deposit packages as a reuse target).
- Payment method → plain constrained string composed inline where needed (matches `walletAdjustmentSchema`'s `reason` field) — not a distinct enough concept to extract.
- Payment reference (the bKash/Nagad transaction reference the user submits) → genuinely new, not covered by anything existing. Add `paymentReferenceSchema` to `packages/shared-validation/src/fields/payment-reference.schema.ts` (trimmed, 1–50 chars), export from `shared-validation/src/index.ts`.
- Sender account number → **bug found and fixed during the Task A/B/C review:** this was originally reused from `phoneNumberSchema` (Bangladesh mobile format) on the assumption that bKash/Nagad are the only payment methods. That's wrong — `paymentMethod` is Settings-driven and the module docs name a future "Bank Transfer" method, whose account number wouldn't be a phone number; forcing the field through a mobile-only regex would break as soon as that's added, and contradicts this exact codebase's own precedent (`settings.validation.ts`'s `companyBkashNumber`/`companyNagadNumber` are validated as plain strings, not via `phoneNumberSchema`, for the same reason). Replaced with a new, payment-method-agnostic `senderAccountNumberSchema` (`packages/shared-validation/src/fields/sender-account-number.schema.ts`, trimmed, 1–50 chars).
  **Depends on:** none
  **Layer:** Shared

---

## B. Backend — Data Layer

### 4. Scaffold `deposit` module folder

**Correction from the original plan:** only `deposit.types.ts`, `deposit.model.ts`, `deposit-number.util.ts`, and `deposit.repository.ts` were created now, each with real content (tasks 5/6/8 below) — not empty placeholder stubs for `deposit-business-rules.ts`/`deposit.service.ts`/`deposit.controller.ts`/`deposit.routes.ts`/`deposit.validation.ts`/`deposit.middleware.ts`/`deposit.dto.ts` as originally described. Those files belong to Sections C/D/E and are created (with real content, not dead stubs) when those tasks are actually implemented.
**Depends on:** none
**Layer:** Backend

### 5. Deposit Mongoose model

`deposit.model.ts`: `depositNumber` (unique), `userId` (ref), `walletId` (ref), `amount` (`min: 0`), `currency`, `paymentMethod`, `senderAccountNumber`, `paymentReference` (the user-submitted payment/transaction reference — named to avoid clashing with the ledger `Transaction` model), `screenshotUrl`, `status` (`DepositStatus`, default `PENDING`), `adminNote`, `rejectionReason`, `reviewedBy` (ref, optional), `reviewedAt` (optional), timestamps. Indexes: unique `depositNumber` (from `unique: true`), compound `userId+createdAt`, compound `status+createdAt`, individual `paymentMethod` — exactly `transaction.model.ts`'s index set (**correction from the original plan:** no separate bare `userId` or `createdAt` index; `transaction.model.ts` doesn't have one either, since the compound indexes already serve those queries via their leading field — an extra bare index would be redundant write overhead with no query it uniquely serves). Also added `DEPOSIT_STATUSES` to `packages/shared-constants` (new file, mirrors `WALLET_STATUSES`/`TRANSACTION_CATEGORIES`) since the schema's `enum:` needs it — same implicit dependency phase-04's wallet model task had on `WALLET_STATUSES`.
**Depends on:** 1, 4
**Layer:** Backend

### 6. Deposit number generator utility

`deposit-number.util.ts`: reuses `getNextSequence` from `database/counter.model.ts` with a `DEP-` prefix, producing `DEP-YYYYMMDD-NNNNNN`. **Correction from the original plan:** duplicated the ~10-line date-key/pad helper from `wallet/transaction-number.util.ts` rather than extracting a shared parameterized utility — refactoring that already-shipped Phase 04 file is outside this phase's scope.
**Depends on:** 5
**Layer:** Backend

### 7. Deposit-specific error classes

**Correction from the original plan:** both extend `AppError` directly with their own fixed message/statusCode/errorCode, matching how `WalletNotFoundError`/`WalletNotActiveError`/`InsufficientBalanceError` are actually written (none of them extend an intermediate `NotFoundError`/`BusinessRuleError` base) — `DepositNotFoundError` (404, `DEPOSIT_NOT_FOUND`), `DepositNotPendingError` (400, `DEPOSIT_NOT_PENDING` — covers "can't approve/reject/cancel a non-pending deposit"). Added to `shared/errors/index.ts` barrel.
**Depends on:** none
**Layer:** Backend

### 8. Deposit repository

`deposit.repository.ts`: `create` (within optional session), `findById`, `findByDepositNumber`, `findByUserId` (paginated + filters: status/paymentMethod/date range/amount/search + sort latest/oldest/highest/lowest — mirrors `transaction.repository.ts`'s `findByWalletId`), `findAllAdmin` (same filters, cross-user), `updateStatus` (sets status + reviewedBy/reviewedAt/adminNote/rejectionReason atomically). **Correction from the original plan:** `search` matches `depositNumber` only, not username — matching a deposit to a submitting user's name requires resolving that name to a `userId` in the Users collection first, which is a service-layer concern (a later task), outside this single-collection repository's scope (the same boundary `transaction.repository.ts`'s `buildFilterQuery` draws around `transactionNumber`/`description`).
**Depends on:** 5, 6
**Layer:** Backend

---

## C. Backend — Business Rules & Validation

### 9. Deposit business-rule validators

`deposit-business-rules.ts` (mirrors `settings/settings-business-rules.ts`'s pattern): `assertDepositsEnabled(settings)`. **Correction from the original plan:** the single `assertAmountAllowed` became two separate assertions, since `DepositSettings.packages` (`{ amount }[]`) and `minimumDeposit`/`maximumDeposit` are independent config fields and phase-05.md's Deposit Validation section lists "Package Exists" and "Amount Allowed" as two distinct checks, not one — `assertPackageExists(amount, settings)` (amount must match a configured package) and `assertAmountWithinLimits(amount, settings)` (amount must still fall within min/max, catching drift if `packages` and min/max are edited out of sync). Plus `assertPaymentMethodAllowed(method, settings)` and `assertIsPending(deposit)` (shared guard for cancel/approve/reject, takes a `DepositDocument` and throws `DepositNotPendingError`).
**Depends on:** 5, 8
**Layer:** Backend

### 10. Deposit Zod validation schemas (server-side)

`deposit.validation.ts`: create-deposit body composed from task 3's field primitives (`packageAmountSchema`, `senderAccountNumberSchema`, `paymentReferenceSchema`) plus an inline payment-method string — same composition pattern as `wallet.validation.ts`'s `walletAdjustmentSchema` — list/query filter schema (page, limit, sortBy, status, paymentMethod, dateFrom, dateTo, minAmount, maxAmount, search), reject-deposit body (`rejectionReason` required non-empty string). **Correction from the original plan:** `mongoIdParamSchema` is not re-exported or redefined here — routes (a later task) import it directly from `@/shared/validators/mongo-id.validator`, same as `admin-wallet.middleware.ts` does; nothing about it belongs in this file.
**Depends on:** 3, 9
**Layer:** Backend

### 11. Deposit screenshot upload middleware

Added `uploadDepositScreenshot` to `middlewares/upload.ts` (the shared file, not a deposit-local one — keeps every multer wiring in one place), reusing the existing `upload` multer instance (`uploadConfig`'s JPG/PNG/WEBP + size limit, and the same `fileFilter`) via `upload.single('screenshot')` — no new multer instance or filter logic.
**Depends on:** none
**Layer:** Backend

---

## D. Backend — Service Layer

**Pre-requisite discovered while implementing this section, confirmed with the user before proceeding:** `walletService.credit()`/`debit()` (Phase 04) always opened and managed their own internal `ClientSession` with no way for a caller to supply one — meaning task 16's approval couldn't actually run the wallet credit and the deposit status update as one atomic transaction as originally planned, only as two independently-committing operations (a real double-credit risk on retry, and a violation of coding_rules.md #17's "Deposit approval... partial updates are not allowed"). Fixed by extending `wallet-balance.service.ts`'s `credit`/`debit` with an optional third `session?: ClientSession` parameter: when supplied, the mutation runs inside the caller's own transaction (and does not emit `WalletCredited`/`WalletDebited`, since it returns before the caller's transaction commits and no listener exists yet to observe it); when omitted, behavior is 100% unchanged (opens and commits its own session, emits its event after commit, exactly as before). All 51 existing wallet tests and the full 186-test suite pass unchanged after this change.

### 12. `DepositService.createDeposit()`

Flow: load `settingsService.getDeposit()` → `assertDepositsEnabled` → `assertAmountAllowed` → `assertPaymentMethodAllowed` → resolve caller's wallet via `walletService.getWalletByUser()` → upload screenshot buffer via `uploadImage()` to a `deposits/` Cloudinary folder → generate deposit number (task 6) → `depositRepository.create()` with `status: PENDING` → return. Wallet balance is never touched here.
**Depends on:** 6, 8, 9, 10, 11
**Layer:** Backend

### 13. `DepositService.listForUser()` / `getByIdForUser()`

Paginated own-deposits list (delegates to `deposit.repository.findByUserId`) and single-deposit fetch scoped to the caller's `userId` — a mismatched id reports `DepositNotFoundError`, not `AuthorizationError` (same non-enumeration convention as `wallet.service.ts`'s `getTransaction`).
**Depends on:** 8, 7
**Layer:** Backend

### 14. `DepositService.cancelDeposit()`

Owner-scoped; `assertIsPending` (task 9) → `updateStatus(CANCELLED)`. No wallet or ledger `Transaction` is created or modified.
**Depends on:** 9, 13
**Layer:** Backend

### 15. `DepositService.listForAdmin()` / `getByIdForAdmin()`

Cross-user paginated list + unscoped single fetch (delegates to `deposit.repository.findAllAdmin`), for the admin controller.
**Depends on:** 8, 7
**Layer:** Backend

### 16. `DepositService.approveDeposit()`

`assertIsPending` → Mongo session (`session.withTransaction`, same pattern as `wallet-balance.service.ts`'s `mutateBalance`) → `walletService.credit(walletId, { category: TransactionCategory.DEPOSIT, amount, currency, referenceId: depositNumber, createdBy: adminId })` → `updateStatus(APPROVED, { reviewedBy: adminId, reviewedAt, adminNote })` → audit log (`AUDIT_ACTIONS.DEPOSIT_APPROVED`, before/after status) → notification hook (stub call, no-op until the Notifications phase exists) → return `{ deposit, wallet, transaction }`. Everything inside one transaction; any failure rolls back both the ledger entry and the status change together.
**Depends on:** 9, 15, 17
**Layer:** Backend

### 17. Wire deposit audit actions

Add `DEPOSIT_APPROVED` and `DEPOSIT_REJECTED` to `AUDIT_ACTIONS` in `modules/audit-log/audit-log.types.ts` (reuses the existing `auditLogRepository`, no new audit infrastructure).
**Depends on:** none
**Layer:** Backend

### 18. `DepositService.rejectDeposit()`

`assertIsPending` → `updateStatus(REJECTED, { reviewedBy: adminId, reviewedAt, rejectionReason })` → audit log (`AUDIT_ACTIONS.DEPOSIT_REJECTED`) → notification hook (stub). Wallet and ledger are untouched — no Mongo transaction required since only one document changes.
**Depends on:** 9, 15, 17
**Layer:** Backend

---

## E. Backend — API Layer

### 19. User deposit controller + routes

`POST /api/v1/deposits` (`uploadDepositScreenshot` → validate → `createDeposit`), `GET /api/v1/deposits` (`listForUser`, paginated), `GET /api/v1/deposits/:id` (`getByIdForUser`), `DELETE /api/v1/deposits/:id` (`cancelDeposit`) — all behind `authenticate`, all scoped to the caller's own deposits (never take a `userId` from the request). Also added `deposit.dto.ts` (`toDepositResponse`, mirrors `wallet.dto.ts`).

**Bug found and fixed while wiring this route:** `createDepositSchema`'s `packageAmount` field (task 10) used the strict `packageAmountSchema` (`z.number()...`), but `POST /deposits` is necessarily `multipart/form-data` (it carries the screenshot file) — multer parses every non-file field as a string, so a real request's `packageAmount` would always arrive as e.g. `"3000"` and fail `z.number()`, which does not coerce. Every legitimate request would have been rejected. Fixed with `z.preprocess((value) => (typeof value === 'string' ? Number(value) : value), packageAmountSchema)` in `deposit.validation.ts` — reuses `packageAmountSchema`'s constraints/messages unchanged, only converts the string case, and a JSON-sent actual number still passes through untouched. Verified at runtime (not just by type-checking): a multipart-style string amount, a JSON-style number amount, a non-numeric string, and a negative string all now validate exactly as expected.
**Depends on:** 10, 11, 12, 13, 14
**Layer:** Backend

### 20. Admin deposit controller + routes

`GET /api/v1/admin/deposits` (`listForAdmin`, paginated + filters), `GET /api/v1/admin/deposits/:id` (`getByIdForAdmin`), `PATCH /api/v1/admin/deposits/:id/approve` (`approveDeposit`, no body — `adminNote` isn't exposed by any Zod schema yet, so it's passed as `undefined` rather than reading unvalidated `req.body`), `PATCH /api/v1/admin/deposits/:id/reject` (body: `rejectionReason`, `rejectDeposit`) — behind `authenticate` + `authorize(ADMIN, SUPER_ADMIN)`, mirroring `admin-wallet.routes.ts`/`admin-wallet.controller.ts`/`admin-wallet.middleware.ts` exactly (including redeclaring `validateDepositIdParam` locally in `admin-deposit.middleware.ts` rather than importing `deposit.middleware.ts`'s copy, matching `admin-wallet.middleware.ts`'s own precedent for the same reason: admin middleware stays self-contained).
**Depends on:** 10, 15, 16, 18
**Layer:** Backend

### 21. Register deposit routes centrally

Mount `depositRouter` at `/deposits` and `adminDepositRouter` at `/admin/deposits` in `apps/server/src/routes/index.ts`.
**Depends on:** 19, 20
**Layer:** Backend

### 22. Confirm indexes applied

Confirmed: `deposit.model.ts`'s `depositSchema.index(...)` calls (task 5 — compound `userId+createdAt`, compound `status+createdAt`, individual `paymentMethod`, plus the implicit unique index from `depositNumber`'s `unique: true`) are model-level declarations, applied automatically by Mongoose on first connection — no separate `database/indexes.ts` step exists anywhere in this repo (confirmed by grep), matching Phase 04's wallet/transaction models. Nothing further needed.
**Depends on:** 5
**Layer:** Backend

---

## F. Backend — Tests

**Correction from the original plan, all in one file:** tasks 23-25 all landed in a single `deposit.service.test.ts` rather than mirroring `wallet.service.test.ts` (fully-mocked) / `wallet-balance.service.test.ts` (real DB) as two separate files. `deposit.service.ts` is one source file (unlike wallet's split), and `jest.mock()` calls apply to a whole file's module graph, not per-`describe` — so it isn't possible to run some tests against fully-mocked `settingsService`/`walletService` and others against the real thing within the same file. Given `approveDeposit` needs the real, replica-set-backed transactional DB regardless (task 25 depends on it), every test in the file - including `createDeposit` - runs against the real DB via `connectTransactionalTestDatabase`, with `@/shared/helpers/upload-image` as the _only_ mock (the sole external/network dependency, Cloudinary). This gives `createDeposit`'s tests genuine confidence (real Settings, real wallet balance assertions) rather than mocks calling mocks. Added `createTestDeposit`/`uniqueDepositNumber` to `test/factories.ts` (mirrors `createTestTransaction`) since no deposit fixture helper existed yet.

**Bug found and fixed while writing these tests:** the "rejection when deposits disabled" test called `settingsService.updateDeposit(..., enabled: false, ...)` to set up its scenario. That write persists to the real `settings` collection _and_ refreshes the in-memory settings cache - and `clearTestDatabase` (`test/db.ts`) deliberately never touches the `settings` collection (it's seeded once per file, not per test). Every test after it in the file was silently inheriting `enabled: false` and failing at the wrong assertion. Fixed with a `describe('createDeposit')`-scoped `afterEach` that restores `SETTINGS_DEFAULTS[SettingsCategory.DEPOSIT]` after every test in that block (unconditional and idempotent, so it's harmless for tests that never touched settings) - same defensive-cleanup reasoning as `wallet-balance.service.test.ts`'s own `afterEach(() => jest.restoreAllMocks())`.

### 23. Unit tests: `DepositService.createDeposit()`

Covers: success with a valid package/payment method (screenshot URL from the mocked `uploadImage`, wallet balance unchanged), rejection when deposits disabled, rejection on an amount not matching any configured package, rejection on a disallowed payment method.
**Depends on:** 12
**Layer:** Test

### 24. Unit tests: approve / reject / cancel transitions

Covers: approve success (wallet credited exactly once, ledger `Transaction` created with `category: DEPOSIT` and the deposit's `referenceId`, status → `APPROVED`), approve on an already-`APPROVED` deposit throws `DepositNotPendingError` (representative non-pending case - `assertIsPending` is a single, already-covered boolean check, so `REJECTED`/`CANCELLED` aren't each separately re-tested), reject success (wallet untouched), cancel success on `PENDING` and rejection when not `PENDING`.
**Depends on:** 14, 16, 18
**Layer:** Test

### 25. Unit test: approval transaction rollback

Spies on `depositRepository.updateStatus` (mocked to reject once) to force a mid-transaction failure _after_ `walletService.credit` has already run inside the same `session.withTransaction` callback, and asserts the whole operation rolled back atomically: wallet balance unchanged, deposit still `PENDING`, zero ledger `Transaction` documents persisted. This is the test that actually exercises Task D's `wallet-balance.service.ts` session-composability fix.
**Depends on:** 16
**Layer:** Test

### 26. Integration tests: user deposit API

`deposit-api.test.ts` (standalone `test/db.ts`, since none of these endpoints touch the wallet balance - same reasoning as `wallet-api.test.ts`). `POST /deposits` (multipart via supertest's `.field()`/`.attach()`, mocked `uploadImage`): success, missing screenshot (422), missing required field (422), disallowed package amount (400 `BUSINESS_RULE_VIOLATION`), unauthenticated (401). `GET /deposits` (+ status filter, `sortBy`, ownership scoping). `GET /deposits/:id` (own vs. another user's → 404, not 403). `DELETE /deposits/:id` (cancels `PENDING`, rejects non-`PENDING` with `DEPOSIT_NOT_PENDING`).
**Depends on:** 19
**Layer:** Test

### 27. Integration tests: admin deposit API

`admin-deposit-api.test.ts` (`connectTransactionalTestDatabase`, since approve calls `walletService.credit`). RBAC enforcement (`USER` role → 403 on list/get/approve/reject; unauthenticated → 401), list/filter (by payment method), approve → wallet balance increases (re-fetched via the admin wallet endpoint) + audit log row exists with the correct admin `userId`, approving a non-`PENDING` deposit → 400 with no audit log written, reject → wallet unchanged + audit log row exists, reject with a missing `rejectionReason` → 422. **Correction from the original plan:** dropped "notification hook invoked (spy)" - `approveDeposit`/`rejectDeposit` (Task D) only leave a comment noting the notification integration point; there is no actual function call there to spy on, and inventing one just to satisfy this test would be adding untested surface rather than testing what exists.
**Depends on:** 20
**Layer:** Test

---

## G. Frontend — Data Layer

### 28. Deposit endpoint constants

`apps/client/src/constants/deposit-endpoints.constants.ts`, mirroring `wallet-endpoints.constants.ts`'s `DEPOSITS`, `DEPOSIT_BY_ID(id)`, `ADMIN_LIST`, `ADMIN_BY_ID(id)`, `ADMIN_APPROVE(id)`, `ADMIN_REJECT(id)`.
**Depends on:** none
**Layer:** Frontend

### 29. Deposit client-only types

`apps/client/src/types/deposit.types.ts`: `CreateDepositPayload` (FormData-shaped: packageAmount, paymentMethod, senderAccountNumber, paymentReference, screenshot: File), `DepositListParams`, `RejectDepositPayload`. **Correction from the original plan:** no separate `AdminDepositListParams` — the server's `deposit.validation.ts` reuses one `depositListQuerySchema` for both `GET /deposits` and `GET /admin/deposits` (unlike wallet, which has genuinely different user/admin list shapes), so a second, byte-for-byte-identical client type would be pure duplication. `DepositListParams` is reused by both `getDeposits` and `adminListDeposits`.
**Depends on:** 2
**Layer:** Frontend

### 30. Deposit API service

`apps/client/src/services/deposit.service.ts`: `createDeposit` (multipart `FormData`), `getDeposits`, `getDepositById`, `cancelDeposit`, `adminListDeposits`, `adminGetDepositById`, `adminApproveDeposit`, `adminRejectDeposit` — thin Axios wrappers, no business logic, matching `wallet.service.ts`'s shape.
**Depends on:** 19, 20 (contracts), 28, 29
**Layer:** Frontend

### 31. React Query hooks

**Correction from the original plan, split into two files:** `apps/client/src/hooks/useDepositQueries.ts` (`useDeposits()`, `useDeposit(id)`, `useAdminDeposits()`, `useAdminDeposit(id)`, plus the exported `DEPOSIT_QUERY_KEYS`) and `apps/client/src/hooks/useDepositMutations.ts` (`useCreateDeposit()`, `useCancelDeposit()`, `useApproveDeposit()`, `useRejectDeposit()`) — matching this codebase's established `use*Queries.ts` / `use*Mutations.ts` file split (`useSettingsQueries.ts`/`useSettingsMutations.ts`, `useProfileMutations.ts`), not one combined file. `DEPOSIT_QUERY_KEYS.root` (`['deposits']`) lets every mutation invalidate the whole deposit key space in one call, hierarchical exactly like `useWalletQueries.ts`'s `WALLET_QUERY_KEYS.wallet`. `useApproveDeposit` additionally invalidates `WALLET_QUERY_KEYS.wallet` (approval credits the wallet) — invalidating that one root key also covers `summary`/`transactions` beneath it, so they don't need separate invalidation calls.
**Depends on:** 30
**Layer:** Frontend

---

## H. Frontend — Components

### 32. `DepositStatusBadge`

`components/common/DepositStatusBadge.tsx` - status badge for `PENDING`(warning)/`APPROVED`(success)/`REJECTED`(destructive)/`CANCELLED`(secondary), reusing the same color-mapping convention as the existing `WalletStatusBadge`/`TransactionBadge`.
**Depends on:** 1
**Layer:** Frontend

### 33. `DepositPackageSelector` + `PaymentMethodCard`

`components/forms/DepositPackageSelector.tsx` (a Select of the configured package amounts) + `components/cards/PaymentMethodCard.tsx` (a Select of payment methods, plus the matching company bKash/Nagad number and deposit instructions). Both driven by `useDepositSettings()` (`GET /settings/deposit`, already existed) dynamically — never a hardcoded list. **Correction from the original plan:** `PaymentMethodCard` resolves which single company account number to display via a best-effort case-insensitive match against the selected method's name (`resolveCompanyNumber`), since `DepositSettings` only exposes `companyBkashNumber`/`companyNagadNumber` as two specific fields, not a generic per-method map.
**Depends on:** 2
**Layer:** Frontend

### 34. `ScreenshotUploader`

`components/forms/ScreenshotUploader.tsx` - file input + image preview + client-side MIME/size validation (UX only — the real check is server-side multer). Emits a `File | null` for the form to submit as `FormData`. **Correction from the original plan:** the preview object URL is computed via `useMemo` on `value`, not `useState` set inside a `useEffect` — `eslint-plugin-react-hooks`'s `set-state-in-effect` rule flags synchronous `setState` inside an effect body; a `useEffect` is still used, but only for its legitimate job (revoking the previous object URL on change/unmount), never for computing the displayed value.
**Depends on:** none
**Layer:** Frontend

### 35. `DepositForm`

First composes its own client-side object schema in `apps/client/src/validators/deposit.validators.ts` (`createDepositFormSchema`) from task 3's field primitives — mirrors `auth.validators.ts`'s `registerFormSchema` composing from the same shared primitives the server uses, rather than importing one pre-built object schema. React Hook Form + that schema, assembles `DepositPackageSelector`, `PaymentMethodCard`, `ScreenshotUploader`, sender-account and payment-reference fields; submits via `useCreateDeposit()`. **Correction from the original plan:** `screenshot`'s Zod field is `z.instanceof(File).nullable().refine(...)` so it can start `null` before a file is picked - empirically, Zod (3.25) narrows a `.refine()`'s _output_ type to exclude `null` even with a plain boolean predicate (not only a `file is File` type-predicate one), so the schema's input shape and validated output shape genuinely differ. `deposit.validators.ts` exports both `CreateDepositFormInput` (`z.input`, matches `defaultValues`) and `CreateDepositFormValues` (`z.output`, matches `onSubmit`'s parameter and `useCreateDeposit()`'s payload); `DepositForm` calls `useForm<CreateDepositFormInput, unknown, CreateDepositFormValues>(...)` — React Hook Form's documented two-extra-generic pattern for a resolver whose validated output differs from its input — rather than fighting the narrowing with a manual `as File` cast.
**Depends on:** 3, 33, 34
**Layer:** Frontend

### 36. `DepositTable` + `DepositCard` + `DepositDetailsCard`

`DepositTable` (`components/tables/`): columns (Deposit Number, Date, Amount, Payment Method, Status), pagination controls, integrates `DepositStatusBadge`, empty/loading states — mirrors `TransactionTable`. `DepositCard` (`components/cards/`): compact summary card, same layout convention as `WalletCard`. `DepositDetailsCard` (`components/cards/`): full detail view (payment method, sender account number, payment reference, submitted/reviewed dates, admin note/rejection reason if reviewed, screenshot preview) — kept purely presentational (no Approve/Reject actions of its own) so both the user's own detail page and the admin approval screen (Task 39, not yet built) can reuse it as-is, each composing its own actions around it. **Correction from the original plan:** "user info" is an optional `submitterLabel` prop the caller resolves and passes in — `Deposit` itself only carries `userId`, not a display name, and resolving that is a page-level (Task I) concern, not this component's.
**Depends on:** 32
**Layer:** Frontend

---

## I. Frontend — Pages

**Two components built here that weren't in Task H's list, needed to actually complete these pages (same "discovered while implementing" precedent as Task D's wallet-balance.service.ts session fix):**

- `components/common/ConfirmDialog.tsx` — one shared, controlled (`open`/`onOpenChange`) confirmation dialog for every approve/reject/cancel action site, per `ui_rules.md`'s "destructive actions must require confirmation." Nothing in this codebase used `Dialog` yet.
- `components/tables/DepositFilter.tsx` — mirrors `TransactionFilter` closely (search, date range, min/max amount, status, `sortBy`, plus an optional Settings-driven `paymentMethods` Select). Needed because task 38/40 both explicitly ask for "filters," Task H didn't provision a filter component, and `depositListQuerySchema` already supports all of these server-side.

### 37. User: Deposit Dashboard / Create Deposit page

`pages/deposit/DepositDashboardPage.tsx`, mounted at `/deposits/new` (see task 41's route correction below) — a thin shell around `DepositForm`, which already wires `useCreateDeposit()` and renders the Settings-driven instructions/company numbers (via `PaymentMethodCard`) itself, same relationship `WalletDashboardPage` has to `WalletCard`/`WalletSummary`.
**Depends on:** 31, 35
**Layer:** Frontend

### 38. User: Deposit History + Deposit Details pages

`pages/deposit/DepositHistoryPage.tsx` (mounted at `/deposits`): `DepositFilter` + `DepositTable`, wired to `useDeposits(params)`, same structure as `TransactionHistoryPage`. `pages/deposit/DepositDetailsPage.tsx` (mounted at `/deposits/:id`): `DepositDetailsCard` wired to `useDeposit(id)`, with a Cancel action shown only while `status === PENDING`, wired to `useCancelDeposit()` — **correction from the original plan:** behind `ConfirmDialog`, not a plain button (cancelling is an irreversible state transition, so `ui_rules.md`'s confirmation requirement applies here too, not just to the admin actions).
**Depends on:** 31, 36
**Layer:** Frontend

### 39. Admin: Pending Deposits + Approval/Rejection screen

**Correction from the original plan, consolidated with task 40:** rather than a separate "pending deposits" list route, `pages/admin/deposit/AdminDepositsPage.tsx` (task 40, below) defaults its status filter to `PENDING` — the identical list+filter view already covers both "the actionable queue" and "full history" depending on whether that one filter is set, and `GET /admin/deposits` already supports every filter either task needs, so building two near-duplicate list pages/routes would contradict `coding_rules.md`'s reuse principle and Task 41's own route list (which only names one admin list route). The detail+actions half of this task is real and separate: `pages/admin/deposit/AdminDepositDetailPage.tsx` (mounted at `/admin/deposits/:id`) — `DepositDetailsCard` (screenshot preview included, `submitterLabel={deposit.userId}` since `Deposit` carries no display name to resolve) + Approve/Reject, each behind `ConfirmDialog`, wired to `useApproveDeposit()`/`useRejectDeposit()`. Reject's confirm button stays disabled until a non-empty reason is typed into a `Textarea` inside the dialog.
**Depends on:** 31, 36
**Layer:** Frontend

### 40. Admin: Deposit History page

`pages/admin/deposit/AdminDepositsPage.tsx` (mounted at `/admin/deposits`) — `DepositFilter` (with `paymentMethods` from `useDepositSettings()`) + `DepositTable` over `useAdminDeposits(params)`, defaulting to `status: PENDING` (task 39) but fully clearable to browse cross-user history with every filter `depositListQuerySchema` supports (status, payment method, date range, amount, search). **Correction from the original plan:** no "user" filter — `depositListQuerySchema`/`DepositFilters` were never built with a `userId` param (confirmed against Task B/C), so there's no backend capability to wire a user filter to; inventing one now would mean adding new backend surface area, out of scope for a frontend-pages task.
**Depends on:** 31, 36
**Layer:** Frontend

### 41. Route registration

Added to `apps/client/src/routes/AppRoutes.tsx`: `/deposits` → `DepositHistoryPage`, `/deposits/new` → `DepositDashboardPage`, `/deposits/:id` → `DepositDetailsPage` (all under `ProtectedRoute`/`DashboardLayout`); `/admin/deposits` → `AdminDepositsPage`, `/admin/deposits/:id` → `AdminDepositDetailPage` (under `AdminRoute`/`AdminLayout`). **Correction from the original plan:** `/deposits` is the _history_ list, not the create form — there was no existing placeholder route to "replace" (no prior `/deposits` route existed at all), so these were pure additions. Added a "Deposits" nav link to both `DashboardLayout`'s `DASHBOARD_NAV_ITEMS` and `AdminLayout`'s `ADMIN_NAV_ITEMS`.
**Depends on:** 37, 38, 39, 40
**Layer:** Frontend

---

## J. Frontend — Tests

### 42. Component/page tests

One test file per component/page (this codebase's established convention — `TransactionTable.test.tsx`, `RegistrationForm.test.tsx`, etc. — not one combined file): `ScreenshotUploader.test.tsx`, `DepositForm.test.tsx`, `DepositTable.test.tsx`, `AdminDepositDetailPage.test.tsx` (the "admin approval/rejection interaction" test — confirmation dialogs, reject-reason gating, and API-error display for both approve/reject all live here). **"DepositTable render/filter/pagination" corrected to "render/pagination":** `DepositTable` itself doesn't filter (that's `DepositFilter`/the parent page's job), so there's nothing filter-related to test at this component's level.

**Three real bugs found and fixed while writing these tests** (none were features — all pre-existing defects in Task H/earlier code, only surfaced because this was the first time anything actually exercised these paths):

1. **`ScreenshotUploader`'s hidden file input had no accessible name** (no `aria-label`, no associated `<label>`) — both an accessibility gap (`ui_rules.md` mandates ARIA labels) and untestable via accessible queries. Added `aria-label="Payment screenshot"`.
2. **`DepositPackageSelector`/`PaymentMethodCard`'s `Select` switched from uncontrolled (`value={undefined}`) to controlled (`value="3000"`) after the first selection** — a real React anti-pattern that logs a console warning and can cause subtle state bugs, only surfaced once a test actually drove a full select-a-package interaction. Fixed by always passing a defined string (`''` when nothing is picked yet) so the `Select` is controlled for its entire lifetime.
3. **`userEvent.upload()` silently no-ops for a file that doesn't match the input's `accept` attribute** (it simulates a real browser file picker, which wouldn't offer a non-matching file at all) — meaning it can't exercise `ScreenshotUploader`'s own MIME/size validation code at all. `ScreenshotUploader.test.tsx`'s rejection tests use `fireEvent.change()` directly instead, bypassing the simulated picker to hit the same code path a drag-and-drop upload (not filtered by `accept`) would.

**One recurring test-authoring gotcha, not a product bug:** this TanStack Query version calls `mutationFn` with a second (mutation context) argument, so `toHaveBeenCalledWith(payload)` assertions against a mutation's underlying service call need `expect.anything()` as a second argument matcher — already established by `RegistrationForm.test.tsx`, applied here for `depositService.createDeposit`/`adminApproveDeposit`. (`adminRejectDeposit` doesn't need it — `useRejectDeposit`'s `mutationFn` is a wrapper that only forwards `(id, payload)` itself, not the context it receives.)
**Depends on:** 37, 38, 39, 40
**Layer:** Test

---

## K. Closeout

### 43. Verify exit criteria against phase-05.md

Checked each of `phase-05.md`'s 12 Exit Criteria against the actual implementation (not just re-reading prior tasks' claims — re-grepped and re-ran everything fresh):

| #   | Criterion                                                | Status                                                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | -------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Users can submit deposit requests successfully           | ✅ Met                                                        | `deposit-api.test.ts`'s multipart-request test + `DepositForm.test.tsx`'s submission test, both passing                                                                                                                                                                                                                                                                                            |
| 2   | Deposit rules loaded entirely from the Settings Service  | ✅ Met                                                        | `createDeposit` calls `settingsService.getDeposit()`; grepped `deposit.service.ts`, `DepositForm.tsx`, `DepositPackageSelector.tsx`, `PaymentMethodCard.tsx`, `client/deposit.service.ts` for literal package amounts (3000/6000/12000/100000) and payment method names ('bKash'/'Nagad') outside test fixtures — zero hits in production code                                                     |
| 3   | Screenshots upload to Cloudinary, only the URL is stored | ✅ Met                                                        | `uploadImage()` called in `createDeposit`; `deposit.model.ts`'s `screenshotUrl` is the only screenshot-related field (a `String`); `middlewares/upload.ts` uses `multer.memoryStorage()` — never touches disk                                                                                                                                                                                      |
| 4   | Deposits stay `PENDING` until administrator approval     | ✅ Met                                                        | Grepped every `DepositStatus.*` assignment in `deposit.service.ts`: `CANCELLED` only in `cancelDeposit`, `APPROVED` only in `approveDeposit`, `REJECTED` only in `rejectDeposit` — all three gated by `assertIsPending`                                                                                                                                                                            |
| 5   | Approval credits the wallet only through `WalletService` | ✅ Met                                                        | Exactly one `walletService.credit` call in the entire deposit module, inside `approveDeposit`                                                                                                                                                                                                                                                                                                      |
| 6   | Every approved deposit creates a wallet transaction      | ✅ Met                                                        | `walletService.credit` → `mutateBalanceInSession` atomically creates the ledger `Transaction` alongside the balance update, in the same MongoDB transaction as the deposit's status change                                                                                                                                                                                                         |
| 7   | Rejecting/cancelling never affects wallet balances       | ✅ Met                                                        | Same grep as #5 — `rejectDeposit`/`cancelDeposit` contain no wallet call at all                                                                                                                                                                                                                                                                                                                    |
| 8   | Notifications generated according to platform settings   | ❌ **Not met — known, intentional gap, not silently dropped** | No `modules/notifications` directory exists anywhere in the repo; `approveDeposit`/`rejectDeposit` (`deposit.service.ts` lines 228, 277) are comment-only no-op stubs. Documented since Task D as deferred to a future Notifications phase (same precedent as Phase 04's wallet module) — flagging again here explicitly since this is the one exit criterion this phase does not actually satisfy |
| 9   | Audit logs for every administrative action               | ✅ Met (for what exists)                                      | `approveDeposit`/`rejectDeposit` both call `auditLogRepository.create` with `DEPOSIT_APPROVED`/`DEPOSIT_REJECTED`; admin list/get are read-only, no audit log expected                                                                                                                                                                                                                             |
| 10  | No configurable values hardcoded                         | ✅ Met                                                        | Same grep as #2, plus Task A-C's `DepositSettings`-driven design throughout                                                                                                                                                                                                                                                                                                                        |
| 11  | No TypeScript/ESLint errors                              | ✅ Met                                                        | Fresh full-repo run: server `tsc --noEmit` + `eslint src` clean; client `tsc -b --force` + `eslint src` clean (only 4 pre-existing warnings in vendored shadcn/ui files, unrelated to this phase)                                                                                                                                                                                                  |
| 12  | Unit/integration/rollback tests pass                     | ✅ Met                                                        | Fresh full run: server 24 suites/223 tests passing, client 21 files/135 tests passing; `jest -t "rolls back"` isolates exactly 2 matching tests (the pre-existing wallet one and the new deposit-approval one), both passing                                                                                                                                                                       |

**Net result: 11 of 12 exit criteria are met.** Criterion 8 (notifications) is the one genuine gap, and it's a known, previously-documented one rather than a surprise — the Notifications module is out of this phase's scope entirely (confirmed absent at the very start of Task A's planning) and every notification call site across both Phase 04 (wallet) and Phase 05 (deposit) was deliberately left as a stub for a future phase to fill in. Recommend treating Phase 05 as functionally complete and moving to Phase 06 with this one item carried forward, rather than blocking on building a Notifications module that was never in scope here.
**Depends on:** 21, 22, 23, 24, 25, 26, 27, 41, 42
**Layer:** Docs / QA

---

## Dependency Overview (rough execution order)

```
1 → 2 ; 1 → 3                                                          (shared)
4 → 5 → 6 → 8 → 9 → 10 ; 4 → 7 ; 11                                    (data + validation)
6,8,9,10,11 → 12 → 13 → 14 ; 8,7 → 15 ; 17 → 16,18                      (services)
10,11,12,13,14 → 19 ; 10,15,16,18 → 20 → 21,22                         (API)
19 → 23 ; 14,16,18 → 24 ; 16 → 25 ; 19 → 26 ; 20 → 27                  (backend tests)
28,29 → 30 → 31                                                        (frontend data)
1 → 32 ; 2 → 33 ; 34 ; 3,33,34 → 35 ; 32 → 36                          (frontend components)
31,35 → 37 ; 31,36 → 38,39,40 → 41 → 42                                (frontend pages/tests)
43 (final gate) ◄─── 21,22,23,24,25,26,27,41,42
```

Backend (4–27) can proceed almost entirely independently of frontend work
(28–42) once the shared foundations (1–3) exist — the two tracks converge at
task 30, which needs real API request/response contracts from tasks 19–20.
Tasks 16/18 (approve/reject) both depend on task 17 (audit actions) but not on
each other, so they can be built in either order or in parallel. Task 43 is the
phase-exit gate and depends on everything upstream of it.
