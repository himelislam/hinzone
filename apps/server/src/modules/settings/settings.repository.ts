import type { Types } from 'mongoose';
import type { SettingsCategory } from 'shared-types';

import { Settings } from './settings.model';
import type { SettingsDocument } from './settings.types';

const findByCategory = async (category: SettingsCategory): Promise<SettingsDocument | null> => {
  return Settings.findOne({ category }).exec();
};

const findAll = async (): Promise<SettingsDocument[]> => {
  return Settings.find({}).exec();
};

// Used both by the admin update flow (with a real updatedBy) and the seeder
// (Task D - no admin to attribute the write to, so updatedBy stays unset). The
// "only insert defaults if the category doesn't already exist" seeding behavior
// is the seeder's own job, not this generic upsert's.
const upsertByCategory = async (
  category: SettingsCategory,
  data: unknown,
  updatedBy?: Types.ObjectId,
): Promise<SettingsDocument> => {
  // Mongoose's overloads already narrow the return type to exclude null when
  // `upsert: true` is present in the options, so no cast is needed here.
  return Settings.findOneAndUpdate(
    { category },
    { data, updatedBy: updatedBy ?? null },
    { new: true, upsert: true, runValidators: true },
  ).exec();
};

export const settingsRepository = {
  findByCategory,
  findAll,
  upsertByCategory,
};
