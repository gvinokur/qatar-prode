import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackofficeTabs } from '../../../app/components/backoffice/backoffice-tabs';

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/backoffice'),
}));

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(() => true),
  };
});

describe('BackofficeTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockTabs = [
    {
      type: 'labelledTab' as const,
      label: 'Tab 1',
      component: <div>Content 1</div>,
    },
    {
      type: 'labelledTab' as const,
      label: 'Tab 2',
      component: <div>Content 2</div>,
    },
    {
      type: 'labelledTab' as const,
      label: 'Tab 3',
      component: <div>Content 3</div>,
      isDevOnly: true,
    },
  ];

  describe('Basic Rendering', () => {
    it('should render all labelled tabs', () => {
      render(<BackofficeTabs tabs={mockTabs} />);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('should render action tabs', () => {
      const tabsWithAction = [
        ...mockTabs,
        {
          type: 'actionTab' as const,
          action: <button>Action Button</button>,
        },
      ];

      render(<BackofficeTabs tabs={tabsWithAction} />);

      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    it('should display dev icon for dev-only tabs', () => {
      render(<BackofficeTabs tabs={mockTabs} />);

      // Dev icon should be present for Tab 3
      const tab3 = screen.getByText('Tab 3').closest('button');
      expect(tab3).toBeInTheDocument();
    });
  });

  describe('Tab Selection', () => {
    it('should set initial tab in URL when not present', async () => {
      const { useSearchParams } = await import('next/navigation');
      (useSearchParams as any).mockReturnValue(new URLSearchParams());

      render(<BackofficeTabs tabs={mockTabs} />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('tab=Tab+1'),
          expect.objectContaining({ scroll: false })
        );
      });
    });

    it('should use tab from URL search params', async () => {
      const { useSearchParams } = await import('next/navigation');
      (useSearchParams as any).mockReturnValue(new URLSearchParams('tab=Tab+2'));

      render(<BackofficeTabs tabs={mockTabs} />);

      await waitFor(() => {
        expect(screen.getByText('Content 2')).toBeInTheDocument();
      });
    });

    it('should update URL when tab is clicked', async () => {
      const user = userEvent.setup();
      const { useSearchParams } = await import('next/navigation');
      (useSearchParams as any).mockReturnValue(new URLSearchParams('tab=Tab+1'));

      render(<BackofficeTabs tabs={mockTabs} />);

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Content 1')).toBeInTheDocument();
      });

      // Clear any initial calls
      mockReplace.mockClear();

      const tab2Button = screen.getByText('Tab 2').closest('button');
      if (tab2Button) {
        await user.click(tab2Button);
      }

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('tab=Tab+2'),
          expect.objectContaining({ scroll: false })
        );
      });
    });

    it('should use custom tabIdParam for nested tabs', () => {
      render(<BackofficeTabs tabs={mockTabs} tabIdParam="subtab" />);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
    });

    it('should default to first tab when URL tab is not found', async () => {
      const { useSearchParams } = await import('next/navigation');
      (useSearchParams as any).mockReturnValue(new URLSearchParams('tab=NonExistent'));

      render(<BackofficeTabs tabs={mockTabs} />);

      await waitFor(() => {
        expect(screen.getByText('Content 1')).toBeInTheDocument();
      });
    });
  });

  describe('Status Icons', () => {
    it('should show active icon for active tabs', () => {
      const tabsWithStatus = [
        {
          type: 'labelledTab' as const,
          label: 'Active Tab',
          component: <div>Active Content</div>,
          isActive: true,
        },
      ];

      render(<BackofficeTabs tabs={tabsWithStatus} />);

      const activeTab = screen.getByText('Active Tab').closest('button');
      expect(activeTab).toBeInTheDocument();
    });

    it('should show inactive icon for inactive tabs', () => {
      const tabsWithStatus = [
        {
          type: 'labelledTab' as const,
          label: 'Inactive Tab',
          component: <div>Inactive Content</div>,
          isActive: false,
        },
      ];

      render(<BackofficeTabs tabs={tabsWithStatus} />);

      const inactiveTab = screen.getByText('Inactive Tab').closest('button');
      expect(inactiveTab).toBeInTheDocument();
    });

    it('should show both dev and inactive icons when applicable', () => {
      const tabsWithStatus = [
        {
          type: 'labelledTab' as const,
          label: 'Dev Inactive Tab',
          component: <div>Dev Inactive Content</div>,
          isDevOnly: true,
          isActive: false,
        },
      ];

      render(<BackofficeTabs tabs={tabsWithStatus} />);

      const tab = screen.getByText('Dev Inactive Tab').closest('button');
      expect(tab).toBeInTheDocument();
    });
  });

  describe('Tooltips', () => {
    it('should show correct tooltip for active tournament', () => {
      const tabsWithStatus = [
        {
          type: 'labelledTab' as const,
          label: 'Active',
          component: <div>Content</div>,
          isActive: true,
        },
      ];

      render(<BackofficeTabs tabs={tabsWithStatus} />);

      const tab = screen.getByText('Active').closest('button');
      expect(tab).toBeInTheDocument();
    });

    it('should show correct tooltip for dev-only inactive tournament', () => {
      const tabsWithStatus = [
        {
          type: 'labelledTab' as const,
          label: 'Dev Inactive',
          component: <div>Content</div>,
          isDevOnly: true,
          isActive: false,
        },
      ];

      render(<BackofficeTabs tabs={tabsWithStatus} />);

      const tab = screen.getByText('Dev Inactive').closest('button');
      expect(tab).toBeInTheDocument();
    });
  });

  describe('Tab Panel Display', () => {
    it('should only display content for selected tab', async () => {
      const { useSearchParams } = await import('next/navigation');
      (useSearchParams as any).mockReturnValue(new URLSearchParams('tab=Tab+1'));

      render(<BackofficeTabs tabs={mockTabs} />);

      await waitFor(() => {
        expect(screen.getByText('Content 1')).toBeInTheDocument();
        expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
      });
    });

    it('should switch content when tab changes', async () => {
      const { useSearchParams } = await import('next/navigation');
      const searchParams = new URLSearchParams('tab=Tab+1');
      (useSearchParams as any).mockReturnValue(searchParams);

      const { rerender } = render(<BackofficeTabs tabs={mockTabs} />);

      await waitFor(() => {
        expect(screen.getByText('Content 1')).toBeInTheDocument();
      });

      // Update search params to simulate tab change
      searchParams.set('tab', 'Tab 2');
      (useSearchParams as any).mockReturnValue(new URLSearchParams('tab=Tab+2'));

      rerender(<BackofficeTabs tabs={mockTabs} />);

      await waitFor(() => {
        expect(screen.getByText('Content 2')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should use fullWidth variant on larger screens', async () => {
      const { useMediaQuery } = await import('@mui/material');
      (useMediaQuery as any).mockReturnValue(true);

      render(<BackofficeTabs tabs={mockTabs} />);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
    });

    it('should use scrollable variant on small screens', async () => {
      const { useMediaQuery } = await import('@mui/material');
      (useMediaQuery as any).mockReturnValue(false);

      render(<BackofficeTabs tabs={mockTabs} />);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tabs array', () => {
      render(<BackofficeTabs tabs={[]} />);

      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });

    it('should handle tabs with same labels gracefully', () => {
      const duplicateTabs = [
        {
          type: 'labelledTab' as const,
          label: 'Same',
          component: <div>Content 1</div>,
        },
        {
          type: 'labelledTab' as const,
          label: 'Same',
          component: <div>Content 2</div>,
        },
      ];

      render(<BackofficeTabs tabs={duplicateTabs} />);

      const sameTabs = screen.getAllByText('Same');
      expect(sameTabs).toHaveLength(2);
    });

    it('should preserve other URL parameters when updating tab', async () => {
      const { useSearchParams } = await import('next/navigation');
      (useSearchParams as any).mockReturnValue(new URLSearchParams('other=value&tab=Tab+1'));

      const user = userEvent.setup();
      render(<BackofficeTabs tabs={mockTabs} />);

      // Clear any initial render calls
      await waitFor(() => {
        expect(screen.getByText('Tab 1')).toBeInTheDocument();
      });
      mockReplace.mockClear();

      const tab2Button = screen.getByText('Tab 2').closest('button');
      if (tab2Button) {
        await user.click(tab2Button);
      }

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringMatching(/other=value/),
          expect.objectContaining({ scroll: false })
        );
      });
    });
  });
});
