import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import AdSettingsTab from '../ad-settings-tab';
import { renderWithTheme } from '@/__tests__/utils/test-utils';

vi.mock('../../../actions/ad-settings-actions', () => ({
  getAdSettingsAction: vi.fn(),
  updateAdSettingsAction: vi.fn(),
}));

import { getAdSettingsAction, updateAdSettingsAction } from '../../../actions/ad-settings-actions';

describe('AdSettingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdSettingsAction).mockResolvedValue({
      modalMinMinutesBetween: 30,
      modalMinPageviewsBetween: 10,
    });
  });

  it('renders fields pre-populated with fetched settings', async () => {
    vi.mocked(getAdSettingsAction).mockResolvedValue({
      modalMinMinutesBetween: 45,
      modalMinPageviewsBetween: 7,
    });

    renderWithTheme(<AdSettingsTab />);

    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton'); // type="number" inputs
      const values = inputs.map((i) => (i as HTMLInputElement).value);
      expect(values).toContain('45');
      expect(values).toContain('7');
    });
  });

  it('calls updateAdSettingsAction with correct values on save', async () => {
    vi.mocked(updateAdSettingsAction).mockResolvedValue(undefined);

    renderWithTheme(<AdSettingsTab />);

    await waitFor(() => {
      expect(screen.getAllByRole('spinbutton').length).toBeGreaterThan(0);
    });

    const saveBtn = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateAdSettingsAction).toHaveBeenCalledWith(30, 10);
    });
  });

  it('shows success snackbar after successful save', async () => {
    vi.mocked(updateAdSettingsAction).mockResolvedValue(undefined);

    renderWithTheme(<AdSettingsTab />);

    await waitFor(() => screen.getAllByRole('spinbutton').length > 0);

    const saveBtn = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/settings saved/i)).toBeInTheDocument();
    });
  });

  it('shows error snackbar on action failure', async () => {
    vi.mocked(updateAdSettingsAction).mockRejectedValue(new Error('Server error'));

    renderWithTheme(<AdSettingsTab />);

    await waitFor(() => screen.getAllByRole('spinbutton').length > 0);

    const saveBtn = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/failed to save settings/i)).toBeInTheDocument();
    });
  });
});
