import bcrypt from 'bcrypt';
import { Schema, model } from 'mongoose';
import { ACCOUNT_STATUSES, USER_ROLES } from 'shared-constants';
import { AccountStatus, UserRole } from 'shared-types';

import { bcryptConfig } from '@/config/bcrypt';

import type { IUser, IUserMethods, UserDocument, UserModel } from './users.types';

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 4,
      maxlength: 30,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: UserRole.USER,
    },
    status: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: AccountStatus.ACTIVE,
    },
    profileImage: {
      type: String,
    },
    referralId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
    },
    lastActive: {
      type: Date,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });

// Salt rounds come from BCRYPT_SALT_ROUNDS (config/bcrypt.ts), a documented fallback
// until the Security Settings policy is available - see docs/07-authentication.md #9.
userSchema.pre('save', async function hashPassword(this: UserDocument): Promise<void> {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, bcryptConfig.saltRounds);
});

userSchema.methods.comparePassword = async function comparePassword(
  this: UserDocument,
  candidatePassword: string,
): Promise<boolean> {
  // `password` has `select: false`, so IUser's non-optional `string` type doesn't
  // guarantee it was actually loaded onto this document - fail clearly instead of
  // letting bcrypt throw an opaque "data and hash arguments required" error.
  if (!this.password) {
    throw new Error(
      'Cannot compare password: this document was loaded without the password field selected.',
    );
  }

  return bcrypt.compare(candidatePassword, this.password);
};

// Belt-and-suspenders alongside `select: false` above - the password hash must never
// reach an API response even if a query explicitly re-selects it.
userSchema.set('toJSON', {
  transform: (_doc, ret): Record<string, unknown> => {
    const sanitized = ret as unknown as Record<string, unknown>;
    delete sanitized.password;
    delete sanitized.__v;
    return sanitized;
  },
});

export const User = model<IUser, UserModel>('User', userSchema, 'users');
