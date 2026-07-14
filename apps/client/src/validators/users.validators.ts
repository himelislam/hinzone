import { z } from 'zod';
import { fullNameSchema, phoneNumberSchema } from 'shared-validation';

// Mirrors apps/server/src/modules/users/users.validation.ts's updateProfileSchema
// (item 40) - profileImage is intentionally absent here too, for the same reason:
// it is set exclusively through the dedicated upload endpoint (see
// components/forms/AvatarUpload.tsx), never as a plain form field.
export const updateProfileFormSchema = z.object({
  fullName: fullNameSchema.optional(),
  phoneNumber: phoneNumberSchema.optional(),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileFormSchema>;
