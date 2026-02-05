'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { QualifiedTeamPrediction, QualifiedTeamPredictionNew } from '../../db/tables-definition';
import { updateQualificationPredictions } from '../../actions/qualification-actions';

/**
 * Auto-save state machine states
 * - idle: No pending changes
 * - pending: Changes made, waiting for debounce timer
 * - saving: Actively saving to server
 * - saved: Successfully saved (temporary state, returns to idle after 2s)
 * - error: Save failed, showing error message with retry option
 */
export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

/**
 * Prediction state management
 */
interface PredictionState {
  /** Map of team predictions keyed by teamId */
  predictions: Map<string, QualifiedTeamPrediction>;
  /** Current save state */
  saveState: SaveState;
  /** Last successful save timestamp */
  lastSaved: Date | null;
  /** Error message if save failed */
  error: string | null;
  /** Pending changes to be saved */
  pendingChanges: QualifiedTeamPredictionNew[];
  /** Server state snapshot for rollback on error */
  serverStateSnapshot: Map<string, QualifiedTeamPrediction>;
}

interface QualifiedTeamsContextValue {
  /** Current predictions */
  predictions: Map<string, QualifiedTeamPrediction>;
  /** Save state for UI feedback */
  saveState: SaveState;
  /** Whether actively saving (locks UI) */
  isSaving: boolean;
  /** Last save timestamp */
  lastSaved: Date | null;
  /** Error message if any */
  error: string | null;
  /** Update a team's position within a group */
  updatePosition: (_groupId: string, _teamId: string, _newPosition: number) => void;
  /** Toggle third place qualification for a team */
  toggleThirdPlace: (_groupId: string, _teamId: string) => void;
  /** Retry failed save */
  retrySave: () => void;
  /** Clear error state */
  clearError: () => void;
  /** Force immediate save (for testing or manual save) */
  forceSave: () => Promise<void>;
}

const QualifiedTeamsContext = createContext<QualifiedTeamsContextValue | undefined>(undefined);

export interface QualifiedTeamsContextProviderProps {
  children: React.ReactNode;
  /** Initial predictions from server */
  initialPredictions: QualifiedTeamPrediction[];
  /** Tournament ID for validation */
  tournamentId: string;
  /** User ID for validation */
  userId: string;
  /** Whether predictions are locked */
  isLocked: boolean;
}

export function QualifiedTeamsContextProvider({
  children,
  initialPredictions,
  tournamentId,
  userId,
  isLocked,
}: QualifiedTeamsContextProviderProps) {
  // Convert initial predictions array to Map for O(1) lookups
  const initialPredictionsMap = useMemo(() => {
    const map = new Map<string, QualifiedTeamPrediction>();
    initialPredictions.forEach((p) => map.set(p.team_id, p));
    return map;
  }, [initialPredictions]);

  // State
  const [state, setState] = useState<PredictionState>({
    predictions: initialPredictionsMap,
    saveState: 'idle',
    lastSaved: null,
    error: null,
    pendingChanges: [],
    serverStateSnapshot: initialPredictionsMap,
  });

  // Refs for debounce timer and cleanup
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Save pending changes to server
   */
  const savePredictions = useCallback(
    async (predictions: QualifiedTeamPredictionNew[]) => {
      if (isLocked) {
        setState((prev) => ({
          ...prev,
          saveState: 'error',
          error: 'Predictions are locked for this tournament',
        }));
        return;
      }

      if (predictions.length === 0) {
        setState((prev) => ({ ...prev, saveState: 'idle', pendingChanges: [] }));
        return;
      }

      setState((prev) => ({ ...prev, saveState: 'saving' }));

      try {
        const result = await updateQualificationPredictions(predictions);

        if (!isMountedRef.current) return;

        if (result.success) {
          setState((prev) => ({
            ...prev,
            saveState: 'saved',
            lastSaved: new Date(),
            error: null,
            pendingChanges: [],
            serverStateSnapshot: new Map(prev.predictions),
          }));

          // Auto-return to idle after 2 seconds
          setTimeout(() => {
            if (isMountedRef.current) {
              setState((prev) => ({
                ...prev,
                saveState: prev.saveState === 'saved' ? 'idle' : prev.saveState,
              }));
            }
          }, 2000);
        } else {
          throw new Error(result.message || 'Failed to save predictions');
        }
      } catch (error: any) {
        if (!isMountedRef.current) return;

        console.error('Save failed:', error);

        // Rollback to server state
        setState((prev) => ({
          ...prev,
          predictions: new Map(prev.serverStateSnapshot),
          saveState: 'error',
          error: error.message || 'Failed to save predictions. Please try again.',
          pendingChanges: [],
        }));
      }
    },
    [tournamentId, userId, isLocked]
  );

  /**
   * Debounced save with 500ms delay
   * Resets timer on rapid changes
   */
  const debouncedSave = useCallback(
    (changes: QualifiedTeamPredictionNew[]) => {
      setState((prev) => {
        // Don't start new debounce if currently saving
        if (prev.saveState === 'saving') {
          return prev;
        }

        // Clear existing timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for 500ms
        saveTimeoutRef.current = setTimeout(() => {
          savePredictions(changes);
        }, 500);

        // Set state to pending
        return {
          ...prev,
          saveState: 'pending',
          pendingChanges: changes,
        };
      });
    },
    [savePredictions]
  );

  /**
   * Update a team's position within a group
   * Triggers optimistic update + debounced save
   */
  const updatePosition = useCallback(
    (groupId: string, teamId: string, newPosition: number) => {
      // Prevent changes while locked or saving
      if (isLocked || state.saveState === 'saving') return;

      setState((prev) => {
        const prediction = prev.predictions.get(teamId);
        if (!prediction) return prev;

        // Create updated prediction
        const updatedPrediction: QualifiedTeamPrediction = {
          ...prediction,
          predicted_position: newPosition,
          updated_at: new Date(),
        };

        // Optimistic update
        const newPredictions = new Map(prev.predictions);
        newPredictions.set(teamId, updatedPrediction);

        // Prepare change for server
        const change: QualifiedTeamPredictionNew = {
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_id: teamId,
          predicted_position: newPosition,
          predicted_to_qualify: updatedPrediction.predicted_to_qualify,
        };

        // Debounced save
        debouncedSave([change]);

        return {
          ...prev,
          predictions: newPredictions,
        };
      });
    },
    [userId, tournamentId, isLocked, state.saveState, debouncedSave]
  );

  /**
   * Toggle third place qualification for a team
   * Only applicable for position 3
   */
  const toggleThirdPlace = useCallback(
    (groupId: string, teamId: string) => {
      // Prevent changes while locked or saving
      if (isLocked || state.saveState === 'saving') return;

      setState((prev) => {
        const prediction = prev.predictions.get(teamId);
        if (!prediction || prediction.predicted_position !== 3) return prev;

        // Toggle qualification
        const updatedPrediction: QualifiedTeamPrediction = {
          ...prediction,
          predicted_to_qualify: !prediction.predicted_to_qualify,
          updated_at: new Date(),
        };

        // Optimistic update
        const newPredictions = new Map(prev.predictions);
        newPredictions.set(teamId, updatedPrediction);

        // Prepare change for server
        const change: QualifiedTeamPredictionNew = {
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_id: teamId,
          predicted_position: prediction.predicted_position,
          predicted_to_qualify: updatedPrediction.predicted_to_qualify,
        };

        // Debounced save
        debouncedSave([change]);

        return {
          ...prev,
          predictions: newPredictions,
        };
      });
    },
    [userId, tournamentId, isLocked, state.saveState, debouncedSave]
  );

  /**
   * Retry failed save
   */
  const retrySave = useCallback(() => {
    if (state.pendingChanges.length > 0) {
      savePredictions(state.pendingChanges);
    } else {
      setState((prev) => ({ ...prev, saveState: 'idle', error: null }));
    }
  }, [state.pendingChanges, savePredictions]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, saveState: 'idle', error: null }));
  }, []);

  /**
   * Force immediate save (for testing or manual save button)
   */
  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (state.pendingChanges.length > 0) {
      await savePredictions(state.pendingChanges);
    }
  }, [state.pendingChanges, savePredictions]);

  /**
   * Cleanup: Flush pending saves on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      // Flush pending changes immediately on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      if (state.pendingChanges.length > 0 && !isLocked) {
        // Fire and forget - don't wait for response
        updateQualificationPredictions(state.pendingChanges).catch((error) => {
          console.error('Failed to flush pending changes on unmount:', error);
        });
      }
    };
  }, [state.pendingChanges, isLocked]);

  const contextValue = useMemo<QualifiedTeamsContextValue>(
    () => ({
      predictions: state.predictions,
      saveState: state.saveState,
      isSaving: state.saveState === 'saving' || state.saveState === 'pending',
      lastSaved: state.lastSaved,
      error: state.error,
      updatePosition,
      toggleThirdPlace,
      retrySave,
      clearError,
      forceSave,
    }),
    [state, updatePosition, toggleThirdPlace, retrySave, clearError, forceSave]
  );

  return <QualifiedTeamsContext.Provider value={contextValue}>{children}</QualifiedTeamsContext.Provider>;
}

/**
 * Hook to use QualifiedTeamsContext
 * Throws error if used outside provider
 */
export function useQualifiedTeamsContext(): QualifiedTeamsContextValue {
  const context = useContext(QualifiedTeamsContext);
  if (context === undefined) {
    throw new Error('useQualifiedTeamsContext must be used within QualifiedTeamsContextProvider');
  }
  return context;
}
