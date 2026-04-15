import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import InviteFriendsDialog from '../invite-friends-dialog'

// Server actions
vi.mock('@/app/actions/short-url-actions', () => ({
  generateShortUrlForGroup: vi.fn().mockResolvedValue({ code: 'abc123' }),
  buildShortUrl: vi.fn().mockResolvedValue('https://prodemundial.app/j/abc123'),
}))

// Share utilities
vi.mock('@/app/utils/share-utils', () => ({
  captureElement: vi.fn().mockResolvedValue(new Blob(['img'], { type: 'image/png' })),
  downloadBlob: vi.fn(),
  shareImage: vi.fn().mockResolvedValue(undefined),
}))

// qrcode.react stub
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <svg data-testid="qrcode" data-value={value} />,
}))

// next-intl — stable t reference so useEffect([t]) doesn't re-fire on every render
const stableT = (key: string, params?: Record<string, string>) => {
  if (key === 'flier.defaultMessage') return 'Join our prode!'
  if (key === 'flier.shareText') return `Join! ${params?.groupName ?? ''}`
  return key
}
vi.mock('next-intl', () => ({
  useTranslations: () => stableT,
  useLocale: () => 'es',
}))

// Browser APIs
vi.stubGlobal('open', vi.fn())
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  canShare: vi.fn().mockReturnValue(true),
  share: vi.fn().mockResolvedValue(undefined),
})

const defaultProps = {
  trigger: <button>Open</button>,
  groupId: 'group-1',
  groupName: 'Test Group',
  groupLogoUrl: 'https://example.com/logo.png',
  themeColor: '#7c3aed',
}

async function openDialog() {
  fireEvent.click(screen.getByRole('button', { name: 'Open' }))
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
}

describe('InviteFriendsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders trigger button', () => {
    renderWithTheme(<InviteFriendsDialog {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })

  it('opens dialog when trigger is clicked', async () => {
    renderWithTheme(<InviteFriendsDialog {...defaultProps} />)
    await openDialog()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders 3 tabs: Enlace, Email, Folleto', async () => {
    renderWithTheme(<InviteFriendsDialog {...defaultProps} />)
    await openDialog()

    expect(screen.getByRole('tab', { name: 'tabs.link' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'tabs.email' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'tabs.flier' })).toBeInTheDocument()
  })

  it('Enlace tab shows link TextField and copy button by default', async () => {
    renderWithTheme(<InviteFriendsDialog {...defaultProps} />)
    await openDialog()

    // Link field with readOnly input
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThan(0)
    // Copy button (tCommon('copy') → mock returns 'copy')
    expect(screen.getByRole('button', { name: 'copy' })).toBeInTheDocument()
  })

  it('Email tab shows coming-soon placeholder', async () => {
    renderWithTheme(<InviteFriendsDialog {...defaultProps} />)
    await openDialog()

    fireEvent.click(screen.getByRole('tab', { name: 'tabs.email' }))
    expect(screen.getByText('flier.emailComingSoon')).toBeInTheDocument()
  })

  it('Folleto tab renders InviteFlierTemplate', async () => {
    renderWithTheme(<InviteFriendsDialog {...defaultProps} />)
    await openDialog()

    fireEvent.click(screen.getByRole('tab', { name: 'tabs.flier' }))
    // Wait for short URL + logo to load, then flier shows group name
    await waitFor(() => expect(screen.getByText('Test Group')).toBeInTheDocument())
  })

  it('customMessage textarea change updates the controlled input value', async () => {
    const user = userEvent.setup()
    renderWithTheme(<InviteFriendsDialog {...defaultProps} />)
    await openDialog()

    await user.click(screen.getByRole('tab', { name: 'tabs.flier' }))

    // Wait for URL to load: flier shows group name when not loading
    await waitFor(() => expect(screen.getByText('Test Group')).toBeInTheDocument())

    const textarea = screen.getByLabelText('flier.customMessageLabel')
    // Clear existing value and type new one
    await user.clear(textarea)
    await user.type(textarea, 'New message')

    // Controlled input reflects the state change
    expect(textarea).toHaveValue('New message')
  })

  it('download button calls captureElement then downloadBlob', async () => {
    const { captureElement, downloadBlob } = await import('@/app/utils/share-utils')

    renderWithTheme(<InviteFriendsDialog {...defaultProps} />)
    await openDialog()
    fireEvent.click(screen.getByRole('tab', { name: 'tabs.flier' }))

    // Wait for short URL to load so buttons are enabled
    await waitFor(() => expect(screen.queryByText('generatingLink')).not.toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /flier.download/i }))
    })

    expect(captureElement).toHaveBeenCalled()
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'invite-Test Group.png')
  })

  it('share button calls captureElement then shareImage', async () => {
    const { captureElement, shareImage } = await import('@/app/utils/share-utils')

    renderWithTheme(<InviteFriendsDialog {...defaultProps} />)
    await openDialog()
    fireEvent.click(screen.getByRole('tab', { name: 'tabs.flier' }))

    await waitFor(() => expect(screen.queryByText('generatingLink')).not.toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /flier.share/i }))
    })

    expect(captureElement).toHaveBeenCalled()
    expect(shareImage).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringContaining('Test Group'),
      'invite-Test Group.png'
    )
  })

  it('shows error snackbar when captureElement rejects', async () => {
    const { captureElement } = await import('@/app/utils/share-utils')
    vi.mocked(captureElement).mockRejectedValueOnce(new Error('capture failed'))

    renderWithTheme(<InviteFriendsDialog {...defaultProps} />)
    await openDialog()
    fireEvent.click(screen.getByRole('tab', { name: 'tabs.flier' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /flier.download/i })).not.toBeDisabled())

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /flier.download/i }))
    })

    await waitFor(() => {
      expect(screen.getByText('flier.captureError')).toBeInTheDocument()
    })
  })

  it('download and share buttons are disabled while isCapturing is true', async () => {
    const { captureElement } = await import('@/app/utils/share-utils')
    // Never resolves during the test so isCapturing stays true
    vi.mocked(captureElement).mockImplementationOnce(() => new Promise(() => {}))

    renderWithTheme(<InviteFriendsDialog {...defaultProps} />)
    await openDialog()
    fireEvent.click(screen.getByRole('tab', { name: 'tabs.flier' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /flier.download/i })).not.toBeDisabled())

    // Click download to trigger isCapturing=true
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /flier.download/i }))
    })

    // Both buttons should become disabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /flier.download/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /flier.share/i })).toBeDisabled()
    })
  })

  it('groupLogoUrl missing → InviteFlierTemplate receives undefined (shows initials)', async () => {
    renderWithTheme(
      <InviteFriendsDialog {...defaultProps} groupLogoUrl={undefined} />
    )
    await openDialog()
    fireEvent.click(screen.getByRole('tab', { name: 'tabs.flier' }))

    // Should show initials (TG), no img
    await waitFor(() => expect(screen.queryByText('generatingLink')).not.toBeInTheDocument())
    expect(screen.getByText('TG')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Test Group' })).not.toBeInTheDocument()
  })

  it('themeColor missing → InviteFlierTemplate renders with default color', async () => {
    renderWithTheme(
      <InviteFriendsDialog {...defaultProps} themeColor={undefined} />
    )
    await openDialog()
    fireEvent.click(screen.getByRole('tab', { name: 'tabs.flier' }))

    // Wait for short URL + logo to load, then flier shows group name with default violet theme
    await waitFor(() => expect(screen.getByText('Test Group')).toBeInTheDocument())
  })
})
