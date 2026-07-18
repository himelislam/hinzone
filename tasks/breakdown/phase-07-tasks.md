# Phase 07 — Stock Management System: Task Breakdown

Source: [tasks/phase-07.md](../phase-07.md)

Conventions followed (same deviation already established and documented in
[phase-04-tasks.md](./phase-04-tasks.md), [phase-05-tasks.md](./phase-05-tasks.md),
and [phase-06-tasks.md](./phase-06-tasks.md)): `stock` is a flat set of
`stock.*.ts` files inside `apps/server/src/modules/stock/`, mirroring
`modules/deposit/*` and `modules/withdrawal/*` rather than phase-07.md's
literal nested `controllers/services/routes/validations/dto/models/interfaces/
types/utils` sub-folder listing.

## Five decisions resolved before task-by-task planning

**1. `MarketHistory` lives inside the `stock` module, not as its own top-level
module.** phase-07.md's Objectives list `MarketHistory` as if it were a
sibling concern, but the closest existing precedent in this codebase is
`Transaction` — a dedicated ledger/history collection tightly coupled to one
parent entity — which lives inside `modules/wallet/` (`transaction.model.ts`,
`transaction.repository.ts`, `transaction.types.ts`) rather than as its own
`modules/transaction/`. `MarketHistory` is `Stock`'s exact analogue: a
history record created only as a side effect of `StockService.updatePrice()`,
never created or queried independently of a stock. This breakdown places
`market-history.model.ts` / `market-history.repository.ts` inside
`modules/stock/`, and the shared API type in
`packages/shared-types/src/stock/market-history.types.ts` (same domain folder
as `stock.types.ts` — mirrors `shared-types/src/wallet/` holding both
`wallet.types.ts` and `transaction.types.ts`).

**2. Admin endpoints get their own `modules/admin/admin-stock.*.ts`
sub-module**, not routes bolted onto `stock.routes.ts`. This is the
established pattern for every financial/catalog module so far
(`admin-deposit.*`, `admin-withdrawal.*`, `admin-wallet.*`, `admin-users.*`,
`admin-settings.*` all live in `modules/admin/`) — phase-07.md's own API
Endpoints section already separates "Public" from "Admin" routes under
different base paths, confirming this reading.

**3. No stock "business number" generator.** Unlike `Deposit`/`Withdrawal`
(`DEP-YYYYMMDD-NNNNNN` / `WD-YYYYMMDD-NNNNNN`, needed because those documents
have no other stable human-facing identifier), `Stock.symbol` (e.g. `AAPL`)
_is_ the unique, human-readable, admin-chosen identifier — phase-07.md's own
"Stock Symbol Rules" section requires it to be unique. No
`stock-number.util.ts` / `Counter` sequence is needed for this module.

**4. Settings values are seeded per-stock defaults, not live per-request
ceilings.** phase-07.md's "Settings Integration" section lists Minimum
Purchase, Maximum Purchase, and Fractional Shares as required Settings — but
its own "Stock Schema" section lists `Minimum Purchase`, `Maximum Purchase`,
and `Allow Fractional Shares` as **per-stock** fields too. Treating
`StockSettings` as a hard ceiling every stock's fields must satisfy would make
the per-stock fields redundant (why let an admin set a per-stock max if it
must equal the platform-wide Settings value?). This breakdown resolves the
ambiguity the same way the codebase already resolves it elsewhere (e.g.
`deposit.amount.currency`/`withdrawal.currency` snapshot `wallet.currency` at
creation rather than being re-resolved from a live source on every read):
`StockService.createStock()` pre-fills `minimumPurchase`/`maximumPurchase`/
`allowFractionalShares` from `settingsService.getStock()` **only when the
admin omits them from the request**; once set, each `Stock` document is the
sole authority for its own limits, editable independently thereafter.
`StockSettings.enabled` / `autoSellEnabled` / `autoSellIntervalMinutes` /
`priceUpdateMode` are **not read anywhere in this phase** — they gate the
Trading module's future runtime behavior (Phase 08: whether trading is open,
whether auto-sell runs), not catalog CRUD. Catalog management must work
identically whether platform-wide trading is enabled or disabled, since
admins need to build out the catalog _before_ flipping trading on.

**5. Stock logos accept SVG; the shared avatar/deposit-screenshot uploader
does not, and stays that way.** phase-07.md requires JPG/PNG/SVG/WEBP for
stock logos. The existing `apps/server/src/config/upload.ts` /
`apps/server/src/middlewares/upload.ts` (`uploadAvatar`, reused unchanged by
`uploadDepositScreenshot`) only allow `image/jpeg`/`image/png`/`image/webp` —
deliberately, since SVG can embed inline `<script>`/event-handler payloads and
both avatars and deposit screenshots are **user-submitted, untrusted**
uploads. Stock logos are **admin-only, trusted** uploads (only `ADMIN`/
`SUPER_ADMIN` can reach the create/update endpoints — see decision 2), so the
risk profile differs. Rather than widening the shared allowlist (which would
also let untrusted users upload SVGs as avatars/screenshots), this breakdown
generalizes `upload.ts`'s multer factory to take a per-use-case allowed-
mimetype list and adds one new `uploadStockLogo` instance scoped to
`image/jpeg`/`image/png`/`image/webp`/`image/svg+xml`. `uploadAvatar` and
`uploadDepositScreenshot` keep their existing three-type allowlist unchanged.

Reused as-is from Phase 03/04/05/06 (no new work required, only wiring):

- `settingsService.getStock()` (`modules/settings/settings.service.ts`) and
  the `StockSettings` type — already shipped and seeded since Phase 03,
  already editable via the existing Settings admin UI. **No new Settings
  work in this phase** (see decision 4 for what is/isn't actually consulted).
- `uploadImage()` (`shared/helpers/upload-image.ts`) — already
  folder-parameterized; reused unchanged for stock logos with a new
  `'stocks'` folder constant, same pattern `DEPOSIT_SCREENSHOT_UPLOAD_FOLDER`
  already established.
- `auditLogRepository` + `AUDIT_ACTIONS` (`modules/audit-log/*`) — reused,
  only needs six new action constants (phase-07.md's Audit Logs section lists
  exactly six events).
- The soft-delete convention (`isDeleted` / `deletedAt` / `deletedBy`,
  default-excluded via `{ isDeleted: { $ne: true } }`) — already established
  by `modules/users/users.model.ts` / `users-admin.service.ts` (confirmed:
  docs/04-folder-structure.md names Users/Stocks/Notifications as the
  soft-delete entities, distinct from Deposits/Withdrawals/Transactions/Audit
  Logs, which stay immutable and are never deleted at all). `deleteStock()`
  reuses this exact field shape; `archiveStock()` is a distinct, non-deleting
  status transition (`status → ARCHIVED`) — an archived stock still exists,
  is still visible to admins, and can still be un-archived via
  `changeStatus()`; a deleted stock is hidden from every listing, admin
  included, same as a deleted user.
- `ConfirmDialog` (`components/common/ConfirmDialog.tsx`) — reused for every
  admin destructive/state-changing action (price update, status change,
  archive, delete), no new confirmation-dialog component needed.
- `escapeRegExp` (`shared/helpers/escape-regex.ts`) — reused for the
  free-text search filter, same as `deposit.repository.ts`/
  `withdrawal.repository.ts`'s `buildFilterQuery`.
- Notification module still does **not** exist (`modules/notifications`
  absent, confirmed unchanged since Phase 06). Per phase-07.md's own scope
  ("this phase does not implement stock trading"), stock catalog events
  (created/updated/price-changed/archived/deleted) are **not** on
  docs/15-notification-system.md's user-facing notification list at all
  (that doc's stock-related entries are all Phase 08 trading events) — so
  there is no notification hook stub to carry forward here, unlike Phases
  05/06.

Each task lists **Depends on** (task numbers that must be done first) and
**Layer** (Shared / Backend / Frontend / Test / Docs).

---

## A. Shared Foundations

### 1. Add `StockStatus` enum

`packages/shared-types/src/enums/stock-status.enum.ts`: `ACTIVE`, `INACTIVE`,
`SUSPENDED`, `ARCHIVED` — per phase-07.md's "Stock Status" section. Only
`ACTIVE` stocks are ever tradable or publicly listable (enforced at the
repository/service query layer in Section D, not here).
**Depends on:** none
**Layer:** Shared

### 2. Add `STOCK_STATUSES` shared constant

`packages/shared-constants/src/stock-statuses.constants.ts` —
`Object.values(StockStatus)`, mirrors `DEPOSIT_STATUSES`/
`WITHDRAWAL_STATUSES`. Needed by `stock.model.ts`'s schema `enum:`.
**Depends on:** 1
**Layer:** Shared

### 3. Add shared `Stock` domain type

`packages/shared-types/src/stock/stock.types.ts` — new top-level domain
folder (mirrors `deposit/`, `withdrawal/`). Exports the API-facing `Stock`
shape: `id`, `symbol`, `name`, `companyName`, `description`, `category`,
`industry`, `logoUrl?`, `currentPrice`, `previousPrice`, `currency`,
`dailyChange`, `dailyChangePercentage`, `totalShares`, `availableShares`,
`minimumPurchase`, `maximumPurchase`, `allowFractionalShares`,
`dividendEnabled`, `status`, `featured`, `displayOrder`, `createdAt`,
`updatedAt` — dates as ISO strings, mirrors `Deposit`/`Withdrawal`'s
API-shape convention exactly (no `isDeleted`/`deletedAt`/`deletedBy` in the
public shape — those are internal-only, same reasoning `IUser`'s soft-delete
fields are never exposed on the client-facing `User` type).
**Depends on:** 1
**Layer:** Shared

### 4. Add shared `MarketHistory` domain type

`packages/shared-types/src/stock/market-history.types.ts` (same domain
folder as task 3 — decision 1). Exports `MarketHistory`: `id`, `stockId`,
`previousPrice`, `newPrice`, `change`, `percentageChange`, `source`
(reuses the **already-shipped** `StockPriceUpdateMode` type —
`'manual' | 'automatic'` — from `packages/shared-types/src/settings/
stock-settings.types.ts`, rather than declaring a second, parallel
manual/automatic union), `updatedBy?`, `createdAt`. No `updatedAt` — mirrors
`IAuditLog`'s immutable, creation-only timestamp shape.
**Depends on:** none
**Layer:** Shared

### 5. Add new shared Zod field primitive: `stockSymbolSchema`

Checking reuse before adding anything new (`coding_rules.md`'s reuse
principle, same check every prior phase's breakdown has done): no existing
`shared-validation` primitive fits a ticker symbol (uppercase letters/digits,
1–10 chars, per phase-07.md's "Stock Symbol Rules" examples: `AAPL`, `GOOGL`,
`MSFT`, `TSLA`, `META`). Add
`packages/shared-validation/src/fields/stock-symbol.schema.ts`:
`z.string().trim().toUpperCase().regex(/^[A-Z0-9.]{1,10}$/, ...)` (the `.`
allows symbols like `BRK.A`), export from `shared-validation/src/index.ts`.
Uniqueness itself is a database concern (task 9's repository +
`assertUniqueSymbol` in task 21), not expressible in a stateless Zod schema.
**Depends on:** none
**Layer:** Shared

---

## B. Backend — Data Layer

### 6. Scaffold `stock` module folder

Only files with real content are created as their own tasks land below — no
empty placeholder stubs, same corrected convention Phases 05/06 already
established over their phase docs' literal nested-folder listings.
**Depends on:** none
**Layer:** Backend

### 7. Stock Mongoose model

`stock.model.ts`: `symbol` (unique, uppercase, indexed), `name`,
`companyName`, `description`, `category`, `industry`, `logoUrl` (optional —
phase-07.md's field list doesn't mark it required, and forcing a logo on
every catalog entry would block fast admin seeding of the initial stock
list), `currentPrice` (`min: 0`), `previousPrice` (`min: 0`, defaults equal
to `currentPrice` at creation so `dailyChange` starts at `0`), `currency`,
`dailyChange` (denormalized, recomputed on every price update — stored
rather than derived at read time so list sorting by "Daily Gain"/"Daily
Loss" — phase-07.md's Sorting section — can use a plain indexed field
instead of an aggregation), `dailyChangePercentage` (denormalized, same
reasoning), `totalShares` (`min: 0`), `availableShares` (`min: 0`, defaults
to `totalShares` at creation — phase-07.md: "Do not decrease available
shares in this phase"), `minimumPurchase` (`min: 0`), `maximumPurchase`
(`min: 0`), `allowFractionalShares` (boolean), `dividendEnabled` (boolean,
default `false`), `status` (`StockStatus`, default `ACTIVE` — a stock is
admin-authored, not user-submitted, so it has no pending-review workflow
like `Deposit`/`Withdrawal`; defaulting to `ACTIVE` matches phase-07.md never
describing a stock-approval step), `featured` (boolean, default `false`),
`displayOrder` (number, default `0`), `isDeleted` / `deletedAt` / `deletedBy`
(soft-delete triad, exact field shape from `users.model.ts` — decision
above), timestamps. Indexes: unique `symbol` (from `unique: true`),
`category`, `industry`, `status`, `featured`, individual `createdAt`
(phase-07.md's "Performance > Indexes" list, verbatim), plus two compound
indexes for the actual query shapes this module runs: `{ status: 1, isDeleted: 1, createdAt: -1 }`
(public/admin listing) and `{ featured: 1, displayOrder: 1 }` (featured-stocks
query, task 24).
**Depends on:** 1, 2, 6
**Layer:** Backend

### 8. MarketHistory Mongoose model

`market-history.model.ts`: `stockId` (ref `Stock`, required), `previousPrice`
(`min: 0`), `newPrice` (`min: 0`), `change`, `percentageChange`, `source`
(`enum: ['manual', 'automatic']`, reuses `StockPriceUpdateMode` — task 4),
`updatedBy` (ref `User`, optional — this phase only ever writes `'manual'`
with `updatedBy` always present, since automatic/price-feed updates are
Phase 08's Auto Sell concern; the field stays optional now so Phase 08 can
write `source: 'automatic'` records with no `updatedBy` without a schema
migration). `{ timestamps: { createdAt: true, updatedAt: false } }` —
immutable, mirrors `audit-log.model.ts`'s exact timestamp option (a price
history record is never edited after creation). Index: `{ stockId: 1, createdAt: -1 }`
(backs `GET /stocks/:id/history`, paginated newest-first).
**Depends on:** 6
**Layer:** Backend

### 9. Stock-specific error classes

Both extend `AppError` directly with a fixed message/statusCode/errorCode,
matching `DepositNotFoundError`'s precedent:

- `StockNotFoundError` (404, `STOCK_NOT_FOUND`) — thrown for a missing id
  _and_ for a public-facing lookup that matches a non-`ACTIVE` or
  soft-deleted stock (same non-enumeration convention `deposit.service.ts`'s
  `getByIdForUser` already established: a caller probing a suspended/deleted
  stock's id by guessing can't distinguish "doesn't exist" from "exists but
  hidden").
- `StockSymbolAlreadyExistsError` (409, `STOCK_SYMBOL_ALREADY_EXISTS`) —
  thrown by `assertUniqueSymbol` (task 21) on create, and on update only when
  the request actually changes `symbol` to one already in use by a different
  document.

Added to `shared/errors/index.ts` barrel.
**Depends on:** none
**Layer:** Backend

### 10. Stock repository

`stock.repository.ts`: `create`, `findById` (excludes `isDeleted: true`),
`findBySymbol` (case-insensitive-safe since `symbol` is stored uppercase —
used by `assertUniqueSymbol`), `findByIdIncludingDeleted` (admin-only escape
hatch, needed so `getByIdForAdmin`/audit trail can still resolve a stock that
was just soft-deleted — mirrors `users-admin.service.ts`'s equivalent need),
`findPublic` (paginated + filters: category/industry/search + sort, scope
always `{ status: ACTIVE, isDeleted: { $ne: true } }` baked in — not a
caller-supplied filter, so a public route can never accidentally see
non-`ACTIVE` stock), `findAllAdmin` (paginated + filters: status/category/
industry/featured/search + sort, scope `{ isDeleted: { $ne: true } }` only —
admins see every status except soft-deleted), `findFeatured` (`{ status: ACTIVE, featured: true, isDeleted: { $ne: true } }`,
sorted by `displayOrder` ascending), `getDistinctCategories` (`Stock.distinct('category', { status: ACTIVE, isDeleted: { $ne: true } })`
— see task 22's note on why this replaces a separate Category collection),
`updateMetadata` (the PUT-editable field set — task 23's note on scope),
`updateStatus`, `updatePriceFields` (`currentPrice`/`previousPrice`/
`dailyChange`/`dailyChangePercentage`, atomic with the triggering
`MarketHistory` write via a session — task 27), `softDelete` (sets
`isDeleted`/`deletedAt`/`deletedBy`). Search matches `symbol`, `name`, and
`companyName` via a case-insensitive `$or` regex (`escapeRegExp`-guarded,
same helper `deposit.repository.ts` already uses) — phase-07.md's Search &
Filtering section lists "Stock Name / Company / Symbol" together as the
free-text targets, distinct from the exact-match `category`/`industry`/
`status`/`featured` filters.
**Depends on:** 1, 2, 7
**Layer:** Backend

### 11. MarketHistory repository

`market-history.repository.ts`: `create` (within the same session as the
triggering `stock.repository.ts#updatePriceFields` call — task 27),
`findByStockId` (paginated, newest-first, backs `GET /stocks/:id/history`
for both the public and admin controllers — same single method, no separate
admin variant needed since price history carries no sensitive fields worth
restricting).
**Depends on:** 8
**Layer:** Backend

---

## C. Backend — Business Rules & Validation

### 12. Generalize the shared upload middleware; add `uploadStockLogo`

Per decision 5: refactor `apps/server/src/middlewares/upload.ts`'s
`fileFilter`/multer-instance construction into a small factory
(`createImageUploader(fieldName: string, allowedMimeTypes: readonly string[])`)
so `uploadAvatar` and `uploadDepositScreenshot` can keep calling it with
their existing three-type allowlist unchanged, while a new
`uploadStockLogo: RequestHandler = createImageUploader('logo', [...uploadConfig.allowedMimeTypes, 'image/svg+xml'])`
is added for this module only. `config/upload.ts`'s `allowedMimeTypes`
constant is not widened — the extra `image/svg+xml` entry lives at the
call site, scoped to this one use case.
**Depends on:** none
**Layer:** Backend

### 13. Stock business-rule validators

`stock-business-rules.ts` (mirrors `deposit-business-rules.ts`'s pattern):

- `assertUniqueSymbol(symbol, excludeStockId?)` — queries
  `stockRepository.findBySymbol`; `excludeStockId` lets `updateStock` skip
  false positives when a request doesn't actually change `symbol`.
- `assertMinMaxPurchaseValid(minimumPurchase, maximumPurchase)` — throws
  `ValidationError` if `maximumPurchase < minimumPurchase`.
- `assertValidPrice(price)` — must be `> 0` (defense-in-depth alongside the
  Zod schema, same reasoning `deposit.model.ts`'s `min: 0` schema-level
  guards already document).
- `assertCanChangeStatus` / `assertNotDeleted` — guards against operating on
  an already-soft-deleted stock (mirrors `assertIsPending`'s role in
  Deposit/Withdrawal, but stock has no linear status workflow to gate — any
  `StockStatus` may transition to any other via `changeStatus()`, per
  phase-07.md never describing restricted transitions the way Withdrawal's
  `PENDING → APPROVED → PROCESSING → COMPLETED` chain does).

No `assertValidCategory`/"Active Settings" checks: phase-07.md's Validation
section names both, but neither maps to an actual constraint that exists
elsewhere in this codebase. There is no `StockSettings.categories` field and
no separate Category collection (decision below, task 22) — `category`/
`industry` are free-text, non-empty strings, validated the same way
`paymentMethod` is in `deposit.validation.ts` when no Settings-driven
allow-list exists to check against. "Active Settings" is interpreted as
"the required Settings category must be loadable" — always true here since
`settingsService.getStock()` is seeded at Phase 03 and never throws for a
missing category; inventing an extra runtime check for an already-guaranteed
invariant would be validation for a scenario that can't happen
(`coding_rules.md`'s anti-pattern list).
**Depends on:** 7, 10
**Layer:** Backend

### 14. Stock Zod validation schemas (server-side)

`stock.validation.ts`:

- `createStockSchema` — `symbol: stockSymbolSchema`, `name`, `companyName`
  (both `z.string().trim().min(1)`), `description: z.string().trim().min(1)`,
  `category`/`industry: z.string().trim().min(1)`, `currentPrice: amountSchema`,
  `totalShares: z.number().nonnegative().finite()`, `minimumPurchase`/
  `maximumPurchase: amountSchema.optional()` (omit-and-default-from-Settings
  per decision 4), `allowFractionalShares: z.boolean().optional()` (same),
  `dividendEnabled: z.boolean().default(false)`, `featured: z.boolean().default(false)`,
  `displayOrder: z.number().int().nonnegative().default(0)`. Multipart body
  (carries the optional `logo` file) — every field multer stringifies gets
  the same `z.preprocess` string-coercion `deposit.validation.ts`'s
  `packageAmount` already established.
- `updateStockSchema` — the PUT-editable metadata subset only (decision:
  `currentPrice`/`previousPrice`/`status` are deliberately **excluded** —
  see task 23's note; changing them bypasses `MarketHistory` recording and
  the dedicated audit action a real price/status change requires). Same
  field set as create minus `symbol`... actually `symbol` _is_ editable
  (phase-07.md's Admin Stock Form lists "Symbol" as a field), re-validated
  through `assertUniqueSymbol` with `excludeStockId`.
- `changeStockStatusSchema` — `{ status: z.nativeEnum(StockStatus) }`.
- `updateStockPriceSchema` — `{ newPrice: amountSchema }`.
- `stockListQuerySchema` — `page`, `limit`, `sortBy` (from `STOCK_SORT_OPTIONS`,
  task 15), `category`, `industry`, `search` — the public-facing subset;
  no `status`/`featured` params (public listing's status scope is fixed to
  `ACTIVE`, and "featured only" has its own dedicated endpoint/method).
- `adminStockListQuerySchema` — `stockListQuerySchema` plus `status` and
  `featured`, mirrors how `depositListQuerySchema` is reused by both the
  user and admin deposit routes, except here the admin variant is a strict
  superset since public listing is scoped server-side, not client-selectable.

**Depends on:** 5, 13
**Layer:** Backend

---

## D. Backend — Service Layer

### 15. Sort-option type + `STOCK_SORT_OPTIONS` constant

`stock.types.ts` (server-side, not the shared package): `STOCK_SORT_OPTIONS = ['nameAsc', 'nameDesc', 'symbolAsc', 'symbolDesc', 'priceHighToLow', 'priceLowToHigh', 'dailyGainDesc', 'dailyLossDesc', 'recentlyUpdated'] as const`
— expands phase-07.md's "Name, Symbol, Price, Daily Gain, Daily Loss,
Recently Updated" into concrete asc/desc pairs, same expansion
`DEPOSIT_SORT_OPTIONS`'s `highestAmount`/`lowestAmount` pair already
establishes for "Amount." `dailyGainDesc` sorts `dailyChangePercentage`
descending (biggest gainers first); `dailyLossDesc` sorts it ascending
(biggest losers/most-negative first) — two distinct sort keys over the same
field, not a single "daily change" toggle, matching phase-07.md listing
"Daily Gain" and "Daily Loss" as two separate sort options. Also declares
`StockFilters`, `StockListOptions`, `PaginatedStocks`,
`CreateStockInput`/`UpdateStockMetadataInput` (server-internal shapes, same
split `deposit.types.ts` draws between its Mongoose-facing `IDeposit` and
its service-facing request interfaces).
**Depends on:** 7
**Layer:** Backend

### 16. `StockService.createStock()`

Flow: `settingsService.getStock()` → fill omitted `minimumPurchase`/
`maximumPurchase`/`allowFractionalShares` from Settings (decision 4) →
`assertUniqueSymbol` → `assertMinMaxPurchaseValid` → `assertValidPrice` →
(if a logo file was uploaded) `uploadImage(buffer, mimetype, 'stocks', symbol)`
→ `stockRepository.create({ ..., previousPrice: currentPrice, availableShares: totalShares, status: ACTIVE, dailyChange: 0, dailyChangePercentage: 0 })`
→ audit log (`STOCK_CREATED`). No `MarketHistory` record on creation — task
27's `recordPriceHistory` only fires on an actual _change_ (an initial price
has no "previous" to diff against), matching phase-07.md's Price Update
workflow diagram, which is scoped to admin-triggered updates on an existing
stock.
**Depends on:** 12, 13, 14, 15
**Layer:** Backend

### 17. `StockService.updateStock()`

Metadata-only update (decision in task 14): re-runs `assertUniqueSymbol`
(only if `symbol` is present in the request and differs from the current
value) and `assertMinMaxPurchaseValid` (only if either purchase-limit field
is present, checked against the resulting merged values, not just the two
fields in isolation — a request changing only `minimumPurchase` must still
be checked against the _existing_ `maximumPurchase`). Re-uploads/replaces
`logoUrl` via `uploadImage` with `overwrite: true` (same `publicId`-based
overwrite `users.service.ts`'s avatar re-upload already uses) only if a new
logo file is present. → `stockRepository.updateMetadata` → audit log
(`STOCK_UPDATED`, before/after the changed fields only).
**Depends on:** 13, 16
**Layer:** Backend

### 18. `StockService.changeStatus()` / `archiveStock()`

`changeStatus(id, status, adminId)`: `assertNotDeleted` →
`stockRepository.updateStatus` → audit log (`STOCK_STATUS_CHANGED`,
before/after status). `archiveStock(id, adminId)` is a thin convenience
wrapper — `changeStatus(id, StockStatus.ARCHIVED, adminId)` — but writes a
distinct `STOCK_ARCHIVED` audit action instead of the generic
`STOCK_STATUS_CHANGED` one, matching phase-07.md's Audit Logs section
listing "Status Changed" and "Stock Archived" as two separate loggable
events even though they're the same underlying field mutation.
**Depends on:** 13, 16
**Layer:** Backend

### 19. `StockService.deleteStock()`

Soft delete: `assertNotDeleted` → `stockRepository.softDelete(id, { deletedAt: now, deletedBy: adminId })`
→ audit log (`STOCK_DELETED`). Wallet/portfolio impact is out of scope
entirely — Phase 08 (Trading/Portfolio) does not exist yet, so no positions
can reference this stock; this phase's exit criteria has no "block delete
if held by users" requirement to satisfy.
**Depends on:** 13, 16
**Layer:** Backend

### 20. `StockService.updatePrice()` + `recordPriceHistory()`

The one workflow task in this module (mirrors `DepositService.approveDeposit`/
`WithdrawalService.completeWithdrawal`'s "the one operation with real
side-effect sequencing" role, though — unlike those — this has no wallet
transaction to wrap, since no money moves in this phase).
`assertValidPrice(newPrice)` → read current `Stock` → compute
`change = newPrice - currentPrice`, `percentageChange = currentPrice === 0 ? 0 : (change / currentPrice) * 100`
→ Mongo session (`session.withTransaction`, same pattern
`deposit.service.ts`'s `approveDeposit` established, even though the two
writes here are both non-financial — chosen for the same reason: the price
fields and the `MarketHistory` record must never diverge, so an all-or-
nothing write is worth the small overhead) → `stockRepository.updatePriceFields(id, { previousPrice: currentPrice, currentPrice: newPrice, dailyChange: change, dailyChangePercentage: percentageChange }, session)`
→ `marketHistoryRepository.create({ stockId, previousPrice: currentPrice, newPrice, change, percentageChange, source: 'manual', updatedBy: adminId }, session)`
→ audit log (`STOCK_PRICE_UPDATED`, before/after `currentPrice` only — the
full before/after price _record_ already lives in `MarketHistory`, same
reasoning `WITHDRAWAL_COMPLETED`'s audit log doesn't duplicate the ledger
`Transaction`'s detail). No trading/portfolio/wallet logic — phase-07.md:
"No trading logic should occur yet."
**Depends on:** 13, 16
**Layer:** Backend

### 21. `StockService` — public read methods

`getStock(id)` (public, throws `StockNotFoundError` unless
`status === ACTIVE && !isDeleted`), `getStocks(options, filters)` (paginated,
scoped to `ACTIVE`/`!isDeleted` inside `stockRepository.findPublic` — service
layer never has to remember to apply the scope itself, it's baked into the
repository method per task 10), `getFeaturedStocks()`, `getCategories()`.
No separate `searchStocks()` method: phase-07.md's `StockService` method
list names it alongside `getStocks()`, but "search" is just one of
`getStocks()`'s filter parameters (`filters.search`), exactly like
`deposit.repository.ts`/`withdrawal.repository.ts` never needed a
search-specific method either — a dedicated method would be a near-duplicate
of `getStocks()` differing only in which filter is guaranteed non-empty.
**Depends on:** 10, 15
**Layer:** Backend

### 22. `StockService` — admin read methods

`listForAdmin(options, filters)` (cross-status via
`stockRepository.findAllAdmin`), `getByIdForAdmin(id)` (uses
`findByIdIncludingDeleted` — task 10 — so an admin can still open a just-
deleted stock's detail page to confirm the deletion, rather than getting a
404 immediately after their own action), `getPriceHistory(stockId, options)`
(delegates to `marketHistoryRepository.findByStockId`; same method backs
both `GET /stocks/:id/history` (public controller) and the admin detail
page's history tab — price history carries no field worth hiding from
non-admins once a stock itself is publicly visible).

Note on category management: `getCategories()` (task 21) returns
`stockRepository.getDistinctCategories()` — distinct values already present
on `ACTIVE` stocks — rather than a separate `Category` collection with its
own CRUD. phase-07.md says categories "should be stored separately or
managed dynamically"; a full Category module would be over-engineering for
what phase-07.md's own API Endpoints section only exposes as a single
read-only `GET /stocks/categories` route (no category CRUD endpoints are
listed anywhere in the phase doc).
**Depends on:** 10, 11, 15
**Layer:** Backend

### 23. Wire stock audit actions

Add `STOCK_CREATED`, `STOCK_UPDATED`, `STOCK_PRICE_UPDATED`,
`STOCK_STATUS_CHANGED`, `STOCK_ARCHIVED`, `STOCK_DELETED` to
`AUDIT_ACTIONS` (`modules/audit-log/audit-log.types.ts`) — reuses the
existing `auditLogRepository`, no new audit infrastructure. Matches
phase-07.md's Audit Logs section exactly (six named events).
**Depends on:** none
**Layer:** Backend

---

## E. Backend — API Layer

### 24. `stock.dto.ts`

`toStockResponse` (Mongoose document → shared `Stock` shape, ISO date
strings), `toStockListArgs` / `toAdminStockListArgs` (query → `StockFilters`/
`StockListOptions`), `toMarketHistoryResponse` — mirrors `deposit.dto.ts`'s
shape.
**Depends on:** 3, 4, 15
**Layer:** Backend

### 25. Public stock controller + routes

`stock.controller.ts` + `stock.routes.ts`: `GET /api/v1/stocks`
(`getStocks`, paginated, no `authenticate` — phase-07.md's Security section:
"Public users may only view active stocks," not "must be logged in to view
stocks"), `GET /api/v1/stocks/featured` (`getFeaturedStocks`),
`GET /api/v1/stocks/categories` (`getCategories`), `GET /api/v1/stocks/:id`
(`getStock`), `GET /api/v1/stocks/:id/history` (`getPriceHistory`,
paginated). All public/unauthenticated, per phase-07.md's explicit route
grouping. Route order matters: `/featured` and `/categories` must be
registered before `/:id` so Express doesn't treat `featured`/`categories` as
an `:id` value (same ordering constraint any Express router with a literal
segment alongside a param segment has).
**Depends on:** 14, 21, 24
**Layer:** Backend

### 26. Admin stock controller + routes

`modules/admin/admin-stock.controller.ts` / `admin-stock.middleware.ts`
(redeclaring id-param/query validators locally rather than importing
`stock.middleware.ts`'s copies — same self-contained-admin-middleware
precedent `admin-deposit.middleware.ts`/`admin-withdrawal.middleware.ts`
already set) / `admin-stock.routes.ts`: `POST /api/v1/admin/stocks`
(`uploadStockLogo` → validate → `createStock`), `GET /api/v1/admin/stocks`
(`listForAdmin`, paginated + filters), `GET /api/v1/admin/stocks/:id`
(`getByIdForAdmin`), `PUT /api/v1/admin/stocks/:id` (`uploadStockLogo` →
validate → `updateStock`), `PATCH /api/v1/admin/stocks/:id/status`
(`changeStatus`), `PATCH /api/v1/admin/stocks/:id/price` (`updatePrice`),
`DELETE /api/v1/admin/stocks/:id` (`deleteStock`) — behind `authenticate` +
`authorize(ADMIN, SUPER_ADMIN)`, mirroring `admin-deposit.*`/
`admin-withdrawal.*` exactly.
**Depends on:** 14, 16, 17, 18, 19, 20, 22, 24
**Layer:** Backend

### 27. Register stock routes centrally

Mount `stockRouter` at `/stocks` and `adminStockRouter` at `/admin/stocks` in
`apps/server/src/routes/index.ts`.
**Depends on:** 25, 26
**Layer:** Backend

### 28. Confirm indexes applied

`stock.model.ts`'s and `market-history.model.ts`'s `.index(...)` calls
(tasks 7, 8) are model-level declarations applied automatically by Mongoose
on first connection — no separate `database/indexes.ts` step, matching
Phase 04/05/06's same confirmation.
**Depends on:** 7, 8
**Layer:** Backend

---

## F. Backend — Tests

### 29. Unit tests: `StockService.createStock()` / `updateStock()`

Covers: success (defaults filled from Settings when omitted, `previousPrice`
seeded equal to `currentPrice`, `availableShares` seeded equal to
`totalShares`), rejection on duplicate `symbol`, rejection when
`maximumPurchase < minimumPurchase`, rejection on non-positive `currentPrice`,
logo upload success and re-upload/overwrite on update, update rejects a
`symbol` change colliding with a different existing stock but allows
"changing" it to its own current value (no false-positive uniqueness
conflict).
**Depends on:** 16, 17
**Layer:** Test

### 30. Unit tests: `StockService.updatePrice()`

Covers: `currentPrice`/`previousPrice`/`dailyChange`/`dailyChangePercentage`
all updated correctly, exactly one `MarketHistory` document created per call
with matching `previousPrice`/`newPrice`/`change`/`percentageChange`,
`source: 'manual'` and `updatedBy` set, rejection on non-positive `newPrice`,
mid-transaction failure (mocked `marketHistoryRepository.create` rejects
after `stockRepository.updatePriceFields` has run) rolls back both writes
atomically — same rollback technique
`deposit.service.test.ts`/`withdrawal.service.test.ts` already established.
**Depends on:** 20
**Layer:** Test

### 31. Unit tests: `changeStatus()` / `archiveStock()` / `deleteStock()`

Covers: every `StockStatus` → every other `StockStatus` transition succeeds
(no restricted-transition guard, per task 13's note) and writes
`STOCK_STATUS_CHANGED`; `archiveStock()` specifically writes `STOCK_ARCHIVED`
(not the generic action); `deleteStock()` sets `isDeleted`/`deletedAt`/
`deletedBy` and writes `STOCK_DELETED`; operating on an already-deleted stock
throws (via `assertNotDeleted`) for all three operations.
**Depends on:** 18, 19
**Layer:** Test

### 32. Unit tests: list/search/filter/sort/featured/categories

Covers: `getStocks()` never returns non-`ACTIVE` or soft-deleted stock
regardless of requested filters; search matches on `symbol`/`name`/
`companyName`; each `category`/`industry`/`status` (admin only)/`featured`
(admin only) filter narrows correctly; every `STOCK_SORT_OPTIONS` value
produces the expected order; `getFeaturedStocks()` returns only
`featured: true` `ACTIVE` stock sorted by `displayOrder`; `getCategories()`
returns distinct values from `ACTIVE` stock only (a category used only by an
`ARCHIVED` or soft-deleted stock does not appear); pagination totals/paging
correct.
**Depends on:** 21, 22
**Layer:** Test

### 33. Integration tests: public stock API

`stock-api.test.ts`. `GET /stocks`: success (only `ACTIVE` returned even
when `INACTIVE`/`SUSPENDED`/`ARCHIVED`/deleted stock exists in the database),
filters/search/sort/pagination. `GET /stocks/featured`. `GET /stocks/categories`.
`GET /stocks/:id`: success for `ACTIVE`, 404 for `INACTIVE`/`SUSPENDED`/
`ARCHIVED`/deleted/nonexistent ids (all indistinguishable 404s, confirming
the non-enumeration behavior task 9 establishes). `GET /stocks/:id/history`:
paginated, newest-first. No route requires authentication.
**Depends on:** 25
**Layer:** Test

### 34. Integration tests: admin stock API

`admin-stock-api.test.ts`. RBAC enforcement (`USER` role → 403;
unauthenticated → 401) on every route. `POST /admin/stocks`: success with
and without a logo file, duplicate symbol → 409, invalid min/max → 400,
missing required field → 422. `GET /admin/stocks`: returns every status
including `ARCHIVED`, excludes soft-deleted, filters by status/featured.
`PUT /admin/stocks/:id`: metadata update success, confirms `currentPrice`/
`status` in the request body are silently ignored (not applied) — the
decision from task 14 held in the real route, not just the design intent.
`PATCH /admin/stocks/:id/status`: any-to-any transition succeeds, audit log
row exists. `PATCH /admin/stocks/:id/price`: `currentPrice` updates, exactly
one new `MarketHistory` row exists with the right stockId, audit log row
exists, invalid price → 400. `DELETE /admin/stocks/:id`: stock disappears
from `GET /admin/stocks` and `GET /stocks` but is still fetchable via
`GET /admin/stocks/:id` (confirms `findByIdIncludingDeleted`'s admin escape
hatch, task 22), audit log row exists.
**Depends on:** 26
**Layer:** Test

---

## G. Frontend — Data Layer

### 35. Stock endpoint constants

`apps/client/src/constants/stock-endpoints.constants.ts`, mirroring
`deposit-endpoints.constants.ts`'s shape: `STOCKS`, `STOCK_BY_ID(id)`,
`STOCK_FEATURED`, `STOCK_CATEGORIES`, `STOCK_HISTORY(id)`, `ADMIN_LIST`,
`ADMIN_BY_ID(id)`, `ADMIN_CREATE`, `ADMIN_UPDATE(id)`,
`ADMIN_CHANGE_STATUS(id)`, `ADMIN_UPDATE_PRICE(id)`, `ADMIN_DELETE(id)`.
**Depends on:** none
**Layer:** Frontend

### 36. Stock client-only types

`apps/client/src/types/stock.types.ts`: `CreateStockPayload`/
`UpdateStockPayload` (both `FormData`-shaped, since the optional logo file
travels alongside the rest — same two-generic `useForm` pattern
`DepositForm.tsx` established for its file field), `StockListParams`
(reused by both the public and admin list calls, extended by
`AdminStockListParams` for the admin-only `status`/`featured` filters — same
extension relationship `WithdrawalListParams` has, task 34 of
phase-06-tasks.md), `ChangeStockStatusPayload`, `UpdateStockPricePayload`.
**Depends on:** 3
**Layer:** Frontend

### 37. Stock API service

`apps/client/src/services/stock.service.ts`: `getStocks`, `getFeaturedStocks`,
`getStockCategories`, `getStockById`, `getStockHistory`,
`adminListStocks`, `adminGetStockById`, `adminCreateStock` (multipart),
`adminUpdateStock` (multipart), `adminChangeStockStatus`,
`adminUpdateStockPrice`, `adminDeleteStock` — thin Axios wrappers, matching
`deposit.service.ts`'s shape.
**Depends on:** 25, 26 (contracts), 35, 36
**Layer:** Frontend

### 38. React Query hooks

`hooks/useStockQueries.ts` (`useStocks(params)`, `useStock(id)`,
`useFeaturedStocks()`, `useStockCategories()`, `useStockHistory(id, params)`,
`useAdminStocks(params)`, `useAdminStock(id)`, `STOCK_QUERY_KEYS`) +
`hooks/useStockMutations.ts` (`useCreateStock()`, `useUpdateStock()`,
`useChangeStockStatus()`, `useUpdateStockPrice()`, `useDeleteStock()`) —
matches the established `use*Queries.ts`/`use*Mutations.ts` split. Every
mutation invalidates both the admin list/detail keys and the corresponding
public keys (`useStocks`, `useStock(id)`, `useFeaturedStocks` where
`featured` changed) — unlike Withdrawal's single-mutation wallet
invalidation, most stock mutations here affect what the public catalog shows,
not a side-channel resource.
**Depends on:** 37
**Layer:** Frontend

---

## H. Frontend — Components

### 39. `StockStatusBadge`

`components/common/StockStatusBadge.tsx` — `ACTIVE` (success)/`INACTIVE`
(secondary)/`SUSPENDED` (warning)/`ARCHIVED` (destructive), reusing the same
color-mapping convention as `DepositStatusBadge`/`WithdrawalStatusBadge`.
**Depends on:** 1
**Layer:** Frontend

### 40. `StockPriceCard`

`components/cards/StockPriceCard.tsx` — presentational: current price,
previous price, `dailyChange`/`dailyChangePercentage` with up/down styling
(green/red per `docs/17-ui-design-system.md`'s color conventions), reused by
`StockCard`, the stock details page, and the admin price-update
confirmation view (phase-07.md's "Price Update Screen > Display" section).
**Depends on:** none
**Layer:** Frontend

### 41. `StockCard` + `FeaturedStockCard`

`components/cards/StockCard.tsx`: logo, company, symbol, `StockPriceCard`,
category — used on the public Stock Listing page. `FeaturedStockCard.tsx`: a
visually distinct variant (larger/highlighted) for the homepage/dashboard
featured-stocks section, per phase-07.md's "Featured Stocks > Used on"
(Homepage, Dashboard, Investment Page).
**Depends on:** 39, 40
**Layer:** Frontend

### 42. `StockTable`

`components/tables/StockTable.tsx` — columns (Logo, Symbol, Company,
Category, Price, Daily Change, Status), pagination, integrates
`StockStatusBadge`, empty/loading states — mirrors `DepositTable`/
`WithdrawalTable`, used by the admin stock list.
**Depends on:** 39, 40
**Layer:** Frontend

### 43. `PriceHistoryTable`

`components/tables/PriceHistoryTable.tsx` — columns (Date, Previous Price,
New Price, Change, % Change, Source, Updated By), paginated, reused by both
the public stock details page and the admin stock detail page's history
view — no admin-only fields present (task 22's reasoning), so one component
serves both.
**Depends on:** none
**Layer:** Frontend

### 44. `StockFilter`

`components/tables/StockFilter.tsx` — search + category (from
`useStockCategories()`) + industry + sort, plus admin-only `status`/
`featured` filters shown only when an `isAdmin` prop is set. Consolidates
phase-07.md's separately-listed `CategoryFilter`/`StockSearch` components
into one controlled filter bar, matching the established `<Feature>Filter`
convention (`DepositFilter`, `WithdrawalFilter`) rather than two components
independently mutating the same `StockListParams` object.
**Depends on:** none
**Layer:** Frontend

### 45. `StockForm`

`components/forms/StockForm.tsx` — composes `createStockFormSchema`/
`updateStockFormSchema` in `apps/client/src/validators/stock.validators.ts`
from task 5's shared primitive plus inline field schemas (mirrors
`deposit.validators.ts` composing from the server's same primitives). React
Hook Form + a `FormData`-producing submit handler (same two-generic
`useForm` workaround `DepositForm.tsx` uses for its optional file field).
Single component reused for both Create Stock and Edit Stock (phase-07.md
lists them as separate admin pages, but the field set is identical minus
`symbol` being immutable-in-practice-but-not-schema on edit — same
create/edit reuse relationship most CRUD forms in this codebase follow once
a create form exists, even though Deposit/Withdrawal have no precedent for
this specific pattern since neither is ever "edited" post-submission).
**Depends on:** 5, 14
**Layer:** Frontend

### 46. `PriceUpdateForm` (inline, dialog-based)

`components/forms/PriceUpdateForm.tsx` — a small form (new price input) shown
inside a `ConfirmDialog` (reused, not a new confirmation component) launched
from the admin stock detail page's "Update Price" action. Live-previews
`change`/`percentageChange` against the currently-loaded stock as the admin
types, using the same formula `StockService.updatePrice()` (task 20) applies
server-side — same "instant UX feedback, server response is still
authoritative" split `FeeCalculator.tsx` established in Phase 06. Replaces
phase-07.md's separate "Price Update Screen" page — folded into the detail
page as an inline dialog action instead, matching how Phase 06 folded
Approve/Reject/Processing/Complete into `AdminWithdrawalDetailPage` rather
than giving each transition its own route.
**Depends on:** 40
**Layer:** Frontend

---

## I. Frontend — Pages

### 47. Public: Stock Listing page

`pages/stock/StockListingPage.tsx`, mounted at `/stocks` — `StockFilter` +
`StockCard` grid (or `StockTable`, per `docs/17`'s listing-density
convention for catalog pages) wired to `useStocks(params)`, paginated.
**Depends on:** 38, 41, 44
**Layer:** Frontend

### 48. Public: Stock Details page

`pages/stock/StockDetailsPage.tsx`, mounted at `/stocks/:id` — company
info/description, `StockPriceCard`, category/industry, `PriceHistoryTable`,
wired to `useStock(id)` + `useStockHistory(id)`. Layout "prepared for future
trading actions" (phase-07.md) means reserving space/a disabled action area
for a Buy/Sell control Phase 08 will add — not building any trading UI now.
**Depends on:** 38, 40, 43
**Layer:** Frontend

### 49. Admin: Stocks list page

`pages/admin/stock/AdminStocksPage.tsx`, mounted at `/admin/stocks` —
`StockFilter` (admin mode) + `StockTable` over `useAdminStocks(params)`, plus
a "Create Stock" button routing to task 50's form page. Covers phase-07.md's
separately-named "Stock Dashboard" (this page) and "Stock Categories" page
(category browsing is just `StockFilter`'s category dropdown, sourced from
`useStockCategories()` — no dedicated category-management page exists since
categories aren't a separately managed entity, task 22's decision).
**Depends on:** 38, 42, 44
**Layer:** Frontend

### 50. Admin: Create/Edit Stock page

`pages/admin/stock/AdminStockFormPage.tsx`, mounted at `/admin/stocks/new`
and `/admin/stocks/:id/edit` — thin shell around `StockForm` (task 45),
branching create-vs-edit on whether an `:id` param is present, same
relationship `DepositDashboardPage` has to `DepositForm` except covering
both verbs with one page component.
**Depends on:** 38, 45
**Layer:** Frontend

### 51. Admin: Stock Detail page

`pages/admin/stock/AdminStockDetailPage.tsx`, mounted at
`/admin/stocks/:id` — full detail view (`StockPriceCard`, metadata,
`PriceHistoryTable`), plus actions: Edit (routes to task 50), Update Price
(opens `PriceUpdateForm` in `ConfirmDialog`), Change Status (`Select` +
`ConfirmDialog`), Archive (`ConfirmDialog`, shorthand for "Change Status →
Archived"), Delete (`ConfirmDialog`, destructive styling). Covers
phase-07.md's separately-named "Price Management" and "Stock History" pages
— both folded in here rather than given their own routes, same
page-consolidation reasoning as task 46.
**Depends on:** 38, 43, 46
**Layer:** Frontend

### 52. Route registration

Added to `apps/client/src/routes/AppRoutes.tsx`: `/stocks` →
`StockListingPage`, `/stocks/:id` → `StockDetailsPage` (public, no
`ProtectedRoute` wrapper — phase-07.md: public users may view active
stocks); `/admin/stocks` → `AdminStocksPage`, `/admin/stocks/new` and
`/admin/stocks/:id/edit` → `AdminStockFormPage`, `/admin/stocks/:id` →
`AdminStockDetailPage` (under `AdminRoute`/`AdminLayout`). Add a "Stocks"
nav entry to `DashboardLayout.tsx`'s `DASHBOARD_NAV_ITEMS` (after
"Withdrawals") and `AdminLayout.tsx`'s `ADMIN_NAV_ITEMS` (after
"Withdrawals").
**Depends on:** 47, 49, 50, 51
**Layer:** Frontend

---

## J. Frontend — Tests

### 53. Component/page tests

One test file per component/page, this repo's established convention:
`StockForm.test.tsx` (create + edit submission, logo upload, validation
errors), `StockTable.test.tsx` (render/pagination), `StockFilter.test.tsx`
(admin vs. non-admin field visibility), `PriceUpdateForm.test.tsx` (live
preview calculation matches the server formula), `AdminStockDetailPage.test.tsx`
(price update/status change/archive/delete interactions, confirmation
dialogs, API-error display for each action), `StockListingPage.test.tsx` /
`StockDetailsPage.test.tsx` (public rendering, no admin actions visible).
**Depends on:** 45, 46, 49, 50, 51
**Layer:** Test

---

## K. Closeout

### 54. Verify exit criteria against phase-07.md

Check each of phase-07.md's Exit Criteria against the actual implementation
once built (re-grep/re-run, not just re-read prior tasks' claims — same
closeout discipline Phases 05/06 used), and explicitly document the five
scope decisions this breakdown made up front:

1. **`MarketHistory`-inside-`stock`-module decision** (decision 1): confirm
   no top-level `modules/market-history/` exists and every `MarketHistory`
   write happens only from `StockService.updatePrice()`.
2. **Admin sub-module decision** (decision 2): confirm no admin route is
   registered on `stock.routes.ts`.
3. **Settings-as-seeded-defaults decision** (decision 4): grep
   `stock.service.ts`/`stock-business-rules.ts` for every
   `settingsService.getStock()` reference and confirm `enabled`/
   `autoSellEnabled`/`autoSellIntervalMinutes`/`priceUpdateMode` are never
   read anywhere in this phase's code.
4. **SVG-scoped-to-stock-logos decision** (decision 5): confirm
   `uploadAvatar`/`uploadDepositScreenshot`'s allowed mime types are
   unchanged (still exactly three types, no SVG) and only `uploadStockLogo`
   accepts `image/svg+xml`.
5. **PUT-excludes-price-and-status decision** (task 14): confirm
   `updateStockSchema` has no `currentPrice`/`previousPrice`/`status` keys
   and that `PUT /admin/stocks/:id` cannot change either, even if a client
   sends them in the body.

Also confirm the still-open Notifications gap does **not** apply to this
phase (per this file's intro note — no stock-catalog notification exists on
docs/15's list, so nothing to carry forward here, unlike Phases 05/06).

Cross-check against phase-07.md's actual Exit Criteria list:

| #   | Criterion                                                                                     | Expected status                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Admins can create, update, archive, and delete stocks                                         | Met once tasks 16–19, 26 land                                                                                                                |
| 2   | Stock prices can be updated and historical price records are created automatically            | Met once task 20 lands — verify exactly one `MarketHistory` row per price update, atomically with the price change                           |
| 3   | Featured stocks and categories work correctly                                                 | Met once tasks 21–22 land                                                                                                                    |
| 4   | Search, filtering, sorting, and pagination are fully functional                               | Met once tasks 10, 21–22, 32 land                                                                                                            |
| 5   | Public users can view only active stocks                                                      | Met once task 10's scoped `findPublic`/`findFeatured` land — verify via task 33's integration tests, not just code inspection                |
| 6   | Stock rules are loaded from the Settings Service                                              | Met with the scope narrowed per decision 4 — document which `StockSettings` fields are/aren't consulted this phase, same as decision 4 above |
| 7   | Audit logs record every administrative action                                                 | Met once task 23 + every service task's audit call lands                                                                                     |
| 8   | Search, filtering, sorting, pagination fully functional _(duplicate of #4 in the source doc)_ | Same evidence as #4                                                                                                                          |
| 9   | No trading, portfolio, or wallet balance changes occur in this phase                          | Met by construction — grep the entire `stock`/`admin` stock code for any `walletService`/`portfolio` reference; expect zero hits             |
| 10  | No TypeScript or ESLint errors exist                                                          | Verify via a fresh full typecheck/lint run across `shared-types`/`shared-constants`/`shared-validation`, server, and client                  |
| 11  | Unit and integration tests pass successfully                                                  | Verify via a fresh full test run across server and client                                                                                    |

**Depends on:** 27, 28, 29, 30, 31, 32, 33, 34, 52, 53
**Layer:** Docs / QA

---

## Dependency Overview (rough execution order)

```
1 → 2 ; 1 → 3 ; 4 ; 5                                                     (shared)
6 → 7 → 10 ; 6 → 8 → 11 ; 9 (independent)                                 (data layer)
12 (independent) ; 7,10 → 13 → 14 ; 5,13 → 14                             (rules + validation)
15 ; 12,13,14,15 → 16 → 17 ; 13,16 → 18,19 ; 13,16 → 20 ; 10,15 → 21 ;
  10,11,15 → 22 ; 23 (independent)                                       (services)
3,4,15 → 24 ; 14,21,24 → 25 ; 14,16,17,18,19,20,22,24 → 26 → 27,28        (API)
16,17 → 29 ; 20 → 30 ; 18,19 → 31 ; 21,22 → 32 ; 25 → 33 ; 26 → 34        (backend tests)
35,36 → 37 → 38                                                          (frontend data)
1 → 39 ; 40 ; 39,40 → 41 ; 39,40 → 42 ; 43 ; 44 ; 5,14 → 45 ; 40 → 46      (frontend components)
38,41,44 → 47 ; 38,40,43 → 48 ; 38,42,44 → 49 ; 38,45 → 50 ; 38,43,46 → 51 ;
  47,49,50,51 → 52 → 53                                                  (frontend pages/tests)
54 (final gate) ◄─── 27,28,29,30,31,32,33,34,52,53
```

Backend (6–28) can proceed almost entirely independently of frontend work
(35–53) once the shared foundations (1–5) exist — the two tracks converge at
task 37, which needs real API request/response contracts from tasks 25–26.
Task 9 (error classes) and task 12 (upload middleware generalization) have no
upstream dependency within this phase and can be built at any point before
tasks 16/25–26 respectively. Task 20 (`updatePrice`) is the one task on the
critical path with real side-effect ordering to get right (price fields +
`MarketHistory` write must be atomic); every other service-layer task is a
simple CRUD operation and can be built in any order once its own
dependencies (rules + validation) land. Task 54 is the phase-exit gate and
depends on everything upstream of it.
