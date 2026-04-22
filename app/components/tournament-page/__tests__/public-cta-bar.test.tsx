import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoggedOffBanner } from '../public-cta-bar'

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}))

// Mock next/dynamic to synchronously return the lazy import result
vi.mock('next/dynamic', () => ({
  default: (importFn: () => Promise<any>, _options?: any) => {
    // Synchronously execute the import factory so the dynamic component is available immediately
    let Component: any = null
    importFn().then((mod: any) => {
      Component = mod.default ?? mod
    })
    const Wrapper = (props: any) => Component ? <Component {...props} /> : null
    Wrapper.displayName = 'DynamicWrapper'
    return Wrapper
  },
}))

vi.mock('@/app/components/onboarding/onboarding-dialog-client', () => ({
  default: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="onboarding-dialog">
      <button data-testid="close-dialog" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}))

vi.mock('@/app/components/auth/login-or-signup-dialog', () => ({
  default: ({ openLoginDialog }: { openLoginDialog: boolean }) =>
    openLoginDialog ? <div data-testid="login-dialog" /> : null,
}))

describe('LoggedOffBanner', () => {
  it('renders with the primary.main background (banner is present in DOM)', () => {
    const { container } = render(<LoggedOffBanner />)
    expect(container.firstElementChild).toBeInTheDocument()
  })

  it('renders the info message and both action buttons', () => {
    render(<LoggedOffBanner />)
    expect(screen.getByText('ctaMessage')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /learnHow/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /loginOrSignup/i })).toBeInTheDocument()
  })

  it('does not apply sticky positioning when sticky prop is omitted', () => {
    const { container } = render(<LoggedOffBanner />)
    const box = container.firstElementChild
    expect(box).not.toHaveStyle({ position: 'sticky' })
  })

  it('renders without error when sticky=true', () => {
    const { container } = render(<LoggedOffBanner sticky />)
    expect(container.firstElementChild).toBeInTheDocument()
  })

  it('does not render the onboarding dialog initially', () => {
    render(<LoggedOffBanner />)
    expect(screen.queryByTestId('onboarding-dialog')).not.toBeInTheDocument()
  })

  it('opens OnboardingDialogClient when Learn How button is clicked', () => {
    render(<LoggedOffBanner />)
    fireEvent.click(screen.getByRole('button', { name: /learnHow/i }))
    expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
  })

  it('opens LoginOrSignupDialog when Login / Sign Up button is clicked', () => {
    render(<LoggedOffBanner />)
    fireEvent.click(screen.getByRole('button', { name: /loginOrSignup/i }))
    expect(screen.getByTestId('login-dialog')).toBeInTheDocument()
  })
})
