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

  describe('default mode (no loginHref)', () => {
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

    it('renders the "Learn more" link below the main CTAs', () => {
      render(<SocialHubCard {...defaultProps} />)
      expect(screen.getByText('newUser.socialHub.learnMore')).toBeInTheDocument()
    })
  })

  describe('login mode (loginHref provided)', () => {
    const loginProps = { ...defaultProps, loginHref: '/en/auth/signin' }

    it('renders a single login button linking to loginHref', () => {
      render(<SocialHubCard {...loginProps} />)

      const loginButton = screen.getByText('socialHub.login')
      expect(loginButton).toBeInTheDocument()
      const link = loginButton.closest('a')
      expect(link).toHaveAttribute('href', '/en/auth/signin')
    })

    it('does not render Create Group or Find Group buttons', () => {
      render(<SocialHubCard {...loginProps} />)

      expect(screen.queryByText('socialHub.createGroup')).not.toBeInTheDocument()
      expect(screen.queryByText('socialHub.findGroup')).not.toBeInTheDocument()
    })

    it('does not render the Learn more link', () => {
      render(<SocialHubCard {...loginProps} />)
      expect(screen.queryByText('newUser.socialHub.learnMore')).not.toBeInTheDocument()
    })

    it('still renders the same icon and title in login mode', () => {
      const { container } = render(<SocialHubCard {...loginProps} />)
      expect(container.querySelector('svg')).toBeInTheDocument()
      expect(screen.getByText('socialHub.title')).toBeInTheDocument()
    })
  })
})
