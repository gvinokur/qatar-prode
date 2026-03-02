import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InviteFriendsDialog from '../../app/components/invite-friends-dialog';
import * as shortUrlActions from '../../app/actions/short-url-actions';

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

// Mock window.open
global.open = vi.fn();

// Mock short URL actions
vi.mock('../../app/actions/short-url-actions', () => ({
  generateShortUrlForGroup: vi.fn(),
  buildShortUrl: vi.fn(),
}));

describe('InviteFriendsDialog', () => {
  const mockProps = {
    trigger: <button>Invite</button>,
    groupId: 'test-group-id',
    groupName: 'Test Group Name',
  };

  const mockShortUrl = {
    id: 'short-url-1',
    code: 'abc123',
    group_id: 'test-group-id',
    tournament_id: null,
    created_at: new Date('2026-03-01'),
    click_count: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock short URL generation
    (shortUrlActions.generateShortUrlForGroup as any).mockResolvedValue(mockShortUrl);
    (shortUrlActions.buildShortUrl as any).mockResolvedValue('https://prodemundial.app/j/abc123');
  });

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

    // Wait for short URL to be generated
    await waitFor(() => {
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('https://prodemundial.app/j/abc123');
    });

    expect(shortUrlActions.generateShortUrlForGroup).toHaveBeenCalledWith('test-group-id', undefined);
    expect(shortUrlActions.buildShortUrl).toHaveBeenCalledWith('abc123');
  });

  it('copies the link to clipboard when "Copiar" is clicked', async () => {
    render(<InviteFriendsDialog {...mockProps} />);
    await userEvent.click(screen.getByText('Invite'));

    // Wait for short URL to load
    await waitFor(() => {
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('https://prodemundial.app/j/abc123');
    });

    const copyButton = screen.getByRole('button', { name: /copiar/i });
    await userEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://prodemundial.app/j/abc123');
    });
  });

  it('opens WhatsApp when WhatsApp button is clicked', async () => {
    render(<InviteFriendsDialog {...mockProps} />);
    await userEvent.click(screen.getByText('Invite'));

    // Wait for short URL to load
    await waitFor(() => {
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('https://prodemundial.app/j/abc123');
    });

    const whatsappButton = screen.getByRole('button', { name: /whatsapp/i });
    await userEvent.click(whatsappButton);

    const expectedMessage = `¡Hola! Te invito a unirte a nuestro grupo "Test Group Name" para jugar en al prode en los torneos actuales y futuros. Usa este enlace para unirte: https://prodemundial.app/j/abc123`;
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