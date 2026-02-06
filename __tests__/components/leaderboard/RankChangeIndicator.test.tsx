import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import RankChangeIndicator from '@/app/components/leaderboard/RankChangeIndicator'

describe('RankChangeIndicator', () => {
  it('renders up arrow for positive change', () => {
    renderWithTheme(<RankChangeIndicator change={3} />)

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByLabelText(/rank improved by 3 positions/i)).toBeInTheDocument()
  })

  it('renders down arrow for negative change', () => {
    renderWithTheme(<RankChangeIndicator change={-2} />)

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByLabelText(/rank declined by 2 positions/i)).toBeInTheDocument()
  })

  it('renders dash for no change', () => {
    renderWithTheme(<RankChangeIndicator change={0} />)

    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByLabelText(/rank unchanged/i)).toBeInTheDocument()
  })

  it('uses singular form for single position change', () => {
    renderWithTheme(<RankChangeIndicator change={1} />)

    expect(screen.getByLabelText(/rank improved by 1 position$/i)).toBeInTheDocument()
  })

  it('accepts size prop', () => {
    const { container } = renderWithTheme(<RankChangeIndicator change={1} size="medium" />)

    // Component should render without error with size prop
    expect(container.firstChild).toBeInTheDocument()
  })
})
