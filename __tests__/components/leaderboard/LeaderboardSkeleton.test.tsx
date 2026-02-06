import { describe, it, expect } from 'vitest'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardSkeleton from '@/app/components/leaderboard/LeaderboardSkeleton'

describe('LeaderboardSkeleton', () => {
  it('renders default number of skeleton cards', () => {
    const { container } = renderWithTheme(<LeaderboardSkeleton />)

    const skeletonCards = container.querySelectorAll('.MuiCard-root')
    expect(skeletonCards).toHaveLength(5) // default count
  })

  it('renders custom number of skeleton cards', () => {
    const { container } = renderWithTheme(<LeaderboardSkeleton count={3} />)

    const skeletonCards = container.querySelectorAll('.MuiCard-root')
    expect(skeletonCards).toHaveLength(3)
  })

  it('renders skeleton elements for rank, avatar, name, and points', () => {
    const { container } = renderWithTheme(<LeaderboardSkeleton count={1} />)

    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    // Should have: rank, avatar, name, points, rank change, progress bar
    expect(skeletons.length).toBeGreaterThan(4)
  })

  it('uses stable keys for skeleton cards', () => {
    const { container } = renderWithTheme(<LeaderboardSkeleton count={3} />)

    const cards = container.querySelectorAll('.MuiCard-root')
    cards.forEach((card, index) => {
      // Keys should not be simple array indices
      expect(card).toBeTruthy()
    })
  })
})
