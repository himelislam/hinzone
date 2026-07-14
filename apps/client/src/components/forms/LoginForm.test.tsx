import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AccountStatus, UserRole } from 'shared-types';
import type { AuthResponse } from 'shared-types';

import { authService } from '@/services/auth.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import LoginForm from './LoginForm';

vi.mock('@/services/auth.service');

const mockedAuthService = vi.mocked(authService);

const FAKE_AUTH_RESPONSE: AuthResponse = {
  user: {
    id: '1',
    fullName: 'Test User',
    username: 'testuser',
    phoneNumber: '01712345678',
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    referralId: 'REF100001',
    isVerified: false,
    loginAttempts: 0,
    accountLockedUntil: null,
    joinDate: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  tokens: { accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 900 },
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('LoginForm', () => {
  it('submits valid credentials', async () => {
    const user = userEvent.setup();
    mockedAuthService.login.mockResolvedValue(FAKE_AUTH_RESPONSE);

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/username, phone number, or email/i), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'TestPass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // TanStack Query v5 calls mutationFn with a second (internal) context
      // argument alongside the variables - only the first argument is ours to
      // assert on.
      expect(mockedAuthService.login).toHaveBeenCalledWith(
        { login: 'testuser', password: 'TestPass123!' },
        expect.anything(),
      );
    });
  });

  it('shows a client-side validation error and never calls the API when a field is empty', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/username, phone number, or email is required/i),
    ).toBeInTheDocument();
    expect(mockedAuthService.login).not.toHaveBeenCalled();
  });

  it('shows the server error message when the API call fails', async () => {
    const user = userEvent.setup();
    mockedAuthService.login.mockRejectedValue(new Error('Invalid credentials.'));

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/username, phone number, or email/i), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'WrongPass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid credentials.')).toBeInTheDocument();
  });
});
