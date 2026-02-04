import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JoinGroupDialog from '@/app/components/tournament-page/join-group-dialog';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

describe('JoinGroupDialog', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush
    });
  });

  it('does not render when open is false', () => {
    renderWithTheme(<JoinGroupDialog open={false} onClose={() => {}} />);
    expect(screen.queryByText('Join Group with Code')).not.toBeInTheDocument();
  });

  it('renders when open is true', () => {
    renderWithTheme(<JoinGroupDialog open={true} onClose={() => {}} />);
    expect(screen.getByText('Join Group with Code')).toBeInTheDocument();
  });

  it('displays input field for group code', () => {
    renderWithTheme(<JoinGroupDialog open={true} onClose={() => {}} />);
    expect(screen.getByLabelText('Group Code')).toBeInTheDocument();
  });

  it('displays Cancel button', () => {
    renderWithTheme(<JoinGroupDialog open={true} onClose={() => {}} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('displays Join Group button', () => {
    renderWithTheme(<JoinGroupDialog open={true} onClose={() => {}} />);
    expect(screen.getByText('Join Group')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithTheme(<JoinGroupDialog open={true} onClose={onClose} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows error when trying to join with empty code', async () => {
    const user = userEvent.setup();
    renderWithTheme(<JoinGroupDialog open={true} onClose={() => {}} />);

    const joinButton = screen.getByText('Join Group');
    await user.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a group code')).toBeInTheDocument();
    });
  });

  it('accepts input in group code field', async () => {
    const user = userEvent.setup();
    renderWithTheme(<JoinGroupDialog open={true} onClose={() => {}} />);

    const input = screen.getByLabelText('Group Code');
    await user.type(input, 'ABC123');

    expect(input).toHaveValue('ABC123');
  });

  it('navigates to join page with correct code', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithTheme(<JoinGroupDialog open={true} onClose={onClose} />);

    const input = screen.getByLabelText('Group Code');
    await user.type(input, 'ABC123');

    const joinButton = screen.getByText('Join Group');
    await user.click(joinButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/friend-groups/join/ABC123');
    });
  });

  it('trims whitespace from group code', async () => {
    const user = userEvent.setup();
    renderWithTheme(<JoinGroupDialog open={true} onClose={() => {}} />);

    const input = screen.getByLabelText('Group Code');
    await user.type(input, '  ABC123  ');

    const joinButton = screen.getByText('Join Group');
    await user.click(joinButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/friend-groups/join/ABC123');
    });
  });

  it('clears error when user types in input', async () => {
    const user = userEvent.setup();
    renderWithTheme(<JoinGroupDialog open={true} onClose={() => {}} />);

    // Trigger error first
    const joinButton = screen.getByText('Join Group');
    await user.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a group code')).toBeInTheDocument();
    });

    // Type in input
    const input = screen.getByLabelText('Group Code');
    await user.type(input, 'A');

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Please enter a group code')).not.toBeInTheDocument();
    });
  });
});
