import type { DepositSettings } from 'shared-types';
import { DepositStatus } from 'shared-types';

import { BusinessRuleError, DepositNotPendingError } from '@/shared/errors';

import type { DepositDocument } from './deposit.types';

// tasks/phase-05.md's Deposit Validation section - checked before a deposit is
// created or transitioned. Cross-field/business rules live here; structural
// validation (is this even a positive number, etc.) belongs to deposit.validation.ts's
// Zod schemas instead (database_rules.md #18: business rule validation belongs
// in the service layer, not the schema) - same split as
// settings/settings-business-rules.ts.

export const assertDepositsEnabled = (settings: DepositSettings): void => {
  if (!settings.enabled) {
    throw new BusinessRuleError('Deposits are currently disabled.');
  }
};

// tasks/phase-05.md's "Package Exists" - the submitted amount must match one of
// the admin-configured packages, never an arbitrary figure (project_rules.md's
// Settings System: "Deposit Packages" must always come from Settings).
export const assertPackageExists = (amount: number, settings: DepositSettings): void => {
  const packageExists = settings.packages.some(
    (depositPackage) => depositPackage.amount === amount,
  );

  if (!packageExists) {
    throw new BusinessRuleError('Selected deposit package is not available.');
  }
};

// tasks/phase-05.md's "Amount Allowed" - a separate bound check from package
// membership, so an amount is still rejected if minimumDeposit/maximumDeposit
// has been tightened since `packages` was last edited.
export const assertAmountWithinLimits = (amount: number, settings: DepositSettings): void => {
  if (amount < settings.minimumDeposit || amount > settings.maximumDeposit) {
    throw new BusinessRuleError(
      `Deposit amount must be between ${settings.minimumDeposit} and ${settings.maximumDeposit}.`,
    );
  }
};

export const assertPaymentMethodAllowed = (method: string, settings: DepositSettings): void => {
  if (!settings.paymentMethods.includes(method)) {
    throw new BusinessRuleError('Selected payment method is not available.');
  }
};

// Shared guard for cancel/approve/reject (DepositService, a later task) - none
// of those transitions are valid once a deposit has left PENDING.
export const assertIsPending = (deposit: DepositDocument): void => {
  if (deposit.status !== DepositStatus.PENDING) {
    throw new DepositNotPendingError();
  }
};
