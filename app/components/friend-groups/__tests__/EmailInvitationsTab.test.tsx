import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import EmailInvitationsTab from '../EmailInvitationsTab';

vi.mock('../../../actions/prode-group-actions', () => ({
  sendGroupEmailInvitations: vi.fn(),
}));

import * as prodeGroupActions from '../../../actions/prode-group-actions';
const mockSendGroupEmailInvitations = vi.mocked(prodeGroupActions.sendGroupEmailInvitations);

const defaultProps = {
  groupId: 'group1',
  onSnackbar: vi.fn(),
};

const renderTab = (props = {}) => renderWithProviders(
  <EmailInvitationsTab {...defaultProps} {...props} />,
  { locale: 'es' }
);

describe('EmailInvitationsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendGroupEmailInvitations.mockResolvedValue({ sent: 1, failed: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders one empty row on mount', () => {
    renderTab();

    const nameInputs = screen.getAllByPlaceholderText(/nombre/i);
    expect(nameInputs).toHaveLength(1);
  });

  it('"+ Agregar otro" adds a new row', () => {
    renderTab();

    const addButton = screen.getByRole('button', { name: /agregar otro/i });
    fireEvent.click(addButton);

    const nameInputs = screen.getAllByPlaceholderText(/nombre/i);
    expect(nameInputs).toHaveLength(2);
  });

  it('delete button removes a row', () => {
    renderTab();

    // Add a second row first
    fireEvent.click(screen.getByRole('button', { name: /agregar otro/i }));
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons).toHaveLength(2);

    fireEvent.click(deleteButtons[0]);

    const nameInputs = screen.getAllByPlaceholderText(/nombre/i);
    expect(nameInputs).toHaveLength(1);
  });

  it('minimum 1 row remains when trying to delete the last row', () => {
    renderTab();

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    const nameInputs = screen.getAllByPlaceholderText(/nombre/i);
    expect(nameInputs).toHaveLength(1);
  });

  it('send button is disabled when all rows are empty', () => {
    renderTab();

    const sendButton = screen.getByRole('button', { name: /enviar/i });
    expect(sendButton).toBeDisabled();
  });

  it('send button is enabled when at least one email is filled', async () => {
    renderTab();

    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const sendButton = screen.getByRole('button', { name: /enviar/i });
    expect(sendButton).not.toBeDisabled();
  });

  it('shows count chip with recipient count when email is filled', () => {
    renderTab();

    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(screen.getByText(/destinatario/i)).toBeInTheDocument();
  });

  it('calls sendGroupEmailInvitations on send click', async () => {
    renderTab();

    fireEvent.change(screen.getByPlaceholderText(/nombre/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'alice@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(mockSendGroupEmailInvitations).toHaveBeenCalledWith(
        'group1',
        [{ name: 'Alice', email: 'alice@example.com' }],
        undefined,
        expect.any(String),
        undefined,
        undefined
      );
    });
  });

  it('on send success calls onSnackbar with success severity', async () => {
    const onSnackbar = vi.fn();
    renderTab({ onSnackbar });

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'alice@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(onSnackbar).toHaveBeenCalledWith(expect.any(String), 'success');
    });
  });

  it('on send with partial failures calls onSnackbar with error severity listing failed addresses', async () => {
    const onSnackbar = vi.fn();
    mockSendGroupEmailInvitations.mockResolvedValue({ sent: 1, failed: ['bob@example.com'] });
    renderTab({ onSnackbar });

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'alice@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(onSnackbar).toHaveBeenCalledWith(
        expect.stringContaining('bob@example.com'),
        'error'
      );
    });
  });

  describe('send button limit enforcement', () => {
    it('send button is disabled when recipients exceed 50', () => {
      renderTab();

      // Add 50 rows of filled emails
      const emailInput = screen.getByPlaceholderText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'user0@example.com' } });

      // Add 50 more rows to go over limit
      for (let i = 1; i <= 50; i++) {
        fireEvent.click(screen.getByRole('button', { name: /agregar otro/i }));
        const emailInputs = screen.getAllByPlaceholderText(/email/i);
        fireEvent.change(emailInputs[i], { target: { value: `user${i}@example.com` } });
      }

      const sendButton = screen.getByRole('button', { name: /enviar/i });
      expect(sendButton).toBeDisabled();
    });

    it('send button is enabled when recipients exactly equal 50', () => {
      renderTab();

      // Fill first row
      fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'user0@example.com' } });

      // Add 49 more rows (total 50)
      for (let i = 1; i < 50; i++) {
        fireEvent.click(screen.getByRole('button', { name: /agregar otro/i }));
        const emailInputs = screen.getAllByPlaceholderText(/email/i);
        fireEvent.change(emailInputs[i], { target: { value: `user${i}@example.com` } });
      }

      const sendButton = screen.getByRole('button', { name: /enviar/i });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('CSV template download', () => {
    it('template button triggers download', () => {
      renderTab();

      // Mock URL.createObjectURL and anchor click
      const createObjectURL = vi.fn(() => 'blob:mock');
      const revokeObjectURL = vi.fn();
      Object.defineProperty(window, 'URL', {
        value: { createObjectURL, revokeObjectURL },
        writable: true,
      });

      const clickSpy = vi.fn();
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: clickSpy,
      } as any);

      fireEvent.click(screen.getByRole('button', { name: /plantilla/i }));

      expect(createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
    });
  });
});
