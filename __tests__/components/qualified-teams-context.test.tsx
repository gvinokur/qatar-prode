import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import {
  QualifiedTeamsContextProvider,
  useQualifiedTeamsContext,
} from '../../app/components/qualified-teams/qualified-teams-context';
import { testFactories } from '../db/test-factories';
import * as qualificationActions from '../../app/actions/qualification-actions';

// Mock qualification actions
vi.mock('../../app/actions/qualification-actions', () => ({
  updateGroupPositionsJsonb: vi.fn(),
}));

const mockUpdateGroupPositions = vi.mocked(qualificationActions.updateGroupPositionsJsonb);

describe('QualifiedTeamsContext', () => {
  const mockUserId = 'user-1';
  const mockTournamentId = 'tournament-1';
  const mockGroupId = 'group-1';

  const mockPredictions = [
    testFactories.qualifiedTeamPrediction({
      id: 'pred-1',
      user_id: mockUserId,
      tournament_id: mockTournamentId,
      group_id: mockGroupId,
      team_id: 'team-1',
      predicted_position: 1,
      predicted_to_qualify: true,
    }),
    testFactories.qualifiedTeamPrediction({
      id: 'pred-2',
      user_id: mockUserId,
      tournament_id: mockTournamentId,
      group_id: mockGroupId,
      team_id: 'team-2',
      predicted_position: 2,
      predicted_to_qualify: true,
    }),
    testFactories.qualifiedTeamPrediction({
      id: 'pred-3',
      user_id: mockUserId,
      tournament_id: mockTournamentId,
      group_id: mockGroupId,
      team_id: 'team-3',
      predicted_position: 3,
      predicted_to_qualify: false,
    }),
  ];

  const createWrapper = (isLocked = false) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QualifiedTeamsContextProvider
        initialPredictions={mockPredictions}
        tournamentId={mockTournamentId}
        userId={mockUserId}
        isLocked={isLocked}
      >
        {children}
      </QualifiedTeamsContextProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateGroupPositions.mockResolvedValue({ success: true, message: 'Actualizadas 3 predicciones exitosamente' });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize with server predictions', () => {
      const { result } = renderHook(() => useQualifiedTeamsContext(), {
        wrapper: createWrapper(),
      });

      expect(result.current.predictions.size).toBe(3);
      expect(result.current.saveState).toBe('idle');
      expect(result.current.lastSaved).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should throw error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useQualifiedTeamsContext());
      }).toThrow('useQualifiedTeamsContext must be used within QualifiedTeamsContextProvider');

      consoleError.mockRestore();
    });
  });

  describe('updateGroupPositions - Batch Updates', () => {
    it('should update all positions in a single batch', async () => {
      const { result } = renderHook(() => useQualifiedTeamsContext(), {
        wrapper: createWrapper(),
      });

      const updates = [
        { teamId: 'team-1', position: 2, qualifies: true },
        { teamId: 'team-2', position: 1, qualifies: true },
        { teamId: 'team-3', position: 3, qualifies: false },
      ];

      await act(async () => {
        await result.current.updateGroupPositions(mockGroupId, updates);
      });

      expect(mockUpdateGroupPositions).toHaveBeenCalledTimes(1);
      expect(mockUpdateGroupPositions).toHaveBeenCalledWith(mockGroupId, mockTournamentId, updates);
    });

    it('should apply optimistic update immediately', async () => {
      const { result } = renderHook(() => useQualifiedTeamsContext(), {
        wrapper: createWrapper(),
      });

      const updates = [
        { teamId: 'team-1', position: 3, qualifies: false },
        { teamId: 'team-2', position: 2, qualifies: true },
        { teamId: 'team-3', position: 1, qualifies: true },
      ];

      await act(async () => {
        await result.current.updateGroupPositions(mockGroupId, updates);
      });

      // Check optimistic update applied
      const team1 = result.current.predictions.get('team-1');
      const team3 = result.current.predictions.get('team-3');

      expect(team1?.predicted_position).toBe(3);
      expect(team1?.predicted_to_qualify).toBe(false);
      expect(team3?.predicted_position).toBe(1);
      expect(team3?.predicted_to_qualify).toBe(true);
    });

    it('should transition to saving state during save', async () => {
      const { result } = renderHook(() => useQualifiedTeamsContext(), {
        wrapper: createWrapper(),
      });

      const updates = [{ teamId: 'team-1', position: 2, qualifies: true }];

      // Create a promise that we control
      let resolveUpdate: any;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });
      mockUpdateGroupPositions.mockReturnValue(updatePromise as any);

      act(() => {
        result.current.updateGroupPositions(mockGroupId, updates);
      });

      // Should be in saving state
      expect(result.current.saveState).toBe('saving');
      expect(result.current.isSaving).toBe(true);

      // Resolve the update
      await act(async () => {
        resolveUpdate({ success: true, message: 'Saved' });
        await updatePromise;
      });
    });

    it('should transition to saved on successful save', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useQualifiedTeamsContext(), {
        wrapper: createWrapper(),
      });

      const updates = [{ teamId: 'team-1', position: 2, qualifies: true }];

      await act(async () => {
        await result.current.updateGroupPositions(mockGroupId, updates);
      });

      expect(result.current.saveState).toBe('saved');
      expect(result.current.lastSaved).not.toBeNull();
      expect(result.current.error).toBeNull();

      vi.useRealTimers();
    });

    it('should return to idle after 2 seconds in saved state', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useQualifiedTeamsContext(), {
        wrapper: createWrapper(),
      });

      const updates = [{ teamId: 'team-1', position: 2, qualifies: true }];

      await act(async () => {
        await result.current.updateGroupPositions(mockGroupId, updates);
      });

      expect(result.current.saveState).toBe('saved');

      // Fast-forward 2 seconds
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.saveState).toBe('idle');

      vi.useRealTimers();
    });

    it('should not update when tournament is locked', async () => {
      const { result } = renderHook(() => useQualifiedTeamsContext(), {
        wrapper: createWrapper(true), // locked
      });

      const updates = [{ teamId: 'team-1', position: 2, qualifies: true }];

      await act(async () => {
        await result.current.updateGroupPositions(mockGroupId, updates);
      });

      expect(mockUpdateGroupPositions).not.toHaveBeenCalled();
    });

    it('should not allow updates while saving', async () => {
      const { result } = renderHook(() => useQualifiedTeamsContext(), {
        wrapper: createWrapper(),
      });

      const updates1 = [{ teamId: 'team-1', position: 2, qualifies: true }];
      const updates2 = [{ teamId: 'team-2', position: 3, qualifies: false }];

      // Start first save (don't await)
      let resolveFirstUpdate: any;
      const firstUpdatePromise = new Promise((resolve) => {
        resolveFirstUpdate = resolve;
      });
      mockUpdateGroupPositions.mockReturnValue(firstUpdatePromise as any);

      act(() => {
        result.current.updateGroupPositions(mockGroupId, updates1);
      });

      expect(result.current.saveState).toBe('saving');

      // Try second save while first is in progress
      await act(async () => {
        await result.current.updateGroupPositions(mockGroupId, updates2);
      });

      // Second save should be ignored
      expect(mockUpdateGroupPositions).toHaveBeenCalledTimes(1);

      // Resolve first save
      await act(async () => {
        resolveFirstUpdate({ success: true, message: 'Saved' });
        await firstUpdatePromise;
      });
    });
  });

  describe('Error Handling', () => {
    it('should rollback on save error', async () => {
      const { result } = renderHook(() => useQualifiedTeamsContext(), {
        wrapper: createWrapper(),
      });

      // Mock error response
      mockUpdateGroupPositions.mockRejectedValueOnce(new Error('Network error'));

      const updates = [
        { teamId: 'team-1', position: 3, qualifies: false },
        { teamId: 'team-2', position: 1, qualifies: true },
      ];

      await act(async () => {
        try {
          await result.current.updateGroupPositions(mockGroupId, updates);
        } catch (e) {
          // Expected error
        }
      });

      // Should rollback to original state
      expect(result.current.saveState).toBe('error');
      expect(result.current.error).toBeTruthy();

      // Check predictions rolled back
      const team1 = result.current.predictions.get('team-1');
      const team2 = result.current.predictions.get('team-2');

      expect(team1?.predicted_position).toBe(1); // Original position
      expect(team2?.predicted_position).toBe(2); // Original position
    });

    it('should clear error state', async () => {
      const { result } = renderHook(() => useQualifiedTeamsContext(), {
        wrapper: createWrapper(),
      });

      mockUpdateGroupPositions.mockRejectedValueOnce(new Error('Error'));

      const updates = [{ teamId: 'team-1', position: 2, qualifies: true }];

      await act(async () => {
        try {
          await result.current.updateGroupPositions(mockGroupId, updates);
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.saveState).toBe('error');
      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.saveState).toBe('idle');
      expect(result.current.error).toBeNull();
    });
  });

  describe('Server State Snapshot', () => {
    it('should update server snapshot on successful save', async () => {
      const { result } = renderHook(() => useQualifiedTeamsContext(), {
        wrapper: createWrapper(),
      });

      const updates = [{ teamId: 'team-1', position: 2, qualifies: true }];

      await act(async () => {
        await result.current.updateGroupPositions(mockGroupId, updates);
      });

      // After successful save, optimistic state becomes server state
      // If we now trigger an error, rollback should go to the new state (not original)
      mockUpdateGroupPositions.mockRejectedValueOnce(new Error('Error after first save'));

      const updates2 = [{ teamId: 'team-1', position: 3, qualifies: false }];

      await act(async () => {
        try {
          await result.current.updateGroupPositions(mockGroupId, updates2);
        } catch (e) {
          // Expected
        }
      });

      // Should rollback to state after first save (position 2), not original (position 1)
      const team1 = result.current.predictions.get('team-1');
      expect(team1?.predicted_position).toBe(2);
    });
  });
});
