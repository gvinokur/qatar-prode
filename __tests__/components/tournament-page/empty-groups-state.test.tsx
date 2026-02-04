import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyGroupsState from '@/app/components/tournament-page/empty-groups-state';
import { renderWithTheme } from '@/__tests__/utils/test-utils';

describe('EmptyGroupsState', () => {
  it('renders empty state message', () => {
    renderWithTheme(<EmptyGroupsState onCreateGroup={() => {}} onJoinGroup={() => {}} />);
    expect(screen.getByText('No Groups Yet!')).toBeInTheDocument();
  });

  it('displays motivational description', () => {
    renderWithTheme(<EmptyGroupsState onCreateGroup={() => {}} onJoinGroup={() => {}} />);
    expect(screen.getByText(/Create your first group or join an existing one/)).toBeInTheDocument();
  });

  it('shows trophy icon', () => {
    renderWithTheme(<EmptyGroupsState onCreateGroup={() => {}} onJoinGroup={() => {}} />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('displays Create Your First Group button', () => {
    renderWithTheme(<EmptyGroupsState onCreateGroup={() => {}} onJoinGroup={() => {}} />);
    expect(screen.getByText('Create Your First Group')).toBeInTheDocument();
  });

  it('displays Join with Code button', () => {
    renderWithTheme(<EmptyGroupsState onCreateGroup={() => {}} onJoinGroup={() => {}} />);
    expect(screen.getByText('Join with Code')).toBeInTheDocument();
  });

  it('calls onCreateGroup when Create button is clicked', async () => {
    const user = userEvent.setup();
    const onCreateGroup = vi.fn();
    renderWithTheme(<EmptyGroupsState onCreateGroup={onCreateGroup} onJoinGroup={() => {}} />);

    const createButton = screen.getByText('Create Your First Group');
    await user.click(createButton);

    expect(onCreateGroup).toHaveBeenCalledTimes(1);
  });

  it('calls onJoinGroup when Join button is clicked', async () => {
    const user = userEvent.setup();
    const onJoinGroup = vi.fn();
    renderWithTheme(<EmptyGroupsState onCreateGroup={() => {}} onJoinGroup={onJoinGroup} />);

    const joinButton = screen.getByText('Join with Code');
    await user.click(joinButton);

    expect(onJoinGroup).toHaveBeenCalledTimes(1);
  });
});
