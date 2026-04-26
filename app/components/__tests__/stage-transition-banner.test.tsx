import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StageTransitionBanner } from '../stage-transition-banner';

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material') as any;
  return {
    ...actual,
    alpha: (color: string, _opacity: number) => color
  };
});

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>
}));

describe('StageTransitionBanner', () => {
  it('renders the section label with overline typography', () => {
    render(
      <StageTransitionBanner
        label="PLAYOFFS"
        ctaLabel="Predict Qualified Teams"
        ctaHref="/en/tournaments/t1/qualified-teams"
      />
    );

    expect(screen.getByText('PLAYOFFS')).toBeInTheDocument();
  });

  it('renders the CTA button with the provided ctaLabel', () => {
    render(
      <StageTransitionBanner
        label="PLAYOFFS"
        ctaLabel="Predict Qualified Teams"
        ctaHref="/en/tournaments/t1/qualified-teams"
      />
    );

    expect(screen.getByRole('link', { name: 'Predict Qualified Teams' })).toBeInTheDocument();
  });

  it('renders CTA with "Check your QT Predictions" label when prediction is locked', () => {
    render(
      <StageTransitionBanner
        label="PLAYOFFS"
        ctaLabel="Check your QT Predictions"
        ctaHref="/en/tournaments/t1/qualified-teams"
      />
    );

    expect(screen.getByRole('link', { name: 'Check your QT Predictions' })).toBeInTheDocument();
  });

  it('CTA button links to ctaHref', () => {
    const href = '/en/tournaments/t1/qualified-teams';

    render(
      <StageTransitionBanner
        label="PLAYOFFS"
        ctaLabel="Predict Qualified Teams"
        ctaHref={href}
      />
    );

    const link = screen.getByRole('link', { name: 'Predict Qualified Teams' });
    expect(link).toHaveAttribute('href', href);
  });
});
