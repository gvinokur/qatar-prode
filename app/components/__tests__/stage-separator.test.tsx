import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StageSeparator } from '../stage-separator'

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material') as any
  return {
    ...actual,
    alpha: (color: string, _opacity: number) => color,
  }
})

describe('StageSeparator', () => {
  it('renders the stage label', () => {
    render(<StageSeparator label="ROUND OF 16" />)
    expect(screen.getByText('ROUND OF 16')).toBeInTheDocument()
  })

  it('renders "Now Available" chip when isNowAvailable=true', () => {
    render(<StageSeparator label="ROUND OF 16" isNowAvailable />)
    // Global test locale is Spanish; 'stageSeparator.nowAvailable' → "Disponible ahora"
    expect(screen.getByText('Disponible ahora')).toBeInTheDocument()
  })

  it('does not render "Now Available" chip when isNowAvailable=false', () => {
    render(<StageSeparator label="ROUND OF 16" isNowAvailable={false} />)
    expect(screen.queryByText('Disponible ahora')).not.toBeInTheDocument()
  })

  it('does not render "Now Available" chip when isNowAvailable is undefined', () => {
    render(<StageSeparator label="ROUND OF 16" />)
    expect(screen.queryByText('Disponible ahora')).not.toBeInTheDocument()
  })
})
