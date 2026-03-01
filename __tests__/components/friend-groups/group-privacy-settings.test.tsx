import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GroupPrivacySettings from '@/app/components/friend-groups/group-privacy-settings';
import { renderWithTheme } from '../../utils/test-utils';
import { updateGroupPrivacyAction } from '@/app/actions/prode-group-actions';

vi.mock('@/app/actions/prode-group-actions', () => ({
  updateGroupPrivacyAction: vi.fn(),
}));

vi.mock('@/app/components/friend-groups/public-group-preview-dialog', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="preview-dialog">
        <button onClick={onClose}>Close Preview</button>
      </div>
    ) : null,
}));

const mockUpdateGroupPrivacyAction = vi.mocked(updateGroupPrivacyAction);

describe('GroupPrivacySettings', () => {
  const defaultProps = {
    groupId: 'group-1',
    groupName: 'Test Group',
    initialIsPublic: false,
    initialDescription: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateGroupPrivacyAction.mockResolvedValue({ success: true });
  });

  describe('Initial rendering', () => {
    it('renders the privacy settings heading', () => {
      renderWithTheme(<GroupPrivacySettings {...defaultProps} />);
      // ES: groups.privacy.settingsTitle → "Configuración de Privacidad"
      expect(screen.getByText(/Configuración de Privacidad/)).toBeInTheDocument();
    });

    it('shows private toggle selected when initialIsPublic is false', () => {
      renderWithTheme(<GroupPrivacySettings {...defaultProps} initialIsPublic={false} />);
      // ES: groups.privacy.private → "Privado"
      const privateBtn = screen.getByRole('button', { name: 'Privado' });
      expect(privateBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows public toggle selected when initialIsPublic is true', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="desc" />
      );
      // ES: groups.privacy.public → "Público"
      const publicBtn = screen.getByRole('button', { name: 'Público' });
      expect(publicBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('does not show description field when private', () => {
      renderWithTheme(<GroupPrivacySettings {...defaultProps} initialIsPublic={false} />);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('shows description field when public', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="desc" />
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('populates description field with initialDescription', () => {
      renderWithTheme(
        <GroupPrivacySettings
          {...defaultProps}
          initialIsPublic={true}
          initialDescription="My description"
        />
      );
      expect(screen.getByRole('textbox')).toHaveValue('My description');
    });

    it('treats null initialDescription as empty string', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription={null} />
      );
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('shows public info alert when public', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="desc" />
      );
      // ES: groups.privacy.makePublicTip
      expect(
        screen.getByText('Tu grupo será visible para todos en la página de descubrimiento')
      ).toBeInTheDocument();
    });

    it('does not show public info alert when private', () => {
      renderWithTheme(<GroupPrivacySettings {...defaultProps} initialIsPublic={false} />);
      expect(
        screen.queryByText('Tu grupo será visible para todos en la página de descubrimiento')
      ).not.toBeInTheDocument();
    });
  });

  describe('Visibility toggle', () => {
    it('switching from private to public shows the description field', () => {
      renderWithTheme(<GroupPrivacySettings {...defaultProps} initialIsPublic={false} />);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Público' }));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('switching from public to private opens confirmation dialog', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="desc" />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Privado' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('cancelling the confirmation dialog leaves the group as public', async () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="desc" />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Privado' }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      });

      // MUI Dialog animates out — wait for it to leave the DOM
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      // Description field still visible — still public
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('confirming the dialog switches group to private', async () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="desc" />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Privado' }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      });

      // MUI Dialog animates out — wait for it to leave the DOM
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      // Description field gone — now private
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('clicking already-selected toggle value does not open confirmation dialog', () => {
      renderWithTheme(<GroupPrivacySettings {...defaultProps} initialIsPublic={false} />);
      // Already private — clicking private again should be a no-op
      fireEvent.click(screen.getByRole('button', { name: 'Privado' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Description field', () => {
    it('shows character count in helper text', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="hello" />
      );
      // "5 / 500 — Visible cuando..."
      expect(screen.getByText(/5 \/ 500/)).toBeInTheDocument();
    });

    it('shows description required error after typing and clearing', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="" />
      );
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'x' } });
      fireEvent.change(input, { target: { value: '' } });
      // ES: groups.privacy.descriptionRequired
      expect(
        screen.getByText('La descripción es obligatoria para grupos públicos')
      ).toBeInTheDocument();
    });

    it('updates character count as user types', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="hi" />
      );
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello world' } });
      expect(screen.getByText(/11 \/ 500/)).toBeInTheDocument();
    });
  });

  describe('Save button', () => {
    it('is disabled when public and description is empty', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="" />
      );
      // ES: groups.privacy.saveSettings → "Guardar Configuración"
      expect(screen.getByRole('button', { name: 'Guardar Configuración' })).toBeDisabled();
    });

    it('is enabled when public and description has content', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="desc" />
      );
      expect(screen.getByRole('button', { name: 'Guardar Configuración' })).not.toBeDisabled();
    });

    it('is enabled when private (description not required)', () => {
      renderWithTheme(<GroupPrivacySettings {...defaultProps} initialIsPublic={false} />);
      expect(screen.getByRole('button', { name: 'Guardar Configuración' })).not.toBeDisabled();
    });
  });

  describe('Preview button', () => {
    it('shows preview button when public with description content', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="desc" />
      );
      // ES: groups.privacy.previewInDiscovery → "Vista previa en Descubrimiento"
      expect(screen.getByRole('button', { name: /Vista previa/i })).toBeInTheDocument();
    });

    it('hides preview button when private', () => {
      renderWithTheme(<GroupPrivacySettings {...defaultProps} initialIsPublic={false} />);
      expect(screen.queryByRole('button', { name: /Vista previa/i })).not.toBeInTheDocument();
    });

    it('preview button is disabled when description is empty', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="" />
      );
      expect(screen.getByRole('button', { name: /Vista previa/i })).toBeDisabled();
    });

    it('opens preview dialog when preview button is clicked', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="desc" />
      );
      fireEvent.click(screen.getByRole('button', { name: /Vista previa/i }));
      expect(screen.getByTestId('preview-dialog')).toBeInTheDocument();
    });

    it('closes preview dialog via onClose callback', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="desc" />
      );
      fireEvent.click(screen.getByRole('button', { name: /Vista previa/i }));
      expect(screen.getByTestId('preview-dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Close Preview' }));
      expect(screen.queryByTestId('preview-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Save action', () => {
    it('calls updateGroupPrivacyAction with groupId and false when private', async () => {
      renderWithTheme(<GroupPrivacySettings {...defaultProps} initialIsPublic={false} />);
      fireEvent.click(screen.getByRole('button', { name: 'Guardar Configuración' }));

      await waitFor(() => {
        expect(mockUpdateGroupPrivacyAction).toHaveBeenCalledWith('group-1', false, undefined);
      });
    });

    it('calls action with trimmed description when public', async () => {
      renderWithTheme(
        <GroupPrivacySettings
          {...defaultProps}
          initialIsPublic={true}
          initialDescription="  trimmed  "
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Guardar Configuración' }));

      await waitFor(() => {
        expect(mockUpdateGroupPrivacyAction).toHaveBeenCalledWith('group-1', true, 'trimmed');
      });
    });

    it('does not call action when save button is disabled', () => {
      renderWithTheme(
        <GroupPrivacySettings {...defaultProps} initialIsPublic={true} initialDescription="" />
      );
      const saveBtn = screen.getByRole('button', { name: 'Guardar Configuración' });
      expect(saveBtn).toBeDisabled();
      expect(mockUpdateGroupPrivacyAction).not.toHaveBeenCalled();
    });

    it('shows success snackbar after successful save', async () => {
      renderWithTheme(<GroupPrivacySettings {...defaultProps} initialIsPublic={false} />);
      fireEvent.click(screen.getByRole('button', { name: 'Guardar Configuración' }));

      await waitFor(() => {
        // ES: groups.privacy.saved → "Configuración de privacidad guardada"
        expect(
          screen.getByText('Configuración de privacidad guardada')
        ).toBeInTheDocument();
      });
    });

    it('shows error message from action response', async () => {
      mockUpdateGroupPrivacyAction.mockResolvedValue({ error: 'Permission denied' });

      renderWithTheme(<GroupPrivacySettings {...defaultProps} initialIsPublic={false} />);
      fireEvent.click(screen.getByRole('button', { name: 'Guardar Configuración' }));

      await waitFor(() => {
        expect(screen.getByText('Permission denied')).toBeInTheDocument();
      });
    });

    it('shows generic error message when action throws', async () => {
      mockUpdateGroupPrivacyAction.mockRejectedValue(new Error('Network error'));

      renderWithTheme(<GroupPrivacySettings {...defaultProps} initialIsPublic={false} />);
      fireEvent.click(screen.getByRole('button', { name: 'Guardar Configuración' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to save settings')).toBeInTheDocument();
      });
    });
  });
});
