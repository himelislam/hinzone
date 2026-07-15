import type { SettingsCategory } from '../enums/settings-category.enum';
import type { CurrencySettings } from './currency-settings.types';
import type { DepositSettings } from './deposit-settings.types';
import type { GeneralSettings } from './general-settings.types';
import type { HomepageSettings } from './homepage-settings.types';
import type { MlmSettings } from './mlm-settings.types';
import type { NotificationSettings } from './notification-settings.types';
import type { SecuritySettings } from './security-settings.types';
import type { StockSettings } from './stock-settings.types';
import type { TradingSettings } from './trading-settings.types';
import type { WithdrawalSettings } from './withdrawal-settings.types';

// Lets the backend's generic getByCategory()/updateByCategory() (and the client's
// matching hooks) stay strongly typed per category instead of returning `unknown` -
// SettingsDataByCategory[SettingsCategory.DEPOSIT] resolves to DepositSettings, etc.
export interface SettingsDataByCategory {
  [SettingsCategory.GENERAL]: GeneralSettings;
  [SettingsCategory.CURRENCY]: CurrencySettings;
  [SettingsCategory.DEPOSIT]: DepositSettings;
  [SettingsCategory.WITHDRAWAL]: WithdrawalSettings;
  [SettingsCategory.TRADING]: TradingSettings;
  [SettingsCategory.STOCKS]: StockSettings;
  [SettingsCategory.MLM]: MlmSettings;
  [SettingsCategory.HOMEPAGE]: HomepageSettings;
  [SettingsCategory.NOTIFICATIONS]: NotificationSettings;
  [SettingsCategory.SECURITY]: SecuritySettings;
}
