import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserSettingsDialog from '../../app/components/auth/user-settings-dialog';
import { SessionProvider } from 'next-auth/react';

// Mock session
const mockSession = {
  user: {
    id: 'test-user',
    name: 'Test User',
    nickname: 'TestNick',
    email: 'test@example.com'
  },
  expires: '2024-12-31'
};

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: mockSession,
    update: vi.fn()
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock user actions
vi.mock('../../app/actions/user-actions', () => ({
  updateNickname: vi.fn()
}));

// Mock notification utils
vi.mock('../../app/utils/notifications-utils', () => ({
  isNotificationSupported: () => true,
  checkExistingSubscription: () => Promise.resolve(false),
  subscribeToNotifications: vi.fn(),
  unsubscribeFromNotifications: vi.fn()
}));

describe('Deprecated Props Fix', () => {
  it('should render UserSettingsDialog with slotProps instead of PaperProps', () => {
    render(
      <SessionProvider session={mockSession}>
        <UserSettingsDialog open={true} onClose={() => {}} />
      </SessionProvider>
    );

    // Verify the dialog is rendered
    expect(screen.getByText('Configuracion de Usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Apodo')).toBeInTheDocument();
    expect(screen.getByText('Recibir Notificationes')).toBeInTheDocument();
  });
});
