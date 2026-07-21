import { BusinessRuleError, StockSymbolAlreadyExistsError, ValidationError } from '@/shared/errors';

import { stockRepository } from './stock.repository';
import type { StockDocument } from './stock.types';

// tasks/phase-07.md's Validation section - checked before a stock is created
// or transitioned. Cross-field/business rules live here; structural
// validation (is this even a positive number, etc.) belongs to
// stock.validation.ts's Zod schemas instead (database_rules.md #18: business
// rule validation belongs in the service layer, not the schema) - same split
// as deposit/deposit-business-rules.ts and withdrawal/withdrawal-business-rules.ts.

// Queries stockRepository.findBySymbol directly (async, unlike
// deposit-business-rules.ts/withdrawal-business-rules.ts's purely synchronous
// guards over already-loaded data) - same precedent as
// users/users-guards.ts's assertEmailAvailable/assertPhoneNumberAvailable, a
// uniqueness check inherently needs its own live lookup. `excludeStockId`
// lets updateStock (Section D) skip a false-positive conflict when a request
// doesn't actually change `symbol` to a different value - it still collides
// correctly against every *other* stock, same `existing.id !== excludeId`
// shape as users-guards.ts.
export const assertUniqueSymbol = async (
  symbol: string,
  excludeStockId?: string,
): Promise<void> => {
  const existing = await stockRepository.findBySymbol(symbol);

  if (existing && existing.id !== excludeStockId) {
    throw new StockSymbolAlreadyExistsError();
  }
};

export const assertMinMaxPurchaseValid = (
  minimumPurchase: number,
  maximumPurchase: number,
): void => {
  if (maximumPurchase < minimumPurchase) {
    const message = 'Maximum purchase cannot be less than minimum purchase.';
    throw new ValidationError(message, [{ path: 'maximumPurchase', message }]);
  }
};

// Guards updateStock (Section D): `totalShares` is independently editable via
// UpdateStockMetadataInput, but stock.model.ts's `availableShares` can only
// ever shrink from `totalShares` (Trading, a future phase - "Do not decrease
// available shares in this phase," phase-07.md). Without this check, lowering
// `totalShares` below the stock's current `availableShares` would leave the
// document in a state where more shares are "available" than the catalog
// claims exist at all. Takes primitive values (not a document) - same shape
// as assertMinMaxPurchaseValid above - so the future service layer supplies
// the stock's current `availableShares` once it has already fetched it.
export const assertTotalSharesNotBelowAvailable = (
  totalShares: number,
  availableShares: number,
): void => {
  if (totalShares < availableShares) {
    const message = 'Total shares cannot be less than the shares currently available.';
    throw new ValidationError(message, [{ path: 'totalShares', message }]);
  }
};

// Defense-in-depth alongside stock.model.ts's `min: 0` schema-level guard and
// stock.validation.ts's amountSchema check (database_rules.md #13/#18) -
// re-checked here because updatePrice (Section D) accepts a price directly
// at any point in a stock's lifetime, not just at creation.
export const assertValidPrice = (price: number): void => {
  if (price <= 0) {
    const message = 'Price must be greater than zero.';
    throw new ValidationError(message, [{ path: 'newPrice', message }]);
  }
};

// Guards every write operation on an existing stock (updateStock,
// changeStatus, updatePrice) - a soft-deleted stock is not editable, same
// reasoning users-admin.service.ts's deleteUser flow forcing status to
// BLOCKED keeps a deleted account out of every other flow that already gates
// on status. Deliberately does not block *reads* - stockRepository.findByIdIncludingDeleted
// (Section B) exists precisely so an admin can still view a just-deleted
// stock's detail page.
export const assertNotDeleted = (stock: StockDocument): void => {
  if (stock.isDeleted) {
    throw new BusinessRuleError('This stock has been deleted and can no longer be modified.');
  }
};

// Stock has no linear status workflow to gate (unlike Withdrawal's
// PENDING -> APPROVED -> PROCESSING -> COMPLETED chain) - any StockStatus may
// transition to any other via changeStatus() (Section D), per phase-07.md
// never describing restricted transitions. The only precondition worth
// asserting before a status change is that the stock isn't already deleted.
export const assertCanChangeStatus = (stock: StockDocument): void => {
  assertNotDeleted(stock);
};
