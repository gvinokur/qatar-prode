import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SocialHubCard } from '../social-hub-card'

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('SocialHubCard', () => {
  const defaultProps = { locale: 'en' as const, tournamentId: 'tour-42' }

  it('renders the Create Group button linking to friend-groups page', () => {
    render(<SocialHubCard {...defaultProps} />)

    const createButton = screen.getByText('socialHub.createGroup')
    expect(createButton).toBeInTheDocument()
    const link = createButton.closest('a')
    expect(link).toHaveAttribute('href', '/en/tournaments/tour-42/friend-groups')
  })

  it('renders the Find Public Group button', () => {
    render(<SocialHubCard {...defaultProps} />)
    expect(screen.getByText('socialHub.findGroup')).toBeInTheDocument()
  })

  it('renders GroupAddIcon (SVG element present)', () => {
    const { container } = render(<SocialHubCard {...defaultProps} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders the social hub title and description text', () => {
    render(<SocialHubCard {...defaultProps} />)
    expect(screen.getByText('socialHub.title')).toBeInTheDocument()
    expect(screen.getByText('socialHub.description')).toBeInTheDocument()
  })

  it('uses the correct locale in the friend-groups URL', () => {
    render(<SocialHubCard locale="es" tournamentId="tour-42" />)
    const links = screen.getAllByRole('link')
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', expect.stringContaining('/es/'))
    })
  })
})
