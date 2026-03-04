import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminSectionTabs from '../../../app/components/friend-groups/admin-section-tabs';
import { renderWithTheme } from '../../utils/test-utils';
import { testFactories } from '../../db/test-factories';

// Mock sub-components to keep tests focused on tab logic
vi.mock('@/app/components/friend-groups/join-request-manager', () => ({
  default: () => <div data-testid="join-request-manager" />,
}));

vi.mock('@/app/components/friend-groups/group-privacy-settings', () => ({
  default: () => <div data-testid="group-privacy-settings" />,
}));

vi.mock('@/app/components/friend-groups/group-tournament-betting-admin', () => ({
  default: () => <div data-testid="group-tournament-betting-admin" />,
}));

vi.mock('@/app/components/friend-groups/friend-groups-themer', () => ({
  default: () => <div data-testid="friend-groups-themer" />,
}));

const defaultGroup = testFactories.prodeGroup();

const defaultProps = {
  groupId: 'group-1',
  initialRequests: [],
  locale: 'es' as const,
  tournamentId: 'tournament-1',
  groupName: 'Test Group',
  initialIsPublic: false,
  initialDescription: null,
  isAdmin: true,
  members: [],
  config: null,
  payments: [],
  group: defaultGroup,
  pendingRequestCount: 0,
};

describe('AdminSectionTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tab rendering', () => {
    it('renders all 4 tabs with role="tab"', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });

    it('renders tab list with aria-label="admin section tabs"', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} />);

      expect(screen.getByRole('tablist', { name: 'admin section tabs' })).toBeInTheDocument();
    });

    it('renders all 4 tab labels in Spanish', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /Solicitudes/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Privacidad/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Apuestas/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Personalizar/i })).toBeInTheDocument();
    });
  });

  describe('Default tab logic', () => {
    it('defaults to privacy tab when pendingRequestCount is 0', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} pendingRequestCount={0} />);

      const privacyTab = screen.getByRole('tab', { name: /Privacidad/i });
      expect(privacyTab).toHaveAttribute('aria-selected', 'true');

      const requestsTab = screen.getByRole('tab', { name: /Solicitudes/i });
      expect(requestsTab).toHaveAttribute('aria-selected', 'false');
    });

    it('defaults to requests tab when pendingRequestCount > 0', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} pendingRequestCount={3} />);

      const requestsTab = screen.getByRole('tab', { name: /Solicitudes/i });
      expect(requestsTab).toHaveAttribute('aria-selected', 'true');

      const privacyTab = screen.getByRole('tab', { name: /Privacidad/i });
      expect(privacyTab).toHaveAttribute('aria-selected', 'false');
    });

    it('defaults to requests tab when pendingRequestCount is 1', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} pendingRequestCount={1} />);

      const requestsTab = screen.getByRole('tab', { name: /Solicitudes/i });
      expect(requestsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Tab switching', () => {
    it('clicking requests tab makes it active', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} pendingRequestCount={0} />);

      // Default is privacy; click requests
      const requestsTab = screen.getByRole('tab', { name: /Solicitudes/i });
      fireEvent.click(requestsTab);

      expect(requestsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('clicking betting tab makes it active', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} />);

      const bettingTab = screen.getByRole('tab', { name: /Apuestas/i });
      fireEvent.click(bettingTab);

      expect(bettingTab).toHaveAttribute('aria-selected', 'true');
    });

    it('clicking customize tab makes it active', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} />);

      const customizeTab = screen.getByRole('tab', { name: /Personalizar/i });
      fireEvent.click(customizeTab);

      expect(customizeTab).toHaveAttribute('aria-selected', 'true');
    });

    it('clicking privacy tab makes it active', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} pendingRequestCount={3} />);

      // Default is requests; click privacy
      const privacyTab = screen.getByRole('tab', { name: /Privacidad/i });
      fireEvent.click(privacyTab);

      expect(privacyTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Content rendering per tab', () => {
    it('shows GroupPrivacySettings content on the privacy tab (default when no pending requests)', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} pendingRequestCount={0} />);

      expect(screen.getByTestId('group-privacy-settings')).toBeVisible();
    });

    it('shows JoinRequestManager content on the requests tab (default when pending requests > 0)', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} pendingRequestCount={2} />);

      expect(screen.getByTestId('join-request-manager')).toBeVisible();
    });

    it('shows GroupTournamentBettingAdmin content after clicking betting tab', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: /Apuestas/i }));

      expect(screen.getByTestId('group-tournament-betting-admin')).toBeVisible();
    });

    it('shows ProdeGroupThemer content after clicking customize tab', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: /Personalizar/i }));

      expect(screen.getByTestId('friend-groups-themer')).toBeVisible();
    });

    it('shows JoinRequestManager content after clicking requests tab', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} pendingRequestCount={0} />);

      fireEvent.click(screen.getByRole('tab', { name: /Solicitudes/i }));

      expect(screen.getByTestId('join-request-manager')).toBeVisible();
    });
  });

  describe('Badge on Requests tab', () => {
    it('shows badge count when pendingRequestCount > 0', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} pendingRequestCount={3} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('badge is invisible when pendingRequestCount is 0', () => {
      const { container } = renderWithTheme(<AdminSectionTabs {...defaultProps} pendingRequestCount={0} />);

      const badge = container.querySelector('.MuiBadge-badge');
      expect(badge).toHaveClass('MuiBadge-invisible');
    });

    it('shows badge with max 99 when pendingRequestCount exceeds 99', () => {
      renderWithTheme(<AdminSectionTabs {...defaultProps} pendingRequestCount={150} />);

      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });
});
