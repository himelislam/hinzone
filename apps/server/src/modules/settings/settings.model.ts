import { Schema, model } from 'mongoose';
import { SETTINGS_CATEGORIES } from 'shared-constants';

import type { ISettings, SettingsModel } from './settings.types';

// One document per category (docs/20-settings-system.md #7) - `data` deliberately
// stays untyped at the schema level (Schema.Types.Mixed) since its shape varies
// by category; structural/business validation happens in the service layer via
// each category's Zod schema before a write ever reaches this model
// (database_rules.md #7/#18 - schemas hold field definitions and structural
// validation only, never business logic).
const settingsSchema = new Schema<ISettings, SettingsModel>(
  {
    category: {
      type: String,
      enum: SETTINGS_CATEGORIES,
      required: true,
      unique: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

export const Settings = model<ISettings, SettingsModel>('Settings', settingsSchema, 'settings');
