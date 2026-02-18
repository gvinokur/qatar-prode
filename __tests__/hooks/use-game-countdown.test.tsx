import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameCountdown } from '../../app/hooks/use-game-countdown';
import { CountdownProvider } from '../../app/components/context-providers/countdown-context-provider';
import React from 'react';

// Wrapper component for testing hooks that require CountdownProvider
function wrapper({ children }: { children: React.ReactNode }) {
  return <CountdownProvider>{children}</CountdownProvider>;
}

describe('useGameCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return closed state for past games', () => {
    const now = new Date('2026-01-20T15:00:00Z');
    vi.setSystemTime(now);

    // Game was 2 hours ago
    const gameDate = new Date('2026-01-20T13:00:00Z');

    const { result } = renderHook(() => useGameCountdown(gameDate), { wrapper });

    // Hook no longer returns translated "Cerrado" - just raw countdown
    expect(result.current.urgency).toBe('closed');
    expect(result.current.isClosed).toBe(true);
    expect(result.current.progressPercent).toBe(0);
    expect(result.current.timeRemaining).toBeLessThanOrEqual(0);
  });

  it('should show countdown for upcoming games', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);

    // Game is in 5 hours (deadline in 4 hours)
    const gameDate = new Date('2026-01-20T15:00:00Z');

    const { result } = renderHook(() => useGameCountdown(gameDate), { wrapper });

    // Hook returns raw countdown (e.g., "4h") without "Cierra en" prefix
    expect(result.current.countdown).toContain('4h');
    expect(result.current.urgency).toBe('warning'); // 4 hours = warning level
    expect(result.current.isClosed).toBe(false);
    expect(result.current.progressPercent).toBeGreaterThan(0);
  });

  it('should return "safe" urgency for games >48h away', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);

    // Game is in 72 hours (deadline in 71 hours)
    const gameDate = new Date('2026-01-23T10:00:00Z');

    const { result } = renderHook(() => useGameCountdown(gameDate), { wrapper });

    expect(result.current.urgency).toBe('safe');
    // Hook returns raw countdown without "Cierra en" prefix
    expect(result.current.countdown).toContain('2 días');
  });

  it('should return "notice" urgency for games 24-48h away', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);

    // Game is in 36 hours (deadline in 35 hours)
    const gameDate = new Date('2026-01-21T22:00:00Z');

    const { result } = renderHook(() => useGameCountdown(gameDate), { wrapper });

    expect(result.current.urgency).toBe('notice');
    expect(result.current.progressPercent).toBeGreaterThan(0);
    expect(result.current.progressPercent).toBeLessThan(100);
  });

  it('should return "warning" urgency for games 1-24h away', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);

    // Game is in 12 hours (deadline in 11 hours)
    const gameDate = new Date('2026-01-20T22:00:00Z');

    const { result } = renderHook(() => useGameCountdown(gameDate), { wrapper });

    expect(result.current.urgency).toBe('warning');
    expect(result.current.countdown).toContain('11h');
  });

  it('should return "urgent" urgency for games <1h away', () => {
    const now = new Date('2026-01-20T14:00:00Z');
    vi.setSystemTime(now);

    // Game is in 1.5 hours, so deadline is in 30 minutes
    const gameDate = new Date('2026-01-20T15:30:00Z');

    const { result } = renderHook(() => useGameCountdown(gameDate), { wrapper });

    expect(result.current.urgency).toBe('urgent');
    expect(result.current.countdown).toContain('30m');
  });

  it('should calculate progress correctly at different time points', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);

    // Test 100% progress (48+ hours away)
    const farGame = new Date('2026-01-22T11:00:00Z'); // 49h away, deadline in 48h
    const { result: farResult } = renderHook(() => useGameCountdown(farGame), { wrapper });
    expect(farResult.current.progressPercent).toBe(100);

    // Test ~50% progress (24 hours to deadline)
    const midGame = new Date('2026-01-21T11:00:00Z'); // 25h away, deadline in 24h
    const { result: midResult } = renderHook(() => useGameCountdown(midGame), { wrapper });
    expect(midResult.current.progressPercent).toBeCloseTo(50, 0);

    // Test 0% progress (past deadline)
    const pastGame = new Date('2026-01-20T08:00:00Z'); // 2h ago
    const { result: pastResult } = renderHook(() => useGameCountdown(pastGame), { wrapper });
    expect(pastResult.current.progressPercent).toBe(0);
  });

  it('should handle boundary conditions', () => {
    const now = new Date('2026-01-20T14:00:00Z');
    vi.setSystemTime(now);

    // Game starts exactly at current time (deadline was 1 hour ago)
    const gameDate = new Date('2026-01-20T14:00:00Z');

    const { result } = renderHook(() => useGameCountdown(gameDate), { wrapper });

    expect(result.current.isClosed).toBe(true);
    // Hook no longer returns translated "Cerrado"
    expect(result.current.urgency).toBe('closed');
  });

  it('should format countdown text correctly for various time ranges', () => {
    const now = new Date('2026-01-20T10:00:00Z');
    vi.setSystemTime(now);

    // Test days
    const daysGame = new Date('2026-01-23T11:00:00Z'); // ~3 days
    const { result: daysResult } = renderHook(() => useGameCountdown(daysGame), { wrapper });
    expect(daysResult.current.countdown).toContain('días');

    // Test hours and minutes
    const hoursGame = new Date('2026-01-20T14:30:00Z'); // ~3.5 hours to deadline
    const { result: hoursResult } = renderHook(() => useGameCountdown(hoursGame), { wrapper });
    expect(hoursResult.current.countdown).toContain('h');
    expect(hoursResult.current.countdown).toContain('m');

    // Test minutes only
    const minsGame = new Date('2026-01-20T11:30:00Z'); // 1h 30m to game = 30m to deadline
    const { result: minsResult } = renderHook(() => useGameCountdown(minsGame), { wrapper });
    expect(minsResult.current.countdown).toContain('m');
  });

  it('should handle different urgency levels across boundary conditions', () => {
    // Test safe/notice boundary (exactly 48h)
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const boundaryGame1 = new Date('2026-01-22T11:00:00Z'); // Exactly 49h away, deadline in 48h
    const { result: result1 } = renderHook(() => useGameCountdown(boundaryGame1), { wrapper });
    expect(result1.current.urgency).toBe('safe');

    // Test notice/warning boundary (exactly 24h)
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const boundaryGame2 = new Date('2026-01-21T11:00:00Z'); // Exactly 25h away, deadline in 24h
    const { result: result2 } = renderHook(() => useGameCountdown(boundaryGame2), { wrapper });
    expect(result2.current.urgency).toBe('notice');

    // Test warning/urgent boundary (exactly 1h)
    vi.setSystemTime(new Date('2026-01-20T14:00:00Z'));
    const boundaryGame3 = new Date('2026-01-20T16:00:00Z'); // Exactly 2h away, deadline in 1h
    const { result: result3 } = renderHook(() => useGameCountdown(boundaryGame3), { wrapper });
    expect(result3.current.urgency).toBe('warning');

    // Test urgent/closed boundary (exactly at deadline)
    vi.setSystemTime(new Date('2026-01-20T14:00:00Z'));
    const boundaryGame4 = new Date('2026-01-20T14:00:00Z'); // Deadline was 1h ago
    const { result: result4 } = renderHook(() => useGameCountdown(boundaryGame4), { wrapper });
    expect(result4.current.urgency).toBe('closed');
  });

  it('should update countdown when context time changes', () => {
    const now = new Date('2026-01-20T14:00:00Z');
    vi.setSystemTime(now);

    // Game is in 2 hours (deadline in 1 hour)
    const gameDate = new Date('2026-01-20T16:00:00Z');

    const { result } = renderHook(() => useGameCountdown(gameDate), { wrapper });

    // Initial state - 1 hour to deadline
    expect(result.current.countdown).toContain('1h');
    expect(result.current.urgency).toBe('warning');

    // Simulate the CountdownProvider's interval triggering after 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Time remaining should have decreased by 1 second
    const timeRemaining = result.current.timeRemaining;
    expect(timeRemaining).toBeLessThan(60 * 60 * 1000); // Less than 1 hour
    expect(timeRemaining).toBeGreaterThan(59 * 60 * 1000); // More than 59 minutes
  });

  it('should indicate progress bar should show only within 48h window', () => {
    // Game >48h away
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));
    const farGame = new Date('2026-01-23T10:00:00Z'); // 72h away
    const { result: farResult } = renderHook(() => useGameCountdown(farGame), { wrapper });
    expect(farResult.current.shouldShowProgressBar).toBe(false);

    // Game within 48h
    const nearGame = new Date('2026-01-21T10:00:00Z'); // 24h away
    const { result: nearResult } = renderHook(() => useGameCountdown(nearGame), { wrapper });
    expect(nearResult.current.shouldShowProgressBar).toBe(true);

    // Cerrado game
    const closedGame = new Date('2026-01-20T08:00:00Z'); // 2h ago
    const { result: closedResult } = renderHook(() => useGameCountdown(closedGame), { wrapper });
    expect(closedResult.current.shouldShowProgressBar).toBe(false);
  });

  it('should handle shouldShowProgressBar at boundary conditions', () => {
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));

    // Exactly 48h to deadline (49h to game start) - should still show progress bar
    const boundary48h = new Date('2026-01-22T11:00:00Z');
    const { result: result48h } = renderHook(() => useGameCountdown(boundary48h), { wrapper });
    expect(result48h.current.shouldShowProgressBar).toBe(true);

    // Just under 48h to deadline
    const justUnder48h = new Date('2026-01-22T10:59:00Z');
    const { result: resultUnder48h } = renderHook(() => useGameCountdown(justUnder48h), { wrapper });
    expect(resultUnder48h.current.shouldShowProgressBar).toBe(true);
  });
});
