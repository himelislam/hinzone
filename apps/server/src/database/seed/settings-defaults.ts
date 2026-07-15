import { SettingsCategory } from 'shared-types';
import type { SettingsDataByCategory } from 'shared-types';

// Mirrors docs/20-settings-system.md's own example values wherever it gives one
// (#9 currency rate, #11 waiting period, #13 trading, #14-16 MLM referrals/
// commissions/ranks) and Phase 02's env-var fallbacks (config/jwt.ts,
// config/security.ts, shared-validation's passwordSchema) for Security Settings,
// so seeding doesn't silently change behavior that's already live. Everything
// else is a reasonable, admin-editable starting point.
export const SETTINGS_DEFAULTS: { [C in SettingsCategory]: SettingsDataByCategory[C] } = {
  [SettingsCategory.GENERAL]: {
    platformName: 'Stock Investment, Trading & MLM Platform',
    platformEmail: 'info@platform.com',
    supportEmail: 'support@platform.com',
    supportPhone: '+8801000000000',
    maintenanceMode: false,
  },
  [SettingsCategory.CURRENCY]: {
    defaultCurrency: 'BDT',
    currencySymbol: '৳',
    usdToBdtRate: 120,
    bdtToUsdRate: 0.00833,
    decimalPrecision: 2,
  },
  [SettingsCategory.DEPOSIT]: {
    enabled: true,
    packages: [{ amount: 3000 }, { amount: 6000 }, { amount: 12000 }],
    minimumDeposit: 3000,
    maximumDeposit: 100000,
    paymentMethods: ['bKash', 'Nagad'],
  },
  [SettingsCategory.WITHDRAWAL]: {
    enabled: true,
    minimumWithdrawal: 1000,
    maximumWithdrawal: 100000,
    waitingPeriodDays: 15,
    withdrawalFeePercentage: 5,
    processingTimeHours: 24,
    paymentMethods: ['bKash', 'Nagad'],
  },
  [SettingsCategory.TRADING]: {
    enabled: true,
    maintenanceMode: false,
    demoTradingEnabled: true,
    demoBalance: 1000,
    marketOpenTime: '10:00',
    marketCloseTime: '16:00',
  },
  [SettingsCategory.STOCKS]: {
    enabled: true,
    autoSellEnabled: false,
    minimumPurchase: 1,
    maximumPurchase: 1000,
    fractionalSharesEnabled: false,
    priceUpdateMode: 'manual',
    autoSellIntervalMinutes: 60,
  },
  [SettingsCategory.MLM]: {
    maximumDirectReferrals: 2,
    commissionLevels: [
      {
        level: 1,
        rates: [
          { packageAmount: 3000, commissionPercentage: 5 },
          { packageAmount: 6000, commissionPercentage: 7 },
          { packageAmount: 12000, commissionPercentage: 10 },
        ],
      },
      {
        level: 2,
        rates: [
          { packageAmount: 3000, commissionPercentage: 2 },
          { packageAmount: 6000, commissionPercentage: 4 },
          { packageAmount: 12000, commissionPercentage: 6 },
        ],
      },
    ],
    ranks: [
      { name: 'Branch', directReferralsRequirement: 2, rewardPercentage: 3 },
      { name: 'Silver', leftTeamRequirement: 8, rightTeamRequirement: 8, rewardPercentage: 5 },
      { name: 'Gold', leftTeamRequirement: 32, rightTeamRequirement: 32, rewardPercentage: 7 },
      { name: 'Diamond', totalTeamRequirement: 150, rewardPercentage: 10 },
    ],
  },
  [SettingsCategory.HOMEPAGE]: {
    bannerImages: [],
  },
  [SettingsCategory.NOTIFICATIONS]: {
    enabled: true,
    depositNotifications: true,
    withdrawalNotifications: true,
    tradingNotifications: true,
    mlmNotifications: true,
    pushEnabled: false,
    emailEnabled: true,
    smsEnabled: false,
  },
  [SettingsCategory.SECURITY]: {
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
  },
};
