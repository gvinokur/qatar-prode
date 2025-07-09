import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import EnvironmentIndicator from '../../app/components/environment-indicator';

describe('EnvironmentIndicator', () => {
  describe('when isDev is true', () => {
    it('renders the development environment indicator', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      expect(screen.getByText('Development Mode')).toBeInTheDocument();
      expect(screen.getByText('Este torneo solo esta disponible en modo desarrollo.')).toBeInTheDocument();
    });

    it('renders with correct Material-UI components', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      // Check for Alert with warning severity
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('MuiAlert-filledWarning');
    });

    it('renders with proper container structure', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      // The Box container should contain the alert
      const alert = screen.getByRole('alert');
      const container = alert.closest('div');
      expect(container).toBeInTheDocument();
      expect(container).toContainElement(alert);
    });

    it('renders with Material-UI Alert component', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('MuiAlert-root');
    });
  });

  describe('when isDev is false', () => {
    it('does not render anything', () => {
      const { container } = render(<EnvironmentIndicator isDev={false} />);
      
      expect(container.firstChild).toBeNull();
      expect(screen.queryByText('Development Mode')).not.toBeInTheDocument();
      expect(screen.queryByText('Este torneo solo esta disponible en modo desarrollo.')).not.toBeInTheDocument();
    });

    it('does not render any alert elements', () => {
      render(<EnvironmentIndicator isDev={false} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('prop validation', () => {
    it('handles boolean true prop correctly', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('handles boolean false prop correctly', () => {
      render(<EnvironmentIndicator isDev={false} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles truthy values as expected', () => {
      // TypeScript would catch this, but testing runtime behavior
      render(<EnvironmentIndicator isDev={1 as any} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('handles falsy values as expected', () => {
      // TypeScript would catch this, but testing runtime behavior
      render(<EnvironmentIndicator isDev={0 as any} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA role for alert', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('role', 'alert');
    });

    it('has proper alert title structure', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      // AlertTitle should be rendered as part of the alert
      const alertTitle = screen.getByText('Development Mode');
      expect(alertTitle).toBeInTheDocument();
      expect(alertTitle).toHaveClass('MuiAlertTitle-root');
    });
  });

  describe('visual appearance', () => {
    it('renders with warning severity styling', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('MuiAlert-filledWarning');
    });

    it('renders with filled variant styling', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('MuiAlert-filled');
    });

    it('renders with proper container hierarchy', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      const alert = screen.getByRole('alert');
      const container = alert.closest('div');
      expect(container).toBeInTheDocument();
      expect(container).toContainElement(alert);
    });
  });

  describe('text content', () => {
    it('displays correct Spanish text', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      expect(screen.getByText('Este torneo solo esta disponible en modo desarrollo.')).toBeInTheDocument();
    });

    it('displays correct English title', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      expect(screen.getByText('Development Mode')).toBeInTheDocument();
    });

    it('contains both title and description text', () => {
      render(<EnvironmentIndicator isDev={true} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Development Mode');
      expect(alert).toHaveTextContent('Este torneo solo esta disponible en modo desarrollo.');
    });
  });
});
