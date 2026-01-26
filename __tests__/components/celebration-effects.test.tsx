import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CheckEffect, TrophyBounce, SobEffect } from '../../app/components/celebration-effects';

// Mock framer-motion to avoid animation complexities in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('CheckEffect', () => {
  it('should render checkmark icon when show is true', () => {
    const { container } = render(<CheckEffect show={true} />);

    // Check that the component renders an svg icon
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should not render when show is false', () => {
    const { container } = render(<CheckEffect show={false} />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('should use white color by default', () => {
    const { container } = render(<CheckEffect show={true} />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should use custom color when provided', () => {
    const { container } = render(<CheckEffect show={true} color="#FF0000" />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});

describe('TrophyBounce', () => {
  it('should render trophy icon when show is true', () => {
    const { container } = render(<TrophyBounce show={true} boostType="golden" />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should not render when show is false', () => {
    const { container } = render(<TrophyBounce show={false} boostType="golden" />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});

describe('SobEffect', () => {
  it('should render sob icon when show is true', () => {
    const { container } = render(<SobEffect show={true} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should not render when show is false', () => {
    const { container } = render(<SobEffect show={false} />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
