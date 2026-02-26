'use client'

import { createContext, useContext, useCallback, useState, ReactNode } from 'react';

interface EditTriggerContextValue {
  triggerEdit: (gameId: string) => void;
  registerTrigger: (trigger: ((gameId: string) => void) | null) => void;
}

const EditTriggerContext = createContext<EditTriggerContextValue | undefined>(undefined);

interface EditTriggerContextProviderProps {
  readonly children: ReactNode;
}

export function EditTriggerContextProvider({ children }: EditTriggerContextProviderProps) {
  const [editTrigger, setEditTrigger] = useState<((gameId: string) => void) | null>(null);

  const registerTrigger = useCallback((trigger: ((gameId: string) => void) | null) => {
    setEditTrigger(() => trigger);
  }, []);

  const triggerEdit = useCallback((gameId: string) => {
    if (editTrigger) {
      editTrigger(gameId);
    }
  }, [editTrigger]);

  return (
    <EditTriggerContext.Provider value={{ triggerEdit, registerTrigger }}>
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
