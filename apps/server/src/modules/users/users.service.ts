import { randomInt } from 'node:crypto';
import { AccountStatus, UserRole } from 'shared-types';

import { BusinessRuleError, NotFoundError } from '@/shared/errors';
import { uploadImage } from '@/shared/helpers/upload-image';

import { userRepository } from './users.repository';
import type { CreateUserInput, UpdateProfileInput, UserDocument } from './users.types';
import {
  assertEmailAvailable,
  assertPhoneNumberAvailable,
  assertUsernameAvailable,
} from './users-guards';

const AVATAR_UPLOAD_FOLDER = 'avatars';

const REFERRAL_ID_PREFIX = 'REF';
const REFERRAL_ID_MIN = 100000;
const REFERRAL_ID_MAX = 999999;
const MAX_REFERRAL_ID_ATTEMPTS = 10;

// Candidate + uniqueness-check retry loop, safeguarded by the unique index on
// referralId at the database level. See docs/07-authentication.md #8 for the format.
const generateUniqueReferralId = async (): Promise<string> => {
  for (let attempt = 0; attempt < MAX_REFERRAL_ID_ATTEMPTS; attempt += 1) {
    const candidate = `${REFERRAL_ID_PREFIX}${randomInt(REFERRAL_ID_MIN, REFERRAL_ID_MAX + 1)}`;
    const existing = await userRepository.findByReferralId(candidate);

    if (!existing) {
      return candidate;
    }
  }

  throw new BusinessRuleError('Unable to generate a unique referral ID. Please try again.');
};

const createUser = async (input: CreateUserInput): Promise<UserDocument> => {
  // Normalize blank email to `undefined` rather than `''`: email is optional with a
  // sparse unique index, and MongoDB's sparse index only skips documents where the
  // field is entirely absent - two users saved with email: '' would collide as
  // "duplicate emails" even though neither actually provided one.
  const email = input.email?.trim() || undefined;

  await assertUsernameAvailable(input.username);
  await assertPhoneNumberAvailable(input.phoneNumber);

  if (email) {
    await assertEmailAvailable(email);
  }

  const referralId = await generateUniqueReferralId();

  // Password hashing happens automatically via the User model's pre-save hook.
  return userRepository.create({
    ...input,
    email,
    referralId,
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    isVerified: false,
    loginAttempts: 0,
    joinDate: new Date(),
  });
};

const getUserById = async (userId: string): Promise<UserDocument> => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  return user;
};

const updateProfile = async (userId: string, input: UpdateProfileInput): Promise<UserDocument> => {
  const updates: UpdateProfileInput = {};

  if (input.fullName !== undefined) {
    updates.fullName = input.fullName;
  }

  if (input.phoneNumber !== undefined) {
    await assertPhoneNumberAvailable(input.phoneNumber, userId);
    updates.phoneNumber = input.phoneNumber;
  }

  if (input.profileImage !== undefined) {
    updates.profileImage = input.profileImage;
  }

  if (Object.keys(updates).length === 0) {
    return getUserById(userId);
  }

  const updated = await userRepository.updateById(userId, updates);

  if (!updated) {
    throw new NotFoundError('User not found.');
  }

  return updated;
};

// Server-generated public_id keyed by userId, so re-uploading an avatar overwrites
// the previous image in Cloudinary instead of accumulating orphaned files.
const updateProfileImage = async (
  userId: string,
  file: { buffer: Buffer; mimetype: string },
): Promise<UserDocument> => {
  const imageUrl = await uploadImage(file.buffer, file.mimetype, AVATAR_UPLOAD_FOLDER, userId);

  return updateProfile(userId, { profileImage: imageUrl });
};

const validateSponsorExists = async (referralId: string): Promise<UserDocument> => {
  const sponsor = await userRepository.findByReferralId(referralId);

  if (!sponsor) {
    throw new BusinessRuleError('Referral ID does not exist.');
  }

  if (sponsor.status !== AccountStatus.ACTIVE) {
    throw new BusinessRuleError('Referral ID does not belong to an active user.');
  }

  return sponsor;
};

export const userService = {
  createUser,
  getUserById,
  updateProfile,
  updateProfileImage,
  validateSponsorExists,
};
