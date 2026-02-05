import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import ConditionalHeader from '../conditional-header'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next/navigation
let mockPathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => mockPathname),
}))

// Mock MUI components
let mockIsMobile = false
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material')
  return {
    ...actual,
    useMediaQuery: vi.fn(() => mockIsMobile),
  }
})

describe('ConditionalHeader', () => {
  beforeEach(() => {
    // Reset to defaults
    mockPathname = '/'
    mockIsMobile = false
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows header on home page (mobile)', () => {
    mockPathname = '/'
    mockIsMobile = true

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.getByTestId('test-header')).toBeInTheDocument()
    expect(container.textContent).toContain('Header Content')
  })

  it('hides header on tournament page (mobile)', () => {
    mockPathname = '/tournaments/123'
    mockIsMobile = true

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.queryByTestId('test-header')).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('Header Content')
  })

  it('shows header on tournament page (desktop)', () => {
    mockPathname = '/tournaments/123'
    mockIsMobile = false

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.getByTestId('test-header')).toBeInTheDocument()
    expect(container.textContent).toContain('Header Content')
  })

  it('handles nested tournament route /tournaments/123/groups/A (mobile)', () => {
    mockPathname = '/tournaments/123/groups/A'
    mockIsMobile = true

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.queryByTestId('test-header')).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('Header Content')
  })

  it('handles nested tournament route /tournaments/123/stats (mobile)', () => {
    mockPathname = '/tournaments/123/stats'
    mockIsMobile = true

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.queryByTestId('test-header')).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('Header Content')
  })

  it('shows header on profile page (mobile)', () => {
    mockPathname = '/profile'
    mockIsMobile = true

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.getByTestId('test-header')).toBeInTheDocument()
    expect(container.textContent).toContain('Header Content')
  })

  it('shows header on any non-tournament page (mobile)', () => {
    mockPathname = '/some-other-page'
    mockIsMobile = true

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.getByTestId('test-header')).toBeInTheDocument()
    expect(container.textContent).toContain('Header Content')
  })

  it('always shows header on desktop regardless of route', () => {
    mockPathname = '/tournaments/456'
    mockIsMobile = false

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.getByTestId('test-header')).toBeInTheDocument()
    expect(container.textContent).toContain('Header Content')
  })
})
