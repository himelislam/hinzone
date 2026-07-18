# Phase 06 — Withdrawal Management System: Task Breakdown

Source: [tasks/phase-06.md](../phase-06.md)

Conventions followed (same deviation already established and documented in
[phase-04-tasks.md](./phase-04-tasks.md) and [phase-05-tasks.md](./phase-05-tasks.md)):
`withdrawal` is a flat set of `withdrawal.*.ts` files inside
`apps/server/src/modules/withdrawal/`, mirroring `modules/deposit/*` (the closest
existing precedent — a user-submitted, admin-approved financial request that
eventually mutates the wallet) rather than phase-06.md's literal nested
`controllers/services/routes/...` sub-folder listing.

## Two decisions resolved before task-by-task planning

**1. Wallet debit timing — Approval vs. Completion.** `phase-06.md`'s own
"Withdrawal Approval Workflow" diagram (line ~271) shows `WalletService.debit()`
running at the **Approve** step. This directly contradicts two documents ranked
above a phase checklist in this repo's own precedence order
(`prompts/coding_rules.md`: "If implementation details conflict with the project
documentation, the project documentation takes precedence"):

- `docs/10-withdraw-module.md` line 185: _"Only **Completed** withdrawals
  permanently reduce the wallet balance."_ — and its own "Wallet Integration"
  section (line 448) ties the debit explicitly to the **Completed** transition,
  not Approved.
- `docs/19-business-rules.md` §9: withdrawal statuses list `Approved` and
  `Completed` as distinct states, and §5 (Wallet Rules) names "Withdrawal
  **Completion**" — not "Withdrawal Approval" — as the wallet-mutating event.

This breakdown follows `docs/10` + `docs/19`: **`WalletService.debit()` is only
ever called from `completeWithdrawal()`**, not `approveWithdrawal()`. Approve
only records administrative sign-off (same single-document-update shape as
`deposit.service.ts`'s `rejectDeposit` — no Mongo transaction needed, since
nothing but the withdrawal document changes). This also matches the doc's own
"Processing Workflow" framing of `APPROVED → PROCESSING → COMPLETED` as tracking
_payment progress_ — the money moves once, at the end, when an admin confirms
the external payout actually happened.

**2. Withdrawal fee model is percentage-only in this phase.** `phase-06.md`
asks the fee engine to "future-proof" support for Percentage / Fixed / No Fee.
But `WithdrawalSettings` (`packages/shared-types/src/settings/withdrawal-settings.types.ts`,
already shipped in Phase 3) only defines `withdrawalFeePercentage: number` — no
flat-fee field exists anywhere in the Settings schema, its Zod validator
(`settings.validation.ts`'s `withdrawalSettingsSchema`), or its business-rule
validator (`settings-business-rules.ts`'s `validateWithdrawal`). Adding a
discriminated percentage/fixed fee shape would mean reopening the already-shipped
Settings module — out of this phase's scope. This breakdown implements
percentage-only (`0%` already covers "No Fee"); switching to a
percentage-or-fixed union is called out as a carried-forward gap in the
Closeout task, the same way Phase 05 carried forward the missing Notifications
module.

Reused as-is from Phase 03/04/05 (no new work required, only wiring):

- `WalletService.debit()` (`modules/wallet/wallet-balance.service.ts`) — already
  accepts an optional `session?: ClientSession` third parameter (added during
  Phase 05 specifically so a caller-owned transaction can wrap a ledger mutation
  together with a status update). `completeWithdrawal` reuses this unchanged.
- `settingsService.getWithdrawal()` (`modules/settings/settings.service.ts`) and
  the `WithdrawalSettings` type — already seeded/editable via the existing
  `/admin/settings/withdrawal` admin page (`WithdrawalSettingsPage.tsx`,
  already routed in `AppRoutes.tsx`). **No new Settings work in this phase.**
  `withdrawalSettingsSchema` and `validateWithdrawal` (min ≤ max, waiting period
  ≥ 0, fee percentage in range) are already enforced at the Settings layer.
- Public read `GET /api/v1/settings/withdrawal` — already generic
  (`settings.routes.ts`), covers phase-06.md's "load withdrawal settings"
  requirement with zero new backend code.
- `Counter` / `getNextSequence()` (`database/counter.model.ts`) — reused for the
  `WD-YYYYMMDD-NNNNNN` number generator, same as `DEP-` before it.
- `auditLogRepository` + `AUDIT_ACTIONS` (`modules/audit-log/*`) — reused, only
  needs four new action constants.
- `ConfirmDialog` (`components/common/ConfirmDialog.tsx`) — already built during
  Phase 05 for deposit approve/reject/cancel; every withdrawal
  approve/reject/processing/complete/cancel action reuses it, no new
  confirmation-dialog component needed.
- Notification module still does **not** exist (`modules/notifications` absent,
  confirmed unchanged since Phase 05). Notification integration stays a
  no-op stub call site, per the same precedent both prior phases established.

Each task lists **Depends on** (task numbers that must be done first) and
**Layer** (Shared / Backend / Frontend / Test / Docs).

---

## A. Shared Foundations

### 1. Add `WithdrawalStatus` enum

`packages/shared-types/src/enums/withdrawal-status.enum.ts`: `PENDING`,
`APPROVED`, `PROCESSING`, `COMPLETED`, `REJECTED`, `CANCELLED`. Mirrors
`DepositStatus`'s enum pattern — six states instead of four, per phase-06.md's
"Withdrawal Status" section.
**Depends on:** none
**Layer:** Shared

### 2. Add `WITHDRAWAL_STATUSES` shared constant

`packages/shared-constants/src/withdrawal-statuses.constants.ts` — `Object.values(WithdrawalStatus)`,
mirrors `DEPOSIT_STATUSES`. Needed by `withdrawal.model.ts`'s schema `enum:`.
**Depends on:** 1
**Layer:** Shared

### 3. Add shared `Withdrawal` domain type

`packages/shared-types/src/withdrawal/withdrawal.types.ts` — new top-level
domain folder (mirrors `deposit/`, `wallet/`), not nested under `wallet/` or
`deposit/`, since Withdrawal is its own backend module. Exports the
API-facing `Withdrawal` shape: `id`, `withdrawalNumber`, `userId`, `walletId`,
`amount`, `withdrawalFee`, `netAmount`, `currency`, `paymentMethod`,
`receiverAccountNumber`, `accountHolderName`, `status`, `adminNote?`,
`rejectionReason?`, `approvedBy?`, `approvedAt?`, `processedAt?`,
`completedAt?`, `createdAt`, `updatedAt` — dates as ISO strings, refs as plain
string ids, mirrors `Deposit`'s API-shape convention exactly.
**Depends on:** 1
**Layer:** Shared

### 4. Add missing shared Zod field primitive

`packages/shared-validation`'s existing primitives already cover most of this
module's fields — checking reuse before adding anything new
(`coding_rules.md`'s reuse principle, same check Phase 05 did):

- Withdrawal amount → reuse `amountSchema` (generic positive number) — **not**
  `packageAmountSchema`, since withdrawal amounts are a user-chosen figure
  within min/max, not a fixed "package" like deposits.
- Account holder name → reuse `fullNameSchema` unchanged — it's already a
  generic person-name validator (2–100 chars), no withdrawal-specific meaning.
- Payment method → inline constrained string, same as `deposit.validation.ts`'s
  approach (not a distinct enough concept to extract).
- Receiver account number → genuinely new. Reusing `senderAccountNumberSchema`
  directly would be semantically backwards (that name specifically means "the
  account the user is paying _from_"; this one is "the account funds should be
  _sent to_") even though the constraint shape is identical (trimmed, 1–50
  chars, payment-method-agnostic — same reasoning `senderAccountNumberSchema`'s
  own comment already documents). Add `receiverAccountNumberSchema` to
  `packages/shared-validation/src/fields/receiver-account-number.schema.ts`,
  export from `shared-validation/src/index.ts`.

**Depends on:** none
**Layer:** Shared

---

## B. Backend — Data Layer

### 5. Scaffold `withdrawal` module folder

Only files with real content are created as their own tasks land below (`withdrawal.types.ts`,
`withdrawal.model.ts`, `withdrawal-number.util.ts`, `withdrawal.repository.ts`,
etc.) — no empty placeholder stubs, same corrected convention Phase 05 already
established over phase-05.md's literal nested-folder listing.
**Depends on:** none
**Layer:** Backend

### 6. Withdrawal Mongoose model

`withdrawal.model.ts`: `withdrawalNumber` (unique), `userId` (ref), `walletId`
(ref), `amount` (`min: 0`), `withdrawalFee` (`min: 0`), `netAmount` (`min: 0`),
`currency`, `paymentMethod`, `receiverAccountNumber`, `accountHolderName`,
`status` (`WithdrawalStatus`, default `PENDING`), `adminNote`,
`rejectionReason`, `approvedBy` (ref, optional), `approvedAt` (optional),
`processedAt` (optional — set when moved to `PROCESSING`), `completedAt`
(optional — set when moved to `COMPLETED`, the moment the wallet is actually
debited; reconciles `docs/10-withdraw-module.md`'s explicit `completedAt`
field with phase-06.md's field list, which names "Processed At" but not a
separate completion timestamp), timestamps. Indexes: unique `withdrawalNumber`
(from `unique: true`), compound `userId+createdAt`, compound `status+createdAt`,
individual `paymentMethod` — exactly `deposit.model.ts`'s index set.
**Depends on:** 1, 2, 5
**Layer:** Backend

### 7. Withdrawal number generator utility

`withdrawal-number.util.ts`: reuses `getNextSequence` from
`database/counter.model.ts` with a `WD-` prefix, producing
`WD-YYYYMMDD-NNNNNN`. Duplicates the same ~10-line date-key/pad helper
`deposit-number.util.ts` duplicated from `transaction-number.util.ts` before
it — refactoring either of those already-shipped files into one shared
parameterized generator is outside this phase's scope (same call Phase 05
made).
**Depends on:** 6
**Layer:** Backend

### 8. Withdrawal-specific error classes

Both extend `AppError` directly with a fixed message/statusCode/errorCode,
matching `DepositNotFoundError`/`DepositNotPendingError`'s precedent:

- `WithdrawalNotFoundError` (404, `WITHDRAWAL_NOT_FOUND`).
- `WithdrawalInvalidTransitionError` (400, `WITHDRAWAL_INVALID_TRANSITION`) —
  one shared class for every guard below (cancel needs `PENDING`,
  approve/reject need `PENDING`, processing needs `APPROVED`, complete needs
  `APPROVED` or `PROCESSING`) rather than a separate error class per
  transition — the four guards differ only in which status(es) they accept,
  not in what kind of failure this represents.

Added to `shared/errors/index.ts` barrel.
**Depends on:** none
**Layer:** Backend

### 9. Withdrawal repository

`withdrawal.repository.ts`: `create` (within optional session), `findById`
(optional session), `findByWithdrawalNumber`, `findByUserId` (paginated +
filters: status/paymentMethod/date range/amount/search + sort
latest/oldest/highest/lowest — mirrors `deposit.repository.ts`'s
`findByUserId`), `findAllAdmin` (same filters, cross-user), `updateStatus`
(sets status + whichever of approvedBy/approvedAt/processedAt/completedAt/
adminNote/rejectionReason apply, atomically, optional session for the
`completeWithdrawal` transaction). Search matches `withdrawalNumber` only —
same single-collection boundary `deposit.repository.ts`'s `buildFilterQuery`
already draws (resolving a submitting user's display name to a `userId` is a
service-layer concern, out of scope here).
**Depends on:** 6, 7
**Layer:** Backend

### 10. Extend `deposit.repository.ts` with `findEarliestApprovedByUserId`

The one piece of new work inside an already-shipped module this phase: the
waiting-period check (Section C, task 11) needs the user's first **approved**
deposit date (`docs/10-withdraw-module.md`'s "Latest Eligible Deposit" /
business-rules' "firstDepositDate"). Add
`findEarliestApprovedByUserId(userId): Promise<DepositDocument | null>` to
`deposit.repository.ts` (`Deposit.findOne({ userId, status: APPROVED }).sort({ createdAt: 1 })`)
— read-only, does not touch any existing deposit behavior, same shape as this
repository's other single-purpose finder methods.
**Depends on:** none (existing module — additive only)
**Layer:** Backend

---

## C. Backend — Business Rules & Validation

### 11. Withdrawal business-rule validators

`withdrawal-business-rules.ts` (mirrors `deposit-business-rules.ts`'s pattern):

- `assertWithdrawalsEnabled(settings)`
- `assertAmountWithinLimits(amount, settings)` — `minimumWithdrawal`/`maximumWithdrawal`
- `assertPaymentMethodAllowed(method, settings)`
- `assertSufficientBalance(amount, wallet)` — a fast pre-check against
  `wallet.availableBalance` for a clear rejection message at request time; the
  check that actually gates money movement still lives inside
  `WalletService.debit`'s own transaction at completion time (balance can
  legitimately move between request and completion).
- `assertWaitingPeriodSatisfied(firstApprovedDeposit, settings, now)` — throws
  `BusinessRuleError` if the user has no approved deposit at all, or if
  `now - firstApprovedDeposit.createdAt < settings.waitingPeriodDays` (message
  states remaining days).
- `assertIsPending(withdrawal)` — shared guard for cancel/approve/reject
  (same name and shape as `deposit-business-rules.ts`'s guard).
- `assertCanMoveToProcessing(withdrawal)` — must currently be `APPROVED`.
- `assertCanComplete(withdrawal)` — must currently be `APPROVED` or `PROCESSING`.

All four transition guards throw `WithdrawalInvalidTransitionError` (task 8)
except `assertIsPending`, which — to stay consistent with the Deposit module's
existing convention — also throws `WithdrawalInvalidTransitionError` (not a
separate `WithdrawalNotPendingError`, since task 8 deliberately unified these
into one error class here).
**Depends on:** 6, 9
**Layer:** Backend

### 12. Withdrawal fee calculation utility

`withdrawal-fee.util.ts`: `calculateWithdrawalFee(amount, feePercentage): { fee: number; netAmount: number }`
— `fee = amount * feePercentage / 100`, `netAmount = amount - fee`. Isolated
in its own file (rather than folded into the business-rules file) specifically
so the percentage-only limitation (see the "Two decisions resolved" note
above) is easy to find and extend later without hunting through unrelated
validators.
**Depends on:** none
**Layer:** Backend

### 13. Withdrawal Zod validation schemas (server-side)

`withdrawal.validation.ts`: `createWithdrawalSchema` (`amount: amountSchema`,
`paymentMethod` inline constrained string, `receiverAccountNumber:
receiverAccountNumberSchema`, `accountHolderName: fullNameSchema`) —
composed from task 4's primitives, same composition pattern as
`deposit.validation.ts`'s `createDepositSchema`. Unlike deposit, this is a
plain JSON `POST` body (no file upload), so **no** `z.preprocess` string-
coercion workaround is needed — deposit's multipart-vs-`z.number()` bug has no
equivalent here. `withdrawalListQuerySchema` (page, limit, sortBy, status,
paymentMethod, dateFrom, dateTo, minAmount, maxAmount, search) mirrors
`depositListQuerySchema` exactly. `rejectWithdrawalSchema` (`rejectionReason`
required non-empty string) mirrors `rejectDepositSchema`.
**Depends on:** 4, 11
**Layer:** Backend

---

## D. Backend — Service Layer

### 14. `WithdrawalService.createWithdrawal()`

Flow: `settingsService.getWithdrawal()` → `assertWithdrawalsEnabled` →
`assertAmountWithinLimits` → `assertPaymentMethodAllowed` → resolve caller's
wallet via `walletService.getWalletByUser()` → `assertSufficientBalance` →
`depositRepository.findEarliestApprovedByUserId(userId)` (task 10) →
`assertWaitingPeriodSatisfied` → `calculateWithdrawalFee` (task 12) →
`generateWithdrawalNumber()` → `withdrawalRepository.create({..., status: PENDING})`.
Wallet balance is never touched here (matches phase-06.md's "Create Withdrawal
Request" workflow: "Wallet balance remains unchanged").
**Depends on:** 7, 9, 10, 11, 12, 13
**Layer:** Backend

### 15. `WithdrawalService.listForUser()` / `getByIdForUser()`

Paginated own-withdrawals list + single-withdrawal fetch scoped to the
caller's `userId` — mismatched id reports `WithdrawalNotFoundError`, not an
authorization error, same non-enumeration convention as `deposit.service.ts`'s
`getByIdForUser`.
**Depends on:** 8, 9
**Layer:** Backend

### 16. `WithdrawalService.cancelWithdrawal()`

Owner-scoped; `assertIsPending` → `updateStatus(CANCELLED)`. No wallet or
ledger `Transaction` involved (matches phase-06.md's "Cancellation" section —
"Users may cancel only PENDING withdrawals. Cancelled withdrawals cannot be
approved later.").
**Depends on:** 11, 15
**Layer:** Backend

### 17. `WithdrawalService.listForAdmin()` / `getByIdForAdmin()`

Cross-user paginated list + unscoped single fetch, for the admin controller.
**Depends on:** 8, 9
**Layer:** Backend

### 18. Wire withdrawal audit actions

Add `WITHDRAWAL_APPROVED`, `WITHDRAWAL_REJECTED`, `WITHDRAWAL_PROCESSING`,
`WITHDRAWAL_COMPLETED` to `AUDIT_ACTIONS` (`modules/audit-log/audit-log.types.ts`)
— reuses the existing `auditLogRepository`, no new audit infrastructure.
**Depends on:** none
**Layer:** Backend

### 19. `WithdrawalService.approveWithdrawal()`

`assertIsPending` → `updateStatus(APPROVED, { approvedBy: adminId, approvedAt, adminNote })`
→ audit log (`WITHDRAWAL_APPROVED`, before/after status) → notification hook
(stub). **No Mongo transaction** — per this file's opening "decision 1", the
wallet is untouched at this step; only the withdrawal document changes, same
single-document-update shape as `deposit.service.ts`'s `rejectDeposit`.
**Depends on:** 11, 17, 18
**Layer:** Backend

### 20. `WithdrawalService.rejectWithdrawal()`

`assertIsPending` → `updateStatus(REJECTED, { approvedBy: adminId, rejectionReason })`
→ audit log (`WITHDRAWAL_REJECTED`) → notification hook (stub). Wallet and
ledger untouched. `approvedBy` doubles as "the admin who reviewed this," same
field reused for both the approve and reject transitions (mirrors
`deposit.model.ts`'s single `reviewedBy` field covering both outcomes).
**Depends on:** 11, 17, 18
**Layer:** Backend

### 21. `WithdrawalService.markProcessing()`

Optional intermediate step, per phase-06.md's "Processing Workflow" ("Allows
administrators to track payment progress"). `assertCanMoveToProcessing`
(must be `APPROVED`) → `updateStatus(PROCESSING, { processedAt })` → audit log
(`WITHDRAWAL_PROCESSING`). No wallet change.
**Depends on:** 11, 17, 18
**Layer:** Backend

### 22. `WithdrawalService.completeWithdrawal()`

The one money-moving operation in this module — withdrawal's equivalent of
`deposit.service.ts`'s `approveDeposit`, just triggered at Complete instead of
Approve (per this file's opening "decision 1"). `assertCanComplete` (must be
`APPROVED` or `PROCESSING`) → Mongo session (`session.withTransaction`, same
pattern as `deposit.service.ts`'s `approveDeposit`) → re-read the withdrawal
fresh inside the transaction → `walletService.debit(walletId, { category: TransactionCategory.WITHDRAWAL, amount: withdrawal.amount, currency, referenceId: withdrawalNumber, createdBy: adminId }, session)`
— debits the **gross requested amount** (not `netAmount`); the fee is
retained by the platform, the net amount is what leaves via the external
payment method, but the full requested amount leaves the wallet, matching
`docs/10-withdraw-module.md`'s Transaction Integration example
(`"amount": -50` for a $50 withdrawal) → `updateStatus(COMPLETED, { completedAt }, session)`
→ audit log (`WITHDRAWAL_COMPLETED`, before/after **status** only — not
balance; balance history already lives on the ledger `Transaction` via
`walletService.debit`, same reasoning `approveDeposit`'s audit log already
established for not duplicating it) → notification hook (stub) → return
`{ withdrawal, wallet, transaction }`. Everything inside one transaction; any
failure rolls back both the ledger entry and the status change together.
**Depends on:** 11, 17, 18
**Layer:** Backend

---

## E. Backend — API Layer

### 23. User withdrawal controller + routes

`POST /api/v1/withdrawals` (validate → `createWithdrawal` — plain JSON body,
no multer/file middleware needed, unlike deposit's route), `GET /api/v1/withdrawals`
(`listForUser`, paginated), `GET /api/v1/withdrawals/:id` (`getByIdForUser`),
`DELETE /api/v1/withdrawals/:id` (`cancelWithdrawal`) — all behind
`authenticate`, all scoped to the caller's own withdrawals. Also add
`withdrawal.dto.ts` (`toWithdrawalResponse`, `toWithdrawalListArgs` — mirrors
`deposit.dto.ts`).
**Depends on:** 13, 14, 15, 16
**Layer:** Backend

### 24. Admin withdrawal controller + routes

`GET /api/v1/admin/withdrawals` (`listForAdmin`, paginated + filters),
`GET /api/v1/admin/withdrawals/:id` (`getByIdForAdmin`),
`PATCH /api/v1/admin/withdrawals/:id/approve` (`approveWithdrawal`, no body),
`PATCH /api/v1/admin/withdrawals/:id/reject` (body: `rejectionReason`,
`rejectWithdrawal`), `PATCH /api/v1/admin/withdrawals/:id/processing`
(`markProcessing`, no body), `PATCH /api/v1/admin/withdrawals/:id/complete`
(`completeWithdrawal`, no body) — behind `authenticate` +
`authorize(ADMIN, SUPER_ADMIN)`, mirroring `admin-deposit.controller.ts`/
`admin-deposit.middleware.ts`/`admin-deposit.routes.ts` exactly, including
redeclaring `validateWithdrawalIdParam` locally rather than importing
`withdrawal.middleware.ts`'s copy (same self-contained-admin-middleware
precedent `admin-deposit.middleware.ts` already set).
**Depends on:** 13, 17, 19, 20, 21, 22
**Layer:** Backend

### 25. Register withdrawal routes centrally

Mount `withdrawalRouter` at `/withdrawals` and `adminWithdrawalRouter` at
`/admin/withdrawals` in `apps/server/src/routes/index.ts`.
**Depends on:** 23, 24
**Layer:** Backend

### 26. Confirm indexes applied

`withdrawal.model.ts`'s `withdrawalSchema.index(...)` calls (task 6) are
model-level declarations applied automatically by Mongoose on first
connection — no separate `database/indexes.ts` step, matching Phase 04/05's
same confirmation.
**Depends on:** 6
**Layer:** Backend

---

## F. Backend — Tests

### 27. Unit tests: `WithdrawalService.createWithdrawal()`

Covers: success (fee/netAmount computed correctly, wallet balance unchanged),
rejection when withdrawals disabled, rejection on amount outside min/max,
rejection on disallowed payment method, rejection on insufficient balance,
rejection when the user has no approved deposit at all, rejection when the
waiting period hasn't elapsed yet, success once it has.
**Depends on:** 14
**Layer:** Test

### 28. Unit tests: approve / reject / processing / cancel transitions

Covers (all non-money-moving): approve success, approve on a non-`PENDING`
withdrawal throws `WithdrawalInvalidTransitionError`, reject success (wallet
untouched), processing success only from `APPROVED`, cancel success only from
`PENDING`.
**Depends on:** 16, 19, 20, 21
**Layer:** Test

### 29. Unit tests: `WithdrawalService.completeWithdrawal()`

Covers: wallet debited exactly once (gross `amount`, not `netAmount`), ledger
`Transaction` created with `category: WITHDRAWAL` and the withdrawal's
`referenceId`, status → `COMPLETED`, completing succeeds from both `APPROVED`
and `PROCESSING`, completing a `PENDING`/already-`COMPLETED`/`REJECTED`/
`CANCELLED` withdrawal throws, completing when the wallet balance has since
dropped below the requested amount throws `InsufficientBalanceError` and
leaves the withdrawal in its prior status.
**Depends on:** 22
**Layer:** Test

### 30. Unit test: completion transaction rollback

Same technique as `deposit.service.test.ts`'s approval-rollback test: force a
mid-transaction failure (mocked `withdrawalRepository.updateStatus` rejects
once) _after_ `walletService.debit` has already run inside the same
`session.withTransaction` callback, and assert the whole operation rolled back
atomically — wallet balance unchanged, withdrawal still in its pre-complete
status, zero ledger `Transaction` documents persisted.
**Depends on:** 22
**Layer:** Test

### 31. Integration tests: user withdrawal API

`withdrawal-api.test.ts` (`connectTransactionalTestDatabase`, since
`createWithdrawal` reads real wallet balance and the waiting-period check
needs a seeded approved deposit). `POST /withdrawals`: success, disabled
setting (400), amount outside limits (400), disallowed payment method (400),
insufficient balance (400), waiting period not satisfied (400), missing
required field (422), unauthenticated (401). `GET /withdrawals` (+ status
filter, `sortBy`, ownership scoping). `GET /withdrawals/:id` (own vs. another
user's → 404). `DELETE /withdrawals/:id` (cancels `PENDING`, rejects
non-`PENDING`).
**Depends on:** 23
**Layer:** Test

### 32. Integration tests: admin withdrawal API

`admin-withdrawal-api.test.ts` (`connectTransactionalTestDatabase`, since
complete calls `walletService.debit`). RBAC enforcement (`USER` role → 403;
unauthenticated → 401), list/filter (by payment method/status), approve →
status change + audit log row exists, approving a non-`PENDING` withdrawal →
400, reject → wallet unchanged + audit log, reject with missing
`rejectionReason` → 422, processing transition (only from `APPROVED`),
complete → wallet balance decreases by the gross amount (re-fetched via the
admin wallet endpoint) + audit log row exists, completing a non-`APPROVED`/
non-`PROCESSING` withdrawal → 400 with no audit log written.
**Depends on:** 24
**Layer:** Test

---

## G. Frontend — Data Layer

### 33. Withdrawal endpoint constants

`apps/client/src/constants/withdrawal-endpoints.constants.ts`, mirroring
`deposit-endpoints.constants.ts`'s shape: `WITHDRAWALS`, `WITHDRAWAL_BY_ID(id)`,
`ADMIN_LIST`, `ADMIN_BY_ID(id)`, `ADMIN_APPROVE(id)`, `ADMIN_REJECT(id)`, plus
two new ones deposit didn't need: `ADMIN_PROCESSING(id)`, `ADMIN_COMPLETE(id)`.
**Depends on:** none
**Layer:** Frontend

### 34. Withdrawal client-only types

`apps/client/src/types/withdrawal.types.ts`: `CreateWithdrawalPayload` (plain
object, not `FormData` — no file involved, unlike deposit's payload),
`WithdrawalListParams`, `RejectWithdrawalPayload`. One `WithdrawalListParams`
reused by both user and admin list calls — same reasoning `DepositListParams`
already established (server reuses one query schema for both endpoints).
**Depends on:** 3
**Layer:** Frontend

### 35. Withdrawal API service

`apps/client/src/services/withdrawal.service.ts`: `createWithdrawal` (plain
JSON `POST`, not multipart — simpler than `deposit.service.ts`'s
`createDeposit`), `getWithdrawals`, `getWithdrawalById`, `cancelWithdrawal`,
`adminListWithdrawals`, `adminGetWithdrawalById`, `adminApproveWithdrawal`,
`adminRejectWithdrawal`, `adminMarkProcessing`, `adminCompleteWithdrawal` —
thin Axios wrappers, matching `deposit.service.ts`'s shape.
**Depends on:** 23, 24 (contracts), 33, 34
**Layer:** Frontend

### 36. React Query hooks

`hooks/useWithdrawalQueries.ts` (`useWithdrawals()`, `useWithdrawal(id)`,
`useAdminWithdrawals()`, `useAdminWithdrawal(id)`, `WITHDRAWAL_QUERY_KEYS`) +
`hooks/useWithdrawalMutations.ts` (`useCreateWithdrawal()`,
`useCancelWithdrawal()`, `useApproveWithdrawal()`, `useRejectWithdrawal()`,
`useMarkProcessing()`, `useCompleteWithdrawal()`) — matches the established
`use*Queries.ts` / `use*Mutations.ts` split (`useDepositQueries.ts`/
`useDepositMutations.ts`). Only `useCompleteWithdrawal` additionally
invalidates `WALLET_QUERY_KEYS.wallet` — it's the sole mutation that actually
moves the balance (per this file's "decision 1"; every other withdrawal
mutation only changes the withdrawal document itself).
**Depends on:** 35
**Layer:** Frontend

---

## H. Frontend — Components

### 37. `WithdrawalStatusBadge`

`components/common/WithdrawalStatusBadge.tsx` — status badge for `PENDING`
(warning)/`APPROVED`(info)/`PROCESSING`(warning)/`COMPLETED`(success)/
`REJECTED`(destructive)/`CANCELLED`(secondary), reusing the same
color-mapping convention as `DepositStatusBadge`.
**Depends on:** 1
**Layer:** Frontend

### 38. `PaymentMethodSelector`

`components/forms/PaymentMethodSelector.tsx` — a plain `Select` of the
configured withdrawal payment methods, driven by `useWithdrawalSettings()`
(`GET /settings/withdrawal`, already exists) dynamically. Deliberately a
separate, simpler component from deposit's `PaymentMethodCard` — withdrawal
has no company-account-number/instructions display to resolve, just a picker.
**Depends on:** none
**Layer:** Frontend

### 39. `FeeCalculator`

`components/forms/FeeCalculator.tsx` — presentational: given the amount typed
so far and `withdrawalFeePercentage` from Settings, live-computes and displays
fee/net amount using the same formula as `withdrawal-fee.util.ts` (task 12),
for instant UX feedback. The authoritative fee/net figure a user actually sees
post-submission always comes from the server response, never trusted from
this component alone.
**Depends on:** none
**Layer:** Frontend

### 40. `WithdrawalSummary`

`components/cards/WithdrawalSummary.tsx` — presentational recap block
(amount/fee/net amount/payment method/waiting-period status) reused by both
the create-form's confirmation step and the admin approval screen's "Display"
requirements (phase-06.md's Admin Approval Screen: wallet balance, amount,
fee, net amount, payment method, waiting-period result).
**Depends on:** none
**Layer:** Frontend

### 41. `WithdrawalTable` + `WithdrawalCard` + `WithdrawalDetailsCard`

`WithdrawalTable` (`components/tables/`): columns (Withdrawal Number, Date,
Amount, Fee, Net Amount, Status), pagination, integrates
`WithdrawalStatusBadge`, empty/loading states — mirrors `DepositTable`.
`WithdrawalCard` (`components/cards/`): compact summary card, mirrors
`DepositCard`. `WithdrawalDetailsCard` (`components/cards/`): full detail view
(payment method, receiver account number, account holder name, submitted/
reviewed/completed dates, admin note/rejection reason) — purely presentational
(no action buttons of its own, `submitterLabel` prop passed in by the caller),
so both the user's detail page and the admin approval screen reuse it as-is,
same split `DepositDetailsCard` already established.
**Depends on:** 37
**Layer:** Frontend

---

## I. Frontend — Pages

`WithdrawalFilter.tsx` (`components/tables/`) is a new component needed here,
not provisioned in Section H — mirrors `DepositFilter` (search, date range,
min/max amount, status, `sortBy`, optional Settings-driven `paymentMethods`
Select). Built inline as part of task 44/45 rather than its own numbered
task, same "discovered while implementing pages" precedent Phase 05 used for
`DepositFilter`/`ConfirmDialog` — except `ConfirmDialog` already exists this
time, so only `WithdrawalFilter` is net-new here.

### 42. `WithdrawalForm`

Composes `createWithdrawalFormSchema` in
`apps/client/src/validators/withdrawal.validators.ts` from task 4's shared
primitives — mirrors `deposit.validators.ts`'s `createDepositFormSchema`
composing from the server's same primitives rather than importing one
pre-built object schema. React Hook Form + that schema, assembles
`PaymentMethodSelector`, `FeeCalculator`, `WithdrawalSummary`, amount/receiver-
account/account-holder-name fields; displays Settings-driven min/max/
processing-time/fee/waiting-period text (phase-06.md's "Withdrawal Form"
section); submits via `useCreateWithdrawal()`. No file-input concern —
simpler than `DepositForm`'s two-generic `useForm` workaround, since there's
no `File`-typed field whose Zod input/output types diverge.
**Depends on:** 4, 38, 39, 40
**Layer:** Frontend

### 43. User: Withdrawal Dashboard / Request Withdrawal page

`pages/withdrawal/WithdrawalDashboardPage.tsx`, mounted at `/withdrawals/new`
— a thin shell around `WithdrawalForm`, same relationship
`DepositDashboardPage` has to `DepositForm`.
**Depends on:** 36, 42
**Layer:** Frontend

### 44. User: Withdrawal History + Withdrawal Details pages

`pages/withdrawal/WithdrawalHistoryPage.tsx` (mounted at `/withdrawals`):
`WithdrawalFilter` + `WithdrawalTable`, wired to `useWithdrawals(params)`,
same structure as `DepositHistoryPage`. `pages/withdrawal/WithdrawalDetailsPage.tsx`
(mounted at `/withdrawals/:id`): `WithdrawalDetailsCard` wired to
`useWithdrawal(id)`, with a Cancel action shown only while
`status === PENDING`, behind the existing shared `ConfirmDialog`, wired to
`useCancelWithdrawal()`.
**Depends on:** 36, 41
**Layer:** Frontend

### 45. Admin: Withdrawals list page

`pages/admin/withdrawal/AdminWithdrawalsPage.tsx` (mounted at
`/admin/withdrawals`) — `WithdrawalFilter` (with `paymentMethods` from
`useWithdrawalSettings()`) + `WithdrawalTable` over `useAdminWithdrawals(params)`,
defaulting `status` to `PENDING` but fully clearable to browse cross-user
history — one list page covering both "the actionable queue" and "full
history," same consolidation `AdminDepositsPage` already established over
phase-05.md's originally-separate "pending" and "history" routes (and
phase-06.md's own route list only names one admin list route, confirming this
reading).
**Depends on:** 36, 41
**Layer:** Frontend

### 46. Admin: Withdrawal Detail + Approval/Processing/Completion screen

`pages/admin/withdrawal/AdminWithdrawalDetailPage.tsx` (mounted at
`/admin/withdrawals/:id`) — `WithdrawalDetailsCard` +
`WithdrawalSummary` (wallet balance, amount, fee, net amount, payment method,
waiting-period-satisfied result, per phase-06.md's Admin Approval Screen spec)

- status-appropriate actions: Approve/Reject when `PENDING`, Mark Processing
  when `APPROVED`, Complete when `APPROVED` or `PROCESSING` — every action
  behind `ConfirmDialog`, Reject's confirm button disabled until a non-empty
  reason is typed into a `Textarea`, mirroring `AdminDepositDetailPage`'s reject
  gating exactly.
  **Depends on:** 36, 41
  **Layer:** Frontend

### 47. Route registration

Added to `apps/client/src/routes/AppRoutes.tsx`: `/withdrawals` →
`WithdrawalHistoryPage`, `/withdrawals/new` → `WithdrawalDashboardPage`,
`/withdrawals/:id` → `WithdrawalDetailsPage` (all under
`ProtectedRoute`/`DashboardLayout`); `/admin/withdrawals` →
`AdminWithdrawalsPage`, `/admin/withdrawals/:id` → `AdminWithdrawalDetailPage`
(under `AdminRoute`/`AdminLayout`). Add a "Withdrawals" nav entry to both
`DashboardLayout.tsx`'s `DASHBOARD_NAV_ITEMS` (after "Deposits") and
`AdminLayout.tsx`'s `ADMIN_NAV_ITEMS` (after "Deposits").
**Depends on:** 43, 44, 45, 46
**Layer:** Frontend

---

## J. Frontend — Tests

### 48. Component/page tests

One test file per component/page, this repo's established convention
(`DepositTable.test.tsx`, `DepositForm.test.tsx`, etc.):
`FeeCalculator.test.tsx`, `WithdrawalForm.test.tsx` (submission, dynamic
Settings-driven min/max/fee/waiting-period display), `WithdrawalTable.test.tsx`
(render/pagination — filtering lives in `WithdrawalFilter`, not this
component, same boundary `DepositTable.test.tsx` already draws),
`AdminWithdrawalDetailPage.test.tsx` (approve/reject/processing/complete
interactions, confirmation dialogs, reject-reason gating, and API-error
display for each action).
**Depends on:** 43, 44, 45, 46
**Layer:** Test

---

## K. Closeout

### 49. Verify exit criteria against phase-06.md

Check each of phase-06.md's Exit Criteria against the actual implementation
once built (re-grep/re-run, not just re-read prior tasks' claims — same
closeout discipline `phase-05-tasks.md`'s task 43 used), and explicitly
document the two scope decisions this breakdown made up front:

1. **Wallet-debit-timing decision** (this file's "decision 1"): confirm the
   only `walletService.debit` call in the withdrawal module lives inside
   `completeWithdrawal`, and that `approveWithdrawal`/`markProcessing`/
   `rejectWithdrawal` contain no wallet call at all — grep
   `withdrawal.service.ts` for every `walletService.` reference to verify.
2. **Fee-model limitation** (this file's "decision 2"): confirm
   `withdrawal-fee.util.ts` and every fee-related field/UI element are
   percentage-only, and flag flat-fee support as a known, previously-
   documented gap for a future phase — not a silently-dropped requirement.

Also carry forward the still-open Notifications gap from Phase 05 (unchanged —
`approveWithdrawal`/`rejectWithdrawal`/`markProcessing`/`completeWithdrawal`
all leave comment-only no-op stubs at their notification hook points).

Checked each of phase-06.md's 12 Exit Criteria fresh against the actual
implementation (re-grepped and re-ran everything, not just re-read prior
tasks' claims):

| #   | Criterion                                                   | Status                                                            | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ----------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Users can submit withdrawal requests successfully           | ✅ Met                                                            | `withdrawal-api.test.ts`'s `POST /api/v1/withdrawals` success test + `WithdrawalForm.test.tsx`'s submission test, both passing in the fresh full-suite run                                                                                                                                                                                                                                                                                     |
| 2   | All withdrawal rules loaded from the Settings Service       | ✅ Met                                                            | `withdrawal.service.ts`'s `createWithdrawal` calls `settingsService.getWithdrawal()`; `WithdrawalForm.tsx` calls `useWithdrawalSettings()`; grepped every withdrawal production file for literal settings-shaped numbers (1000/100000/15/5/24, `paymentMethods` strings) — the only numeric literal found is `MS_PER_DAY = 24 * 60 * 60 * 1000` (a unit-conversion constant, not a business threshold), zero hits in production code otherwise |
| 3   | Waiting periods validated dynamically                       | ✅ Met                                                            | `assertWaitingPeriodSatisfied` (`withdrawal-business-rules.ts`) reads `settings.waitingPeriodDays`, never a literal                                                                                                                                                                                                                                                                                                                            |
| 4   | Withdrawal fees calculated dynamically                      | ✅ Met                                                            | `calculateWithdrawalFee` (`withdrawal-fee.util.ts`) and `FeeCalculator.tsx` both take `feePercentage` as a parameter sourced from `WithdrawalSettings.withdrawalFeePercentage`, never a literal                                                                                                                                                                                                                                                |
| 5   | Wallet balances only debited through WalletService          | ✅ Met                                                            | Exactly one `walletService.debit(` call in the entire withdrawal module (`withdrawal-review.service.ts`'s `completeWithdrawal`); `withdrawal.service.ts`'s only `walletService.` reference is `getWalletByUser` (a read); `applyTransition` (shared by approve/reject/processing) and `cancelWithdrawal` have zero wallet references — confirms "decision 1" holds in the real code, not just the design intent                                |
| 6   | Every approved withdrawal creates a wallet transaction      | ⚠️ Met, reworded                                                  | Per "decision 1" (`docs/10-withdraw-module.md` + `docs/19-business-rules.md` outrank phase-06.md's own approval-workflow diagram), the wallet-mutating event is **Completion**, not Approval — `completeWithdrawal` calls `walletService.debit`, which atomically creates the ledger `Transaction` in the same MongoDB transaction as the status update. Approval alone creates no transaction, by design.                                     |
| 7   | Rejected/cancelled withdrawals never affect wallet balances | ✅ Met                                                            | Same grep as #5 — `rejectWithdrawal` (via `applyTransition`) and `cancelWithdrawal` contain no wallet call at all                                                                                                                                                                                                                                                                                                                              |
| 8   | Notifications generated according to platform settings      | ❌ **Not met — known, carried-forward gap, not silently dropped** | No `modules/notifications` directory exists anywhere in the repo (unchanged since Phase 05); every notification hook point (`approveWithdrawal`/`rejectWithdrawal`/`markProcessing`/`completeWithdrawal`) is a comment-only no-op stub. Same deferred-to-a-future-phase gap Phase 05 already carried forward for deposits.                                                                                                                     |
| 9   | Audit logs for every administrative action                  | ✅ Met                                                            | All four transitions call `recordTransitionAudit` with a distinct `AUDIT_ACTIONS.WITHDRAWAL_APPROVED`/`REJECTED`/`PROCESSING`/`COMPLETED`; confirmed further by `admin-withdrawal-api.test.ts`'s audit-log-row assertions, passing                                                                                                                                                                                                             |
| 10  | No configurable business rules hardcoded                    | ✅ Met                                                            | Same grep as #2, plus the percentage-only fee model itself is sourced entirely from Settings (see #4) — the one acknowledged scope limit is that the Settings _schema_ has no flat-fee field to source from at all (see "decision 2" below), not that a value was hardcoded around it                                                                                                                                                          |
| 11  | No TypeScript or ESLint errors                              | ✅ Met                                                            | Fresh full run: `shared-types`/`shared-constants`/`shared-validation` typecheck clean; server `tsc --noEmit` + `eslint src` clean; client `tsc -b --force` + `eslint src` clean (only the same 4 pre-existing warnings in vendored shadcn/ui files and a test helper, unrelated to this phase); both apps' `prettier --check` clean                                                                                                            |
| 12  | Unit/integration/rollback tests pass                        | ✅ Met                                                            | Fresh full run: server **28 suites / 284 tests** passing (includes the mid-transaction rollback test for `completeWithdrawal` and the two TOCTOU-race regression tests added during the D/E/F review pass); client **25 files / 160 tests** passing                                                                                                                                                                                            |

**Decision 2 (fee-model scope limit) reconfirmed:** `WithdrawalSettings`
(`packages/shared-types/src/settings/withdrawal-settings.types.ts`) still only
defines `withdrawalFeePercentage: number` — no flat-fee field exists in the
Settings schema, its Zod validator, or its business-rule validator. Every fee
computation site (`withdrawal-fee.util.ts` server-side,
`FeeCalculator.tsx` client-side) is percentage-only, consistent with that
schema. Flat-fee support remains a known, previously-documented gap for a
future phase that reopens the Settings module — not a requirement that was
silently dropped.

**Net result: 11 of 12 exit criteria are met**, with criterion 6 met in
substance but reworded to match the resolved wallet-debit-timing decision
(criterion 6's literal wording assumes the same "Approval" framing phase-06.md
used before that conflict was resolved in favor of `docs/10`/`docs/19`).
Criterion 8 (notifications) is the one genuine gap, and it is a known,
previously-documented one carried forward unchanged from Phase 05 — the
Notifications module was never in scope for either phase. Recommend treating
Phase 06 as functionally complete and moving to Phase 07 with this one item
carried forward, rather than blocking on a Notifications module that was
never in scope here.
**Depends on:** 25, 26, 27, 28, 29, 30, 31, 32, 47, 48
**Layer:** Docs / QA

---

## Dependency Overview (rough execution order)

```
1 → 2 ; 1 → 3 ; 4                                                       (shared)
5 → 6 → 7 → 9 → 11 ; 6 → 8 ; 10 (independent, extends existing deposit
  module) ; 12                                                          (data + rules)
7,9,10,11,12,13 → 14 → 15 → 16 ; 8,9 → 17 ; 18 → 19,20,21,22             (services)
13,14,15,16 → 23 ; 13,17,19,20,21,22 → 24 → 25,26                       (API)
23 → 27 ; 16,19,20,21 → 28 ; 22 → 29 ; 22 → 30 ; 23 → 31 ; 24 → 32       (backend tests)
33,34 → 35 → 36                                                         (frontend data)
1 → 37 ; 38 ; 39 ; 40 ; 37 → 41                                         (frontend components)
4,38,39,40 → 42 ; 36,42 → 43 ; 36,41 → 44,45,46 → 47 → 48                (frontend pages/tests)
49 (final gate) ◄─── 25,26,27,28,29,30,31,32,47,48
```

Backend (5–26) can proceed almost entirely independently of frontend work
(33–48) once the shared foundations (1–4) exist — the two tracks converge at
task 35, which needs real API request/response contracts from tasks 23–24.
Task 10 (the `deposit.repository.ts` extension) has no upstream dependency
within this phase and can be built at any point before task 14. Tasks 19/20/21
(approve/reject/processing) all depend on task 18 (audit actions) but not on
each other, so they can be built in either order or in parallel; task 22
(complete) is independent of 19–21's implementation but is the one task that
actually needs task 18 _and_ a working `walletService.debit`, making it the
natural last service-layer task to land. Task 49 is the phase-exit gate and
depends on everything upstream of it.
