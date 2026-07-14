import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AccountStatus, UserRole } from 'shared-types';
import type { AuthResponse } from 'shared-types';

import { authService } from '@/services/auth.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import RegistrationForm from './RegistrationForm';

vi.mock('@/services/auth.service');

const mockedAuthService = vi.mocked(authService);

const FAKE_AUTH_RESPONSE: AuthResponse = {
  user: {
    id: '1',
    fullName: 'Jane Doe',
    username: 'janedoe',
    phoneNumber: '01712345678',
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    referralId: 'REF100002',
    isVerified: false,
    loginAttempts: 0,
    accountLockedUntil: null,
    joinDate: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  tokens: { accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 900 },
};

const fillRequiredFields = async (
  user: ReturnType<typeof userEvent.setup>,
  overrides: { password?: string; confirmPassword?: string } = {},
): Promise<void> => {
  await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
  await user.type(screen.getByLabelText(/^username$/i), 'janedoe');
  await user.type(screen.getByLabelText(/phone number/i), '01712345678');
  await user.type(screen.getByLabelText('Password'), overrides.password ?? 'TestPass123!');
  await user.type(
    screen.getByLabelText(/confirm password/i),
    overrides.confirmPassword ?? overrides.password ?? 'TestPass123!',
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('RegistrationForm', () => {
  it('submits valid registration details, omitting empty optional fields', async () => {
    const user = userEvent.setup();
    mockedAuthService.register.mockResolvedValue(FAKE_AUTH_RESPONSE);

    renderWithProviders(<RegistrationForm />);
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockedAuthService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Jane Doe',
          username: 'janedoe',
          phoneNumber: '01712345678',
          password: 'TestPass123!',
          email: undefined,
          referrerId: undefined,
        }),
        expect.anything(),
      );
    });
  });

  it('shows a client-side validation error when passwords do not match', async () => {
    const user = userEvent.setup();

    renderWithProviders(<RegistrationForm />);
    await fillRequiredFields(user, { password: 'TestPass123!', confirmPassword: 'Different1!' });

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockedAuthService.register).not.toHaveBeenCalled();
  });

  it('shows the server error message when registration fails (e.g. duplicate username)', async () => {
    const user = userEvent.setup();
    mockedAuthService.register.mockRejectedValue(new Error('Username is already taken.'));

    renderWithProviders(<RegistrationForm />);
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Username is already taken.')).toBeInTheDocument();
  });
});
