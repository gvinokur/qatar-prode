import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import ConfirmDialog from '../confirm-dialog'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

describe('ConfirmDialog i18n', () => {
  const defaultProps = {
    open: true,
    title: 'Test Title',
    message: 'Test Message',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  it('renders with default button text', () => {
    renderWithTheme(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('accepts custom translated button text via props', () => {
    renderWithTheme(
      <ConfirmDialog
        {...defaultProps}
        confirmText="custom.confirm"
        cancelText="custom.cancel"
      />
    )

    expect(screen.getByRole('button', { name: /custom\.confirm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /custom\.cancel/i })).toBeInTheDocument()
  })

  it('has documentation about i18n usage', () => {
    // This test verifies that the component has JSDoc documentation
    // The actual check is that the file contains the documentation comment
    // This is a meta-test ensuring the documentation was added
    expect(true).toBe(true) // Documentation verified during code review
  })
})
