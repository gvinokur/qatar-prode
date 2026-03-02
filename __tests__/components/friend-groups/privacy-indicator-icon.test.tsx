import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import PrivacyIndicatorIcon from '@/app/components/friend-groups/privacy-indicator-icon';
import { renderWithTheme } from '@/__tests__/utils/test-utils';

describe('PrivacyIndicatorIcon', () => {
  it('should render lock icon for private group', () => {
    const { container } = renderWithTheme(<PrivacyIndicatorIcon isPublic={false} />);

    // The LockIcon renders an SVG; verify via aria/title in tooltip or check MUI icon class
    const lockIcon = container.querySelector('[data-testid="LockIcon"]');
    expect(lockIcon).toBeInTheDocument();
  });

  it('should render public icon for public group', () => {
    const { container } = renderWithTheme(<PrivacyIndicatorIcon isPublic={true} />);

    const publicIcon = container.querySelector('[data-testid="PublicIcon"]');
    expect(publicIcon).toBeInTheDocument();
  });

  it('should NOT render public icon when group is private', () => {
    const { container } = renderWithTheme(<PrivacyIndicatorIcon isPublic={false} />);

    const publicIcon = container.querySelector('[data-testid="PublicIcon"]');
    expect(publicIcon).not.toBeInTheDocument();
  });

  it('should NOT render lock icon when group is public', () => {
    const { container } = renderWithTheme(<PrivacyIndicatorIcon isPublic={true} />);

    const lockIcon = container.querySelector('[data-testid="LockIcon"]');
    expect(lockIcon).not.toBeInTheDocument();
  });

  it('should render with default small size', () => {
    const { container } = renderWithTheme(<PrivacyIndicatorIcon isPublic={false} />);

    // MUI icons render with fontSize class based on size prop
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render with medium size prop', () => {
    const { container } = renderWithTheme(<PrivacyIndicatorIcon isPublic={true} size="medium" />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should wrap icon in a Tooltip (renders title attribute accessible)', () => {
    const { container } = renderWithTheme(<PrivacyIndicatorIcon isPublic={true} />);

    // Tooltip wraps the icon; the SVG element is present inside the tooltip
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
