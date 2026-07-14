import { AccountStatus, UserRole } from 'shared-types';

import { BusinessRuleError, NotFoundError, ValidationError } from '@/shared/errors';
import { uploadImage } from '@/shared/helpers/upload-image';

import { userRepository } from './users.repository';
import { userService } from './users.service';
import type { UserDocument } from './users.types';

jest.mock('./users.repository');
jest.mock('@/shared/helpers/upload-image');

const mockedRepository = jest.mocked(userRepository);
const mockedUploadImage = jest.mocked(uploadImage);

const buildUser = (overrides: Partial<UserDocument> = {}): UserDocument =>
  ({
    id: '507f1f77bcf86cd799439011',
    _id: '507f1f77bcf86cd799439011',
    fullName: 'Test User',
    username: 'testuser',
    phoneNumber: '01712345678',
    status: AccountStatus.ACTIVE,
    role: UserRole.USER,
    ...overrides,
  }) as unknown as UserDocument;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createUser', () => {
  it('normalizes a blank email to undefined and creates the user', async () => {
    mockedRepository.findByUsername.mockResolvedValue(null);
    mockedRepository.findByPhoneNumber.mockResolvedValue(null);
    mockedRepository.findByReferralId.mockResolvedValue(null);
    mockedRepository.create.mockResolvedValue(buildUser());

    await userService.createUser({
      fullName: 'Test User',
      username: 'testuser',
      email: '   ',
      phoneNumber: '01712345678',
      password: 'TestPass123!',
    });

    expect(mockedRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: undefined }),
    );
  });

  it('rejects a taken username before checking anything else', async () => {
    mockedRepository.findByUsername.mockResolvedValue(buildUser());

    await expect(
      userService.createUser({
        fullName: 'Test User',
        username: 'taken',
        phoneNumber: '01712345678',
        password: 'TestPass123!',
      }),
    ).rejects.toThrow(ValidationError);

    expect(mockedRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a taken phone number', async () => {
    mockedRepository.findByUsername.mockResolvedValue(null);
    mockedRepository.findByPhoneNumber.mockResolvedValue(buildUser());

    await expect(
      userService.createUser({
        fullName: 'Test User',
        username: 'testuser',
        phoneNumber: '01712345678',
        password: 'TestPass123!',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects a taken email when one is provided', async () => {
    mockedRepository.findByUsername.mockResolvedValue(null);
    mockedRepository.findByPhoneNumber.mockResolvedValue(null);
    mockedRepository.findByEmail.mockResolvedValue(buildUser());

    await expect(
      userService.createUser({
        fullName: 'Test User',
        username: 'testuser',
        email: 'taken@example.com',
        phoneNumber: '01712345678',
        password: 'TestPass123!',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws a BusinessRuleError when it cannot generate a unique referral ID', async () => {
    mockedRepository.findByUsername.mockResolvedValue(null);
    mockedRepository.findByPhoneNumber.mockResolvedValue(null);
    // Every candidate referral ID "already exists" - forces the retry loop to
    // exhaust MAX_REFERRAL_ID_ATTEMPTS.
    mockedRepository.findByReferralId.mockResolvedValue(buildUser());

    await expect(
      userService.createUser({
        fullName: 'Test User',
        username: 'testuser',
        phoneNumber: '01712345678',
        password: 'TestPass123!',
      }),
    ).rejects.toThrow(BusinessRuleError);

    expect(mockedRepository.create).not.toHaveBeenCalled();
  });

  it('creates the user with USER role, ACTIVE status, and zeroed login attempts', async () => {
    mockedRepository.findByUsername.mockResolvedValue(null);
    mockedRepository.findByPhoneNumber.mockResolvedValue(null);
    mockedRepository.findByReferralId.mockResolvedValue(null);
    mockedRepository.create.mockResolvedValue(buildUser());

    await userService.createUser({
      fullName: 'Test User',
      username: 'testuser',
      phoneNumber: '01712345678',
      password: 'TestPass123!',
    });

    expect(mockedRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        isVerified: false,
        loginAttempts: 0,
      }),
    );
  });
});

describe('getUserById', () => {
  it('returns the user when found', async () => {
    const user = buildUser();
    mockedRepository.findById.mockResolvedValue(user);

    await expect(userService.getUserById(user.id)).resolves.toBe(user);
  });

  it('throws NotFoundError when the user does not exist', async () => {
    mockedRepository.findById.mockResolvedValue(null);

    await expect(userService.getUserById('missing-id')).rejects.toThrow(NotFoundError);
  });
});

describe('updateProfile', () => {
  it('short-circuits to a plain read when no fields are provided', async () => {
    const user = buildUser();
    mockedRepository.findById.mockResolvedValue(user);

    await userService.updateProfile(user.id, {});

    expect(mockedRepository.updateById).not.toHaveBeenCalled();
    expect(mockedRepository.findById).toHaveBeenCalledWith(user.id);
  });

  it('updates fullName without any uniqueness check', async () => {
    const user = buildUser();
    mockedRepository.updateById.mockResolvedValue(user);

    await userService.updateProfile(user.id, { fullName: 'New Name' });

    expect(mockedRepository.findByPhoneNumber).not.toHaveBeenCalled();
    expect(mockedRepository.updateById).toHaveBeenCalledWith(user.id, { fullName: 'New Name' });
  });

  it('rejects a phone number already used by another account', async () => {
    const user = buildUser();
    const otherUser = buildUser({ id: 'another-id' });
    mockedRepository.findByPhoneNumber.mockResolvedValue(otherUser);

    await expect(
      userService.updateProfile(user.id, { phoneNumber: '01798765432' }),
    ).rejects.toThrow(ValidationError);

    expect(mockedRepository.updateById).not.toHaveBeenCalled();
  });

  it('allows keeping your own phone number unchanged (excludeUserId)', async () => {
    const user = buildUser();
    mockedRepository.findByPhoneNumber.mockResolvedValue(user);
    mockedRepository.updateById.mockResolvedValue(user);

    await userService.updateProfile(user.id, { phoneNumber: user.phoneNumber });

    expect(mockedRepository.updateById).toHaveBeenCalled();
  });

  it('throws NotFoundError if the user was deleted between the check and the update', async () => {
    const user = buildUser();
    mockedRepository.updateById.mockResolvedValue(null);

    await expect(userService.updateProfile(user.id, { fullName: 'New Name' })).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe('updateProfileImage', () => {
  it('uploads the file and stores the resulting URL on the profile', async () => {
    const user = buildUser();
    mockedUploadImage.mockResolvedValue('https://cloudinary.example.com/avatars/abc.jpg');
    mockedRepository.updateById.mockResolvedValue(user);

    await userService.updateProfileImage(user.id, {
      buffer: Buffer.from('fake-image'),
      mimetype: 'image/png',
    });

    expect(mockedUploadImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'image/png',
      'avatars',
      user.id,
    );
    expect(mockedRepository.updateById).toHaveBeenCalledWith(user.id, {
      profileImage: 'https://cloudinary.example.com/avatars/abc.jpg',
    });
  });
});

describe('validateSponsorExists', () => {
  it('returns the sponsor when it exists and is active', async () => {
    const sponsor = buildUser({ status: AccountStatus.ACTIVE });
    mockedRepository.findByReferralId.mockResolvedValue(sponsor);

    await expect(userService.validateSponsorExists('REF100001')).resolves.toBe(sponsor);
  });

  it('throws BusinessRuleError when the referral ID does not exist', async () => {
    mockedRepository.findByReferralId.mockResolvedValue(null);

    await expect(userService.validateSponsorExists('REF999999')).rejects.toThrow(BusinessRuleError);
  });

  it('throws BusinessRuleError when the sponsor is not active', async () => {
    const sponsor = buildUser({ status: AccountStatus.SUSPENDED });
    mockedRepository.findByReferralId.mockResolvedValue(sponsor);

    await expect(userService.validateSponsorExists('REF100001')).rejects.toThrow(BusinessRuleError);
  });
});
