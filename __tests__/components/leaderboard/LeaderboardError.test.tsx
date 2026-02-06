import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardError from '@/app/components/leaderboard/LeaderboardError'

describe('LeaderboardError', () => {
  it('renders error message', () => {
    renderWithTheme(<LeaderboardError />)

    expect(screen.getByText(/failed to load leaderboard/i)).toBeInTheDocument()
    expect(screen.getByText(/there was an error loading the leaderboard data/i)).toBeInTheDocument()
  })

  it('displays error icon', () => {
    const { container } = renderWithTheme(<LeaderboardError />)

    const errorIcon = container.querySelector('svg')
    expect(errorIcon).toBeInTheDocument()
  })

  it('shows retry button when onRetry is provided', () => {
    const handleRetry = vi.fn()
    renderWithTheme(<LeaderboardError onRetry={handleRetry} />)

    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()
  })

  it('does not show retry button when onRetry is not provided', () => {
    renderWithTheme(<LeaderboardError />)

    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', () => {
    const handleRetry = vi.fn()
    renderWithTheme(<LeaderboardError onRetry={handleRetry} />)

    const retryButton = screen.getByRole('button', { name: /retry/i })
    fireEvent.click(retryButton)

    expect(handleRetry).toHaveBeenCalledTimes(1)
  })
})
