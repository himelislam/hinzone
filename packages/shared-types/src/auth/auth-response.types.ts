import type { User } from '../user/user.types';
import type { AuthTokens } from './auth-tokens.types';

// Response shape for endpoints that both authenticate and return the account,
// e.g. POST /auth/register and POST /auth/login.
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
