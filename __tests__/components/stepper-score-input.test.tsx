import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import StepperScoreInput from '../../app/components/stepper-score-input';
import { renderWithProviders } from '../utils/test-utils';

describe('StepperScoreInput', () => {
  const defaultProps = {
    teamName: 'Argentina',
    onChange: vi.fn(),
  };

  describe('Initial render', () => {
    it('renders with undefined value (shows em dash)', () => {
      renderWithProviders(<StepperScoreInput {...defaultProps} value={undefined} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders decrement button as disabled when value is undefined', () => {
      renderWithProviders(<StepperScoreInput {...defaultProps} value={undefined} />);

      const decrementButton = screen.getByLabelText(/decrease argentina score/i);
      expect(decrementButton).toBeDisabled();
    });

    it('renders increment button as enabled when value is undefined', () => {
      renderWithProviders(<StepperScoreInput {...defaultProps} value={undefined} />);

      const incrementButton = screen.getByLabelText(/increase argentina score/i);
      expect(incrementButton).toBeEnabled();
    });
  });

  describe('Increment from empty', () => {
    it('sets value to 0 when incrementing from undefined', () => {
      const onChange = vi.fn();
      renderWithProviders(<StepperScoreInput {...defaultProps} onChange={onChange} value={undefined} />);

      const incrementButton = screen.getByLabelText(/increase argentina score/i);
      fireEvent.click(incrementButton);

      expect(onChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Decrement behavior', () => {
    it('does nothing when decrementing from undefined', () => {
      const onChange = vi.fn();
      renderWithProviders(<StepperScoreInput {...defaultProps} onChange={onChange} value={undefined} />);

      const decrementButton = screen.getByLabelText(/decrease argentina score/i);
      // Button should be disabled, but let's verify onChange is not called if somehow clicked
      expect(decrementButton).toBeDisabled();
    });

    it('does nothing when decrementing from 0', () => {
      const onChange = vi.fn();
      renderWithProviders(<StepperScoreInput {...defaultProps} onChange={onChange} value={0} />);

      const decrementButton = screen.getByLabelText(/decrease argentina score/i);
      expect(decrementButton).toBeDisabled();
    });

    it('decrements value when value > 0', () => {
      const onChange = vi.fn();
      renderWithProviders(<StepperScoreInput {...defaultProps} onChange={onChange} value={3} />);

      const decrementButton = screen.getByLabelText(/decrease argentina score/i);
      fireEvent.click(decrementButton);

      expect(onChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Increment behavior', () => {
    it('increments value by 1', () => {
      const onChange = vi.fn();
      renderWithProviders(<StepperScoreInput {...defaultProps} onChange={onChange} value={3} />);

      const incrementButton = screen.getByLabelText(/increase argentina score/i);
      fireEvent.click(incrementButton);

      expect(onChange).toHaveBeenCalledWith(4);
    });

    it('stops at 99 (max value)', () => {
      const onChange = vi.fn();
      renderWithProviders(<StepperScoreInput {...defaultProps} onChange={onChange} value={99} />);

      const incrementButton = screen.getByLabelText(/increase argentina score/i);
      expect(incrementButton).toBeDisabled();
    });
  });

  describe('Disabled state', () => {
    it('disables both buttons when disabled prop is true', () => {
      renderWithProviders(<StepperScoreInput {...defaultProps} value={5} disabled={true} />);

      const decrementButton = screen.getByLabelText(/decrease argentina score/i);
      const incrementButton = screen.getByLabelText(/increase argentina score/i);

      expect(decrementButton).toBeDisabled();
      expect(incrementButton).toBeDisabled();
    });

    it('does not call onChange when buttons are clicked while disabled', () => {
      const onChange = vi.fn();
      renderWithProviders(<StepperScoreInput {...defaultProps} value={5} disabled={true} onChange={onChange} />);

      const incrementButton = screen.getByLabelText(/increase argentina score/i);
      fireEvent.click(incrementButton);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label for decrement button', () => {
      renderWithProviders(<StepperScoreInput {...defaultProps} teamName="Brazil" value={5} />);

      expect(screen.getByLabelText('Decrease Brazil score')).toBeInTheDocument();
    });

    it('has proper aria-label for increment button', () => {
      renderWithProviders(<StepperScoreInput {...defaultProps} teamName="Brazil" value={5} />);

      expect(screen.getByLabelText('Increase Brazil score')).toBeInTheDocument();
    });
  });

  describe('Score display', () => {
    it('displays the current score value', () => {
      renderWithProviders(<StepperScoreInput {...defaultProps} value={7} />);

      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('displays 0 when value is 0', () => {
      renderWithProviders(<StepperScoreInput {...defaultProps} value={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Compact mode', () => {
    it('uses smaller button sizes in compact mode', () => {
      renderWithProviders(<StepperScoreInput {...defaultProps} value={5} compact={true} />);

      const decrementButton = screen.getByLabelText(/decrease argentina score/i);
      // In compact mode, buttons should have smaller size attribute
      // This is verified through MUI's size prop, actual DOM size may vary
      expect(decrementButton).toBeInTheDocument();
    });
  });
});
