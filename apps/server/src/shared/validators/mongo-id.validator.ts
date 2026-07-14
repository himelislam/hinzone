import { z } from 'zod';

// Validates a route param is a well-formed MongoDB ObjectId before it ever reaches
// a repository lookup - without this, a malformed :id throws a Mongoose CastError
// instead of a clear validation error.
export const mongoIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.'),
});

export type MongoIdParams = z.infer<typeof mongoIdParamSchema>;
