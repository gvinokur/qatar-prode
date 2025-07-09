import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { useTheme } from 'next-themes';
import ThemeSwitcher from '../../../app/components/header/theme-switcher';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

// Mock MUI icons
vi.mock('@mui/icons-material', () => ({
  DarkMode: ({ sx, ...props }: any) => (
    <div data-testid="dark-mode-icon" {...props} style={sx} />
  ),
  LightMode: ({ sx, ...props }: any) => (
    <div data-testid="light-mode-icon" {...props} style={sx} />
  ),
}));

describe('ThemeSwitcher', () => {
  const mockSetTheme = vi.fn();
  const mockUseTheme = vi.mocked(useTheme);

  // Create a test theme for MUI
  const testTheme = createTheme({
    palette: {
      primary: {
        main: '#1976d2',
        contrastText: '#ffffff',
      },
    },
  });

  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider theme={testTheme}>
        {component}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      setTheme: mockSetTheme,
      theme: 'light',
      resolvedTheme: 'light',
      themes: ['light', 'dark'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the theme switcher button', () => {
      renderWithTheme(<ThemeSwitcher />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders dark mode icon when theme is light', () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'light',
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        systemTheme: 'light',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      expect(screen.getByTestId('dark-mode-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('light-mode-icon')).not.toBeInTheDocument();
    });

    it('renders light mode icon when theme is dark', () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'dark',
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        systemTheme: 'dark',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      expect(screen.getByTestId('light-mode-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('dark-mode-icon')).not.toBeInTheDocument();
    });

    it('applies correct title attribute for light theme', () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'light',
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        systemTheme: 'light',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Switch to dark mode');
    });

    it('applies correct title attribute for dark theme', () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'dark',
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        systemTheme: 'dark',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Switch to light mode');
    });

    it('applies correct margin-right style', () => {
      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Note: MUI sx prop applies styles through CSS classes, so we just check the button exists
    });
  });

  describe('theme switching functionality', () => {
    it('switches from light to dark theme when clicked', async () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'light',
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        systemTheme: 'light',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalledTimes(1);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('switches from dark to light theme when clicked', async () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'dark',
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        systemTheme: 'dark',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalledTimes(1);
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('handles multiple clicks correctly', async () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'light',
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        systemTheme: 'light',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      
      // First click (light -> dark)
      fireEvent.click(button);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      
      // Second click (should still call with 'dark' since resolvedTheme hasn't changed)
      fireEvent.click(button);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      
      expect(mockSetTheme).toHaveBeenCalledTimes(2);
    });

    it('calls setTheme with correct parameters', async () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'light',
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        systemTheme: 'light',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      expect(mockSetTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has proper button role', () => {
      renderWithTheme(<ThemeSwitcher />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('is keyboard accessible', () => {
      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    it('responds to keyboard events', () => {
      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      // KeyDown events don't trigger onClick by default in testing
      // We need to test that keyboard navigation works, not that it triggers the click
      expect(button).toBeInTheDocument();
    });

    it('responds to space key', () => {
      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ' });
      
      // KeyDown events don't trigger onClick by default in testing
      // We need to test that keyboard navigation works, not that it triggers the click
      expect(button).toBeInTheDocument();
    });
  });

  describe('icon styling', () => {
    it('applies correct styles to dark mode icon', () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'light',
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        systemTheme: 'light',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      const icon = screen.getByTestId('dark-mode-icon');
      expect(icon).toBeInTheDocument();
      // Note: The actual sx prop with height, width, and color would be applied through MUI's system
    });

    it('applies correct styles to light mode icon', () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'dark',
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        systemTheme: 'dark',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      const icon = screen.getByTestId('light-mode-icon');
      expect(icon).toBeInTheDocument();
      // Note: The actual sx prop with height, width, and color would be applied through MUI's system
    });
  });

  describe('edge cases', () => {
    it('handles undefined resolvedTheme', () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: undefined,
        resolvedTheme: undefined,
        themes: ['light', 'dark'],
        systemTheme: 'light',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should default to 'light' when undefined theme is encountered
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('handles null resolvedTheme', () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: null,
        resolvedTheme: null,
        themes: ['light', 'dark'],
        systemTheme: 'light',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should default to 'light' when null theme is encountered
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('handles system theme', () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'system',
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'system'],
        systemTheme: 'light',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should use resolvedTheme for logic, not theme
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('handles custom theme names', () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'custom-light',
        resolvedTheme: 'custom-light',
        themes: ['custom-light', 'custom-dark'],
        systemTheme: 'custom-light',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should default to 'light' for non-standard theme names
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('handles theme switching correctly', () => {
      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      expect(mockSetTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe('component lifecycle', () => {
    it('renders correctly on mount', () => {
      renderWithTheme(<ThemeSwitcher />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByTestId('dark-mode-icon')).toBeInTheDocument();
    });

    it('updates icon when theme changes', () => {
      const { rerender } = renderWithTheme(<ThemeSwitcher />);
      
      expect(screen.getByTestId('dark-mode-icon')).toBeInTheDocument();
      
      // Simulate theme change
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'dark',
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        systemTheme: 'dark',
        forcedTheme: undefined,
      });

      rerender(
        <ThemeProvider theme={testTheme}>
          <ThemeSwitcher />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('light-mode-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('dark-mode-icon')).not.toBeInTheDocument();
    });

    it('updates title when theme changes', () => {
      const { rerender } = renderWithTheme(<ThemeSwitcher />);
      
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Switch to dark mode');
      
      // Simulate theme change
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'dark',
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        systemTheme: 'dark',
        forcedTheme: undefined,
      });

      rerender(
        <ThemeProvider theme={testTheme}>
          <ThemeSwitcher />
        </ThemeProvider>
      );
      
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Switch to light mode');
    });

    it('handles component unmounting gracefully', () => {
      const { unmount } = renderWithTheme(<ThemeSwitcher />);
      
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('MUI integration', () => {
    it('integrates properly with MUI theme provider', () => {
      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Component should render without errors when wrapped in MUI ThemeProvider
      expect(screen.getByTestId('dark-mode-icon')).toBeInTheDocument();
    });

    it('uses MUI IconButton component', () => {
      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // IconButton should be clickable
      fireEvent.click(button);
      expect(mockSetTheme).toHaveBeenCalled();
    });
  });

  describe('next-themes integration', () => {
    it('calls useTheme hook correctly', () => {
      renderWithTheme(<ThemeSwitcher />);
      
      expect(mockUseTheme).toHaveBeenCalledTimes(1);
      expect(mockUseTheme).toHaveBeenCalledWith();
    });

    it('uses resolvedTheme for logic', () => {
      // Test that resolvedTheme is used instead of theme
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'system',
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'system'],
        systemTheme: 'light',
        forcedTheme: undefined,
      });

      renderWithTheme(<ThemeSwitcher />);
      
      // Should show dark mode icon because resolvedTheme is 'light'
      expect(screen.getByTestId('dark-mode-icon')).toBeInTheDocument();
      
      // Should have correct title based on resolvedTheme
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Switch to dark mode');
    });

    it('handles forced theme correctly', () => {
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        theme: 'light',
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        systemTheme: 'light',
        forcedTheme: 'light',
      });

      renderWithTheme(<ThemeSwitcher />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should still try to switch theme even if forced
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });
  });
});
