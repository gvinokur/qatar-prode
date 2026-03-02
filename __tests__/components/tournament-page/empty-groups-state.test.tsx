import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyGroupsState from '@/app/components/tournament-page/empty-groups-state';
import { renderWithTheme } from '@/__tests__/utils/test-utils';

describe('EmptyGroupsState', () => {
  it('renders empty state message', () => {
    renderWithTheme(<EmptyGroupsState onCreateGroup={() => {}} onDiscoverGroups={() => {}} />);
    expect(screen.getByText('No Groups Yet!')).toBeInTheDocument();
  });

  it('displays motivational description', () => {
    renderWithTheme(<EmptyGroupsState onCreateGroup={() => {}} onDiscoverGroups={() => {}} />);
    expect(screen.getByText(/Create your first group or discover/i)).toBeInTheDocument();
  });

  it('shows trophy icon', () => {
    renderWithTheme(<EmptyGroupsState onCreateGroup={() => {}} onDiscoverGroups={() => {}} />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('displays Create Your First Group button', () => {
    renderWithTheme(<EmptyGroupsState onCreateGroup={() => {}} onDiscoverGroups={() => {}} />);
    expect(screen.getByText('Create Your First Group')).toBeInTheDocument();
  });

  it('displays Discover Groups button', () => {
    renderWithTheme(<EmptyGroupsState onCreateGroup={() => {}} onDiscoverGroups={() => {}} />);
    // Button text comes from translation - Spanish default
    expect(screen.getByText(/Descubrir Grupos/i)).toBeInTheDocument();
  });

  it('calls onCreateGroup when Create button is clicked', async () => {
    const user = userEvent.setup();
    const onCreateGroup = vi.fn();
    renderWithTheme(<EmptyGroupsState onCreateGroup={onCreateGroup} onDiscoverGroups={() => {}} />);

    const createButton = screen.getByText('Create Your First Group');
    await user.click(createButton);

    expect(onCreateGroup).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscoverGroups when Discover Groups button is clicked', async () => {
    const user = userEvent.setup();
    const onDiscoverGroups = vi.fn();
    renderWithTheme(<EmptyGroupsState onCreateGroup={() => {}} onDiscoverGroups={onDiscoverGroups} />);

    const discoverButton = screen.getByText(/Descubrir Grupos/i);
    await user.click(discoverButton);

    expect(onDiscoverGroups).toHaveBeenCalledTimes(1);
  });
});
