'use client'

import { createContext, useContext, useCallback, useState, useRef, useEffect, useMemo, ReactNode } from 'react';

interface EditTriggerContextValue {
  triggerEdit: (gameId: string) => void;
  registerTrigger: (trigger: ((gameId: string) => void) | null) => void;
  isEditMode: boolean;
  isEditModeRef: { current: boolean };
  setEditMode: (isEdit: boolean) => void;
}

const EditTriggerContext = createContext<EditTriggerContextValue | undefined>(undefined);

interface EditTriggerContextProviderProps {
  readonly children: ReactNode;
}

export function EditTriggerContextProvider({ children }: EditTriggerContextProviderProps) {
  const [editTrigger, setEditTrigger] = useState<((gameId: string) => void) | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const isEditModeRef = useRef(false);

  // Sync state to ref whenever it changes
  useEffect(() => {
    isEditModeRef.current = isEditMode;
  }, [isEditMode]);

  const registerTrigger = useCallback((trigger: ((gameId: string) => void) | null) => {
    setEditTrigger(() => trigger);
  }, []);

  const triggerEdit = useCallback((gameId: string) => {
    if (editTrigger) {
      editTrigger(gameId);
      setIsEditMode(true); // Mark edit mode as active when triggered
    }
  }, [editTrigger]);

  const setEditMode = useCallback((isEdit: boolean) => {
    setIsEditMode(isEdit);
  }, []);

  const contextValue = useMemo(
    () => ({ triggerEdit, registerTrigger, isEditMode, isEditModeRef, setEditMode }),
    [triggerEdit, registerTrigger, isEditMode, setEditMode]
  );

  return (
    <EditTriggerContext.Provider value={contextValue}>
      {children}
    </EditTriggerContext.Provider>
  );
}

export function useEditTrigger() {
  const context = useContext(EditTriggerContext);
  if (context === undefined) {
    throw new Error('useEditTrigger must be used within EditTriggerContextProvider');
  }
  return context;
}
