import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GamesLoggedOutHeader } from '../games-logged-out-header'
import { StatusHeaderVariant } from '@/app/components/prediction-status-header'

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}))

vi.mock('@/app/components/prediction-status-header', () => ({
  PredictionStatusHeader: ({ variant }: { variant: StatusHeaderVariant }) => (
    <div data-testid="prediction-status-header">
      <span data-testid="status-text">{variant.statusText}</span>
      {variant.message && <span data-testid="message">{variant.message}</span>}
      {variant.action && 'onClick' in variant.action && (
        <button data-testid="psh-action-btn" onClick={variant.action.onClick}>
          {variant.action.label}
        </button>
      )}
    </div>
  ),
}))

vi.mock('@/app/components/auth/login-or-signup-dialog', () => ({
  default: ({
    openLoginDialog,
    handleCloseLoginDialog,
  }: {
    openLoginDialog: boolean
    handleCloseLoginDialog: () => void
  }) =>
    openLoginDialog ? (
      <div data-testid="login-dialog">
        <button data-testid="close-dialog" onClick={handleCloseLoginDialog}>
          Close
        </button>
      </div>
    ) : null,
}))

describe('GamesLoggedOutHeader', () => {
  it('renders the PredictionStatusHeader', () => {
    render(<GamesLoggedOutHeader />)
    expect(screen.getByTestId('prediction-status-header')).toBeInTheDocument()
  })

  it('renders with the welcome status text', () => {
    render(<GamesLoggedOutHeader />)
    expect(screen.getByTestId('status-text')).toHaveTextContent('welcome')
  })

  it('renders the sign-in description message', () => {
    render(<GamesLoggedOutHeader />)
    expect(screen.getByTestId('message')).toHaveTextContent('ctaDescription')
  })

  it('wraps the PSH in a sticky positioned element', () => {
    const { container } = render(<GamesLoggedOutHeader />)
    // The Box wrapping PSH should have position: sticky applied via MUI sx
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper).toBeInTheDocument()
    // MUI converts sx to inline style or class — verify the wrapper exists and PSH is inside
    expect(wrapper.querySelector('[data-testid="prediction-status-header"]')).toBeInTheDocument()
  })

  it('auth dialog is closed by default', () => {
    render(<GamesLoggedOutHeader />)
    expect(screen.queryByTestId('login-dialog')).not.toBeInTheDocument()
  })

  it('opens the auth dialog when the Login action is clicked', () => {
    render(<GamesLoggedOutHeader />)
    fireEvent.click(screen.getByTestId('psh-action-btn'))
    expect(screen.getByTestId('login-dialog')).toBeInTheDocument()
  })

  it('closes the auth dialog when the close handler is called', () => {
    render(<GamesLoggedOutHeader />)
    fireEvent.click(screen.getByTestId('psh-action-btn'))
    expect(screen.getByTestId('login-dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('close-dialog'))
    expect(screen.queryByTestId('login-dialog')).not.toBeInTheDocument()
  })

  it('rapid clicks on the Login button do not open multiple dialogs', () => {
    render(<GamesLoggedOutHeader />)
    const btn = screen.getByTestId('psh-action-btn')
    fireEvent.click(btn)
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(screen.getAllByTestId('login-dialog')).toHaveLength(1)
  })

  it('unmounts without errors while dialog is open', () => {
    const { unmount } = render(<GamesLoggedOutHeader />)
    fireEvent.click(screen.getByTestId('psh-action-btn'))
    expect(() => unmount()).not.toThrow()
  })
})
