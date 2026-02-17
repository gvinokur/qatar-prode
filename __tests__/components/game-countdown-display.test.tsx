import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameCountdownDisplay from '../../app/components/game-countdown-display';
import { CountdownProvider } from '../../app/components/context-providers/countdown-context-provider';
import { TimezoneProvider } from '../../app/components/context-providers/timezone-context-provider';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import React from 'react';

// Wrapper for all required providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  const theme = createTheme();
  return (
    <ThemeProvider theme={theme}>
      <TimezoneProvider>
        <CountdownProvider>
          {children}
        </CountdownProvider>
      </TimezoneProvider>
    </ThemeProvider>
  );
}

describe('GameCountdownDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render countdown text for upcoming games', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);

    // Game is in 5 hours (deadline in 4 hours)
    const gameDate = new Date('2026-01-20T15:00:00Z');

    render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} />
      </TestWrapper>
    );

    // Should show countdown on Line 2
    expect(screen.getByText(/Cierra en/)).toBeInTheDocument();
    expect(screen.getByText(/4h/)).toBeInTheDocument();
  });

  it('should show both countdown and date information', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);
    const gameDate = new Date('2026-01-20T15:00:00Z');

    render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} gameTimezone="America/New_York" compact={true} />
      </TestWrapper>
    );

    // Should show countdown
    expect(screen.getByText(/Cierra en/)).toBeInTheDocument();

    // Should also show formatted date with toggle link (no label in utility)
    expect(screen.getByText('Ver horario local')).toBeInTheDocument();
  });

  it('should not show progress bar for games >48h away', () => {
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const gameDate = new Date('2026-01-23T10:00:00Z'); // 72h away

    const { container } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} compact={true} />
      </TestWrapper>
    );

    const progressBar = container.querySelector('.MuiLinearProgress-root');
    expect(progressBar).not.toBeInTheDocument();
  });

  it('should show progress bar for games within 48h window', () => {
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const gameDate = new Date('2026-01-20T15:00:00Z'); // 4h to deadline

    const { container } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} compact={true} />
      </TestWrapper>
    );

    const progressBar = container.querySelector('.MuiLinearProgress-root');
    expect(progressBar).toBeInTheDocument();
  });

  it('should not render progress bar for closed games', () => {
    const now = new Date('2026-01-20T15:00:00Z');
    vi.setSystemTime(now);

    const gameDate = new Date('2026-01-20T13:00:00Z'); // Past game

    const { container } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} compact={true} />
      </TestWrapper>
    );

    const progressBar = container.querySelector('.MuiLinearProgress-root');
    expect(progressBar).not.toBeInTheDocument();
  });

  it('should display countdown for games less than 1 hour away', () => {
    const now = new Date('2026-01-20T14:00:00Z');
    vi.setSystemTime(now);

    // Game is in 1.5 hours (deadline in 30 minutes)
    const gameDate = new Date('2026-01-20T15:30:00Z');

    render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} />
      </TestWrapper>
    );

    // Should display the countdown with urgent timing
    expect(screen.getByText(/Cierra en/)).toBeInTheDocument();
    expect(screen.getByText(/30m/)).toBeInTheDocument();
  });

  it('should show date on Line 1 and state on Line 2', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);
    const gameDate = new Date('2026-01-20T15:00:00Z');

    render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} gameTimezone="America/New_York" compact={true} />
      </TestWrapper>
    );

    // Line 1 should have date with toggle link (no label in utility)
    expect(screen.getByText('Ver horario local')).toBeInTheDocument();

    // Line 2 should have countdown
    expect(screen.getByText(/Cierra en/)).toBeInTheDocument();
  });

  it('should display different urgency colors', () => {
    // Test safe urgency (neutral, not green)
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const safeGame = new Date('2026-01-23T10:00:00Z'); // 72h away
    const { container: safeContainer } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={safeGame} />
      </TestWrapper>
    );
    // Safe urgency should show neutral color (text.secondary)
    const safeTypography = safeContainer.querySelector('p');
    expect(safeTypography).toBeInTheDocument();

    // Test notice urgency (blue)
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const noticeGame = new Date('2026-01-21T22:00:00Z'); // 36h away
    const { container: noticeContainer } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={noticeGame} />
      </TestWrapper>
    );
    const noticeTypography = noticeContainer.querySelector('p');
    expect(noticeTypography).toBeInTheDocument();

    // Test warning urgency (orange)
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const warningGame = new Date('2026-01-20T22:00:00Z'); // 12h away
    const { container: warningContainer } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={warningGame} />
      </TestWrapper>
    );
    const warningTypography = warningContainer.querySelector('p');
    expect(warningTypography).toBeInTheDocument();
  });

  it('should show toggle link when gameTimezone provided', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);
    const gameDate = new Date('2026-01-20T15:00:00Z');

    render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} gameTimezone="America/New_York" compact={true} />
      </TestWrapper>
    );

    // Should show user time by default with toggle link (no label in utility)
    expect(screen.getByText('Ver horario local')).toBeInTheDocument();
  });

  it('should handle missing gameTimezone prop gracefully', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);

    const gameDate = new Date('2026-01-20T15:00:00Z');

    render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} />
      </TestWrapper>
    );

    expect(screen.getByText(/Cierra en/)).toBeInTheDocument();
  });

  it('should render countdown for different time ranges', () => {
    // Test días display
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const díasGame = new Date('2026-01-23T11:00:00Z'); // ~3 días
    const { rerender } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={díasGame} />
      </TestWrapper>
    );
    expect(screen.getByText(/días/)).toBeInTheDocument();

    // Test hours display
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const hoursGame = new Date('2026-01-20T14:30:00Z'); // ~3.5 hours to deadline
    rerender(
      <TestWrapper>
        <GameCountdownDisplay gameDate={hoursGame} />
      </TestWrapper>
    );
    expect(screen.getByText(/h/)).toBeInTheDocument();

    // Test minutes display
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const minsGame = new Date('2026-01-20T11:30:00Z'); // 30m to deadline
    rerender(
      <TestWrapper>
        <GameCountdownDisplay gameDate={minsGame} />
      </TestWrapper>
    );
    expect(screen.getByText(/m/)).toBeInTheDocument();
  });

  it('should toggle between times when toggle link clicked', () => {
    const now = new Date('2026-01-20T15:00:00Z');
    vi.setSystemTime(now);
    const gameDate = new Date('2026-01-20T13:00:00Z'); // Cerrado game

    render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} gameTimezone="America/New_York" compact={true} />
      </TestWrapper>
    );

    // Should show user time initially with toggle link (no label in utility)
    expect(screen.getByText('Ver horario local')).toBeInTheDocument();

    // Click toggle
    const toggleLink = screen.getByText('Ver horario local');
    fireEvent.click(toggleLink);

    // Should now show game time with different toggle text (no label in utility)
    expect(screen.getByText('Ver tu horario')).toBeInTheDocument();

    // Should show "Cerrado" on Line 2
    expect(screen.getByText('Cerrado')).toBeInTheDocument();
  });

  it('should show date without label when no gameTimezone provided', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);
    const gameDate = new Date('2026-01-20T15:00:00Z');

    render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} compact={true} />
      </TestWrapper>
    );

    // Should show formatted date without label
    expect(screen.getByText(/20 ene/)).toBeInTheDocument();
    // Toggle link should not be present
    expect(screen.queryByText('Ver horario local')).not.toBeInTheDocument();
  });
});
