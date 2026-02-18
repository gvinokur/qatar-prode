import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import UserSettingsDialog from '../../../app/components/auth/user-settings-dialog';
import { updateNickname } from '../../../app/actions/user-actions';
import {
  checkExistingSubscription,
  isNotificationSupported,
  subscribeToNotifications,
  unsubscribeFromNotifications
} from '../../../app/utils/notifications-utils';
import { setupTestMocks } from '../../mocks/setup-helpers';
import { createAuthenticatedSessionValue } from '../../mocks/next-auth.mocks';
import { createMockTranslations } from '../../utils/mock-translations';
import * as intl from 'next-intl';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => 'es'),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock user actions
vi.mock('../../../app/actions/user-actions', () => ({
  updateNickname: vi.fn(),
}));

// Mock notification utils
vi.mock('../../../app/utils/notifications-utils', () => ({
  isNotificationSupported: vi.fn(),
  checkExistingSubscription: vi.fn(),
  subscribeToNotifications: vi.fn(),
  unsubscribeFromNotifications: vi.fn(),
}));

describe('UserSettingsDialog', () => {
  const mockOnClose = vi.fn();

  let mockSessionValue: ReturnType<typeof setupTestMocks>['session'];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup i18n mocks
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('auth')
    );

    // Setup session mock with helper
    const mocks = setupTestMocks({
      session: true,
      sessionDefaults: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
    });

    mockSessionValue = mocks.session!;
    // Add nickname to the session (User type has nickname field)
    if (mockSessionValue.data?.user) {
      (mockSessionValue.data.user as any).nickname = 'testuser';
    }

    vi.mocked(isNotificationSupported).mockReturnValue(true);
    vi.mocked(checkExistingSubscription).mockResolvedValue(false);
    vi.mocked(updateNickname).mockResolvedValue(undefined);
    vi.mocked(subscribeToNotifications).mockResolvedValue(undefined);
    vi.mocked(unsubscribeFromNotifications).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders dialog when open prop is true', () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('[userSettings.title]')).toBeInTheDocument();
    });

    it('does not render dialog when open prop is false', () => {
      render(<UserSettingsDialog open={false} onClose={mockOnClose} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders nickname text field with user nickname as default value', () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      const nicknameField = screen.getByRole('textbox', { name: '[userSettings.nickname.label]' });
      expect(nicknameField).toHaveValue('testuser');
    });

    it('renders nickname text field with user name as fallback when nickname is not available', () => {
      const sessionValueWithoutNickname = createAuthenticatedSessionValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      });

      vi.mocked(useSession).mockReturnValue(sessionValueWithoutNickname);

      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);

      const nicknameField = screen.getByRole('textbox', { name: '[userSettings.nickname.label]' });
      expect(nicknameField).toHaveValue('Test User');
    });

    it('renders empty nickname field when neither nickname nor name is available', () => {
      const sessionValueWithoutName = createAuthenticatedSessionValue({
        id: '1',
        email: 'test@example.com',
      });
      // Remove name from user
      if (sessionValueWithoutName.data?.user) {
        delete (sessionValueWithoutName.data.user as any).name;
      }

      vi.mocked(useSession).mockReturnValue(sessionValueWithoutName);
      
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      const nicknameField = screen.getByRole('textbox', { name: '[userSettings.nickname.label]' });
      expect(nicknameField).toHaveValue('');
    });

    it('renders notifications switch', () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('switch', { name: '[userSettings.notifications.label]' })).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('button', { name: '[nicknameSetup.buttons.cancel]' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' })).toBeInTheDocument();
    });
  });

  describe('notification support', () => {
    it('enables notifications switch when notifications are supported', async () => {
      (isNotificationSupported as any).mockReturnValue(true);
      
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByRole('switch', { name: '[userSettings.notifications.label]' })).not.toBeDisabled();
      });
    });

    it('disables notifications switch when notifications are not supported', async () => {
      (isNotificationSupported as any).mockReturnValue(false);
      
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByRole('switch', { name: '[userSettings.notifications.label]' })).toBeDisabled();
      });
    });

    it('sets notifications switch to checked when existing subscription exists', async () => {
      (checkExistingSubscription as any).mockResolvedValue(true);
      
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByRole('switch', { name: '[userSettings.notifications.label]' })).toBeChecked();
      });
    });

    it('sets notifications switch to unchecked when no existing subscription exists', async () => {
      (checkExistingSubscription as any).mockResolvedValue(false);
      
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByRole('switch', { name: '[userSettings.notifications.label]' })).not.toBeChecked();
      });
    });
  });

  describe('user interactions', () => {
    it('updates nickname field when user types', async () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      const nicknameField = screen.getByRole('textbox', { name: '[userSettings.nickname.label]' });
      
      await act(async () => {
        fireEvent.change(nicknameField, { target: { value: 'newuser' } });
      });
      
      expect(nicknameField).toHaveValue('newuser');
    });

    it('toggles notifications switch when clicked', async () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      const notificationsSwitch = screen.getByRole('switch', { name: '[userSettings.notifications.label]' });
      
      await waitFor(() => {
        expect(notificationsSwitch).not.toBeChecked();
      });
      
      await act(async () => {
        fireEvent.click(notificationsSwitch);
      });
      
      expect(notificationsSwitch).toBeChecked();
    });

    it('closes dialog when cancel button is clicked', async () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '[nicknameSetup.buttons.cancel]' }));
      });
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    it('submits form with updated nickname and notifications enabled', async () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      // Update nickname
      const nicknameField = screen.getByRole('textbox', { name: '[userSettings.nickname.label]' });
      await act(async () => {
        fireEvent.change(nicknameField, { target: { value: 'newuser' } });
      });
      
      // Enable notifications
      const notificationsSwitch = screen.getByRole('switch', { name: '[userSettings.notifications.label]' });
      await act(async () => {
        fireEvent.click(notificationsSwitch);
      });
      
      // Submit form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' }));
      });
      
      await waitFor(() => {
        expect(updateNickname).toHaveBeenCalledWith('newuser', 'es');
      });
      
      expect(mockSessionValue.update).toHaveBeenCalledWith({
        name: 'newuser',
        nickname: 'newuser',
      });
      
      expect(subscribeToNotifications).toHaveBeenCalled();
      expect(unsubscribeFromNotifications).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('submits form with updated nickname and notifications disabled', async () => {
      (checkExistingSubscription as any).mockResolvedValue(true);
      
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      // Update nickname
      const nicknameField = screen.getByRole('textbox', { name: '[userSettings.nickname.label]' });
      await act(async () => {
        fireEvent.change(nicknameField, { target: { value: 'newuser' } });
      });
      
      // Wait for notifications to be initially enabled
      await waitFor(() => {
        expect(screen.getByRole('switch', { name: '[userSettings.notifications.label]' })).toBeChecked();
      });
      
      // Disable notifications
      const notificationsSwitch = screen.getByRole('switch', { name: '[userSettings.notifications.label]' });
      await act(async () => {
        fireEvent.click(notificationsSwitch);
      });
      
      // Submit form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' }));
      });
      
      await waitFor(() => {
        expect(updateNickname).toHaveBeenCalledWith('newuser', 'es');
      });
      
      expect(mockSessionValue.update).toHaveBeenCalledWith({
        name: 'newuser',
        nickname: 'newuser',
      });
      
      expect(unsubscribeFromNotifications).toHaveBeenCalled();
      expect(subscribeToNotifications).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles checkExistingSubscription failure gracefully', async () => {
      (checkExistingSubscription as any).mockRejectedValue(new Error('Failed to check subscription'));
      
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      // Should still render the component even if checking existing subscription fails
      expect(screen.getByRole('switch', { name: '[userSettings.notifications.label]' })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: '[userSettings.notifications.label]' })).not.toBeChecked();
    });
  });

  describe('accessibility', () => {
    it('has proper form structure', () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog.tagName).toBe('FORM');
    });

    it('has proper button types', () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });
      expect(saveButton).toHaveAttribute('type', 'submit');
    });

    it('has proper labels for form elements', () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('textbox', { name: '[userSettings.nickname.label]' })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: '[userSettings.notifications.label]' })).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles null session gracefully', () => {
      const nullSessionValue = {
        data: null,
        status: 'unauthenticated' as const,
        update: vi.fn(),
      };

      vi.mocked(useSession).mockReturnValue(nullSessionValue);

      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);

      const nicknameField = screen.getByRole('textbox', { name: '[userSettings.nickname.label]' });
      expect(nicknameField).toHaveValue('');
    });

    it('handles session with empty user object gracefully', () => {
      const emptyUserSessionValue = {
        data: { user: {} } as any,
        status: 'authenticated' as const,
        update: vi.fn(),
      };

      vi.mocked(useSession).mockReturnValue(emptyUserSessionValue);

      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);

      const nicknameField = screen.getByRole('textbox', { name: '[userSettings.nickname.label]' });
      expect(nicknameField).toHaveValue('');
    });
  });

  describe('component lifecycle', () => {
    it('initializes form with correct default values on mount', () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      const nicknameField = screen.getByRole('textbox', { name: '[userSettings.nickname.label]' });
      expect(nicknameField).toHaveValue('testuser');
      
      const notificationsSwitch = screen.getByRole('switch', { name: '[userSettings.notifications.label]' });
      expect(notificationsSwitch).not.toBeChecked();
    });

    it('calls checkExistingSubscription on mount', async () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(checkExistingSubscription).toHaveBeenCalled();
      });
    });

    it('calls isNotificationSupported on mount', () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      expect(isNotificationSupported).toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('allows submission with empty nickname', async () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      const nicknameField = screen.getByRole('textbox', { name: '[userSettings.nickname.label]' });
      await act(async () => {
        fireEvent.change(nicknameField, { target: { value: '' } });
      });
      
      expect(nicknameField).toHaveValue('');
      
      // Should still allow form submission
      const submitButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });
      expect(submitButton).not.toBeDisabled();
    });

    it('preserves form values when switching between notifications states', async () => {
      render(<UserSettingsDialog open={true} onClose={mockOnClose} />);
      
      const nicknameField = screen.getByRole('textbox', { name: '[userSettings.nickname.label]' });
      await act(async () => {
        fireEvent.change(nicknameField, { target: { value: 'newuser' } });
      });
      
      const notificationsSwitch = screen.getByRole('switch', { name: '[userSettings.notifications.label]' });
      await act(async () => {
        fireEvent.click(notificationsSwitch);
      });
      
      await act(async () => {
        fireEvent.click(notificationsSwitch);
      });
      
      // Nickname should still be preserved
      expect(nicknameField).toHaveValue('newuser');
    });
  });
});
