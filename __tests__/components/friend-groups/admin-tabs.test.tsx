import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import AdminTabs from '../../../app/components/friend-groups/admin-tabs';
import { renderWithTheme } from '../../utils/test-utils';
import { createMockRouter, createMockSearchParams } from '../../mocks/next-navigation.mocks';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

const standingsContent = <div>Standings Content</div>;
const historyContent = <div>History Content</div>;
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
    vi.mocked(usePathname).mockReturnValue('/test-group');
  });

  describe('Tab visibility', () => {
    it('always shows Clasificación and Historial tabs for non-admin', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          standingsContent={standingsContent}
          historyContent={historyContent}
        />
      );

      expect(screen.getByRole('tab', { name: /Clasificación/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Historial/i })).toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /Administración/i })).not.toBeInTheDocument();
    });

    it('shows all three tabs for admin', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          standingsContent={standingsContent}
          historyContent={historyContent}
          adminContent={adminContent}
        />
      );

      expect(screen.getByRole('tab', { name: /Clasificación/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Historial/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Administración/i })).toBeInTheDocument();
    });
  });

  describe('Default tab selection', () => {
    it('defaults to Clasificación tab when no URL param', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          standingsContent={standingsContent}
          historyContent={historyContent}
        />
      );

      expect(screen.getByRole('tab', { name: /Clasificación/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('defaults to Historial tab when URL has ?tab=history', () => {
      mockSearchParams = createMockSearchParams({ tab: 'history' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          standingsContent={standingsContent}
          historyContent={historyContent}
        />
      );

      expect(screen.getByRole('tab', { name: /Historial/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('defaults to Administración tab when URL has ?tab=admin and isAdmin=true', () => {
      mockSearchParams = createMockSearchParams({ tab: 'admin' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          standingsContent={standingsContent}
          historyContent={historyContent}
          adminContent={adminContent}
        />
      );

      expect(screen.getByRole('tab', { name: /Administración/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('ignores ?tab=admin when non-admin, falls back to standings', () => {
      mockSearchParams = createMockSearchParams({ tab: 'admin' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          standingsContent={standingsContent}
          historyContent={historyContent}
        />
      );

      expect(screen.getByRole('tab', { name: /Clasificación/i })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Tab content', () => {
    it('shows standings content on Clasificación tab by default', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          standingsContent={standingsContent}
          historyContent={historyContent}
        />
      );

      expect(screen.getByText('Standings Content')).toBeVisible();
    });

    it('shows history content after clicking Historial tab', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          standingsContent={standingsContent}
          historyContent={historyContent}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /Historial/i }));
      expect(screen.getByText('History Content')).toBeVisible();
    });

    it('shows admin content after clicking Administración tab', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          standingsContent={standingsContent}
          historyContent={historyContent}
          adminContent={adminContent}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /Administración/i }));
      expect(screen.getByText('Admin Content')).toBeVisible();
    });
  });

  describe('URL sync', () => {
    it('clicking Historial updates URL to ?tab=history', () => {

      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          standingsContent={standingsContent}
          historyContent={historyContent}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /Historial/i }));
      expect(mockRouter.replace).toHaveBeenCalledWith('/test-group?tab=history', { scroll: false });
    });

    it('clicking Administración updates URL to ?tab=admin', () => {

      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          standingsContent={standingsContent}
          historyContent={historyContent}
          adminContent={adminContent}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /Administración/i }));
      expect(mockRouter.replace).toHaveBeenCalledWith('/test-group?tab=admin', { scroll: false });
    });

    it('clicking Clasificación clears URL param', () => {

      mockSearchParams = createMockSearchParams({ tab: 'history' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      renderWithTheme(
        <AdminTabs
          isAdmin={false}
          standingsContent={standingsContent}
          historyContent={historyContent}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /Clasificación/i }));
      expect(mockRouter.replace).toHaveBeenCalledWith('/test-group', { scroll: false });
    });
  });

  describe('Badge with pending request count', () => {
    it('shows badge on Admin tab when pendingRequestCount > 0', () => {
      renderWithTheme(
        <AdminTabs
          isAdmin={true}
          standingsContent={standingsContent}
          historyContent={historyContent}
          adminContent={adminContent}
          pendingRequestCount={3}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('does not show numeric badge when pendingRequestCount is 0', () => {
      const { container } = renderWithTheme(
        <AdminTabs
          isAdmin={true}
          standingsContent={standingsContent}
          historyContent={historyContent}
          adminContent={adminContent}
          pendingRequestCount={0}
        />
      );

      const badge = container.querySelector('.MuiBadge-badge');
      expect(badge).toHaveClass('MuiBadge-invisible');
    });
  });
});
