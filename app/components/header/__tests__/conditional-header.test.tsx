import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { screen } from '@testing-library/react'
import ConditionalHeader from '../conditional-header'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next/navigation
let mockPathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => mockPathname),
}))

describe('ConditionalHeader', () => {
  beforeEach(() => {
    // Reset to defaults
    mockPathname = '/es'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows header on home page', () => {
    mockPathname = '/es'

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.getByTestId('test-header')).toBeInTheDocument()
    expect(container.textContent).toContain('Header Content')
  })

  it('hides header on tournament page', () => {
    mockPathname = '/es/tournaments/123'

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.queryByTestId('test-header')).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('Header Content')
  })

  it('handles nested tournament route /tournaments/123/groups/A', () => {
    mockPathname = '/es/tournaments/123/groups/A'

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.queryByTestId('test-header')).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('Header Content')
  })

  it('handles nested tournament route /tournaments/123/stats', () => {
    mockPathname = '/es/tournaments/123/stats'

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.queryByTestId('test-header')).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('Header Content')
  })

  it('shows header on profile page', () => {
    mockPathname = '/es/profile'

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.getByTestId('test-header')).toBeInTheDocument()
    expect(container.textContent).toContain('Header Content')
  })

  it('shows header on any non-tournament page', () => {
    mockPathname = '/es/some-other-page'

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.getByTestId('test-header')).toBeInTheDocument()
    expect(container.textContent).toContain('Header Content')
  })

  it('shows header on non-tournament pages', () => {
    mockPathname = '/es/settings'

    const { container } = renderWithTheme(
      <ConditionalHeader>
        <div data-testid="test-header">Header Content</div>
      </ConditionalHeader>
    )

    expect(screen.getByTestId('test-header')).toBeInTheDocument()
    expect(container.textContent).toContain('Header Content')
  })
})
