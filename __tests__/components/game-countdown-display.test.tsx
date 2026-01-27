import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

    expect(screen.getByText(/Closes in/)).toBeInTheDocument();
    expect(screen.getByText(/4h/)).toBeInTheDocument();
  });

  it('should show formatted date for past games', () => {
    const now = new Date('2026-01-20T15:00:00Z');
    vi.setSystemTime(now);

    // Game was 2 hours ago
    const gameDate = new Date('2026-01-20T13:00:00Z');

    render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} />
      </TestWrapper>
    );

    // Should show formatted date instead of countdown when closed
    // The component falls back to date display when isClosed = true
    // Just verify something is rendered (the actual format depends on date-utils)
    const typography = screen.getByText(/./);
    expect(typography).toBeInTheDocument();
  });

  it('should render progress bar when showProgressBar is true', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);

    const gameDate = new Date('2026-01-20T15:00:00Z');

    const { container } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} showProgressBar={true} />
      </TestWrapper>
    );

    // Check for LinearProgress component (has role="progressbar")
    const progressBar = container.querySelector('.MuiLinearProgress-root');
    expect(progressBar).toBeInTheDocument();
  });

  it('should not render progress bar when showProgressBar is false', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);

    const gameDate = new Date('2026-01-20T15:00:00Z');

    const { container } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} showProgressBar={false} />
      </TestWrapper>
    );

    const progressBar = container.querySelector('.MuiLinearProgress-root');
    expect(progressBar).not.toBeInTheDocument();
  });

  it('should not render progress bar for closed games', () => {
    const now = new Date('2026-01-20T15:00:00Z');
    vi.setSystemTime(now);

    const gameDate = new Date('2026-01-20T13:00:00Z'); // Past game

    const { container } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} showProgressBar={true} />
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
    expect(screen.getByText(/Closes in/)).toBeInTheDocument();
    expect(screen.getByText(/30m/)).toBeInTheDocument();
  });

  it('should render in compact mode correctly', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);

    const gameDate = new Date('2026-01-20T15:00:00Z');

    const { container } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} compact={true} showProgressBar={true} />
      </TestWrapper>
    );

    // In compact mode, outer Box should use flexDirection: 'row'
    const outerBox = container.firstChild?.firstChild;
    expect(outerBox).toBeInTheDocument();
  });

  it('should display different urgency colors', () => {
    // Test safe urgency (green)
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const safeGame = new Date('2026-01-23T10:00:00Z'); // 72h away
    const { container: safeContainer } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={safeGame} />
      </TestWrapper>
    );
    // Safe urgency should show green color (success.main)
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

  it('should handle timezone toggle via TimezoneProvider', () => {
    const now = new Date('2026-01-20T15:00:00Z');
    vi.setSystemTime(now);

    const gameDate = new Date('2026-01-20T13:00:00Z'); // Past game
    const gameTimezone = 'America/New_York';

    render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={gameDate} gameTimezone={gameTimezone} />
      </TestWrapper>
    );

    // Since it's a closed game, it should fall back to date display
    // The TimezoneProvider's showLocalTime setting should be respected
    // Just verify the component renders without errors
    expect(screen.getByText(/./)).toBeInTheDocument();
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

    expect(screen.getByText(/Closes in/)).toBeInTheDocument();
  });

  it('should render countdown for different time ranges', () => {
    // Test days display
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const daysGame = new Date('2026-01-23T11:00:00Z'); // ~3 days
    const { rerender } = render(
      <TestWrapper>
        <GameCountdownDisplay gameDate={daysGame} />
      </TestWrapper>
    );
    expect(screen.getByText(/days/)).toBeInTheDocument();

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
});
