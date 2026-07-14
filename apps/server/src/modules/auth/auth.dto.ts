import type { AuthResponse, AuthTokens } from 'shared-types';

import { toUserResponse } from '../users/users.dto';
import type { UserDocument } from '../users/users.types';

// Bundles a mapped, client-safe user with its tokens - the shape returned by
// POST /auth/register and POST /auth/login.
export const toAuthResponse = (user: UserDocument, tokens: AuthTokens): AuthResponse => ({
  user: toUserResponse(user),
  tokens,
});
