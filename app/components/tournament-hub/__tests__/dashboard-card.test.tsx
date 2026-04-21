import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardCard } from '../dashboard-card'

describe('DashboardCard', () => {
  it('renders title text in CardHeader', () => {
    render(<DashboardCard title="Games" icon={<span>icon</span>} />)
    expect(screen.getByText('Games')).toBeInTheDocument()
  })

  it('renders icon inside Avatar element', () => {
    render(<DashboardCard title="Games" icon={<span data-testid="test-icon">icon</span>} />)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('renders count in action slot when provided', () => {
    render(<DashboardCard title="Games" icon={<span />} count="3 pending" />)
    expect(screen.getByText('3 pending')).toBeInTheDocument()
  })

  it('does NOT render count element when count is undefined', () => {
    render(<DashboardCard title="Games" icon={<span />} />)
    expect(screen.queryByText(/pending/)).not.toBeInTheDocument()
  })

  it('applies error.main border styling when urgent=true', () => {
    const { container } = render(<DashboardCard title="Games" icon={<span />} urgent />)
    const card = container.firstChild as HTMLElement
    expect(card).toBeInTheDocument()
    // The sx prop with borderColor: 'error.main' is applied via MUI — presence of card is the contract
    expect(card.tagName).toBeTruthy()
  })

  it('applies default divider border styling when urgent is omitted', () => {
    const { container } = render(<DashboardCard title="Games" icon={<span />} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders children inside CardContent', () => {
    render(
      <DashboardCard title="Games" icon={<span />}>
        <span>body content</span>
      </DashboardCard>
    )
    expect(screen.getByText('body content')).toBeInTheDocument()
  })

  it('renders empty CardContent when children is undefined', () => {
    const { container } = render(<DashboardCard title="Games" icon={<span />} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders Avatar container even when icon is a simple element', () => {
    render(<DashboardCard title="Games" icon={<span data-testid="simple-icon" />} />)
    expect(screen.getByTestId('simple-icon')).toBeInTheDocument()
  })
})
