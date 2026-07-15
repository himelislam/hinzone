// Values double as the `:category` route segment (GET/PUT .../settings/:category,
// docs/20-settings-system.md #21) and the Settings collection's `category`
// discriminator field, so they must stay in sync with both. Stocks and
// Notifications are plural to match docs/20's actual route list; every other
// category is a singleton concept and stays singular.
export enum SettingsCategory {
  GENERAL = 'general',
  CURRENCY = 'currency',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRADING = 'trading',
  STOCKS = 'stocks',
  MLM = 'mlm',
  HOMEPAGE = 'homepage',
  NOTIFICATIONS = 'notifications',
  SECURITY = 'security',
}
