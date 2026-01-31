'use client'

import React, { createContext, useState, useContext, useCallback } from 'react';
import { GuessesContext } from './guesses-context-provider';

interface EditModeContextValue {
  editingGameId: string | null;
  editMode: 'inline' | 'dialog' | null;
  startEdit: (gameId: string, mode: 'inline' | 'dialog') => Promise<void>;
  endEdit: () => void;
}

const EditModeContext = createContext<EditModeContextValue>({
  editingGameId: null,
  editMode: null,
  startEdit: async () => {},
  endEdit: () => {}
});

export function useEditMode() {
  return useContext(EditModeContext);
}

interface EditModeProviderProps {
  readonly children: React.ReactNode;
}

export function EditModeProvider({ children }: EditModeProviderProps) {
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'inline' | 'dialog' | null>(null);
  const guessesContext = useContext(GuessesContext);

  const startEdit = useCallback(async (gameId: string, mode: 'inline' | 'dialog') => {
    // Close any existing edit before opening new one
    if (editingGameId && editingGameId !== gameId) {
      // Flush pending save for previous game
      if (guessesContext.pendingSaves.has(editingGameId)) {
        try {
          await guessesContext.flushPendingSave(editingGameId);
        } catch (error) {
          console.error('Failed to save previous game:', error);
          // Continue anyway - don't block new edit
        }
      }
    }
    setEditingGameId(gameId);
    setEditMode(mode);
  }, [editingGameId, guessesContext]);

  const endEdit = useCallback(() => {
    setEditingGameId(null);
    setEditMode(null);
  }, []);

  const value = React.useMemo(() => ({
    editingGameId,
    editMode,
    startEdit,
    endEdit
  }), [editingGameId, editMode, startEdit, endEdit]);

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
}

export { EditModeContext };
