import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PredictionStatusHeader } from '../prediction-status-header';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import type { StatusHeaderVariant } from '../types';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('../../boost-badge', () => ({
  BoostCountBadge: () => null,
}));

const baseVariant: StatusHeaderVariant = {
  tone: 'brand',
  leadIcon: 'rocket',
  statusText: 'Get your picks in',
};

describe('PredictionStatusHeader', () => {
  it('does not render expanded section when message is absent', () => {
    renderWithTheme(<PredictionStatusHeader variant={baseVariant} />);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(screen.queryByText(/install/i)).not.toBeInTheDocument();
  });

  it('renders expanded section with message when message is provided', () => {
    const variant: StatusHeaderVariant = {
      ...baseVariant,
      message: 'Install the app for instant notifications',
    };
    renderWithTheme(<PredictionStatusHeader variant={variant} />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByText('Install the app for instant notifications')).toBeInTheDocument();
  });

  it('renders no buttons in expanded section when action is absent', () => {
    const variant: StatusHeaderVariant = {
      ...baseVariant,
      message: 'Some message with no action',
    };
    renderWithTheme(<PredictionStatusHeader variant={variant} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders single button in expanded section for single-action variant', () => {
    const variant: StatusHeaderVariant = {
      ...baseVariant,
      message: 'Install the app for instant notifications',
      action: { label: 'Install', onClick: vi.fn() },
    };
    renderWithTheme(<PredictionStatusHeader variant={variant} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Install');
  });

  it('renders two buttons in expanded section for both-action variant', () => {
    const variant: StatusHeaderVariant = {
      ...baseVariant,
      message: 'Complete your predictions before the deadline',
      action: { label: 'Predict', onClick: vi.fn() },
      secondaryAction: { label: 'Dismiss', onClick: vi.fn() },
    };
    renderWithTheme(<PredictionStatusHeader variant={variant} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Predict');
    expect(buttons[1]).toHaveTextContent('Dismiss');
  });

  it('renders collapsed action as text button in top strip when no message', () => {
    const variant: StatusHeaderVariant = {
      ...baseVariant,
      action: { label: 'View', href: '/tournament' },
    };
    renderWithTheme(<PredictionStatusHeader variant={variant} />);
    const link = screen.getByRole('link', { name: 'View' });
    expect(link).toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});
