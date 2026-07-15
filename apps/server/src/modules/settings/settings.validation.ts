import { z } from 'zod';
import type { ZodTypeAny } from 'zod';
import { SettingsCategory } from 'shared-types';
import {
  currencyRateSchema,
  emailSchema,
  packageAmountSchema,
  percentageSchema,
} from 'shared-validation';

// Structural/single-field validation only (required fields, formats, ranges) - the
// cross-field rules that span more than one property live in settings-business-rules.ts
// instead (database_rules.md #18: schema/structural validation and business-rule
// validation are separate concerns). docs/20-settings-system.md #22.

const generalSettingsSchema = z.object({
  platformName: z.string().trim().min(1, 'Platform name is required.').max(100),
  platformLogo: z.string().trim().url('Enter a valid logo URL.').optional(),
  platformEmail: emailSchema,
  supportEmail: emailSchema,
  supportPhone: z.string().trim().min(1, 'Support phone is required.'),
  whatsappNumber: z.string().trim().min(1).optional(),
  maintenanceMode: z.boolean(),
  termsAndConditions: z.string().trim().optional(),
  privacyPolicy: z.string().trim().optional(),
});

const currencySettingsSchema = z.object({
  defaultCurrency: z.string().trim().min(1, 'Default currency is required.').max(10),
  currencySymbol: z.string().trim().min(1, 'Currency symbol is required.').max(5),
  usdToBdtRate: currencyRateSchema,
  bdtToUsdRate: currencyRateSchema,
  decimalPrecision: z.number().int().min(0).max(8),
});

const depositPackageSchema = z.object({
  amount: packageAmountSchema,
});

const depositSettingsSchema = z.object({
  enabled: z.boolean(),
  packages: z.array(depositPackageSchema).min(1, 'At least one deposit package is required.'),
  minimumDeposit: packageAmountSchema,
  maximumDeposit: packageAmountSchema,
  paymentMethods: z
    .array(z.string().trim().min(1))
    .min(1, 'At least one payment method is required.'),
  companyBkashNumber: z.string().trim().optional(),
  companyNagadNumber: z.string().trim().optional(),
  depositInstructions: z.string().trim().optional(),
});

const withdrawalSettingsSchema = z.object({
  enabled: z.boolean(),
  minimumWithdrawal: packageAmountSchema,
  maximumWithdrawal: packageAmountSchema,
  waitingPeriodDays: z.number().int().min(0, 'Waiting period cannot be negative.'),
  withdrawalFeePercentage: percentageSchema,
  processingTimeHours: z.number().int().positive('Processing time must be greater than zero.'),
  paymentMethods: z
    .array(z.string().trim().min(1))
    .min(1, 'At least one payment method is required.'),
});

// HH:mm, 24-hour clock - matches marketOpenTime/marketCloseTime's plain time-of-day
// strings (no date, no timezone).
const TIME_OF_DAY_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const tradingSettingsSchema = z.object({
  enabled: z.boolean(),
  maintenanceMode: z.boolean(),
  demoTradingEnabled: z.boolean(),
  demoBalance: z.number().min(0, 'Demo balance cannot be negative.'),
  marketOpenTime: z.string().regex(TIME_OF_DAY_REGEX, 'Enter a valid time in HH:mm format.'),
  marketCloseTime: z.string().regex(TIME_OF_DAY_REGEX, 'Enter a valid time in HH:mm format.'),
});

const stockSettingsSchema = z.object({
  enabled: z.boolean(),
  autoSellEnabled: z.boolean(),
  minimumPurchase: z.number().positive('Minimum purchase must be greater than zero.'),
  maximumPurchase: z.number().positive('Maximum purchase must be greater than zero.'),
  fractionalSharesEnabled: z.boolean(),
  priceUpdateMode: z.enum(['manual', 'automatic']),
  autoSellIntervalMinutes: z
    .number()
    .int()
    .positive('Auto sell interval must be greater than zero.'),
});

const mlmCommissionRateSchema = z.object({
  packageAmount: packageAmountSchema,
  commissionPercentage: percentageSchema,
});

const mlmCommissionLevelSchema = z.object({
  level: z.number().int().positive('Level must be a positive whole number.'),
  rates: z.array(mlmCommissionRateSchema).min(1, 'At least one commission rate is required.'),
});

const mlmRankSchema = z.object({
  name: z.string().trim().min(1, 'Rank name is required.'),
  directReferralsRequirement: z.number().int().min(0).optional(),
  leftTeamRequirement: z.number().int().min(0).optional(),
  rightTeamRequirement: z.number().int().min(0).optional(),
  totalTeamRequirement: z.number().int().min(0).optional(),
  rewardPercentage: percentageSchema,
});

const mlmSettingsSchema = z.object({
  maximumDirectReferrals: z.number().int().min(0, 'Maximum direct referrals cannot be negative.'),
  commissionLevels: z.array(mlmCommissionLevelSchema),
  ranks: z.array(mlmRankSchema),
});

const homepageSettingsSchema = z.object({
  bannerImages: z.array(z.string().trim().url('Enter a valid banner image URL.')),
  announcement: z.string().trim().optional(),
  promotionalText: z.string().trim().optional(),
  marketNews: z.string().trim().optional(),
  maintenanceNotice: z.string().trim().optional(),
});

const notificationSettingsSchema = z.object({
  enabled: z.boolean(),
  depositNotifications: z.boolean(),
  withdrawalNotifications: z.boolean(),
  tradingNotifications: z.boolean(),
  mlmNotifications: z.boolean(),
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
});

// jsonwebtoken's expiresIn duration format ("15m", "7d") - the same format
// config/jwt.ts's signAccessToken/signRefreshToken expect for the jwtAccessExpiration/
// jwtRefreshExpiration values this schema validates.
const DURATION_REGEX = /^\d+(\.\d+)?\s?(ms|s|m|h|d|w|y)$/i;

const passwordPolicySchema = z.object({
  minimumLength: z.number().int().min(6, 'Minimum length must be at least 6.').max(128),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialCharacters: z.boolean(),
});

const securitySettingsSchema = z.object({
  jwtAccessExpiration: z.string().regex(DURATION_REGEX, 'Enter a duration such as "15m" or "7d".'),
  jwtRefreshExpiration: z.string().regex(DURATION_REGEX, 'Enter a duration such as "15m" or "7d".'),
  passwordPolicy: passwordPolicySchema,
  maximumLoginAttempts: z
    .number()
    .int()
    .positive('Maximum login attempts must be greater than zero.'),
  accountLockDurationMinutes: z
    .number()
    .int()
    .positive('Account lock duration must be greater than zero.'),
  passwordResetTokenExpirationMinutes: z
    .number()
    .int()
    .positive('Password reset token expiration must be greater than zero.'),
  sessionTimeoutMinutes: z.number().int().positive('Session timeout must be greater than zero.'),
  twoFactorEnabled: z.boolean(),
});

// Looked up by category for the generic PUT /settings/:category admin route
// (docs/20-settings-system.md #21) - one Zod schema per category, keyed the same
// way settings.service.ts's getByCategory()/updateByCategory() are.
export const SETTINGS_VALIDATION_SCHEMAS: Record<SettingsCategory, ZodTypeAny> = {
  [SettingsCategory.GENERAL]: generalSettingsSchema,
  [SettingsCategory.CURRENCY]: currencySettingsSchema,
  [SettingsCategory.DEPOSIT]: depositSettingsSchema,
  [SettingsCategory.WITHDRAWAL]: withdrawalSettingsSchema,
  [SettingsCategory.TRADING]: tradingSettingsSchema,
  [SettingsCategory.STOCKS]: stockSettingsSchema,
  [SettingsCategory.MLM]: mlmSettingsSchema,
  [SettingsCategory.HOMEPAGE]: homepageSettingsSchema,
  [SettingsCategory.NOTIFICATIONS]: notificationSettingsSchema,
  [SettingsCategory.SECURITY]: securitySettingsSchema,
};

export const settingsCategoryParamSchema = z.object({
  category: z.nativeEnum(SettingsCategory),
});

export type SettingsCategoryParams = z.infer<typeof settingsCategoryParamSchema>;
