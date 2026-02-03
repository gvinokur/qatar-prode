'use client'

import React from 'react';
import { EditModeProvider } from './edit-mode-context-provider';

interface EditModeWrapperProps {
  readonly children: React.ReactNode;
}

/**
 * Client component wrapper for EditModeProvider
 * Used to wrap tournament pages that need edit mode coordination
 */
export function EditModeWrapper({ children }: EditModeWrapperProps) {
  return (
    <EditModeProvider>
      {children}
    </EditModeProvider>
  );
}
