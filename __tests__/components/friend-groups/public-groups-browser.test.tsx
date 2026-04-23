import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import PublicGroupsBrowser from '@/app/components/friend-groups/public-groups-browser';
import { renderWithTheme } from '../../utils/test-utils';
import { createMockRouter, createMockSearchParams } from '../../mocks/next-navigation.mocks';
import { requestToJoinGroup } from '@/app/actions/prode-group-join-request-actions';
import type { DiscoveryGroupData } from '@/app/components/tournament-page/tournament-group-card';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@/app/actions/prode-group-join-request-actions', () => ({
  requestToJoinGroup: vi.fn(),
}));

const mockRequestToJoinGroup = vi.mocked(requestToJoinGroup);

const makeGroup = (overrides: Partial<DiscoveryGroupData> = {}): DiscoveryGroupData => ({
  id: 'group-1',
  name: 'Test Group',
  description: 'A test group',
  is_public: true,
  owner: { id: 'owner-1', name: 'Test Owner' },
  memberCount: 5,
  userStatus: 'none',
  bettingEnabled: false,
  ...overrides,
});

const DISCOVER_PATH = '/es/tournaments/tournament-1/friend-groups/discover';

describe('PublicGroupsBrowser', () => {
  let mockRouter: ReturnType<typeof createMockRouter>;
  let mockSearchParams: ReturnType<typeof createMockSearchParams>;

  const defaultProps = {
    initialGroups: [makeGroup()],
    initialSearchTerm: '',
    initialPage: 1,
    totalPages: 1,
    totalCount: 1,
    tournamentId: 'tournament-1',
    currentUserId: 'user-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter = createMockRouter();
    mockSearchParams = createMockSearchParams();
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(usePathname).mockReturnValue(DISCOVER_PATH);
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);
    mockRequestToJoinGroup.mockResolvedValue({ success: true } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders the search input', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders group cards', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} />);
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    it('shows empty state when no groups and no search term', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} initialGroups={[]} totalCount={0} />);
      // ES: groups.discovery.noResults
      expect(screen.getByText('No se encontraron grupos públicos')).toBeInTheDocument();
    });

    it('shows search-specific empty state when searching with no results', () => {
      renderWithTheme(
        <PublicGroupsBrowser
          {...defaultProps}
          initialGroups={[]}
          totalCount={0}
          initialSearchTerm="nonexistent"
        />
      );
      // ES: groups.discovery.noResultsSearch
      expect(screen.getByText('No hay grupos que coincidan con "nonexistent"')).toBeInTheDocument();
    });

    it('renders multiple group cards', () => {
      const groups = [
        makeGroup({ id: 'g1', name: 'Group Alpha' }),
        makeGroup({ id: 'g2', name: 'Group Beta' }),
      ];
      renderWithTheme(
        <PublicGroupsBrowser {...defaultProps} initialGroups={groups} totalCount={2} />
      );
      expect(screen.getByText('Group Alpha')).toBeInTheDocument();
      expect(screen.getByText('Group Beta')).toBeInTheDocument();
    });

    it('syncs displayed groups when initialGroups prop changes', () => {
      const { rerenderWithTheme } = renderWithTheme(
        <PublicGroupsBrowser {...defaultProps} initialGroups={[makeGroup({ name: 'Old Group' })]} />
      );
      expect(screen.getByText('Old Group')).toBeInTheDocument();

      rerenderWithTheme(
        <PublicGroupsBrowser {...defaultProps} initialGroups={[makeGroup({ name: 'New Group' })]} />
      );
      expect(screen.getByText('New Group')).toBeInTheDocument();
      expect(screen.queryByText('Old Group')).not.toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('initializes search input with initialSearchTerm', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} initialSearchTerm="soccer" />);
      expect(screen.getByRole('textbox')).toHaveValue('soccer');
    });

    it('updates search value on input change', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'soccer' } });
      expect(input).toHaveValue('soccer');
    });

    it('does not navigate immediately on input change (debounced)', () => {
      vi.useFakeTimers();
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'soccer' } });
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('navigates with search param after 500ms debounce', async () => {
      vi.useFakeTimers();
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'soccer' } });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('search=soccer'));
    });

    it('resets to page=1 when search term changes', async () => {
      vi.useFakeTimers();
      mockSearchParams = createMockSearchParams({ page: '3' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      renderWithTheme(<PublicGroupsBrowser {...defaultProps} initialPage={3} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'soccer' } });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('page=1'));
    });

    it('removes search param when input is cleared', async () => {
      vi.useFakeTimers();
      mockSearchParams = createMockSearchParams({ search: 'soccer' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      renderWithTheme(<PublicGroupsBrowser {...defaultProps} initialSearchTerm="soccer" />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const pushedUrl = vi.mocked(mockRouter.push).mock.calls[0][0] as string;
      expect(pushedUrl).not.toContain('search=');
    });

    it('does not navigate if search value matches current URL param', async () => {
      vi.useFakeTimers();
      mockSearchParams = createMockSearchParams({ search: 'soccer' });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      // initialSearchTerm matches URL param — no change needed
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} initialSearchTerm="soccer" />);

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('does not render pagination when totalPages is 1', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} totalPages={1} />);
      expect(screen.queryByRole('button', { name: 'Anterior' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
    });

    it('renders pagination controls when totalPages > 1', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} totalPages={3} />);
      expect(screen.getByRole('button', { name: /Anterior/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Siguiente/i })).toBeInTheDocument();
    });

    it('previous button is disabled on page 1', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} totalPages={3} initialPage={1} />);
      expect(screen.getByRole('button', { name: /Anterior/i })).toBeDisabled();
    });

    it('next button is disabled on last page', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} totalPages={3} initialPage={3} />);
      expect(screen.getByRole('button', { name: /Siguiente/i })).toBeDisabled();
    });

    it('previous button is enabled on page 2', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} totalPages={3} initialPage={2} />);
      expect(screen.getByRole('button', { name: /Anterior/i })).not.toBeDisabled();
    });

    it('clicking next navigates to the next page', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} totalPages={3} initialPage={1} />);
      fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));
      expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    });

    it('clicking previous navigates to the previous page', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} totalPages={3} initialPage={2} />);
      fireEvent.click(screen.getByRole('button', { name: /Anterior/i }));
      expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('page=1'));
    });

    it('shows page info text', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} totalPages={5} initialPage={2} />);
      // ES: groups.pagination.pageInfo → "Página 2 de 5"
      expect(screen.getByText('Página 2 de 5')).toBeInTheDocument();
    });
  });

  describe('Join request — authenticated user', () => {
    it('opens dialog when clicking Request to Join', async () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Solicitar Unirse' }));

      await waitFor(() => {
        // Dialog title: groups.joinRequest.requestButton → "Solicitar Unirse al Grupo"
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Cuéntale un poco sobre ti/i)).toBeInTheDocument();
      });
      expect(mockRequestToJoinGroup).not.toHaveBeenCalled();
    });

    it('calls requestToJoinGroup with correct arguments when confirming dialog without message', async () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Solicitar Unirse' }));

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      // Click confirm without typing a message
      const confirmButtons = screen.getAllByRole('button', { name: /Solicitar Unirse al Grupo/i });
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(mockRequestToJoinGroup).toHaveBeenCalledWith(
          'group-1',
          'discovery',
          'es',
          'tournament-1',
          undefined
        );
      });
    });

    it('calls requestToJoinGroup with message when user types one', async () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Solicitar Unirse' }));

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      fireEvent.change(screen.getByPlaceholderText(/Cuéntale un poco sobre ti/i), {
        target: { value: 'Hola desde el gimnasio' },
      });

      const confirmButtons = screen.getAllByRole('button', { name: /Solicitar Unirse al Grupo/i });
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(mockRequestToJoinGroup).toHaveBeenCalledWith(
          'group-1',
          'discovery',
          'es',
          'tournament-1',
          'Hola desde el gimnasio'
        );
      });
    });

    it('shows character counter in dialog', async () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Solicitar Unirse' }));

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      expect(screen.getByText('0/300')).toBeInTheDocument();
    });

    it('closes dialog without calling action when cancel is clicked', async () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Solicitar Unirse' }));

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(mockRequestToJoinGroup).not.toHaveBeenCalled();
    });

    it('optimistically marks group as pending after confirming join', async () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Solicitar Unirse' }));

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      const confirmButtons = screen.getAllByRole('button', { name: /Solicitar Unirse al Grupo/i });
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Solicitar Unirse' })).not.toBeInTheDocument();
      });
    });

    it('does not update group state when join request throws', async () => {
      mockRequestToJoinGroup.mockRejectedValue(new Error('Network error'));

      renderWithTheme(<PublicGroupsBrowser {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Solicitar Unirse' }));

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      const confirmButtons = screen.getAllByRole('button', { name: /Solicitar Unirse al Grupo/i });
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        // State not updated — join button still present after dialog closes
        expect(screen.getByRole('button', { name: 'Solicitar Unirse' })).toBeInTheDocument();
      });
    });
  });

  describe('Join request — unauthenticated user', () => {
    it('redirects to login page when unauthenticated user clicks Request to Join', () => {
      renderWithTheme(<PublicGroupsBrowser {...defaultProps} currentUserId={null} />);
      fireEvent.click(screen.getByRole('button', { name: 'Solicitar Unirse' }));

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('/es/login?returnUrl=')
      );
      expect(mockRequestToJoinGroup).not.toHaveBeenCalled();
    });
  });
});
