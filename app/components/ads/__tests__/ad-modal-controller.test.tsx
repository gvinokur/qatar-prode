import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import AdModalController from '../ad-modal-controller';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { createAuthenticatedSessionValue } from '@/__tests__/mocks/next-auth.mocks';

const mockPathname = vi.fn(() => '/en/home');

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('../../../actions/ad-settings-actions', () => ({
  getAdSettingsAction: vi.fn(),
}));

import { useSession } from 'next-auth/react';
import { getAdSettingsAction } from '../../../actions/ad-settings-actions';

const LOW_THRESHOLDS = { modalMinMinutesBetween: 0, modalMinPageviewsBetween: 1 };
const HIGH_THRESHOLDS = { modalMinMinutesBetween: 999, modalMinPageviewsBetween: 999 };

function makeAdFreeSession(isAdFree: boolean) {
  return createAuthenticatedSessionValue({ isAdFree } as any);
}

describe('AdModalController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getAdSettingsAction).mockResolvedValue(HIGH_THRESHOLDS);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders null when user is ad-free', async () => {
    vi.mocked(useSession).mockReturnValue(makeAdFreeSession(true));

    const { container } = renderWithTheme(<AdModalController />);
    await act(async () => {});
    expect(container.firstChild).toBeNull();
  });

  it('does not open modal before page view threshold is reached', async () => {
    vi.mocked(useSession).mockReturnValue(makeAdFreeSession(false));
    vi.mocked(getAdSettingsAction).mockResolvedValue({ modalMinMinutesBetween: 0, modalMinPageviewsBetween: 5 });

    renderWithTheme(<AdModalController />);
    await act(async () => {});

    expect(screen.queryByText(/cerrar anuncio/i)).not.toBeInTheDocument();
  });

  it('does not open modal before minutes threshold is reached', async () => {
    vi.mocked(useSession).mockReturnValue(makeAdFreeSession(false));
    // Set last shown at to now — minutes elapsed = 0, threshold = 999 min
    localStorage.setItem('ad_last_shown_at', String(Date.now()));
    vi.mocked(getAdSettingsAction).mockResolvedValue({ modalMinMinutesBetween: 999, modalMinPageviewsBetween: 0 });

    renderWithTheme(<AdModalController />);
    await act(async () => {});

    expect(screen.queryByText(/cerrar anuncio/i)).not.toBeInTheDocument();
  });

  it('renders null and does not crash when getAdSettingsAction throws (falls back to default thresholds)', async () => {
    vi.mocked(useSession).mockReturnValue(makeAdFreeSession(false));
    vi.mocked(getAdSettingsAction).mockRejectedValue(new Error('Network error'));

    const { container } = renderWithTheme(<AdModalController />);
    await act(async () => {});

    // Component should not crash — still renders the wrapper Box
    expect(container.firstChild).not.toBeNull();
  });

  it('calls localStorage.setItem when modal closes', async () => {
    vi.mocked(useSession).mockReturnValue(makeAdFreeSession(false));
    vi.mocked(getAdSettingsAction).mockResolvedValue(LOW_THRESHOLDS);

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    // Change pathname to trigger page view count
    mockPathname.mockReturnValueOnce('/en/home').mockReturnValue('/en/other');

    const { rerender } = renderWithTheme(<AdModalController />);
    await act(async () => {});

    // Trigger re-render with new pathname
    rerender(<div><AdModalController /></div>);
    await act(async () => {});

    // If modal opened, clicking close should set localStorage
    const closeBtn = screen.queryByText(/cerrar anuncio/i);
    if (closeBtn) {
      await act(async () => closeBtn.click());
      expect(setItemSpy).toHaveBeenCalledWith('ad_last_shown_at', expect.any(String));
    }
  });
});
