import type { AccountStatus } from '../enums/account-status.enum';
import type { UserRole } from '../enums/user-role.enum';

// API-facing user shape shared by client and server. Never include password,
// tokens, or other sensitive fields here - this type crosses the network boundary.
export interface User {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  phoneNumber: string;
  role: UserRole;
  status: AccountStatus;
  profileImage?: string;
  referralId: string;
  referrerId?: string;
  isVerified: boolean;
  loginAttempts: number;
  accountLockedUntil?: string | null;
  lastLogin?: string;
  lastActive?: string;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}
