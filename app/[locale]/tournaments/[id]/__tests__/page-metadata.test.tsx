import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { render } from '@testing-library/react';
import TournamentHubPage from '../page';

// Mock MUI icons used in page.tsx
vi.mock('@mui/icons-material/SportsSoccer', () => ({ default: () => <span data-testid="icon-soccer" /> }))
vi.mock('@mui/icons-material/EmojiEvents', () => ({ default: () => <span data-testid="icon-events" /> }))
vi.mock('@mui/icons-material/Groups', () => ({ default: () => <span data-testid="icon-groups" /> }))
vi.mock('@mui/icons-material/History', () => ({ default: () => <span data-testid="icon-history" /> }))

describe('TournamentHubPage (root landing page)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the hub page without errors', async () => {
    const result = await TournamentHubPage();
    expect(result).toBeTruthy();
  });

  it('renders the Banner Area placeholder', async () => {
    const page = await TournamentHubPage();
    render(page as Parameters<typeof render>[0]);

    expect(screen.getByText(/Banner Area/)).toBeInTheDocument();
  });

  it('renders all four mock DashboardCard titles', async () => {
    const page = await TournamentHubPage();
    render(page as Parameters<typeof render>[0]);

    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Standings')).toBeInTheDocument();
    expect(screen.getByText('Groups')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('renders for unauthenticated users without redirecting', async () => {
    const page = await TournamentHubPage();
    render(page as Parameters<typeof render>[0]);

    // Page renders normally for guests — no redirect, all content visible
    expect(screen.getByText(/Banner Area/)).toBeInTheDocument();
  });
});
