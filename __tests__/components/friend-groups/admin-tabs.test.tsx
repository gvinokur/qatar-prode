import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminTabs from '../../../app/components/friend-groups/admin-tabs';
import { renderWithTheme } from '../../utils/test-utils';
import { createMockRouter, createMockSearchParams } from '../../mocks/next-navigation.mocks';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

const leaderboardContent = <div>Leaderboard Content</div>;
const adminContent = <div>Admin Content</div>;

describe('AdminTabs', () => {
  let mockRouter: ReturnType<typeof createMockRouter>;
  let mockSearchParams: ReturnType<typeof createMockSearchParams>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter = createMockRouter();
    mockSearchParams = createMockSearchParams();
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);
  });

  describe('Non-admin mode (isAdmin=false)', () => {
    it('shows leaderboard content without tabs', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      expect(screen.getByText('Leaderboard Content')).toBeInTheDocument();
      expect(screen.queryByText('Tabla de Posiciones')).not.toBeInTheDocument();
      expect(screen.queryByText('Administración')).not.toBeInTheDocument();
    });

    it('does not render tab UI elements when not admin', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    it('ignores ?tab=admin URL param when not admin', () => {
      mockSearchParams = createMockSearchParams({ tab: 'admin' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      // Should still show leaderboard content, not admin content
      expect(screen.getByText('Leaderboard Content')).toBeInTheDocument();
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });
  });

  describe('Admin mode (isAdmin=true)', () => {
    it('shows both Leaderboard and Admin tab labels', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      expect(screen.getByText('Tabla de Posiciones')).toBeInTheDocument();
      expect(screen.getByText('Administración')).toBeInTheDocument();
    });

    it('defaults to leaderboard tab when no URL param is present', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      const leaderboardTab = screen.getByRole('tab', { name: /Tabla de Posiciones/i });
      expect(leaderboardTab).toHaveAttribute('aria-selected', 'true');

      const adminTab = screen.getByRole('tab', { name: /Administración/i });
      expect(adminTab).toHaveAttribute('aria-selected', 'false');
    });

    it('starts on admin tab when URL has ?tab=admin', () => {
      mockSearchParams = createMockSearchParams({ tab: 'admin' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      const adminTab = screen.getByRole('tab', { name: /Administración/i });
      expect(adminTab).toHaveAttribute('aria-selected', 'true');

      const leaderboardTab = screen.getByRole('tab', { name: /Tabla de Posiciones/i });
      expect(leaderboardTab).toHaveAttribute('aria-selected', 'false');
    });

    it('shows leaderboard content in the leaderboard tab by default', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      // The active tab panel should be visible
      expect(screen.getByText('Leaderboard Content')).toBeVisible();
    });

    it('clicking admin tab calls router.replace with ?tab=admin', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/test-group' },
        writable: true,
      });

      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      const adminTab = screen.getByRole('tab', { name: /Administración/i });
      fireEvent.click(adminTab);

      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/test-group?tab=admin',
        { scroll: false }
      );
    });

    it('clicking leaderboard tab calls router.replace without ?tab param', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/test-group' },
        writable: true,
      });

      mockSearchParams = createMockSearchParams({ tab: 'admin' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      const leaderboardTab = screen.getByRole('tab', { name: /Tabla de Posiciones/i });
      fireEvent.click(leaderboardTab);

      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/test-group',
        { scroll: false }
      );
    });

    it('shows admin content after clicking admin tab', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      const adminTab = screen.getByRole('tab', { name: /Administración/i });
      fireEvent.click(adminTab);

      expect(screen.getByText('Admin Content')).toBeVisible();
    });

    it('shows admin content when starting on admin tab from URL', () => {
      mockSearchParams = createMockSearchParams({ tab: 'admin' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      expect(screen.getByText('Admin Content')).toBeVisible();
    });
  });

  describe('Badge with pending request count', () => {
    it('shows Badge with pendingRequestCount on the Admin tab when count > 0', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
          pendingRequestCount={3}
        />
      );

      // The badge content should be visible
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('does not render a visible badge when pendingRequestCount is 0', () => {
      const { container } = renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
          pendingRequestCount={0}
        />
      );

      // MUI Badge renders the element in the DOM but applies MuiBadge-invisible to hide it
      const badge = container.querySelector('.MuiBadge-badge');
      expect(badge).toHaveClass('MuiBadge-invisible');
    });

    it('does not render a badge when pendingRequestCount is not provided', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      // No numeric badge content expected
      expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
    });

    it('does not show badge in non-admin mode even with pendingRequestCount', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
          pendingRequestCount={5}
        />
      );

      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });
  });

  describe('useEffect: syncs tab when searchParams change', () => {
    it('switches to admin tab when searchParams change to ?tab=admin', () => {
      const { rerenderWithTheme } = renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      // Initially on leaderboard tab
      expect(screen.getByRole('tab', { name: /Tabla de Posiciones/i })).toHaveAttribute('aria-selected', 'true');

      // Simulate searchParams changing to ?tab=admin
      const newSearchParams = createMockSearchParams({ tab: 'admin' });
      vi.mocked(useSearchParams).mockReturnValue(newSearchParams);

      rerenderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      expect(screen.getByRole('tab', { name: /Administración/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('switches back to leaderboard tab when searchParams change to no tab param', () => {
      mockSearchParams = createMockSearchParams({ tab: 'admin' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      const { rerenderWithTheme } = renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      // Initially on admin tab
      expect(screen.getByRole('tab', { name: /Administración/i })).toHaveAttribute('aria-selected', 'true');

      // Simulate searchParams changing (e.g., back button)
      const newSearchParams = createMockSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(newSearchParams);

      rerenderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
        />
      );

      expect(screen.getByRole('tab', { name: /Tabla de Posiciones/i })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('defaultTab prop', () => {
    it('URL param takes precedence over defaultTab for initial tab selection', () => {
      // When ?tab=admin is in URL, admin tab is selected regardless of defaultTab
      mockSearchParams = createMockSearchParams({ tab: 'admin' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
          defaultTab="leaderboard"
        />
      );

      const adminTab = screen.getByRole('tab', { name: /Administración/i });
      expect(adminTab).toHaveAttribute('aria-selected', 'true');
    });

    it('does not use defaultTab="admin" when isAdmin=false', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          leaderboardContent={leaderboardContent}
          adminContent={adminContent}
          defaultTab="admin"
        />
      );

      // Non-admin: no tabs shown at all
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(screen.getByText('Leaderboard Content')).toBeInTheDocument();
    });
  });
});
