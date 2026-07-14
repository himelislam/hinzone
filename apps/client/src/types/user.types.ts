// Mirrors apps/server/src/modules/users/users.validation.ts's updateProfileSchema
// (PUT /users/profile) - see validators/users.validators.ts for the client-side
// zod counterpart.
export interface UpdateProfilePayload {
  fullName?: string;
  phoneNumber?: string;
}
