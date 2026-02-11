import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../utils/test-utils';
import { EmptyGamesState } from '../../app/components/empty-games-state';

describe('EmptyGamesState', () => {
  describe('filter type: unpredicted', () => {
    it('renders success message for unpredicted filter', () => {
      renderWithTheme(<EmptyGamesState filterType="unpredicted" />);

      expect(screen.getByText('🎉')).toBeInTheDocument();
      expect(screen.getByText('¡Todo Listo!')).toBeInTheDocument();
      expect(screen.getByText('Ya predijiste todos los partidos disponibles.')).toBeInTheDocument();
    });
  });

  describe('filter type: closingSoon', () => {
    it('renders no upcoming games message', () => {
      renderWithTheme(<EmptyGamesState filterType="closingSoon" />);

      expect(screen.getByText('⏰')).toBeInTheDocument();
      expect(screen.getByText('No hay partidos próximos')).toBeInTheDocument();
      expect(screen.getByText('No hay partidos cerrando en las próximas 48 horas.')).toBeInTheDocument();
    });
  });

  describe('filter type: groups', () => {
    it('renders no group games message', () => {
      renderWithTheme(<EmptyGamesState filterType="groups" />);

      expect(screen.getByText('🔍')).toBeInTheDocument();
      expect(screen.getByText('No hay partidos de grupos')).toBeInTheDocument();
      expect(screen.getByText('No se encontraron partidos en esta fase.')).toBeInTheDocument();
    });
  });

  describe('filter type: playoffs', () => {
    it('renders no playoff games message', () => {
      renderWithTheme(<EmptyGamesState filterType="playoffs" />);

      expect(screen.getByText('🔍')).toBeInTheDocument();
      expect(screen.getByText('No hay partidos de playoffs')).toBeInTheDocument();
      expect(screen.getByText('No se encontraron partidos en esta fase.')).toBeInTheDocument();
    });
  });

  describe('filter type: all (default)', () => {
    it('renders default no games message', () => {
      renderWithTheme(<EmptyGamesState filterType="all" />);

      expect(screen.getByText('🔍')).toBeInTheDocument();
      expect(screen.getByText('No hay partidos')).toBeInTheDocument();
      expect(screen.getByText('No se encontraron partidos con los filtros seleccionados.')).toBeInTheDocument();
    });
  });

  describe('layout and styling', () => {
    it('renders centered layout', () => {
      const { container } = renderWithTheme(<EmptyGamesState filterType="unpredicted" />);
      const box = container.firstChild as HTMLElement;

      expect(box).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      });
    });

    it('renders large emoji', () => {
      renderWithTheme(<EmptyGamesState filterType="unpredicted" />);
      const emoji = screen.getByText('🎉');

      expect(emoji).toHaveStyle({
        fontSize: '4rem'
      });
    });
  });

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWithTheme(<EmptyGamesState filterType="unpredicted" />);

      const heading = screen.getByRole('heading', { name: '¡Todo Listo!' });
      expect(heading).toBeInTheDocument();
    });

    it('provides descriptive text for screen readers', () => {
      renderWithTheme(<EmptyGamesState filterType="closingSoon" />);

      expect(screen.getByText('No hay partidos cerrando en las próximas 48 horas.')).toBeInTheDocument();
    });
  });
});
