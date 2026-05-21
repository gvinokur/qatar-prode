import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import AiGenerateAllDialog from '../ai-generate-all-dialog';

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.rich = (key: string, params?: Record<string, unknown>) => {
      if (params && 'count' in params) return `${key}:${params.count}`;
      return key;
    };
    return t;
  },
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  pendingCount: 10,
  loading: false,
};

describe('AiGenerateAllDialog', () => {
  it('renders the dialog title', () => {
    renderWithTheme(<AiGenerateAllDialog {...defaultProps} />);
    expect(screen.getByText('aiGenerate.dialogTitle')).toBeInTheDocument();
  });

  it('renders correct count in the message', () => {
    renderWithTheme(<AiGenerateAllDialog {...defaultProps} pendingCount={36} />);
    // The message key includes the count via dangerouslySetInnerHTML
    const content = screen.getByRole('dialog');
    expect(content.textContent).toContain('36');
  });

  it('confirm button is enabled when loading=false', () => {
    renderWithTheme(<AiGenerateAllDialog {...defaultProps} loading={false} />);
    const btn = screen.getByText('aiGenerate.confirmButton').closest('button');
    expect(btn).not.toBeDisabled();
  });

  it('confirm button is disabled when loading=true', () => {
    renderWithTheme(<AiGenerateAllDialog {...defaultProps} loading={true} />);
    const btn = screen.getByText('aiGenerate.generating').closest('button');
    expect(btn).toBeDisabled();
  });

  it('shows generating text when loading=true', () => {
    renderWithTheme(<AiGenerateAllDialog {...defaultProps} loading={true} />);
    expect(screen.getByText('aiGenerate.generating')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked and not loading', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderWithTheme(<AiGenerateAllDialog {...defaultProps} onConfirm={onConfirm} loading={false} />);
    await user.click(screen.getByText('aiGenerate.confirmButton'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithTheme(<AiGenerateAllDialog {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByText('aiGenerate.cancelButton'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders error message when errorMessage prop is set', () => {
    renderWithTheme(
      <AiGenerateAllDialog {...defaultProps} errorMessage="Failed to generate predictions" />
    );
    expect(screen.getByText('Failed to generate predictions')).toBeInTheDocument();
  });

  it('does not render error section when errorMessage is null', () => {
    renderWithTheme(<AiGenerateAllDialog {...defaultProps} errorMessage={null} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
