import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import StepCard from '../StepCard';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import CreateIcon from '@mui/icons-material/Create';

describe('StepCard', () => {
  const defaultProps = {
    stepNumber: 1,
    icon: <CreateIcon />,
    title: 'Test Step',
    description: 'This is a test description',
    tip: 'This is a test tip'
  };

  it('renders all content correctly', () => {
    renderWithTheme(<StepCard {...defaultProps} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Test Step')).toBeInTheDocument();
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
    expect(screen.getByText(/This is a test tip/)).toBeInTheDocument();
  });

  it('displays the step number badge', () => {
    renderWithTheme(<StepCard {...defaultProps} />);

    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('displays the icon', () => {
    renderWithTheme(<StepCard {...defaultProps} />);

    const icon = screen.getByTestId('CreateIcon');
    expect(icon).toBeInTheDocument();
  });

  it('displays the tip with "Tip:" prefix', () => {
    renderWithTheme(<StepCard {...defaultProps} />);

    expect(screen.getByText(/Tip:/)).toBeInTheDocument();
    expect(screen.getByText(/This is a test tip/)).toBeInTheDocument();
  });

  it('renders different step numbers', () => {
    const { rerender } = renderWithTheme(<StepCard {...defaultProps} stepNumber={3} />);

    expect(screen.getByText('3')).toBeInTheDocument();

    rerender(<StepCard {...defaultProps} stepNumber={4} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
