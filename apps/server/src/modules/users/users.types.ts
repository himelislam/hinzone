import type { HydratedDocument, Model, Types } from 'mongoose';
import type { AccountStatus, UserRole } from 'shared-types';

export interface IUser {
  fullName: string;
  username: string;
  email?: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  status: AccountStatus;
  profileImage?: string;
  referralId: string;
  referrerId?: Types.ObjectId;
  isVerified: boolean;
  loginAttempts: number;
  accountLockedUntil?: Date | null;
  lastLogin?: Date;
  lastActive?: Date;
  joinDate: Date;
  // database_rules.md #6/#15 - Users support soft delete; admin deletion sets these
  // rather than removing the document.
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  // Populated by Mongoose via the `timestamps: true` schema option.
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;
export type UserModel = Model<IUser, object, IUserMethods>;

export interface CreateUserInput {
  fullName: string;
  username: string;
  email?: string;
  phoneNumber: string;
  password: string;
  // Must already be resolved via userService.validateSponsorExists (pass sponsor._id).
  referrerId?: Types.ObjectId;
}

export interface UpdateProfileInput {
  fullName?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedUsers {
  items: UserDocument[];
  total: number;
}

export interface AdminUpdateUserInput {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  role?: UserRole;
}

export interface AdminUserListFilters {
  search?: string;
  role?: UserRole;
  status?: AccountStatus;
  dateFrom?: Date;
  dateTo?: Date;
}
