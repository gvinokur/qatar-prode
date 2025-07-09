import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import SessionWrapper from '../../app/components/session-wrapper';
import { SessionProvider } from 'next-auth/react';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  SessionProvider: vi.fn(({ children }) => (
    <div data-testid="session-provider">{children}</div>
  )),
}));

// Mock SessionProvider to get access to it
const mockSessionProvider = vi.mocked(SessionProvider);

describe('SessionWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders children within SessionProvider', () => {
      const TestChild = () => <div data-testid="test-child">Test Child</div>;
      
      render(
        <SessionWrapper>
          <TestChild />
        </SessionWrapper>
      );

      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('renders with null children', () => {
      render(<SessionWrapper>{null}</SessionWrapper>);
      
      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
      expect(screen.queryByText('Test Child')).not.toBeInTheDocument();
    });

    it('renders with undefined children', () => {
      render(<SessionWrapper>{undefined}</SessionWrapper>);
      
      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    });

    it('renders with empty children', () => {
      render(<SessionWrapper>{''}</SessionWrapper>);
      
      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
      expect(screen.getByTestId('session-provider')).toHaveTextContent('');
    });

    it('renders with multiple children', () => {
      render(
        <SessionWrapper>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <span data-testid="child-3">Child 3</span>
        </SessionWrapper>
      );

      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });

  describe('SessionProvider integration', () => {
    it('calls SessionProvider with correct props', () => {
      const TestChild = () => <div>Test Child</div>;
      
      render(
        <SessionWrapper>
          <TestChild />
        </SessionWrapper>
      );

      expect(mockSessionProvider).toHaveBeenCalledWith(
        {
          children: expect.any(Object),
        },
        undefined
      );
    });

    it('passes children to SessionProvider', () => {
      const TestChild = () => <div data-testid="test-child">Test Child</div>;
      
      render(
        <SessionWrapper>
          <TestChild />
        </SessionWrapper>
      );

      expect(mockSessionProvider).toHaveBeenCalledTimes(1);
      
      // Verify that the children prop contains the TestChild component
      const call = mockSessionProvider.mock.calls[0];
      const props = call[0];
      expect(props.children).toBeDefined();
    });

    it('does not pass any additional props to SessionProvider', () => {
      const TestChild = () => <div>Test Child</div>;
      
      render(
        <SessionWrapper>
          <TestChild />
        </SessionWrapper>
      );

      expect(mockSessionProvider).toHaveBeenCalledWith(
        {
          children: expect.any(Object),
        },
        undefined
      );

      // Check that only children prop is passed
      const call = mockSessionProvider.mock.calls[0];
      const props = call[0];
      const propKeys = Object.keys(props);
      expect(propKeys).toEqual(['children']);
    });
  });

  describe('component structure', () => {
    it('renders as a client component', () => {
      // This is implicitly tested by the "use client" directive
      // We can verify the component renders without SSR issues
      const TestChild = () => <div data-testid="test-child">Test Child</div>;
      
      expect(() => {
        render(
          <SessionWrapper>
            <TestChild />
          </SessionWrapper>
        );
      }).not.toThrow();
    });

    it('maintains proper component hierarchy', () => {
      const TestChild = () => <div data-testid="test-child">Test Child</div>;
      
      render(
        <SessionWrapper>
          <TestChild />
        </SessionWrapper>
      );

      const sessionProvider = screen.getByTestId('session-provider');
      const testChild = screen.getByTestId('test-child');
      
      expect(sessionProvider).toContainElement(testChild);
    });

    it('preserves child component props and state', () => {
      const TestChild = ({ message }: { message: string }) => (
        <div data-testid="test-child">{message}</div>
      );
      
      render(
        <SessionWrapper>
          <TestChild message="Hello World" />
        </SessionWrapper>
      );

      expect(screen.getByTestId('test-child')).toHaveTextContent('Hello World');
    });
  });

  describe('edge cases', () => {
    it('handles React fragments as children', () => {
      render(
        <SessionWrapper>
          <React.Fragment>
            <div data-testid="fragment-child-1">Fragment Child 1</div>
            <div data-testid="fragment-child-2">Fragment Child 2</div>
          </React.Fragment>
        </SessionWrapper>
      );

      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
      expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument();
    });

    it('handles array of children', () => {
      const childrenArray = [
        <div key="1" data-testid="array-child-1">Array Child 1</div>,
        <div key="2" data-testid="array-child-2">Array Child 2</div>,
      ];
      
      render(
        <SessionWrapper>
          {childrenArray}
        </SessionWrapper>
      );

      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
      expect(screen.getByTestId('array-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('array-child-2')).toBeInTheDocument();
    });

    it('handles nested components', () => {
      const NestedChild = () => (
        <div data-testid="nested-wrapper">
          <div data-testid="nested-child">Nested Child</div>
        </div>
      );
      
      render(
        <SessionWrapper>
          <NestedChild />
        </SessionWrapper>
      );

      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
      expect(screen.getByTestId('nested-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('nested-child')).toBeInTheDocument();
      expect(screen.getByText('Nested Child')).toBeInTheDocument();
    });

    it('handles conditional rendering of children', () => {
      const showChild = true;
      
      render(
        <SessionWrapper>
          {showChild && <div data-testid="conditional-child">Conditional Child</div>}
        </SessionWrapper>
      );

      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
      expect(screen.getByTestId('conditional-child')).toBeInTheDocument();
    });

    it('handles false conditional rendering', () => {
      const showChild = false;
      
      render(
        <SessionWrapper>
          {showChild && <div data-testid="conditional-child">Conditional Child</div>}
        </SessionWrapper>
      );

      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
      expect(screen.queryByTestId('conditional-child')).not.toBeInTheDocument();
    });
  });

  describe('TypeScript type safety', () => {
    it('accepts ReactNode children', () => {
      // This test verifies the TypeScript interface is working correctly
      const stringChild = 'String child';
      const numberChild = 42;
      const booleanChild = true;
      
      expect(() => {
        render(
          <SessionWrapper>
            {stringChild}
            {numberChild}
            {booleanChild && <div>Boolean child</div>}
          </SessionWrapper>
        );
      }).not.toThrow();
    });

    it('renders string children correctly', () => {
      const textContent = 'This is a string child';
      
      render(
        <SessionWrapper>
          {textContent}
        </SessionWrapper>
      );

      expect(screen.getByTestId('session-provider')).toHaveTextContent(textContent);
    });

    it('renders number children correctly', () => {
      const numberContent = 123;
      
      render(
        <SessionWrapper>
          {numberContent}
        </SessionWrapper>
      );

      expect(screen.getByTestId('session-provider')).toHaveTextContent('123');
    });
  });

  describe('component behavior', () => {
    it('re-renders when children change', () => {
      const { rerender } = render(
        <SessionWrapper>
          <div data-testid="child">Initial Child</div>
        </SessionWrapper>
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Initial Child');

      rerender(
        <SessionWrapper>
          <div data-testid="child">Updated Child</div>
        </SessionWrapper>
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Updated Child');
    });

    it('maintains SessionProvider across re-renders', () => {
      const { rerender } = render(
        <SessionWrapper>
          <div>Initial</div>
        </SessionWrapper>
      );

      expect(screen.getByTestId('session-provider')).toBeInTheDocument();

      rerender(
        <SessionWrapper>
          <div>Updated</div>
        </SessionWrapper>
      );

      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
      expect(mockSessionProvider).toHaveBeenCalledTimes(2);
    });
  });

  describe('accessibility', () => {
    it('preserves accessibility attributes from children', () => {
      render(
        <SessionWrapper>
          <button aria-label="Test button" data-testid="accessible-button">
            Accessible Button
          </button>
        </SessionWrapper>
      );

      const button = screen.getByTestId('accessible-button');
      expect(button).toHaveAttribute('aria-label', 'Test button');
      expect(button).toHaveAccessibleName('Test button');
    });

    it('does not interfere with child component accessibility', () => {
      render(
        <SessionWrapper>
          <div role="main" aria-labelledby="main-title">
            <h1 id="main-title">Main Content</h1>
          </div>
        </SessionWrapper>
      );

      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveAttribute('aria-labelledby', 'main-title');
    });
  });

  describe('performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const renderCount = vi.fn();
      const TestChild = () => {
        renderCount();
        return <div data-testid="test-child">Test Child</div>;
      };

      const { rerender } = render(
        <SessionWrapper>
          <TestChild />
        </SessionWrapper>
      );

      expect(renderCount).toHaveBeenCalledTimes(1);

      // Re-render with same children
      rerender(
        <SessionWrapper>
          <TestChild />
        </SessionWrapper>
      );

      // TestChild should render again because it's a new instance
      expect(renderCount).toHaveBeenCalledTimes(2);
    });
  });
});
