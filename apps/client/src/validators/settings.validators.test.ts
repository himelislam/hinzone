import { describe, expect, it } from 'vitest';

import {
  cleanStringList,
  currencySettingsFormSchema,
  depositSettingsFormSchema,
  generalSettingsFormSchema,
  homepageSettingsFormSchema,
  mlmSettingsFormSchema,
  notificationSettingsFormSchema,
  securitySettingsFormSchema,
  stockSettingsFormSchema,
  tradingSettingsFormSchema,
  withdrawalSettingsFormSchema,
} from './settings.validators';

describe('generalSettingsFormSchema', () => {
  const valid = {
    platformName: 'Acme',
    platformEmail: 'info@acme.test',
    supportEmail: 'support@acme.test',
    supportPhone: '+8801000000000',
    maintenanceMode: false,
  };

  it('accepts a valid payload with every optional field omitted', () => {
    expect(generalSettingsFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a blank platform name', () => {
    expect(generalSettingsFormSchema.safeParse({ ...valid, platformName: ' ' }).success).toBe(
      false,
    );
  });

  it('rejects a malformed platform email', () => {
    expect(
      generalSettingsFormSchema.safeParse({ ...valid, platformEmail: 'not-an-email' }).success,
    ).toBe(false);
  });
});

describe('currencySettingsFormSchema', () => {
  const valid = {
    defaultCurrency: 'BDT',
    currencySymbol: '৳',
    usdToBdtRate: 120,
    bdtToUsdRate: 0.00833,
    decimalPrecision: 2,
  };

  it('accepts a valid payload', () => {
    expect(currencySettingsFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a non-positive exchange rate', () => {
    expect(currencySettingsFormSchema.safeParse({ ...valid, usdToBdtRate: 0 }).success).toBe(false);
  });

  it('rejects a decimal precision above 8', () => {
    expect(currencySettingsFormSchema.safeParse({ ...valid, decimalPrecision: 9 }).success).toBe(
      false,
    );
  });
});

describe('depositSettingsFormSchema', () => {
  const valid = {
    enabled: true,
    packages: [{ amount: 3000 }],
    minimumDeposit: 3000,
    maximumDeposit: 100000,
    paymentMethods: ['bKash'],
  };

  it('accepts a valid payload', () => {
    expect(depositSettingsFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a non-positive package amount', () => {
    expect(
      depositSettingsFormSchema.safeParse({ ...valid, packages: [{ amount: 0 }] }).success,
    ).toBe(false);
  });

  it('rejects an empty paymentMethods array', () => {
    expect(depositSettingsFormSchema.safeParse({ ...valid, paymentMethods: [] }).success).toBe(
      false,
    );
  });

  it('does not itself reject blank entries within paymentMethods (StringListTextarea handles that)', () => {
    // stringListField only enforces "at least one entry", not per-item content -
    // per-item cleanup is StringListTextarea/cleanStringList's job at submit time.
    expect(depositSettingsFormSchema.safeParse({ ...valid, paymentMethods: [''] }).success).toBe(
      true,
    );
  });
});

describe('withdrawalSettingsFormSchema', () => {
  const valid = {
    enabled: true,
    minimumWithdrawal: 1000,
    maximumWithdrawal: 100000,
    waitingPeriodDays: 15,
    withdrawalFeePercentage: 5,
    processingTimeHours: 24,
    paymentMethods: ['bKash'],
  };

  it('accepts a valid payload', () => {
    expect(withdrawalSettingsFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a negative waiting period', () => {
    expect(
      withdrawalSettingsFormSchema.safeParse({ ...valid, waitingPeriodDays: -1 }).success,
    ).toBe(false);
  });

  it('rejects a fee percentage above 100', () => {
    expect(
      withdrawalSettingsFormSchema.safeParse({ ...valid, withdrawalFeePercentage: 101 }).success,
    ).toBe(false);
  });
});

describe('tradingSettingsFormSchema', () => {
  const valid = {
    enabled: true,
    maintenanceMode: false,
    demoTradingEnabled: true,
    demoBalance: 1000,
    marketOpenTime: '10:00',
    marketCloseTime: '16:00',
  };

  it('accepts a valid payload', () => {
    expect(tradingSettingsFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a malformed market time', () => {
    expect(tradingSettingsFormSchema.safeParse({ ...valid, marketOpenTime: '25:99' }).success).toBe(
      false,
    );
  });

  it('rejects a negative demo balance', () => {
    expect(tradingSettingsFormSchema.safeParse({ ...valid, demoBalance: -1 }).success).toBe(false);
  });
});

describe('stockSettingsFormSchema', () => {
  const valid = {
    enabled: true,
    autoSellEnabled: false,
    minimumPurchase: 1,
    maximumPurchase: 1000,
    fractionalSharesEnabled: false,
    priceUpdateMode: 'manual',
    autoSellIntervalMinutes: 60,
  };

  it('accepts a valid payload', () => {
    expect(stockSettingsFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a priceUpdateMode outside the enum', () => {
    expect(
      stockSettingsFormSchema.safeParse({ ...valid, priceUpdateMode: 'sometimes' }).success,
    ).toBe(false);
  });
});

describe('mlmSettingsFormSchema', () => {
  const valid = {
    maximumDirectReferrals: 2,
    commissionLevels: [{ level: 1, rates: [{ packageAmount: 3000, commissionPercentage: 5 }] }],
    ranks: [{ name: 'Branch', directReferralsRequirement: 2, rewardPercentage: 3 }],
  };

  it('accepts a valid payload with optional rank requirements omitted', () => {
    const result = mlmSettingsFormSchema.safeParse({
      ...valid,
      ranks: [{ name: 'Diamond', totalTeamRequirement: 150, rewardPercentage: 10 }],
    });

    expect(result.success).toBe(true);
  });

  it('rejects a commission percentage above 100', () => {
    const result = mlmSettingsFormSchema.safeParse({
      ...valid,
      commissionLevels: [{ level: 1, rates: [{ packageAmount: 3000, commissionPercentage: 150 }] }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects a blank rank name', () => {
    expect(
      mlmSettingsFormSchema.safeParse({
        ...valid,
        ranks: [{ name: '', rewardPercentage: 3 }],
      }).success,
    ).toBe(false);
  });
});

describe('homepageSettingsFormSchema', () => {
  it('accepts an empty bannerImages array being rejected (min 1) and a populated one passing', () => {
    expect(homepageSettingsFormSchema.safeParse({ bannerImages: [] }).success).toBe(false);
    expect(
      homepageSettingsFormSchema.safeParse({ bannerImages: ['https://example.com/a.png'] }).success,
    ).toBe(true);
  });
});

describe('notificationSettingsFormSchema', () => {
  it('accepts a fully populated boolean payload', () => {
    const result = notificationSettingsFormSchema.safeParse({
      enabled: true,
      depositNotifications: true,
      withdrawalNotifications: true,
      tradingNotifications: true,
      mlmNotifications: true,
      pushEnabled: false,
      emailEnabled: true,
      smsEnabled: false,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a missing field', () => {
    expect(notificationSettingsFormSchema.safeParse({ enabled: true }).success).toBe(false);
  });
});

describe('securitySettingsFormSchema', () => {
  const valid = {
    jwtAccessExpiration: '15m',
    jwtRefreshExpiration: '7d',
    passwordPolicy: {
      minimumLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialCharacters: true,
    },
    maximumLoginAttempts: 5,
    accountLockDurationMinutes: 15,
    passwordResetTokenExpirationMinutes: 30,
    sessionTimeoutMinutes: 60,
    twoFactorEnabled: false,
  };

  it('accepts a valid payload', () => {
    expect(securitySettingsFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a malformed duration string', () => {
    expect(
      securitySettingsFormSchema.safeParse({ ...valid, jwtAccessExpiration: 'soon' }).success,
    ).toBe(false);
  });

  it('rejects a password policy minimum length below 6', () => {
    expect(
      securitySettingsFormSchema.safeParse({
        ...valid,
        passwordPolicy: { ...valid.passwordPolicy, minimumLength: 5 },
      }).success,
    ).toBe(false);
  });
});

describe('cleanStringList', () => {
  it('trims whitespace and drops blank entries', () => {
    expect(cleanStringList(['  bKash  ', '', '   ', 'Nagad'])).toEqual(['bKash', 'Nagad']);
  });

  it('returns an empty array when every entry is blank', () => {
    expect(cleanStringList(['', '   '])).toEqual([]);
  });
});
