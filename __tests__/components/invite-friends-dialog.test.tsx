import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InviteFriendsDialog from '../../app/components/invite-friends-dialog';

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

// Mock window.open
global.open = vi.fn();

describe('InviteFriendsDialog', () => {
  const mockProps = {
    trigger: <button>Invite</button>,
    groupId: 'test-group-id',
    groupName: 'Test Group Name',
  };

  it('renders the trigger button', () => {
    render(<InviteFriendsDialog {...mockProps} />);
    expect(screen.getByText('Invite')).toBeInTheDocument();
  });

  it('opens the dialog when the trigger is clicked', async () => {
    render(<InviteFriendsDialog {...mockProps} />);
    
    await userEvent.click(screen.getByText('Invite'));
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Invitar amigos a Test Group Name')).toBeInTheDocument();
  });

  it('displays the correct invitation link', async () => {
    render(<InviteFriendsDialog {...mockProps} />);
    await userEvent.click(screen.getByText('Invite'));
    
    const expectedLink = `http://localhost:3000/friend-groups/join/test-group-id`;
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe(expectedLink);
  });

  it('copies the link to clipboard when "Copiar" is clicked', async () => {
    render(<InviteFriendsDialog {...mockProps} />);
    await userEvent.click(screen.getByText('Invite'));
    
    const copyButton = screen.getByRole('button', { name: /copiar/i });
    await userEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/friend-groups/join/test-group-id');
    });
  });

  it('opens email client when email button is clicked', async () => {
    render(<InviteFriendsDialog {...mockProps} />);
    await userEvent.click(screen.getByText('Invite'));
    
    const emailButton = screen.getByRole('button', { name: /email/i });
    await userEvent.click(emailButton);
    
    const expectedMessage = `¡Hola! Te invito a unirte a nuestro grupo "Test Group Name" para jugar en al prode en los torneos actuales y futuros. Usa este enlace para unirte: http://localhost:3000/friend-groups/join/test-group-id`;
    const expectedMailto = `mailto:?subject=Invitaci%C3%B3n%20al%20grupo%20%22Test%20Group%20Name%22%20del%20Prode&body=${encodeURIComponent(expectedMessage)}`;
    
    expect(global.open).toHaveBeenCalledWith(expectedMailto);
  });

  it('opens WhatsApp when WhatsApp button is clicked', async () => {
    render(<InviteFriendsDialog {...mockProps} />);
    await userEvent.click(screen.getByText('Invite'));
    
    const whatsappButton = screen.getByRole('button', { name: /whatsapp/i });
    await userEvent.click(whatsappButton);
    
    const expectedMessage = `¡Hola! Te invito a unirte a nuestro grupo "Test Group Name" para jugar en al prode en los torneos actuales y futuros. Usa este enlace para unirte: http://localhost:3000/friend-groups/join/test-group-id`;
    const expectedWhatsappUrl = `https://wa.me/?text=${encodeURIComponent(expectedMessage)}`;

    expect(global.open).toHaveBeenCalledWith(expectedWhatsappUrl);
  });

  it('closes the dialog when the close button is clicked', async () => {
    render(<InviteFriendsDialog {...mockProps} />);
    await userEvent.click(screen.getByText('Invite'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes the dialog when the "Cerrar" button is clicked', async () => {
    render(<InviteFriendsDialog {...mockProps} />);
    await userEvent.click(screen.getByText('Invite'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    const cerrarButton = screen.getByRole('button', { name: /cerrar/i });
    await userEvent.click(cerrarButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
}); 