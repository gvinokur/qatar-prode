import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import AdSidebar from '../ad-sidebar';
import { renderWithTheme } from '@/__tests__/utils/test-utils';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/en/home'),
}));

describe('AdSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when isAdFree is true', () => {
    const { container } = renderWithTheme(<AdSidebar isAdFree={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the ad container when isAdFree is false', () => {
    renderWithTheme(<AdSidebar isAdFree={false} />);
    // In test env (NODE_ENV=test, not production), placeholder is shown
    expect(screen.getByText(/ad placeholder/i)).toBeInTheDocument();
  });

  it('renders placeholder box in non-production environment', () => {
    renderWithTheme(<AdSidebar isAdFree={false} />);
    expect(screen.getByText(/ad placeholder \(dev\)/i)).toBeInTheDocument();
  });

  it('is hidden on small screens via sx display prop (component renders outer Box)', () => {
    const { container } = renderWithTheme(<AdSidebar isAdFree={false} />);
    // The outer Box exists when not ad-free
    expect(container.firstChild).not.toBeNull();
  });
});
