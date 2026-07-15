import { SettingsCategory } from 'shared-types';
import type {
  CurrencySettings,
  DepositSettings,
  MlmSettings,
  StockSettings,
  TradingSettings,
  WithdrawalSettings,
} from 'shared-types';

import { BusinessRuleError } from '@/shared/errors';

// Cross-field rules that span more than one property within a single category's
// payload (docs/20-settings-system.md #22) - structural/single-field validation
// (is this even a positive number, etc.) belongs to each category's Zod schema
// instead (settings.validation.ts, a later task). database_rules.md #18: business
// rule validation belongs in the service layer, not the schema.

const assertMinNotAboveMax = (min: number, max: number, label: string): void => {
  if (min > max) {
    throw new BusinessRuleError(`Minimum ${label} cannot be greater than the maximum.`);
  }
};

const assertPositiveRate = (rate: number, label: string): void => {
  if (rate <= 0) {
    throw new BusinessRuleError(`${label} must be greater than zero.`);
  }
};

const assertPercentageInRange = (value: number, label: string): void => {
  if (value < 0 || value > 100) {
    throw new BusinessRuleError(`${label} must be between 0 and 100.`);
  }
};

const validateCurrency = (data: CurrencySettings): void => {
  assertPositiveRate(data.usdToBdtRate, 'USD to BDT exchange rate');
  assertPositiveRate(data.bdtToUsdRate, 'BDT to USD exchange rate');
};

const validateDeposit = (data: DepositSettings): void => {
  assertMinNotAboveMax(data.minimumDeposit, data.maximumDeposit, 'deposit amount');
};

const validateWithdrawal = (data: WithdrawalSettings): void => {
  assertMinNotAboveMax(data.minimumWithdrawal, data.maximumWithdrawal, 'withdrawal amount');

  if (data.waitingPeriodDays < 0) {
    throw new BusinessRuleError('Withdrawal waiting period cannot be negative.');
  }

  assertPercentageInRange(data.withdrawalFeePercentage, 'Withdrawal fee percentage');
};

const validateStock = (data: StockSettings): void => {
  assertMinNotAboveMax(data.minimumPurchase, data.maximumPurchase, 'stock purchase amount');
};

const validateTrading = (data: TradingSettings): void => {
  if (data.demoBalance < 0) {
    throw new BusinessRuleError('Demo balance cannot be negative.');
  }
};

const validateMlm = (data: MlmSettings): void => {
  for (const level of data.commissionLevels) {
    for (const rate of level.rates) {
      assertPercentageInRange(
        rate.commissionPercentage,
        `Level ${level.level} commission percentage`,
      );
    }
  }

  for (const rank of data.ranks) {
    assertPercentageInRange(rank.rewardPercentage, `${rank.name} reward percentage`);
  }
};

// General/Homepage/Notification/Security have no documented cross-field rules
// beyond structural validation, so they fall through with nothing further to check.
export const validateSettingsData = (category: SettingsCategory, data: unknown): void => {
  switch (category) {
    case SettingsCategory.CURRENCY:
      validateCurrency(data as CurrencySettings);
      break;
    case SettingsCategory.DEPOSIT:
      validateDeposit(data as DepositSettings);
      break;
    case SettingsCategory.WITHDRAWAL:
      validateWithdrawal(data as WithdrawalSettings);
      break;
    case SettingsCategory.STOCKS:
      validateStock(data as StockSettings);
      break;
    case SettingsCategory.TRADING:
      validateTrading(data as TradingSettings);
      break;
    case SettingsCategory.MLM:
      validateMlm(data as MlmSettings);
      break;
    default:
      break;
  }
};
