import { z } from 'zod';
import {
  currencyRateSchema,
  emailSchema,
  packageAmountSchema,
  percentageSchema,
} from 'shared-validation';

// Mirrors apps/server/src/modules/settings/settings.validation.ts's schemas 1:1 so
// the client rejects obviously invalid input before it reaches the network - the
// backend re-validates everything regardless (project_rules.md's Validation Rules:
// "Never trust frontend validation"). Structural only; cross-field business rules
// (e.g. minimum <= maximum) are enforced server-side (settings-business-rules.ts)
// and surfaced back through FormAlert via getErrorMessage.

// Stays string[] at the schema/form-state level (matching SettingsDataByCategory
// exactly, so no zod .transform() is needed and useForm keeps its normal single
// generic) - the three consumers (Deposit/Withdrawal's paymentMethods, Homepage's
// bannerImages) render this via StringListTextarea, which keeps raw (untrimmed,
// possibly-blank) lines in form state while the user is typing and only cleans
// them at submit time - so per-item content isn't validated here, only that at
// least one entry survives that cleanup.
const stringListField = z.array(z.string()).min(1, 'At least one entry is required.');

// The one place that actually trims/drops blanks - called once, at submit time,
// by every form using StringListTextarea (never on every keystroke).
export const cleanStringList = (values: string[]): string[] =>
  values.map((value) => value.trim()).filter(Boolean);

export const generalSettingsFormSchema = z.object({
  platformName: z.string().trim().min(1, 'Platform name is required.').max(100),
  platformLogo: z.string().trim().optional(),
  platformEmail: emailSchema,
  supportEmail: emailSchema,
  supportPhone: z.string().trim().min(1, 'Support phone is required.'),
  whatsappNumber: z.string().trim().optional(),
  maintenanceMode: z.boolean(),
  termsAndConditions: z.string().trim().optional(),
  privacyPolicy: z.string().trim().optional(),
});
export type GeneralSettingsFormValues = z.infer<typeof generalSettingsFormSchema>;

export const currencySettingsFormSchema = z.object({
  defaultCurrency: z.string().trim().min(1, 'Default currency is required.').max(10),
  currencySymbol: z.string().trim().min(1, 'Currency symbol is required.').max(5),
  usdToBdtRate: currencyRateSchema,
  bdtToUsdRate: currencyRateSchema,
  decimalPrecision: z.coerce.number().int().min(0).max(8),
});
export type CurrencySettingsFormValues = z.infer<typeof currencySettingsFormSchema>;

export const depositSettingsFormSchema = z.object({
  enabled: z.boolean(),
  packages: z.array(z.object({ amount: packageAmountSchema })),
  minimumDeposit: packageAmountSchema,
  maximumDeposit: packageAmountSchema,
  paymentMethods: stringListField,
  companyBkashNumber: z.string().trim().optional(),
  companyNagadNumber: z.string().trim().optional(),
  depositInstructions: z.string().trim().optional(),
});
export type DepositSettingsFormValues = z.infer<typeof depositSettingsFormSchema>;

export const withdrawalSettingsFormSchema = z.object({
  enabled: z.boolean(),
  minimumWithdrawal: packageAmountSchema,
  maximumWithdrawal: packageAmountSchema,
  waitingPeriodDays: z.coerce.number().int().min(0, 'Waiting period cannot be negative.'),
  withdrawalFeePercentage: percentageSchema,
  processingTimeHours: z.coerce
    .number()
    .int()
    .positive('Processing time must be greater than zero.'),
  paymentMethods: stringListField,
});
export type WithdrawalSettingsFormValues = z.infer<typeof withdrawalSettingsFormSchema>;

const TIME_OF_DAY_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const tradingSettingsFormSchema = z.object({
  enabled: z.boolean(),
  maintenanceMode: z.boolean(),
  demoTradingEnabled: z.boolean(),
  demoBalance: z.coerce.number().min(0, 'Demo balance cannot be negative.'),
  marketOpenTime: z.string().regex(TIME_OF_DAY_REGEX, 'Enter a valid time in HH:mm format.'),
  marketCloseTime: z.string().regex(TIME_OF_DAY_REGEX, 'Enter a valid time in HH:mm format.'),
});
export type TradingSettingsFormValues = z.infer<typeof tradingSettingsFormSchema>;

export const stockSettingsFormSchema = z.object({
  enabled: z.boolean(),
  autoSellEnabled: z.boolean(),
  minimumPurchase: z.coerce.number().positive('Minimum purchase must be greater than zero.'),
  maximumPurchase: z.coerce.number().positive('Maximum purchase must be greater than zero.'),
  fractionalSharesEnabled: z.boolean(),
  priceUpdateMode: z.enum(['manual', 'automatic']),
  autoSellIntervalMinutes: z.coerce
    .number()
    .int()
    .positive('Auto sell interval must be greater than zero.'),
});
export type StockSettingsFormValues = z.infer<typeof stockSettingsFormSchema>;

export const mlmSettingsFormSchema = z.object({
  maximumDirectReferrals: z.coerce
    .number()
    .int()
    .min(0, 'Maximum direct referrals cannot be negative.'),
  commissionLevels: z.array(
    z.object({
      level: z.number().int().positive(),
      rates: z.array(
        z.object({ packageAmount: packageAmountSchema, commissionPercentage: percentageSchema }),
      ),
    }),
  ),
  ranks: z.array(
    z.object({
      name: z.string().trim().min(1, 'Rank name is required.'),
      directReferralsRequirement: z.number().int().min(0).optional(),
      leftTeamRequirement: z.number().int().min(0).optional(),
      rightTeamRequirement: z.number().int().min(0).optional(),
      totalTeamRequirement: z.number().int().min(0).optional(),
      rewardPercentage: percentageSchema,
    }),
  ),
});
export type MlmSettingsFormValues = z.infer<typeof mlmSettingsFormSchema>;

export const homepageSettingsFormSchema = z.object({
  bannerImages: stringListField,
  announcement: z.string().trim().optional(),
  promotionalText: z.string().trim().optional(),
  marketNews: z.string().trim().optional(),
  maintenanceNotice: z.string().trim().optional(),
});
export type HomepageSettingsFormValues = z.infer<typeof homepageSettingsFormSchema>;

export const notificationSettingsFormSchema = z.object({
  enabled: z.boolean(),
  depositNotifications: z.boolean(),
  withdrawalNotifications: z.boolean(),
  tradingNotifications: z.boolean(),
  mlmNotifications: z.boolean(),
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
});
export type NotificationSettingsFormValues = z.infer<typeof notificationSettingsFormSchema>;

const DURATION_REGEX = /^\d+(\.\d+)?\s?(ms|s|m|h|d|w|y)$/i;

export const securitySettingsFormSchema = z.object({
  jwtAccessExpiration: z.string().regex(DURATION_REGEX, 'Enter a duration such as "15m" or "7d".'),
  jwtRefreshExpiration: z.string().regex(DURATION_REGEX, 'Enter a duration such as "15m" or "7d".'),
  passwordPolicy: z.object({
    minimumLength: z.coerce.number().int().min(6, 'Minimum length must be at least 6.').max(128),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSpecialCharacters: z.boolean(),
  }),
  maximumLoginAttempts: z.coerce
    .number()
    .int()
    .positive('Maximum login attempts must be greater than zero.'),
  accountLockDurationMinutes: z.coerce
    .number()
    .int()
    .positive('Account lock duration must be greater than zero.'),
  passwordResetTokenExpirationMinutes: z.coerce
    .number()
    .int()
    .positive('Password reset token expiration must be greater than zero.'),
  sessionTimeoutMinutes: z.coerce
    .number()
    .int()
    .positive('Session timeout must be greater than zero.'),
  twoFactorEnabled: z.boolean(),
});
export type SecuritySettingsFormValues = z.infer<typeof securitySettingsFormSchema>;
