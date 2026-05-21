import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../utils/test-utils';
import TournamentTeamsManagerTab from '../../../app/components/backoffice/tournament-teams-manager-tab';
import { testFactories } from '../../db/test-factories';

vi.mock('../../../app/actions/tournament-actions', () => ({
  getTeamsMap: vi.fn(),
}));

vi.mock('../../../app/components/backoffice/internal/team-dialog', () => ({
  default: () => <div data-testid="team-dialog" />,
}));

vi.mock('../../../app/utils/theme-utils', () => ({
  getThemeLogoUrl: vi.fn(() => null),
}));

vi.mock('../../../app/components/skeletons', () => ({
  TeamGridSkeleton: () => <div data-testid="skeleton" />,
}));

import { getTeamsMap } from '../../../app/actions/tournament-actions';

const mockGetTeamsMap = vi.mocked(getTeamsMap);

describe('TournamentTeamsManagerTab — rank badge', () => {
  it('displays rank badge (#N) for a ranked team', async () => {
    const team = testFactories.team({ id: 't1', name: 'Argentina', short_name: 'ARG', rank: 3 });
    mockGetTeamsMap.mockResolvedValue({ t1: team } as any);

    renderWithTheme(<TournamentTeamsManagerTab tournamentId="tour-1" />);

    await waitFor(() => {
      expect(screen.getByText('#3')).toBeInTheDocument();
    });
  });

  it('displays em dash for an unranked team', async () => {
    const team = testFactories.team({ id: 't2', name: 'Playoff B', short_name: 'POB', rank: null });
    mockGetTeamsMap.mockResolvedValue({ t2: team } as any);

    renderWithTheme(<TournamentTeamsManagerTab tournamentId="tour-1" />);

    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('shows empty teams message when no teams exist', async () => {
    mockGetTeamsMap.mockResolvedValue({} as any);

    renderWithTheme(<TournamentTeamsManagerTab tournamentId="tour-1" />);

    await waitFor(() => {
      expect(screen.getByText(/No teams found/i)).toBeInTheDocument();
    });
  });
});
