import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../../utils/test-utils';
import TeamDialog from '../../../../app/components/backoffice/internal/team-dialog';
import { testFactories } from '../../../db/test-factories';

vi.mock('../../../../app/actions/team-actions', () => ({
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
}));

vi.mock('../../../../app/utils/theme-utils', () => ({
  getThemeLogoUrl: vi.fn(() => null),
}));

vi.mock('mui-color-input', () => ({
  MuiColorInput: ({ value, onChange }: { value: string; onChange: (c: string) => void }) => (
    <input data-testid="color-input" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock('../../../../app/components/friend-groups/image-picker', () => ({
  default: () => <div data-testid="image-picker" />,
}));

vi.mock('../../../../app/components/backoffice/i18n-field-editor', () => ({
  default: () => <div data-testid="i18n-editor" />,
}));

import { createTeam, updateTeam } from '../../../../app/actions/team-actions';

const mockCreateTeam = vi.mocked(createTeam);
const mockUpdateTeam = vi.mocked(updateTeam);

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  tournamentId: 'tournament-1',
  onTeamSaved: vi.fn(),
};

const fillRequiredFields = () => {
  fireEvent.change(screen.getByLabelText(/Team Name/i), { target: { value: 'Argentina' } });
  fireEvent.change(screen.getByLabelText(/Short Name/i), { target: { value: 'ARG' } });
};

describe('TeamDialog — rank field', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the FIFA Rank field', () => {
    renderWithTheme(<TeamDialog {...defaultProps} />);
    expect(screen.getByLabelText(/FIFA Rank/i)).toBeInTheDocument();
  });

  it('shows helper text for the rank field', () => {
    renderWithTheme(<TeamDialog {...defaultProps} />);
    expect(screen.getByText(/Optional \(1–999\)/i)).toBeInTheDocument();
  });

  it('pre-populates rank from team prop in edit mode', () => {
    const team = testFactories.team({ rank: 42 });
    renderWithTheme(<TeamDialog {...defaultProps} team={team} />);
    const rankInput = screen.getByLabelText(/FIFA Rank/i) as HTMLInputElement;
    expect(rankInput.value).toBe('42');
  });

  it('shows empty rank field when team has null rank in edit mode', () => {
    const team = testFactories.team({ rank: null });
    renderWithTheme(<TeamDialog {...defaultProps} team={team} />);
    const rankInput = screen.getByLabelText(/FIFA Rank/i) as HTMLInputElement;
    expect(rankInput.value).toBe('');
  });

  it('shows validation error when rank is 0', async () => {
    renderWithTheme(<TeamDialog {...defaultProps} />);
    fillRequiredFields();

    fireEvent.change(screen.getByLabelText(/FIFA Rank/i), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Team/i }));

    await waitFor(() => {
      expect(screen.getByText('Rank must be between 1 and 999')).toBeInTheDocument();
    });
    expect(mockCreateTeam).not.toHaveBeenCalled();
  });

  it('shows validation error when rank is 1000', async () => {
    renderWithTheme(<TeamDialog {...defaultProps} />);
    fillRequiredFields();

    fireEvent.change(screen.getByLabelText(/FIFA Rank/i), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Team/i }));

    await waitFor(() => {
      expect(screen.getByText('Rank must be between 1 and 999')).toBeInTheDocument();
    });
    expect(mockCreateTeam).not.toHaveBeenCalled();
  });

  it('submits with null rank when field is left empty', async () => {
    mockCreateTeam.mockResolvedValue(testFactories.team({ rank: null }) as any);
    renderWithTheme(<TeamDialog {...defaultProps} />);
    fillRequiredFields();

    // Leave rank empty
    fireEvent.click(screen.getByRole('button', { name: /Create Team/i }));

    await waitFor(() => {
      expect(mockCreateTeam).toHaveBeenCalled();
    });
    const formData: FormData = mockCreateTeam.mock.calls[0][0];
    const teamPayload = JSON.parse(formData.get('team') as string);
    expect(teamPayload.rank).toBeNull();
  });

  it('submits with the entered rank value', async () => {
    mockCreateTeam.mockResolvedValue(testFactories.team({ rank: 15 }) as any);
    renderWithTheme(<TeamDialog {...defaultProps} />);
    fillRequiredFields();

    fireEvent.change(screen.getByLabelText(/FIFA Rank/i), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Team/i }));

    await waitFor(() => {
      expect(mockCreateTeam).toHaveBeenCalled();
    });
    const formData: FormData = mockCreateTeam.mock.calls[0][0];
    const teamPayload = JSON.parse(formData.get('team') as string);
    expect(teamPayload.rank).toBe(15);
  });

  it('shows server-side error message when updateTeam rejects with validation error', async () => {
    mockUpdateTeam.mockRejectedValue(new Error('Rank must be between 1 and 999'));
    const team = testFactories.team({ rank: 5, short_name: 'ARG' });
    renderWithTheme(<TeamDialog {...defaultProps} team={team} />);

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Rank must be between 1 and 999')).toBeInTheDocument();
    });
  });
});
