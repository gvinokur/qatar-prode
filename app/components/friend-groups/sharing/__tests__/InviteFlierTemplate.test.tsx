import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import InviteFlierTemplate from '../InviteFlierTemplate'

// qrcode.react uses canvas — provide a simple SVG stub
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <svg data-testid="qrcode" data-value={value} />,
}))

const defaultProps = {
  groupName: 'Test Group',
  customMessage: 'Join us!',
  shortUrl: 'https://prodemundial.app/j/abc123',
}

describe('InviteFlierTemplate', () => {
  it('renders group name and custom message', () => {
    renderWithTheme(<InviteFlierTemplate {...defaultProps} />)

    expect(screen.getByText('Test Group')).toBeInTheDocument()
    expect(screen.getByText('Join us!')).toBeInTheDocument()
  })

  it('renders QRCodeSVG with shortUrl as value', () => {
    renderWithTheme(<InviteFlierTemplate {...defaultProps} />)

    const qr = screen.getByTestId('qrcode')
    expect(qr).toHaveAttribute('data-value', 'https://prodemundial.app/j/abc123')
  })

  it('renders Avatar with group initials when groupLogoUrl is absent', () => {
    renderWithTheme(<InviteFlierTemplate {...defaultProps} />)

    // MUI Avatar renders text initials (first 2 words → TG)
    expect(screen.getByText('TG')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders group logo image when groupLogoUrl is provided', () => {
    renderWithTheme(
      <InviteFlierTemplate {...defaultProps} groupLogoUrl="https://example.com/logo.png" />
    )

    const img = screen.getByRole('img', { name: 'Test Group' })
    expect(img).toHaveAttribute('src', 'https://example.com/logo.png')
    expect(screen.queryByText('TG')).not.toBeInTheDocument()
  })

  it('applies themeColor to gradient background', () => {
    const { container } = renderWithTheme(
      <InviteFlierTemplate {...defaultProps} themeColor="#ff0000" />
    )

    const card = container.firstChild as HTMLElement
    expect(card.style.background).toContain('#ff0000')
  })

  it('renders skeleton state when loading=true', () => {
    const { container } = renderWithTheme(
      <InviteFlierTemplate {...defaultProps} loading={true} />
    )

    // Skeletons should be rendered instead of content
    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
    // Group name text should not be visible
    expect(screen.queryByText('Test Group')).not.toBeInTheDocument()
  })
})
