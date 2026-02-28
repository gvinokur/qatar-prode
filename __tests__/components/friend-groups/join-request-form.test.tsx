import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { useRouter } from 'next/navigation';
import JoinRequestForm from '../../../app/components/friend-groups/join-request-form';
import { renderWithTheme } from '../../utils/test-utils';
import { testFactories } from '../../db/test-factories';
import { createMockRouter } from '../../mocks/next-navigation.mocks';

vi.mock('@/app/actions/prode-group-join-request-actions', () => ({
  requestToJoinGroup: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

const mockGroup = testFactories.prodeGroup({ name: 'Grupo de Prueba' });

const defaultProps = {
  group: mockGroup,
  memberCount: 5,
  locale: 'es' as const,
};

describe('JoinRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(createMockRouter());
  });

  describe('Normal form view', () => {
    it('renders group name in normal view', () => {
      renderWithTheme(<JoinRequestForm {...defaultProps} />);

      expect(screen.getByText('Grupo de Prueba')).toBeInTheDocument();
    });

    it('renders member count in normal view', () => {
      // The ICU plural mock returns "# miembros" literally for count > 1
      renderWithTheme(<JoinRequestForm {...defaultProps} />);

      expect(screen.getByText(/miembro/i)).toBeInTheDocument();
    });

    it('shows approval required info alert', () => {
      renderWithTheme(<JoinRequestForm {...defaultProps} />);

      expect(screen.getByText(/Se requiere aprobación del administrador/i)).toBeInTheDocument();
    });

    it('shows submit button in normal view', () => {
      renderWithTheme(<JoinRequestForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Solicitar Unirse al Grupo/i })).toBeInTheDocument();
    });

    it('button is disabled while loading', async () => {
      const { requestToJoinGroup } = await import('@/app/actions/prode-group-join-request-actions');
      (requestToJoinGroup as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 200))
      );

      renderWithTheme(<JoinRequestForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Solicitar Unirse al Grupo/i });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    it('shows success state with "¡Solicitud Enviada!" after successful submission', async () => {
      const { requestToJoinGroup } = await import('@/app/actions/prode-group-join-request-actions');
      (requestToJoinGroup as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      renderWithTheme(<JoinRequestForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Solicitar Unirse al Grupo/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('¡Solicitud Enviada!')).toBeInTheDocument();
      });
    });

    it('shows error alert when submission fails', async () => {
      const { requestToJoinGroup } = await import('@/app/actions/prode-group-join-request-actions');
      (requestToJoinGroup as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Error al enviar la solicitud')
      );

      renderWithTheme(<JoinRequestForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Solicitar Unirse al Grupo/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error al enviar la solicitud')).toBeInTheDocument();
      });
    });
  });

  describe('Cooldown view', () => {
    const cooldownProps = {
      ...defaultProps,
      rejectionCooldown: '15 de marzo de 2026',
    };

    it('shows rejection warning alert when rejectionCooldown is set', () => {
      renderWithTheme(<JoinRequestForm {...cooldownProps} />);

      expect(screen.getByText('Solicitud No Aprobada')).toBeInTheDocument();
    });

    it('shows the cooldown date in the cooldown message', () => {
      renderWithTheme(<JoinRequestForm {...cooldownProps} />);

      expect(screen.getByText(/15 de marzo de 2026/)).toBeInTheDocument();
    });

    it('does NOT show the submit button in cooldown view', () => {
      renderWithTheme(<JoinRequestForm {...cooldownProps} />);

      expect(
        screen.queryByRole('button', { name: /Solicitar Unirse al Grupo/i })
      ).not.toBeInTheDocument();
    });
  });
});
