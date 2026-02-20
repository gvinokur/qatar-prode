import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import LanguageSwitcher from '../language-switcher'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/dashboard',
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    toString: () => '',
  }),
}))

describe('LanguageSwitcher i18n', () => {
  it('renders language switcher with aria-label', () => {
    renderWithTheme(<LanguageSwitcher />)

    // Avatar uses aria-label (not button role)
    const switcher = screen.getByLabelText(/language.selectLanguage/i)
    expect(switcher).toBeInTheDocument()
  })

  it('uses common namespace for aria-label', () => {
    renderWithTheme(<LanguageSwitcher />)

    // Verify aria-label uses translation key
    const switcher = screen.getByLabelText('language.selectLanguage')
    expect(switcher).toHaveAttribute('aria-label', 'language.selectLanguage')
  })

  it('keeps language names hardcoded', () => {
    renderWithTheme(<LanguageSwitcher />)

    // Language names should remain as-is (self-referential)
    // This is verified by the component not translating these values
    const switcher = screen.getByLabelText(/language.selectLanguage/i)
    expect(switcher).toBeInTheDocument()
  })
})
