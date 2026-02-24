import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import TournamentRedirect from '../tournament-redirect';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import * as dismissalStorage from '@/app/utils/dismissal-storage';

// Mock next/navigation
const mockPush = vi.fn();
let mockPathname = '/en';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

// Mock next-intl
let mockLocale = 'en';

vi.mock('next-intl', () => ({
  useLocale: () => mockLocale,
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'home.loadingTournaments': 'Loading Tournaments',
    };
    return translations[key] || key;
  },
}));

// Mock dismissal-storage module
vi.mock('@/app/utils/dismissal-storage', () => ({
  getLastSelectedTournamentId: vi.fn(),
  setLastSelectedTournamentId: vi.fn(),
}));

describe('TournamentRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocale = 'en';
    mockPathname = '/en';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders loading indicator with CircularProgress', () => {
      const tournaments = [{ id: 'tournament-1' }];

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      // Check for CircularProgress by role
      const progressIndicator = screen.getByRole('progressbar');
      expect(progressIndicator).toBeInTheDocument();
    });

    it('shows localized loading text', () => {
      const tournaments = [{ id: 'tournament-1' }];

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      // Check for translated text
      const loadingText = screen.getByText('Loading Tournaments');
      expect(loadingText).toBeInTheDocument();
      expect(loadingText.tagName).toBe('H6'); // Typography variant="h6"
    });
  });

  describe('Redirect behavior', () => {
    it('redirects to last selected tournament if it exists in the list', () => {
      const tournaments = [
        { id: 'tournament-1' },
        { id: 'tournament-2' },
        { id: 'tournament-3' },
      ];

      // Mock last selected tournament
      vi.mocked(dismissalStorage.getLastSelectedTournamentId).mockReturnValue(
        'tournament-2'
      );

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      // Should redirect to last selected tournament
      expect(mockPush).toHaveBeenCalledWith('/en/tournaments/tournament-2');
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('redirects to first tournament if no last selected', () => {
      const tournaments = [
        { id: 'tournament-1' },
        { id: 'tournament-2' },
        { id: 'tournament-3' },
      ];

      // Mock no last selected tournament
      vi.mocked(dismissalStorage.getLastSelectedTournamentId).mockReturnValue(
        null
      );

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      // Should redirect to first tournament
      expect(mockPush).toHaveBeenCalledWith('/en/tournaments/tournament-1');
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('redirects to first tournament if last selected is not in list', () => {
      const tournaments = [
        { id: 'tournament-1' },
        { id: 'tournament-2' },
        { id: 'tournament-3' },
      ];

      // Mock last selected tournament that doesn't exist in current list
      vi.mocked(dismissalStorage.getLastSelectedTournamentId).mockReturnValue(
        'tournament-deleted'
      );

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      // Should fall back to first tournament
      expect(mockPush).toHaveBeenCalledWith('/en/tournaments/tournament-1');
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('uses correct locale in redirect URL', () => {
      mockLocale = 'es';
      const tournaments = [{ id: 'tournament-1' }];

      vi.mocked(dismissalStorage.getLastSelectedTournamentId).mockReturnValue(
        null
      );

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      // Should use Spanish locale in URL
      expect(mockPush).toHaveBeenCalledWith('/es/tournaments/tournament-1');
    });

    it('does nothing if tournaments array is empty', () => {
      const tournaments: Array<{ id: string }> = [];

      vi.mocked(dismissalStorage.getLastSelectedTournamentId).mockReturnValue(
        null
      );

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      // Should not redirect when no tournaments
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('localStorage interactions', () => {
    it('saves tournament ID to localStorage when redirecting to last selected', () => {
      const tournaments = [
        { id: 'tournament-1' },
        { id: 'tournament-2' },
        { id: 'tournament-3' },
      ];

      vi.mocked(dismissalStorage.getLastSelectedTournamentId).mockReturnValue(
        'tournament-2'
      );

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      // Should save the selected tournament ID
      expect(
        dismissalStorage.setLastSelectedTournamentId
      ).toHaveBeenCalledWith('tournament-2');
      expect(
        dismissalStorage.setLastSelectedTournamentId
      ).toHaveBeenCalledTimes(1);
    });

    it('saves tournament ID to localStorage when redirecting to first tournament', () => {
      const tournaments = [
        { id: 'tournament-1' },
        { id: 'tournament-2' },
      ];

      vi.mocked(dismissalStorage.getLastSelectedTournamentId).mockReturnValue(
        null
      );

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      // Should save the first tournament ID
      expect(
        dismissalStorage.setLastSelectedTournamentId
      ).toHaveBeenCalledWith('tournament-1');
      expect(
        dismissalStorage.setLastSelectedTournamentId
      ).toHaveBeenCalledTimes(1);
    });

    it('reads last selected tournament ID from localStorage on mount', () => {
      const tournaments = [{ id: 'tournament-1' }];

      vi.mocked(dismissalStorage.getLastSelectedTournamentId).mockReturnValue(
        'tournament-1'
      );

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      // Should call getLastSelectedTournamentId
      expect(
        dismissalStorage.getLastSelectedTournamentId
      ).toHaveBeenCalledTimes(1);
    });

    it('does not save to localStorage when tournaments array is empty', () => {
      const tournaments: Array<{ id: string }> = [];

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      // Should not save when no tournaments
      expect(
        dismissalStorage.setLastSelectedTournamentId
      ).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('handles single tournament in list', () => {
      const tournaments = [{ id: 'only-tournament' }];

      vi.mocked(dismissalStorage.getLastSelectedTournamentId).mockReturnValue(
        null
      );

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      expect(mockPush).toHaveBeenCalledWith('/en/tournaments/only-tournament');
      expect(
        dismissalStorage.setLastSelectedTournamentId
      ).toHaveBeenCalledWith('only-tournament');
    });

    it('handles tournaments with special characters in IDs', () => {
      const tournaments = [{ id: 'tournament-2024-world-cup' }];

      vi.mocked(dismissalStorage.getLastSelectedTournamentId).mockReturnValue(
        null
      );

      renderWithTheme(<TournamentRedirect tournaments={tournaments} />);

      expect(mockPush).toHaveBeenCalledWith(
        '/en/tournaments/tournament-2024-world-cup'
      );
    });
  });
});
