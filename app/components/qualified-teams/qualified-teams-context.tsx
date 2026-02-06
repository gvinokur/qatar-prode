'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { QualifiedTeamPrediction } from '../../db/tables-definition';
import { updateGroupPositionsJsonb } from '../../actions/qualification-actions';

/**
 * Simplified save state machine
 * - idle: No active save operation
 * - saving: Actively saving to server
 * - saved: Successfully saved (temporary state, returns to idle after 2s)
 * - error: Save failed, showing error message with retry option
 */
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

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
  /** Update positions for entire group (batch) */
  updateGroupPositions: (_groupId: string, _updates: Array<{ teamId: string; position: number; qualifies: boolean }>) => Promise<void>;
  /** Clear error state */
  clearError: () => void;
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
    serverStateSnapshot: initialPredictionsMap,
  });

  // Ref for cleanup
  const isMountedRef = useRef(true);

  /**
   * Update positions for an entire group in a single atomic batch operation
   * This triggers immediate save with optimistic update
   */
  const updateGroupPositions = useCallback(
    async (groupId: string, updates: Array<{ teamId: string; position: number; qualifies: boolean }>) => {
      // Prevent changes while locked or already saving
      if (isLocked || state.saveState === 'saving') return;

      // Optimistic update: Apply changes immediately to UI
      setState((prev) => {
        const newPredictions = new Map(prev.predictions);

        updates.forEach(({ teamId, position, qualifies }) => {
          const prediction = prev.predictions.get(teamId);
          if (prediction) {
            newPredictions.set(teamId, {
              ...prediction,
              predicted_position: position,
              predicted_to_qualify: qualifies,
              updated_at: new Date(),
            });
          }
        });

        return {
          ...prev,
          predictions: newPredictions,
          saveState: 'saving' as const,
          error: null,
        };
      });

      // Save to server
      try {
        const result = await updateGroupPositionsJsonb(groupId, tournamentId, updates);

        if (!isMountedRef.current) return;

        if (result.success) {
          setState((prev) => ({
            ...prev,
            saveState: 'saved',
            lastSaved: new Date(),
            error: null,
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
          throw new Error(result.message || 'Error al guardar las predicciones');
        }
      } catch (error: any) {
        if (!isMountedRef.current) return;

        console.error('Save failed:', error);

        // Rollback to server state
        setState((prev) => ({
          ...prev,
          predictions: new Map(prev.serverStateSnapshot),
          saveState: 'error',
          error: error.message || 'Error al guardar las predicciones. Por favor intenta de nuevo.',
        }));
      }
    },
    [tournamentId, userId, isLocked, state.saveState]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, saveState: 'idle', error: null }));
  }, []);

  /**
   * Cleanup: Mark component as unmounted
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const contextValue = useMemo<QualifiedTeamsContextValue>(
    () => ({
      predictions: state.predictions,
      saveState: state.saveState,
      isSaving: state.saveState === 'saving',
      lastSaved: state.lastSaved,
      error: state.error,
      updateGroupPositions,
      clearError,
    }),
    [state, updateGroupPositions, clearError]
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
