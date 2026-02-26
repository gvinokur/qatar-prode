import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { EditTriggerContextProvider, useEditTrigger } from '../edit-trigger-context-provider';

// Test component that uses the hook
function TestComponent() {
  const { triggerEdit, registerTrigger } = useEditTrigger();

  return (
    <div>
      <button onClick={() => {
        const mockTrigger = vi.fn();
        registerTrigger(mockTrigger);
      }}>
        Register
      </button>
      <button onClick={() => triggerEdit('game-123')}>
        Trigger
      </button>
    </div>
  );
}

describe('EditTriggerContextProvider', () => {
  it('should render children', () => {
    render(
      <EditTriggerContextProvider>
        <div data-testid="child">Test Child</div>
      </EditTriggerContextProvider>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Test Child');
  });

  it('should register and call trigger function', () => {
    const mockTrigger = vi.fn();

    function TestComponentWithMock() {
      const { triggerEdit, registerTrigger } = useEditTrigger();

      return (
        <div>
          <button
            onClick={() => registerTrigger(mockTrigger)}
            data-testid="register-btn"
          >
            Register
          </button>
          <button
            onClick={() => triggerEdit('game-123')}
            data-testid="trigger-btn"
          >
            Trigger
          </button>
        </div>
      );
    }

    render(
      <EditTriggerContextProvider>
        <TestComponentWithMock />
      </EditTriggerContextProvider>
    );

    // Register the trigger
    act(() => {
      screen.getByTestId('register-btn').click();
    });

    // Call triggerEdit
    act(() => {
      screen.getByTestId('trigger-btn').click();
    });

    // Verify the registered function was called with correct argument
    expect(mockTrigger).toHaveBeenCalledWith('game-123');
    expect(mockTrigger).toHaveBeenCalledTimes(1);
  });

  it('should not call trigger if not registered', () => {
    function TestComponentNoRegister() {
      const { triggerEdit } = useEditTrigger();

      return (
        <button onClick={() => triggerEdit('game-123')} data-testid="trigger-btn">
          Trigger
        </button>
      );
    }

    // Should not throw error when trigger is called without registration
    render(
      <EditTriggerContextProvider>
        <TestComponentNoRegister />
      </EditTriggerContextProvider>
    );

    expect(() => {
      screen.getByTestId('trigger-btn').click();
    }).not.toThrow();
  });

  it('should throw error when hook used outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function TestComponentOutsideProvider() {
      useEditTrigger();
      return <div>Test</div>;
    }

    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useEditTrigger must be used within EditTriggerContextProvider');

    consoleSpy.mockRestore();
  });

  it('should allow unregistering trigger with null', () => {
    const mockTrigger = vi.fn();

    function TestComponentWithUnregister() {
      const { triggerEdit, registerTrigger } = useEditTrigger();

      return (
        <div>
          <button
            onClick={() => registerTrigger(mockTrigger)}
            data-testid="register-btn"
          >
            Register
          </button>
          <button
            onClick={() => registerTrigger(null)}
            data-testid="unregister-btn"
          >
            Unregister
          </button>
          <button
            onClick={() => triggerEdit('game-123')}
            data-testid="trigger-btn"
          >
            Trigger
          </button>
        </div>
      );
    }

    render(
      <EditTriggerContextProvider>
        <TestComponentWithUnregister />
      </EditTriggerContextProvider>
    );

    // Register trigger
    act(() => {
      screen.getByTestId('register-btn').click();
    });

    // Unregister trigger
    act(() => {
      screen.getByTestId('unregister-btn').click();
    });

    // Try to trigger - should not call the function
    act(() => {
      screen.getByTestId('trigger-btn').click();
    });

    expect(mockTrigger).not.toHaveBeenCalled();
  });
});
