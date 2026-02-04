import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '@mui/material';
import Footer from '../../app/components/home/footer';
import { renderWithTheme } from '../utils/test-utils';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock @mui/material hooks
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(),
  };
});

// Mock user actions to prevent actual API calls
vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../app/actions/prode-group-actions', () => ({
  getUserScoresForTournament: vi.fn().mockResolvedValue([]),
  getUsersForGroup: vi.fn().mockResolvedValue([]),
}));

describe('Footer - Mobile Hide Integration Test', () => {
  const mockMessage = 'Test Footer Message';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility based on mobile and tournament context', () => {
    it('renders footer on desktop regardless of path', () => {
      vi.mocked(useMediaQuery).mockReturnValue(false); // Desktop
      vi.mocked(usePathname).mockReturnValue('/tournaments/123');

      const { container } = renderWithTheme(<Footer message={mockMessage} />);

      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('renders footer on mobile when not in tournament context', () => {
      vi.mocked(useMediaQuery).mockReturnValue(true); // Mobile
      vi.mocked(usePathname).mockReturnValue('/'); // Main home

      const { container } = renderWithTheme(<Footer message={mockMessage} />);

      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('hides footer on mobile when in tournament context', () => {
      vi.mocked(useMediaQuery).mockReturnValue(true); // Mobile
      vi.mocked(usePathname).mockReturnValue('/tournaments/123'); // Tournament page

      const { container } = renderWithTheme(<Footer message={mockMessage} />);

      const footer = container.querySelector('footer');
      expect(footer).not.toBeInTheDocument();
    });

    it('hides footer on mobile for all tournament routes', () => {
      vi.mocked(useMediaQuery).mockReturnValue(true); // Mobile

      const tournamentPaths = [
        '/tournaments/123',
        '/tournaments/123/groups/A',
        '/tournaments/123/friend-groups',
        '/tournaments/123/stats',
        '/tournaments/456/playoffs',
      ];

      tournamentPaths.forEach((path) => {
        vi.mocked(usePathname).mockReturnValue(path);

        const { container } = renderWithTheme(<Footer message={mockMessage} />);

        const footer = container.querySelector('footer');
        expect(footer).not.toBeInTheDocument();
      });
    });

    it('shows footer on mobile for non-tournament routes', () => {
      vi.mocked(useMediaQuery).mockReturnValue(true); // Mobile

      const nonTournamentPaths = [
        '/',
        '/predictions',
        '/friend-groups',
        '/friend-groups/abc123',
      ];

      nonTournamentPaths.forEach((path) => {
        vi.mocked(usePathname).mockReturnValue(path);

        const { container } = renderWithTheme(<Footer message={mockMessage} />);

        const footer = container.querySelector('footer');
        expect(footer).toBeInTheDocument();
      });
    });
  });

  describe('responsive behavior transitions', () => {
    it('shows footer when transitioning from mobile to desktop in tournament', () => {
      vi.mocked(usePathname).mockReturnValue('/tournaments/123');

      // Start as mobile (footer hidden)
      vi.mocked(useMediaQuery).mockReturnValue(true);
      const { container, rerenderWithTheme } = renderWithTheme(<Footer message={mockMessage} />);
      expect(container.querySelector('footer')).not.toBeInTheDocument();

      // Change to desktop (footer should appear)
      vi.mocked(useMediaQuery).mockReturnValue(false);
      rerenderWithTheme(<Footer message={mockMessage} />);
      expect(container.querySelector('footer')).toBeInTheDocument();
    });

    it('hides footer when transitioning from desktop to mobile in tournament', () => {
      vi.mocked(usePathname).mockReturnValue('/tournaments/123');

      // Start as desktop (footer visible)
      vi.mocked(useMediaQuery).mockReturnValue(false);
      const { container, rerenderWithTheme } = renderWithTheme(<Footer message={mockMessage} />);
      expect(container.querySelector('footer')).toBeInTheDocument();

      // Change to mobile (footer should hide)
      vi.mocked(useMediaQuery).mockReturnValue(true);
      rerenderWithTheme(<Footer message={mockMessage} />);
      expect(container.querySelector('footer')).not.toBeInTheDocument();
    });

    it('hides footer when navigating from home to tournament on mobile', () => {
      vi.mocked(useMediaQuery).mockReturnValue(true); // Mobile

      // Start at home (footer visible)
      vi.mocked(usePathname).mockReturnValue('/');
      const { container, rerenderWithTheme } = renderWithTheme(<Footer message={mockMessage} />);
      expect(container.querySelector('footer')).toBeInTheDocument();

      // Navigate to tournament (footer should hide)
      vi.mocked(usePathname).mockReturnValue('/tournaments/123');
      rerenderWithTheme(<Footer message={mockMessage} />);
      expect(container.querySelector('footer')).not.toBeInTheDocument();
    });

    it('shows footer when navigating from tournament to home on mobile', () => {
      vi.mocked(useMediaQuery).mockReturnValue(true); // Mobile

      // Start at tournament (footer hidden)
      vi.mocked(usePathname).mockReturnValue('/tournaments/123');
      const { container, rerenderWithTheme } = renderWithTheme(<Footer message={mockMessage} />);
      expect(container.querySelector('footer')).not.toBeInTheDocument();

      // Navigate to home (footer should appear)
      vi.mocked(usePathname).mockReturnValue('/');
      rerenderWithTheme(<Footer message={mockMessage} />);
      expect(container.querySelector('footer')).toBeInTheDocument();
    });
  });

  describe('footer content and styling', () => {
    it('displays correct message when visible', () => {
      vi.mocked(useMediaQuery).mockReturnValue(false); // Desktop
      vi.mocked(usePathname).mockReturnValue('/tournaments/123');

      const { container } = renderWithTheme(<Footer message={mockMessage} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveTextContent(mockMessage);
    });

    it('maintains fixed positioning and z-index when visible', () => {
      vi.mocked(useMediaQuery).mockReturnValue(false); // Desktop
      vi.mocked(usePathname).mockReturnValue('/tournaments/123');

      const { container } = renderWithTheme(<Footer message={mockMessage} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveStyle({
        position: 'fixed',
        bottom: '0',
        zIndex: '1300',
      });
    });

    it('displays image when imageUrl prop is provided', () => {
      const imageUrl = 'https://example.com/logo.png';
      vi.mocked(useMediaQuery).mockReturnValue(false); // Desktop
      vi.mocked(usePathname).mockReturnValue('/');

      const { container } = renderWithTheme(<Footer message={mockMessage} imageUrl={imageUrl} />);

      const image = container.querySelector('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', imageUrl);
    });
  });
});
