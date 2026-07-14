import type { Types } from 'mongoose';

// createdAt/updatedAt below are populated by Mongoose via each schema's
// `timestamps: true` option.

export interface IRefreshToken {
  userId: Types.ObjectId;
  // Links a refresh token to the login instance it belongs to, so logout can delete
  // the matching Session record too (docs/07-authentication.md #14) and rotation
  // (#13) can carry the same session forward instead of starting a new one.
  sessionId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession {
  userId: Types.ObjectId;
  device?: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
  lastActivity: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPasswordResetToken {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRefreshTokenInput {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
}

export interface CreateSessionInput {
  userId: Types.ObjectId;
  device?: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
  expiresAt: Date;
}

export interface CreatePasswordResetTokenInput {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
}

// Populated by the controller from request headers/IP (Task E deliberately keeps
// AuthService free of any direct dependency on Express's Request object).
export interface AuthRequestContext {
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  operatingSystem?: string;
}

export interface RegisterInput {
  fullName: string;
  username: string;
  email?: string;
  phoneNumber: string;
  password: string;
  // Raw referral code from the request body, e.g. "REF100001" - resolved to the
  // sponsor's ObjectId internally via userService.validateSponsorExists.
  referrerId?: string;
}

export interface LoginInput {
  // Username, phone number, or email - see docs/07-authentication.md #10.
  login: string;
  password: string;
}
