import { AccountStatus } from 'shared-types';

// Shared by auth.service.ts and password.service.ts. Lives in its own file rather
// than being defined in either one, because auth.service.ts already imports
// passwordService - defining it in auth.service.ts and importing it back into
// password.service.ts would create a circular dependency between the two.
export const isBlockedFromAuth = (status: AccountStatus): boolean =>
  status === AccountStatus.SUSPENDED || status === AccountStatus.BLOCKED;
