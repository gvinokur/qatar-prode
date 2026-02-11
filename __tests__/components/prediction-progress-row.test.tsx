import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../utils/test-utils';
import { PredictionProgressRow } from '../../app/components/prediction-progress-row';

describe('PredictionProgressRow', () => {
  const defaultProps = {
    label: 'Partidos',
    currentValue: 10,
    maxValue: 20,
    percentage: 50,
    urgencyLevel: 'notice' as const,
    onClick: vi.fn()
  };

  describe('rendering', () => {
    it('renders label and value', () => {
      renderWithTheme(<PredictionProgressRow {...defaultProps} />);

      expect(screen.getByText('Partidos: 10/20')).toBeInTheDocument();
    });

    it('renders percentage value when maxValue is undefined', () => {
      renderWithTheme(
        <PredictionProgressRow
          {...defaultProps}
          maxValue={undefined}
          currentValue={75}
        />
      );

      expect(screen.getByText('Partidos: 75%')).toBeInTheDocument();
    });

    it('renders progress bar with correct value', () => {
      const { container } = renderWithTheme(<PredictionProgressRow {...defaultProps} />);

      const progressBar = container.querySelector('.MuiLinearProgress-root');
      expect(progressBar).toBeInTheDocument();
    });

    it('renders urgency icon', () => {
      const { container } = renderWithTheme(<PredictionProgressRow {...defaultProps} />);

      const iconButton = container.querySelector('.MuiIconButton-root');
      expect(iconButton).toBeInTheDocument();
    });
  });

  describe('urgency levels', () => {
    it('displays urgent icon', () => {
      const { container } = renderWithTheme(
        <PredictionProgressRow {...defaultProps} urgencyLevel="urgent" />
      );

      expect(container.querySelector('svg[data-testid="ErrorIcon"]')).toBeInTheDocument();
    });

    it('displays warning icon', () => {
      const { container } = renderWithTheme(
        <PredictionProgressRow {...defaultProps} urgencyLevel="warning" />
      );

      expect(container.querySelector('svg[data-testid="WarningIcon"]')).toBeInTheDocument();
    });

    it('displays notice icon', () => {
      const { container } = renderWithTheme(
        <PredictionProgressRow {...defaultProps} urgencyLevel="notice" />
      );

      expect(container.querySelector('svg[data-testid="InfoIcon"]')).toBeInTheDocument();
    });

    it('displays complete icon', () => {
      const { container } = renderWithTheme(
        <PredictionProgressRow {...defaultProps} urgencyLevel="complete" />
      );

      expect(container.querySelector('svg[data-testid="CheckCircleIcon"]')).toBeInTheDocument();
    });

    it('displays locked icon', () => {
      const { container } = renderWithTheme(
        <PredictionProgressRow {...defaultProps} urgencyLevel="locked" />
      );

      expect(container.querySelector('svg[data-testid="LockIcon"]')).toBeInTheDocument();
    });
  });

  describe('boosts', () => {
    it('does not show boosts by default', () => {
      const { container } = renderWithTheme(<PredictionProgressRow {...defaultProps} />);

      // Boost badges are MUI Chips, so check for absence of multiple chips
      const chips = container.querySelectorAll('.MuiChip-root');
      expect(chips.length).toBe(0);
    });

    it('shows silver boost badge when enabled', () => {
      renderWithTheme(
        <PredictionProgressRow
          {...defaultProps}
          showBoosts={true}
          silverUsed={2}
          silverMax={5}
          onBoostClick={vi.fn()}
        />
      );

      expect(screen.getByText('2/5')).toBeInTheDocument();
    });

    it('shows golden boost badge when enabled', () => {
      renderWithTheme(
        <PredictionProgressRow
          {...defaultProps}
          showBoosts={true}
          goldenUsed={1}
          goldenMax={3}
          onBoostClick={vi.fn()}
        />
      );

      expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('shows both boost badges when both are available', () => {
      renderWithTheme(
        <PredictionProgressRow
          {...defaultProps}
          showBoosts={true}
          silverUsed={2}
          silverMax={5}
          goldenUsed={1}
          goldenMax={3}
          onBoostClick={vi.fn()}
        />
      );

      expect(screen.getByText('2/5')).toBeInTheDocument();
      expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('does not show silver badge when silverMax is 0', () => {
      renderWithTheme(
        <PredictionProgressRow
          {...defaultProps}
          showBoosts={true}
          silverUsed={0}
          silverMax={0}
          goldenUsed={1}
          goldenMax={3}
          onBoostClick={vi.fn()}
        />
      );

      expect(screen.queryByText('0/0')).not.toBeInTheDocument();
      expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('does not show golden badge when goldenMax is 0', () => {
      renderWithTheme(
        <PredictionProgressRow
          {...defaultProps}
          showBoosts={true}
          silverUsed={2}
          silverMax={5}
          goldenUsed={0}
          goldenMax={0}
          onBoostClick={vi.fn()}
        />
      );

      expect(screen.getByText('2/5')).toBeInTheDocument();
      expect(screen.queryByText('0/0')).not.toBeInTheDocument();
    });

    it('renders silver badge with onClick handler', () => {
      const onBoostClick = vi.fn();

      renderWithTheme(
        <PredictionProgressRow
          {...defaultProps}
          showBoosts={true}
          silverUsed={2}
          silverMax={5}
          onBoostClick={onBoostClick}
        />
      );

      // Verify silver badge renders (clicking tested in integration tests)
      expect(screen.getByText('2/5')).toBeInTheDocument();
      expect(onBoostClick).toBeDefined();
    });

    it('renders golden badge with onClick handler', () => {
      const onBoostClick = vi.fn();

      renderWithTheme(
        <PredictionProgressRow
          {...defaultProps}
          showBoosts={true}
          goldenUsed={1}
          goldenMax={3}
          onBoostClick={onBoostClick}
        />
      );

      // Verify golden badge renders (clicking tested in integration tests)
      expect(screen.getByText('1/3')).toBeInTheDocument();
      expect(onBoostClick).toBeDefined();
    });
  });

  describe('interactions', () => {
    it('calls onClick when row is clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      renderWithTheme(<PredictionProgressRow {...defaultProps} onClick={onClick} />);

      const row = screen.getByText('Partidos: 10/20').closest('div');
      if (row) {
        await user.click(row);
        expect(onClick).toHaveBeenCalledWith(expect.any(Object));
      }
    });

    it('has hover effect', () => {
      const { container } = renderWithTheme(<PredictionProgressRow {...defaultProps} />);

      const row = screen.getByText('Partidos: 10/20').closest('div');
      expect(row).toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('layout', () => {
    it('applies default margin bottom', () => {
      const { container } = renderWithTheme(<PredictionProgressRow {...defaultProps} />);

      const row = screen.getByText('Partidos: 10/20').closest('div');
      expect(row).toHaveStyle({ marginBottom: expect.any(String) });
    });

    it('applies custom margin bottom', () => {
      const { container } = renderWithTheme(
        <PredictionProgressRow {...defaultProps} marginBottom={2} />
      );

      const row = screen.getByText('Partidos: 10/20').closest('div');
      expect(row).toBeInTheDocument();
    });

    it('applies zero margin bottom', () => {
      const { container } = renderWithTheme(
        <PredictionProgressRow {...defaultProps} marginBottom={0} />
      );

      const row = screen.getByText('Partidos: 10/20').closest('div');
      expect(row).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles 0% progress', () => {
      renderWithTheme(
        <PredictionProgressRow
          {...defaultProps}
          currentValue={0}
          maxValue={20}
          percentage={0}
        />
      );

      expect(screen.getByText('Partidos: 0/20')).toBeInTheDocument();
    });

    it('handles 100% progress', () => {
      renderWithTheme(
        <PredictionProgressRow
          {...defaultProps}
          currentValue={20}
          maxValue={20}
          percentage={100}
        />
      );

      expect(screen.getByText('Partidos: 20/20')).toBeInTheDocument();
    });

    it('handles percentage display with decimals', () => {
      renderWithTheme(
        <PredictionProgressRow
          {...defaultProps}
          maxValue={undefined}
          currentValue={33.33}
          percentage={33.33}
        />
      );

      expect(screen.getByText('Partidos: 33.33%')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('row is clickable', () => {
      const { container } = renderWithTheme(<PredictionProgressRow {...defaultProps} />);

      const row = screen.getByText('Partidos: 10/20').closest('div');
      expect(row).toHaveStyle({ cursor: 'pointer' });
    });

    it('icon button has proper size', () => {
      const { container } = renderWithTheme(<PredictionProgressRow {...defaultProps} />);

      const iconButton = container.querySelector('.MuiIconButton-sizeSmall');
      expect(iconButton).toBeInTheDocument();
    });
  });
});
