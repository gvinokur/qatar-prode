import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from '../header'

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn(async () => 'en'),
  getTranslations: vi.fn(async ({ locale, namespace }) => {
    return (key: string) => key
  }),
}))

describe('Header i18n', () => {
  it('uses getTranslations with common namespace', async () => {
    const { getTranslations } = await import('next-intl/server')

    render(await Header({}))

    expect(getTranslations).toHaveBeenCalledWith({
      locale: 'en',
      namespace: 'common',
    })
  })

  it('renders app title with translation key', async () => {
    const HeaderElement = await Header({})
    render(HeaderElement)

    // Since mock returns the key itself, we should see 'app.title'
    expect(screen.getByText('app.title')).toBeInTheDocument()
  })

  it('renders logo with translated alt text', async () => {
    const HeaderElement = await Header({})
    render(HeaderElement)

    const logo = screen.getByAltText('app.logoAlt')
    expect(logo).toBeInTheDocument()
  })
})
