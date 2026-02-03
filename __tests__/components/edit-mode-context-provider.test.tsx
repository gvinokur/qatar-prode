import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { EditModeProvider, useEditMode } from '../../app/components/context-providers/edit-mode-context-provider';
import React from 'react';

describe('EditModeProvider', () => {
  beforeEach(() => {
    // Reset any state between tests
  });

  describe('Initial State', () => {
    it('provides null editingGameId initially', () => {
      const { result } = renderHook(() => useEditMode(), {
        wrapper: EditModeProvider,
      });

      expect(result.current.editingGameId).toBeNull();
    });

    it('provides null editMode initially', () => {
      const { result } = renderHook(() => useEditMode(), {
        wrapper: EditModeProvider,
      });

      expect(result.current.editMode).toBeNull();
    });

    it('provides startEdit function', () => {
      const { result } = renderHook(() => useEditMode(), {
        wrapper: EditModeProvider,
      });

      expect(typeof result.current.startEdit).toBe('function');
    });

    it('provides endEdit function', () => {
      const { result } = renderHook(() => useEditMode(), {
        wrapper: EditModeProvider,
      });

      expect(typeof result.current.endEdit).toBe('function');
    });
  });

  describe('startEdit', () => {
    it('sets editingGameId when startEdit is called', async () => {
      const { result } = renderHook(() => useEditMode(), {
        wrapper: EditModeProvider,
      });

      await act(async () => {
        await result.current.startEdit('game-123', 'inline');
      });

      expect(result.current.editingGameId).toBe('game-123');
    });

    it('sets editMode to inline when startEdit is called with inline mode', async () => {
      const { result } = renderHook(() => useEditMode(), {
        wrapper: EditModeProvider,
      });

      await act(async () => {
        await result.current.startEdit('game-123', 'inline');
      });

      expect(result.current.editMode).toBe('inline');
    });

    it('sets editMode to dialog when startEdit is called with dialog mode', async () => {
      const { result } = renderHook(() => useEditMode(), {
        wrapper: EditModeProvider,
      });

      await act(async () => {
        await result.current.startEdit('game-456', 'dialog');
      });

      expect(result.current.editMode).toBe('dialog');
      expect(result.current.editingGameId).toBe('game-456');
    });

    it('updates to new game when startEdit is called with different gameId', async () => {
      const { result } = renderHook(() => useEditMode(), {
        wrapper: EditModeProvider,
      });

      await act(async () => {
        await result.current.startEdit('game-1', 'inline');
      });

      expect(result.current.editingGameId).toBe('game-1');

      await act(async () => {
        await result.current.startEdit('game-2', 'dialog');
      });

      expect(result.current.editingGameId).toBe('game-2');
      expect(result.current.editMode).toBe('dialog');
    });
  });

  describe('endEdit', () => {
    it('clears editingGameId when endEdit is called', async () => {
      const { result } = renderHook(() => useEditMode(), {
        wrapper: EditModeProvider,
      });

      await act(async () => {
        await result.current.startEdit('game-123', 'inline');
      });

      expect(result.current.editingGameId).toBe('game-123');

      act(() => {
        result.current.endEdit();
      });

      expect(result.current.editingGameId).toBeNull();
    });

    it('clears editMode when endEdit is called', async () => {
      const { result } = renderHook(() => useEditMode(), {
        wrapper: EditModeProvider,
      });

      await act(async () => {
        await result.current.startEdit('game-123', 'inline');
      });

      expect(result.current.editMode).toBe('inline');

      act(() => {
        result.current.endEdit();
      });

      expect(result.current.editMode).toBeNull();
    });
  });

  describe('Provider Integration', () => {
    it('provides context to children components', () => {
      const TestComponent = () => {
        const { editingGameId, editMode } = useEditMode();
        return (
          <div>
            <span data-testid="gameId">{editingGameId || 'null'}</span>
            <span data-testid="mode">{editMode || 'null'}</span>
          </div>
        );
      };

      render(
        <EditModeProvider>
          <TestComponent />
        </EditModeProvider>
      );

      expect(screen.getByTestId('gameId')).toHaveTextContent('null');
      expect(screen.getByTestId('mode')).toHaveTextContent('null');
    });

    it('updates child components when state changes', async () => {
      const TestComponent = () => {
        const { editingGameId, editMode, startEdit } = useEditMode();
        return (
          <div>
            <span data-testid="gameId">{editingGameId || 'null'}</span>
            <span data-testid="mode">{editMode || 'null'}</span>
            <button onClick={() => startEdit('test-game', 'inline')}>Start Edit</button>
          </div>
        );
      };

      render(
        <EditModeProvider>
          <TestComponent />
        </EditModeProvider>
      );

      expect(screen.getByTestId('gameId')).toHaveTextContent('null');

      await act(async () => {
        screen.getByText('Start Edit').click();
      });

      expect(screen.getByTestId('gameId')).toHaveTextContent('test-game');
      expect(screen.getByTestId('mode')).toHaveTextContent('inline');
    });
  });

  describe('useEditMode hook', () => {
    it('returns context value when used inside provider', () => {
      const { result } = renderHook(() => useEditMode(), {
        wrapper: EditModeProvider,
      });

      expect(result.current).toHaveProperty('editingGameId');
      expect(result.current).toHaveProperty('editMode');
      expect(result.current).toHaveProperty('startEdit');
      expect(result.current).toHaveProperty('endEdit');
    });
  });
});
