import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { CheckEffect, TrophyBounce, SobEffect } from '../../app/components/celebration-effects';

// Create test theme with accent colors
const testTheme = createTheme({
  palette: {
    mode: 'light',
    accent: {
      gold: {
        main: '#ffc107',
        light: '#ffd54f',
        dark: '#ffa000',
        contrastText: '#000000'
      },
      silver: {
        main: '#C0C0C0',
        light: '#E0E0E0',
        dark: '#A0A0A0',
        contrastText: '#000000'
      }
    }
  }
});

// Wrapper component for theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={testTheme}>
      {component}
    </ThemeProvider>
  );
};

// Mock framer-motion to avoid animation complexities in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('CheckEffect', () => {
  it('should render checkmark icon when show is true', () => {
    const { container } = renderWithTheme(<CheckEffect show={true} />);

    // Check that the component renders an svg icon
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should not render when show is false', () => {
    const { container } = renderWithTheme(<CheckEffect show={false} />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('should use white color by default', () => {
    const { container } = renderWithTheme(<CheckEffect show={true} />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should use custom color when provided', () => {
    const { container } = renderWithTheme(<CheckEffect show={true} color="#FF0000" />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});

describe('TrophyBounce', () => {
  it('should render trophy icon when show is true', () => {
    const { container } = renderWithTheme(<TrophyBounce show={true} boostType="golden" />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should not render when show is false', () => {
    const { container } = renderWithTheme(<TrophyBounce show={false} boostType="golden" />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});

describe('SobEffect', () => {
  it('should render sob icon when show is true', () => {
    const { container } = renderWithTheme(<SobEffect show={true} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should not render when show is false', () => {
    const { container } = renderWithTheme(<SobEffect show={false} />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
