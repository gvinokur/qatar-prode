import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import NotificationDialog from '../../../app/components/friend-groups/notification-dialog';
import { renderWithTheme } from '../../utils/test-utils';

// Mock the notification action
vi.mock('../../../app/actions/notifiaction-actions', () => ({
  sendGroupNotification: vi.fn()
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  groupId: 'group1',
  tournamentId: 'tournament1',
  senderId: 'sender1'
};

describe('NotificationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    expect(screen.getByText('Enviar Notificación a Participantes')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithTheme(<NotificationDialog {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Enviar Notificación a Participantes')).not.toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    expect(screen.getByLabelText('Destino')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Mensaje')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
  });

  it('has tournament as default target page', () => {
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    // Check that the default option is displayed
    expect(screen.getByText('Página del torneo')).toBeInTheDocument();
  });

  it('allows changing target page', async () => {
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    const targetSelect = screen.getByLabelText('Destino');
    
    fireEvent.mouseDown(targetSelect);
    fireEvent.click(screen.getByText('Página del grupo de amigos'));
    
    await waitFor(() => {
      expect(screen.getByText('Página del grupo de amigos')).toBeInTheDocument();
    });
  });

  it('allows entering title and message', async () => {
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    const titleField = screen.getByLabelText('Título');
    const messageField = screen.getByLabelText('Mensaje');
    
    fireEvent.change(titleField, { target: { value: 'Test Title' } });
    fireEvent.change(messageField, { target: { value: 'Test Message' } });
    
    await waitFor(() => {
      expect(titleField).toHaveValue('Test Title');
      expect(messageField).toHaveValue('Test Message');
    });
  });

  it('disables send button when title is empty', () => {
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    const sendButton = screen.getByRole('button', { name: 'Enviar' });
    expect(sendButton).toBeDisabled();
  });

  it('disables send button when message is empty', async () => {
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    const titleField = screen.getByLabelText('Título');
    fireEvent.change(titleField, { target: { value: 'Test Title' } });
    
    const sendButton = screen.getByRole('button', { name: 'Enviar' });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when both title and message are filled', async () => {
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    const titleField = screen.getByLabelText('Título');
    const messageField = screen.getByLabelText('Mensaje');
    
    fireEvent.change(titleField, { target: { value: 'Test Title' } });
    fireEvent.change(messageField, { target: { value: 'Test Message' } });
    
    await waitFor(() => {
      const sendButton = screen.getByRole('button', { name: 'Enviar' });
      expect(sendButton).not.toBeDisabled();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('sends notification successfully', async () => {
    const { sendGroupNotification } = await import('../../../app/actions/notifiaction-actions');
    (sendGroupNotification as any).mockResolvedValue(undefined);
    
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    const titleField = screen.getByLabelText('Título');
    const messageField = screen.getByLabelText('Mensaje');
    const sendButton = screen.getByRole('button', { name: 'Enviar' });
    
    fireEvent.change(titleField, { target: { value: 'Test Title' } });
    fireEvent.change(messageField, { target: { value: 'Test Message' } });
    
    await waitFor(() => {
      expect(sendButton).not.toBeDisabled();
    });
    
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(sendGroupNotification).toHaveBeenCalledWith({
        groupId: 'group1',
        tournamentId: 'tournament1',
        targetPage: 'tournament',
        title: 'Test Title',
        message: 'Test Message',
        senderId: 'sender1'
      });
    });
    
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('shows success message after sending notification', async () => {
    const { sendGroupNotification } = await import('../../../app/actions/notifiaction-actions');
    (sendGroupNotification as any).mockResolvedValue(undefined);
    
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    const titleField = screen.getByLabelText('Título');
    const messageField = screen.getByLabelText('Mensaje');
    const sendButton = screen.getByRole('button', { name: 'Enviar' });
    
    fireEvent.change(titleField, { target: { value: 'Test Title' } });
    fireEvent.change(messageField, { target: { value: 'Test Message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Notificación enviada')).toBeInTheDocument();
    });
  });

  it('shows error message when sending fails', async () => {
    const { sendGroupNotification } = await import('../../../app/actions/notifiaction-actions');
    (sendGroupNotification as any).mockRejectedValue(new Error('Network error'));
    
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    const titleField = screen.getByLabelText('Título');
    const messageField = screen.getByLabelText('Mensaje');
    const sendButton = screen.getByRole('button', { name: 'Enviar' });
    
    fireEvent.change(titleField, { target: { value: 'Test Title' } });
    fireEvent.change(messageField, { target: { value: 'Test Message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const { sendGroupNotification } = await import('../../../app/actions/notifiaction-actions');
    (sendGroupNotification as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    const titleField = screen.getByLabelText('Título');
    const messageField = screen.getByLabelText('Mensaje');
    const sendButton = screen.getByRole('button', { name: 'Enviar' });
    
    fireEvent.change(titleField, { target: { value: 'Test Title' } });
    fireEvent.change(messageField, { target: { value: 'Test Message' } });
    fireEvent.click(sendButton);
    
    // Buttons should be disabled during loading
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  it('clears form fields after successful submission', async () => {
    const { sendGroupNotification } = await import('../../../app/actions/notifiaction-actions');
    (sendGroupNotification as any).mockResolvedValue(undefined);
    
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    const titleField = screen.getByLabelText('Título');
    const messageField = screen.getByLabelText('Mensaje');
    const sendButton = screen.getByRole('button', { name: 'Enviar' });
    
    fireEvent.change(titleField, { target: { value: 'Test Title' } });
    fireEvent.change(messageField, { target: { value: 'Test Message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(titleField).toHaveValue('');
      expect(messageField).toHaveValue('');
    });
  });

  it('closes snackbar when close button is clicked', async () => {
    const { sendGroupNotification } = await import('../../../app/actions/notifiaction-actions');
    (sendGroupNotification as any).mockResolvedValue(undefined);
    
    renderWithTheme(<NotificationDialog {...defaultProps} />);
    
    const titleField = screen.getByLabelText('Título');
    const messageField = screen.getByLabelText('Mensaje');
    const sendButton = screen.getByRole('button', { name: 'Enviar' });
    
    fireEvent.change(titleField, { target: { value: 'Test Title' } });
    fireEvent.change(messageField, { target: { value: 'Test Message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Notificación enviada')).toBeInTheDocument();
    });
    
    const closeSnackbarButton = screen.getByLabelText('Close');
    fireEvent.click(closeSnackbarButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Notificación enviada')).not.toBeInTheDocument();
    });
  });
});
