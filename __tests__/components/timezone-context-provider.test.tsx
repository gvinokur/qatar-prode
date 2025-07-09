import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TimezoneProvider, useTimezone } from '../../app/components/context-providers/timezone-context-provider';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Define a test component that uses the timezone context
const TestComponent = () => {
  const { showLocalTime, toggleTimezone } = useTimezone();
  
  return (
    <div>
      <span data-testid="timezone-display">
        {showLocalTime ? 'Local' : 'UTC'}
      </span>
      <button data-testid="toggle-button" onClick={toggleTimezone}>
        Toggle Timezone
      </button>
    </div>
  );
};

const TestComponentWithStatus = () => {
  const { showLocalTime, toggleTimezone } = useTimezone();
  
  return (
    <div>
      <span data-testid="status">{showLocalTime ? 'true' : 'false'}</span>
      <button data-testid="toggle" onClick={toggleTimezone}>
        Toggle
      </button>
    </div>
  );
};

const MultipleConsumerComponent = () => {
  const context1 = useTimezone();
  const context2 = useTimezone();
  
  return (
    <div>
      <span data-testid="context1">{context1.showLocalTime ? 'true' : 'false'}</span>
      <span data-testid="context2">{context2.showLocalTime ? 'true' : 'false'}</span>
      <button data-testid="toggle1" onClick={context1.toggleTimezone}>
        Toggle 1
      </button>
      <button data-testid="toggle2" onClick={context2.toggleTimezone}>
        Toggle 2
      </button>
    </div>
  );
};

const renderWithProvider = (children: React.ReactNode) => {
  return render(
    <TimezoneProvider>
      {children}
    </TimezoneProvider>
  );
};

describe('TimezoneProvider', () => {
  beforeEach(() => {
    // Reset localStorage mock
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
    
    // Mock localStorage globally
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('initializes with showLocalTime as true by default', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('timezone-display')).toHaveTextContent('Local');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('showLocalTime');
    });

    it('loads saved preference from localStorage on mount', () => {
      mockLocalStorage.getItem.mockReturnValue('false');
      
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('timezone-display')).toHaveTextContent('UTC');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('showLocalTime');
    });

    it('handles localStorage with true value', () => {
      mockLocalStorage.getItem.mockReturnValue('true');
      
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('timezone-display')).toHaveTextContent('Local');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('showLocalTime');
    });

    it('handles localStorage with falsy string values', () => {
      mockLocalStorage.getItem.mockReturnValue('');
      
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('timezone-display')).toHaveTextContent('UTC');
    });

    it('handles localStorage with invalid string values', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid');
      
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('timezone-display')).toHaveTextContent('UTC');
    });
  });

  describe('toggleTimezone functionality', () => {
    it('toggles from true to false and saves to localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('true');
      
      renderWithProvider(<TestComponentWithStatus />);
      
      expect(screen.getByTestId('status')).toHaveTextContent('true');
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });
      
      expect(screen.getByTestId('status')).toHaveTextContent('false');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('showLocalTime', 'false');
    });

    it('toggles from false to true and saves to localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('false');
      
      renderWithProvider(<TestComponentWithStatus />);
      
      expect(screen.getByTestId('status')).toHaveTextContent('false');
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });
      
      expect(screen.getByTestId('status')).toHaveTextContent('true');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('showLocalTime', 'true');
    });

    it('toggles multiple times correctly', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      renderWithProvider(<TestComponentWithStatus />);
      
      // Initial state (default true)
      expect(screen.getByTestId('status')).toHaveTextContent('true');
      
      // First toggle (true -> false)
      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });
      expect(screen.getByTestId('status')).toHaveTextContent('false');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('showLocalTime', 'false');
      
      // Second toggle (false -> true)
      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });
      expect(screen.getByTestId('status')).toHaveTextContent('true');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('showLocalTime', 'true');
      
      // Third toggle (true -> false)
      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });
      expect(screen.getByTestId('status')).toHaveTextContent('false');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('showLocalTime', 'false');
    });
  });

  describe('context provider behavior', () => {
    it('provides the same context to multiple consumers', () => {
      mockLocalStorage.getItem.mockReturnValue('true');
      
      renderWithProvider(<MultipleConsumerComponent />);
      
      expect(screen.getByTestId('context1')).toHaveTextContent('true');
      expect(screen.getByTestId('context2')).toHaveTextContent('true');
    });

    it('updates all consumers when context changes', () => {
      mockLocalStorage.getItem.mockReturnValue('true');
      
      renderWithProvider(<MultipleConsumerComponent />);
      
      expect(screen.getByTestId('context1')).toHaveTextContent('true');
      expect(screen.getByTestId('context2')).toHaveTextContent('true');
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle1'));
      });
      
      expect(screen.getByTestId('context1')).toHaveTextContent('false');
      expect(screen.getByTestId('context2')).toHaveTextContent('false');
    });

    it('both toggle buttons work identically', () => {
      mockLocalStorage.getItem.mockReturnValue('true');
      
      renderWithProvider(<MultipleConsumerComponent />);
      
      expect(screen.getByTestId('context1')).toHaveTextContent('true');
      expect(screen.getByTestId('context2')).toHaveTextContent('true');
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle2'));
      });
      
      expect(screen.getByTestId('context1')).toHaveTextContent('false');
      expect(screen.getByTestId('context2')).toHaveTextContent('false');
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle1'));
      });
      
      expect(screen.getByTestId('context1')).toHaveTextContent('true');
      expect(screen.getByTestId('context2')).toHaveTextContent('true');
    });

    it('renders children correctly', () => {
      renderWithProvider(
        <div data-testid="test-child">Test content</div>
      );
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toHaveTextContent('Test content');
    });

    it('renders multiple children correctly', () => {
      renderWithProvider(
        <>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <TestComponent />
        </>
      );
      
      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
      expect(screen.getByTestId('timezone-display')).toBeInTheDocument();
    });

    it('renders nested providers correctly', () => {
      renderWithProvider(
        <TimezoneProvider>
          <TestComponent />
        </TimezoneProvider>
      );
      
      expect(screen.getByTestId('timezone-display')).toBeInTheDocument();
    });
  });

  describe('useTimezone hook', () => {
    it('returns default context when used outside provider', () => {
      render(<TestComponent />);
      
      expect(screen.getByTestId('timezone-display')).toHaveTextContent('Local');
      
      // Should not call localStorage when outside provider
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });

    it('returns correct context shape', () => {
      let contextValue: any;
      
      const TestHookComponent = () => {
        contextValue = useTimezone();
        return <div>Test</div>;
      };
      
      renderWithProvider(<TestHookComponent />);
      
      expect(contextValue).toHaveProperty('showLocalTime');
      expect(contextValue).toHaveProperty('toggleTimezone');
      expect(typeof contextValue.showLocalTime).toBe('boolean');
      expect(typeof contextValue.toggleTimezone).toBe('function');
    });

    it('creates new toggleTimezone function on each render', () => {
      let contextValue1: any;
      let contextValue2: any;
      
      const TestHookComponent = () => {
        const context = useTimezone();
        if (!contextValue1) {
          contextValue1 = context;
        } else {
          contextValue2 = context;
        }
        return <div>Test</div>;
      };
      
      const { rerender } = renderWithProvider(<TestHookComponent />);
      rerender(
        <TimezoneProvider>
          <TestHookComponent />
        </TimezoneProvider>
      );
      
      expect(contextValue1.toggleTimezone).not.toBe(contextValue2.toggleTimezone);
    });
  });

  describe('edge cases', () => {
    it('handles null children gracefully', () => {
      renderWithProvider(null);
      
      // Should not crash
      expect(document.body).toBeInTheDocument();
    });

    it('handles undefined children gracefully', () => {
      renderWithProvider(undefined);
      
      // Should not crash
      expect(document.body).toBeInTheDocument();
    });

    it('handles empty fragment children', () => {
      renderWithProvider(<></>);
      
      // Should not crash
      expect(document.body).toBeInTheDocument();
    });

    it('handles localStorage getItem throwing error', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      // Should throw error since component doesn't handle localStorage errors
      expect(() => {
        renderWithProvider(<TestComponentWithStatus />);
      }).toThrow('localStorage error');
    });

    it('handles sequential toggles correctly', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      renderWithProvider(<TestComponentWithStatus />);
      
      expect(screen.getByTestId('status')).toHaveTextContent('true');
      
      // First toggle
      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });
      expect(screen.getByTestId('status')).toHaveTextContent('false');
      
      // Second toggle
      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });
      expect(screen.getByTestId('status')).toHaveTextContent('true');
      
      // Third toggle
      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });
      expect(screen.getByTestId('status')).toHaveTextContent('false');
      
      // Fourth toggle  
      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });
      expect(screen.getByTestId('status')).toHaveTextContent('true');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(4);
    });
  });

  describe('localStorage integration', () => {
    it('only calls localStorage.getItem once on mount', () => {
      mockLocalStorage.getItem.mockReturnValue('false');
      
      renderWithProvider(<TestComponent />);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(1);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('showLocalTime');
    });

    it('does not call localStorage.getItem on re-renders', () => {
      mockLocalStorage.getItem.mockReturnValue('false');
      
      const { rerender } = renderWithProvider(<TestComponent />);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(1);
      
      rerender(
        <TimezoneProvider>
          <TestComponent />
        </TimezoneProvider>
      );
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(1);
    });

    it('saves correct string values to localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('true');
      
      renderWithProvider(<TestComponentWithStatus />);
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('showLocalTime', 'false');
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('showLocalTime', 'true');
    });
  });

  describe('component lifecycle', () => {
    it('initializes correctly on mount', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('timezone-display')).toHaveTextContent('Local');
    });

    it('cleans up properly on unmount', () => {
      mockLocalStorage.getItem.mockReturnValue('true');
      
      const { unmount } = renderWithProvider(<TestComponent />);
      
      expect(() => unmount()).not.toThrow();
    });

    it('handles provider remounting', () => {
      mockLocalStorage.getItem.mockReturnValue('false');
      
      const { rerender } = renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('timezone-display')).toHaveTextContent('UTC');
      
      rerender(
        <TimezoneProvider>
          <TestComponent />
        </TimezoneProvider>
      );
      
      expect(screen.getByTestId('timezone-display')).toHaveTextContent('UTC');
    });
  });
});
