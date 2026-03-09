import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock html-to-image before importing share-utils
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,abc123'),
}))

import { captureElement, shareImage, downloadBlob, openWhatsApp } from '../../app/utils/share-utils'

describe('captureElement', () => {
  it('captures element and returns a Blob', async () => {
    const el = document.createElement('div')
    const blob = await captureElement(el)
    expect(blob.constructor.name).toBe('Blob')
    expect(blob.type).toBe('image/png')
  })
})

describe('downloadBlob', () => {
  it('creates an anchor element and triggers download', () => {
    const mockUrl = 'blob:http://localhost/fake-url'
    const createObjectURL = vi.fn().mockReturnValue(mockUrl)
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, writable: true })

    const clickSpy = vi.fn()
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => {
      // intercept click
      return el
    })
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el)

    // Override createElement to spy on click
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementationOnce((tag) => {
      const el = origCreateElement(tag)
      el.click = clickSpy
      return el
    })

    const blob = new Blob(['test'], { type: 'image/png' })
    downloadBlob(blob, 'test.png')

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith(mockUrl)

    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
    vi.restoreAllMocks()
  })
})

describe('openWhatsApp', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens WhatsApp URL with encoded text', () => {
    openWhatsApp('Hello World!')
    expect(window.open).toHaveBeenCalledWith(
      'https://wa.me/?text=Hello%20World!',
      '_blank'
    )
  })

  it('encodes special characters', () => {
    openWhatsApp('Test & More')
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('Test%20%26%20More'),
      '_blank'
    )
  })
})

describe('shareImage', () => {
  const blob = new Blob(['test'], { type: 'image/png' })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses navigator.share when file sharing is supported', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined)
    const canShareMock = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'share', { value: shareMock, writable: true, configurable: true })
    Object.defineProperty(navigator, 'canShare', { value: canShareMock, writable: true, configurable: true })

    await shareImage(blob, 'Check this out!', 'test.png')

    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Check this out!' })
    )
  })

  it('falls back to download + WhatsApp when canShare returns false', async () => {
    const canShareMock = vi.fn().mockReturnValue(false)
    Object.defineProperty(navigator, 'canShare', { value: canShareMock, writable: true, configurable: true })
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn().mockReturnValue('blob:test'), writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true })
    vi.spyOn(window, 'open').mockImplementation(() => null)

    // Mock anchor click
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementationOnce((tag) => {
      const el = origCreateElement(tag)
      el.click = vi.fn()
      return el
    })

    await shareImage(blob, 'My share text', 'test.png')

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('wa.me'),
      '_blank'
    )
    vi.restoreAllMocks()
  })

  it('falls back when canShare is undefined', async () => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, writable: true, configurable: true })
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn().mockReturnValue('blob:test'), writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true })
    vi.spyOn(window, 'open').mockImplementation(() => null)

    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementationOnce((tag) => {
      const el = origCreateElement(tag)
      el.click = vi.fn()
      return el
    })

    await shareImage(blob, 'text', 'test.png')

    expect(window.open).toHaveBeenCalled()
    vi.restoreAllMocks()
  })
})
