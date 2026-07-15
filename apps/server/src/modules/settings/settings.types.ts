import type { HydratedDocument, Model, Types } from 'mongoose';
import type { SettingsCategory } from 'shared-types';

// `data`'s concrete shape depends on `category` (see shared-types'
// SettingsDataByCategory) - a single collection holds every category's document
// (docs/20-settings-system.md #7), so it can't be statically typed here any more
// precisely than audit-log.types.ts's before/after fields are. Callers narrow it
// via SettingsDataByCategory[category] at the point of use (the Settings Service).
export interface ISettings {
  category: SettingsCategory;
  data: unknown;
  // docs/20-settings-system.md #7's document shape only tracks who last updated a
  // category, not who created it - every document originates from the seeder
  // (scripts/seedSettings.ts), not an admin, so a createdBy field would be null
  // for the collection's entire lifetime in practice.
  updatedBy?: Types.ObjectId | null;
  // Populated by Mongoose via the `timestamps: true` schema option.
  createdAt: Date;
  updatedAt: Date;
}

export type SettingsDocument = HydratedDocument<ISettings>;
export type SettingsModel = Model<ISettings>;
