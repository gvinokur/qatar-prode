'use client'

import React, { createContext, useState, useContext, useCallback } from 'react';

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

  const startEdit = useCallback(async (gameId: string, mode: 'inline' | 'dialog') => {
    // Simply set the new editing state
    // No need to flush - saves happen immediately when card closes
    setEditingGameId(gameId);
    setEditMode(mode);
  }, []);

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
