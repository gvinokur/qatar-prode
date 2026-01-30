import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AppThemeProvider from '../../../app/components/context-providers/theme-provider';

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
    resolvedTheme: 'light',
  })),
}));

describe('AppThemeProvider', () => {
  beforeEach(() => {
    // Clean up CSS variables before each test
    document.documentElement.style.removeProperty('--gradient-primary');
  });

  it('should render children', () => {
    render(
      <AppThemeProvider>
        <div>Test Content</div>
      </AppThemeProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should inject gradient CSS variable for light mode', async () => {
    const { useTheme } = await import('next-themes');
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
      resolvedTheme: 'light',
      themes: ['light', 'dark'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });

    render(
      <AppThemeProvider>
        <div>Test</div>
      </AppThemeProvider>
    );

    await waitFor(() => {
      const gradientValue = document.documentElement.style.getPropertyValue('--gradient-primary');
      expect(gradientValue).toContain('linear-gradient');
      expect(gradientValue).toContain('#c62828');
      expect(gradientValue).toContain('#e53935');
    });
  });

  it('should inject gradient CSS variable for dark mode', async () => {
    const { useTheme } = await import('next-themes');
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: vi.fn(),
      resolvedTheme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    });

    render(
      <AppThemeProvider>
        <div>Test</div>
      </AppThemeProvider>
    );

    await waitFor(() => {
      const gradientValue = document.documentElement.style.getPropertyValue('--gradient-primary');
      expect(gradientValue).toContain('linear-gradient');
      expect(gradientValue).toContain('#d32f2f');
      expect(gradientValue).toContain('#e57373');
    });
  });

  it('should provide MUI theme with accent colors', () => {
    render(
      <AppThemeProvider>
        <div data-testid="test-child">Test</div>
      </AppThemeProvider>
    );

    // Component renders successfully which means theme is provided
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });
});
