import { z } from 'zod';
import { AccountStatus, UserRole } from 'shared-types';
import { emailSchema, fullNameSchema, phoneNumberSchema } from 'shared-validation';

// A Cloudinary URL set by the separate upload endpoint (POST /users/profile/image),
// not a file upload itself - see docs/06-api-specification.md #6.
const profileImageUrlSchema = z.string().trim().url('Enter a valid image URL.');

// profileImage is deliberately absent here - it is set exclusively through the
// dedicated, file-validated upload endpoint (POST /users/profile/image), never as
// an arbitrary client-supplied URL. Accepting an arbitrary URL here would let a
// client point profileImage at unvalidated, non-Cloudinary content, bypassing the
// file-type/size checks the upload endpoint enforces.
export const updateProfileSchema = z.object({
  fullName: fullNameSchema.optional(),
  phoneNumber: phoneNumberSchema.optional(),
});

// PUT /api/v1/admin/users/:id (docs/06-api-specification.md #16) - admin-only, so
// role is editable here even though it never is on the self-service update above.
export const adminUpdateUserSchema = z.object({
  fullName: fullNameSchema.optional(),
  email: emailSchema.optional(),
  phoneNumber: phoneNumberSchema.optional(),
  profileImage: profileImageUrlSchema.optional(),
  role: z.nativeEnum(UserRole).optional(),
});

// PATCH /api/v1/admin/users/:id/status - a focused, single-purpose endpoint kept
// separate from the general update above.
export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(AccountStatus),
});

// Whitelisted rather than a bare string: userRepository.list() plugs `sort`
// straight into a Mongo .sort({[sort]: order}) call, so an unconstrained field
// name would let a client sort by (though never see, since it's select:false)
// fields like password or accountLockedUntil - never trust client input into a
// query construct, even from an already-authenticated admin.
const SORTABLE_FIELDS = [
  'fullName',
  'username',
  'email',
  'phoneNumber',
  'role',
  'status',
  'createdAt',
  'joinDate',
  'lastLogin',
] as const;

// GET /api/v1/admin/users query params - search/filter/paginate/sort
// (phase-02's admin "Search & Filtering" section: name, email, username, phone,
// role, status, registration date).
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(SORTABLE_FIELDS).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string().trim().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// Inferred request-body/query types for controllers - avoids each controller
// needing to import zod directly just to derive the shape validate() already
// guaranteed.
export type UpdateProfileRequestBody = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserRequestBody = z.infer<typeof adminUpdateUserSchema>;
export type UpdateUserStatusRequestBody = z.infer<typeof updateUserStatusSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
