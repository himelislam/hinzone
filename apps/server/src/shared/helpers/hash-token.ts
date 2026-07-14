import { createHash } from 'node:crypto';

// Refresh/reset tokens are already high-entropy random values, so a fast
// cryptographic hash is appropriate here - unlike passwords, they don't need
// bcrypt's deliberately slow, salted hashing to resist brute force.
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
