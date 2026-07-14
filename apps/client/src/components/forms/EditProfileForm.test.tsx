import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AccountStatus, UserRole } from 'shared-types';
import type { User } from 'shared-types';

import { usersService } from '@/services/users.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import EditProfileForm from './EditProfileForm';

vi.mock('@/services/users.service');

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();

  return { ...actual, useNavigate: (): typeof navigateMock => navigateMock };
});

const mockedUsersService = vi.mocked(usersService);

const TEST_USER: User = {
  id: '1',
  fullName: 'Jane Doe',
  username: 'janedoe',
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
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('EditProfileForm', () => {
  it('pre-fills the form with the current profile values', () => {
    renderWithProviders(<EditProfileForm user={TEST_USER} />);

    expect(screen.getByLabelText(/full name/i)).toHaveValue('Jane Doe');
    expect(screen.getByLabelText(/phone number/i)).toHaveValue('01712345678');
  });

  it('submits the updated fields and navigates back to the profile page on success', async () => {
    const user = userEvent.setup();
    mockedUsersService.updateProfile.mockResolvedValue({
      ...TEST_USER,
      fullName: 'Jane Updated',
    });

    renderWithProviders(<EditProfileForm user={TEST_USER} />);

    const fullNameInput = screen.getByLabelText(/full name/i);
    await user.clear(fullNameInput);
    await user.type(fullNameInput, 'Jane Updated');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedUsersService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: 'Jane Updated', phoneNumber: '01712345678' }),
        expect.anything(),
      );
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/profile');
    });
  });

  it('shows the server error message when the update fails', async () => {
    const user = userEvent.setup();
    mockedUsersService.updateProfile.mockRejectedValue(
      new Error('Phone number is already registered.'),
    );

    renderWithProviders(<EditProfileForm user={TEST_USER} />);

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Phone number is already registered.')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
