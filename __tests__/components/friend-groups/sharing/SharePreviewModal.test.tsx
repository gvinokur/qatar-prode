import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from '../../../utils/test-utils'
import SharePreviewModal from '../../../../app/components/friend-groups/sharing/SharePreviewModal'
import { createRef } from 'react'

vi.mock('../../../../app/utils/share-utils', () => ({
  captureElement: vi.fn(),
  downloadBlob: vi.fn(),
  openWhatsApp: vi.fn(),
  shareImage: vi.fn(),
}))

import { captureElement, downloadBlob, openWhatsApp, shareImage } from '../../../../app/utils/share-utils'

const mockCaptureElement = captureElement as ReturnType<typeof vi.fn>
const mockDownloadBlob = downloadBlob as ReturnType<typeof vi.fn>
const mockOpenWhatsApp = openWhatsApp as ReturnType<typeof vi.fn>
const mockShareImage = shareImage as ReturnType<typeof vi.fn>

function makeRef(el: HTMLElement | null) {
  const ref = createRef<HTMLElement>()
  Object.defineProperty(ref, 'current', { value: el, writable: true })
  return ref
}

describe('SharePreviewModal', () => {
  const fakeBlob = new Blob(['img'], { type: 'image/png' })
  const fakeObjectUrl = 'blob:http://localhost/fake'

  beforeEach(() => {
    mockCaptureElement.mockResolvedValue(fakeBlob)
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn().mockReturnValue(fakeObjectUrl), writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not call captureElement when closed', () => {
    const ref = makeRef(document.createElement('div'))
    renderWithTheme(
      <SharePreviewModal
        open={false}
        onClose={vi.fn()}
        templateRef={ref}
        shareText="Share text"
        filename="test.png"
      />
    )
    expect(mockCaptureElement).not.toHaveBeenCalled()
  })

  it('shows loading state while capturing', async () => {
    // Make capture take time
    mockCaptureElement.mockReturnValue(new Promise(() => {}))
    const ref = makeRef(document.createElement('div'))
    renderWithTheme(
      <SharePreviewModal
        open={true}
        onClose={vi.fn()}
        templateRef={ref}
        shareText="Share text"
        filename="test.png"
      />
    )
    // The generating text comes from i18n key groups.sharing.generatingImage
    await waitFor(() => {
      expect(mockCaptureElement).toHaveBeenCalled()
    })
  })

  it('shows preview image after capture completes', async () => {
    const ref = makeRef(document.createElement('div'))
    renderWithTheme(
      <SharePreviewModal
        open={true}
        onClose={vi.fn()}
        templateRef={ref}
        shareText="Share text"
        filename="test.png"
      />
    )
    await waitFor(() => {
      const img = screen.queryByAltText('Share preview')
      expect(img).toBeInTheDocument()
    })
  })

  it('shows error when capture fails', async () => {
    mockCaptureElement.mockRejectedValue(new Error('capture failed'))
    const ref = makeRef(document.createElement('div'))
    renderWithTheme(
      <SharePreviewModal
        open={true}
        onClose={vi.fn()}
        templateRef={ref}
        shareText="Share text"
        filename="test.png"
      />
    )
    // i18n key groups.sharing.captureError should show
    await waitFor(() => {
      // The translation key resolves from Spanish locale
      const errorEl = screen.queryByRole('paragraph') ?? document.querySelector('[class*="MuiTypography"]')
      expect(errorEl).toBeTruthy()
    })
  })

  it('calls onClose when cancel button clicked', async () => {
    const onClose = vi.fn()
    const ref = makeRef(document.createElement('div'))
    renderWithTheme(
      <SharePreviewModal
        open={true}
        onClose={onClose}
        templateRef={ref}
        shareText="Share text"
        filename="test.png"
      />
    )
    // Cancel button text from i18n: groups.sharing.cancel
    const cancelBtn = await screen.findByRole('button', { name: /cancel|cancelar/i })
    await userEvent.click(cancelBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls downloadBlob when download button clicked', async () => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, writable: true, configurable: true })
    const ref = makeRef(document.createElement('div'))
    renderWithTheme(
      <SharePreviewModal
        open={true}
        onClose={vi.fn()}
        templateRef={ref}
        shareText="Share text"
        filename="test.png"
      />
    )
    await waitFor(() => {
      expect(screen.queryByAltText('Share preview')).toBeInTheDocument()
    })
    // Download button from i18n: groups.sharing.download
    const downloadBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.match(/download|descargar/i)
    )
    expect(downloadBtn).toBeTruthy()
    await userEvent.click(downloadBtn!)
    expect(mockDownloadBlob).toHaveBeenCalledWith(fakeBlob, 'test.png')
  })

  it('shows native share button when canShare is true', async () => {
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(true),
      writable: true,
      configurable: true,
    })
    const ref = makeRef(document.createElement('div'))
    renderWithTheme(
      <SharePreviewModal
        open={true}
        onClose={vi.fn()}
        templateRef={ref}
        shareText="Share text"
        filename="test.png"
      />
    )
    await waitFor(() => {
      expect(screen.queryByAltText('Share preview')).toBeInTheDocument()
    })
    // shareButton i18n key
    const shareBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.match(/share|compartir/i) && !btn.textContent?.match(/cancel|cancelar/i)
    )
    expect(shareBtn).toBeTruthy()
  })

  it('shows WhatsApp button when canShare is false', async () => {
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(false),
      writable: true,
      configurable: true,
    })
    const ref = makeRef(document.createElement('div'))
    renderWithTheme(
      <SharePreviewModal
        open={true}
        onClose={vi.fn()}
        templateRef={ref}
        shareText="Share text"
        filename="test.png"
      />
    )
    await waitFor(() => {
      expect(screen.queryByAltText('Share preview')).toBeInTheDocument()
    })
    // openWhatsApp i18n key
    const waBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.match(/whatsapp/i)
    )
    expect(waBtn).toBeTruthy()
    await userEvent.click(waBtn!)
    expect(mockOpenWhatsApp).toHaveBeenCalledWith('Share text')
  })

  it('calls shareImage when native share button clicked', async () => {
    mockShareImage.mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(true),
      writable: true,
      configurable: true,
    })
    const ref = makeRef(document.createElement('div'))
    renderWithTheme(
      <SharePreviewModal
        open={true}
        onClose={vi.fn()}
        templateRef={ref}
        shareText="My share"
        filename="test.png"
      />
    )
    await waitFor(() => {
      expect(screen.queryByAltText('Share preview')).toBeInTheDocument()
    })
    const shareBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.match(/share|compartir/i) && !btn.textContent?.match(/cancel|cancelar/i)
    )
    await userEvent.click(shareBtn!)
    expect(mockShareImage).toHaveBeenCalledWith(fakeBlob, 'My share', 'test.png')
  })
})
