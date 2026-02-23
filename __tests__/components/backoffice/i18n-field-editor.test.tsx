import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../utils/test-utils';
import I18nFieldEditor from '../../../app/components/backoffice/i18n-field-editor';

describe('I18nFieldEditor', () => {
  const defaultProps = {
    label: 'Test Field',
    value: null,
    onChange: vi.fn(),
    originalValue: 'Original Value'
  };

  describe('Rendering', () => {
    it('should render with label', () => {
      renderWithTheme(<I18nFieldEditor {...defaultProps} />);

      expect(screen.getByText('Test Field')).toBeInTheDocument();
    });

    it('should render English and Spanish input fields', () => {
      renderWithTheme(<I18nFieldEditor {...defaultProps} />);

      expect(screen.getByLabelText('English (en)')).toBeInTheDocument();
      expect(screen.getByLabelText('Spanish (es)')).toBeInTheDocument();
    });

    it('should show helper text when provided', () => {
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          helperText="This is a helper text"
        />
      );

      expect(screen.getByText('This is a helper text')).toBeInTheDocument();
    });

    it('should display original value hint', () => {
      renderWithTheme(<I18nFieldEditor {...defaultProps} />);

      expect(screen.getByText(/Current value:/)).toBeInTheDocument();
      expect(screen.getByText(/Original Value/)).toBeInTheDocument();
    });

    it('should not display original value hint when originalValue is empty', () => {
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          originalValue=""
        />
      );

      expect(screen.queryByText(/Current value:/)).not.toBeInTheDocument();
    });
  });

  describe('Value handling', () => {
    it('should initialize with empty values when value is null', () => {
      renderWithTheme(<I18nFieldEditor {...defaultProps} value={null} />);

      const enInput = screen.getByLabelText('English (en)') as HTMLInputElement;
      const esInput = screen.getByLabelText('Spanish (es)') as HTMLInputElement;

      expect(enInput.value).toBe('');
      expect(esInput.value).toBe('');
    });

    it('should initialize with provided values', () => {
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          value={{ en: 'English Text', es: 'Spanish Text' }}
        />
      );

      const enInput = screen.getByLabelText('English (en)') as HTMLInputElement;
      const esInput = screen.getByLabelText('Spanish (es)') as HTMLInputElement;

      expect(enInput.value).toBe('English Text');
      expect(esInput.value).toBe('Spanish Text');
    });

    it('should call onChange with empty strings when both fields are cleared', () => {
      const onChange = vi.fn();
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          onChange={onChange}
          value={{ en: 'Text', es: 'Texto' }}
        />
      );

      const enInput = screen.getByLabelText('English (en)');
      const esInput = screen.getByLabelText('Spanish (es)');

      fireEvent.change(enInput, { target: { value: '' } });
      fireEvent.change(esInput, { target: { value: '' } });

      expect(onChange).toHaveBeenLastCalledWith({ en: '', es: '' });
    });

    it('should call onChange with object when at least one field has value', () => {
      const onChange = vi.fn();
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          onChange={onChange}
        />
      );

      const enInput = screen.getByLabelText('English (en)');

      fireEvent.change(enInput, { target: { value: 'English Text' } });

      expect(onChange).toHaveBeenCalledWith({ en: 'English Text', es: '' });
    });

    it('should update both English and Spanish fields independently', () => {
      const onChange = vi.fn();
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          onChange={onChange}
        />
      );

      const enInput = screen.getByLabelText('English (en)');
      const esInput = screen.getByLabelText('Spanish (es)');

      fireEvent.change(enInput, { target: { value: 'English Text' } });
      expect(onChange).toHaveBeenCalledWith({ en: 'English Text', es: '' });

      fireEvent.change(esInput, { target: { value: 'Spanish Text' } });
      expect(onChange).toHaveBeenCalledWith({ en: 'English Text', es: 'Spanish Text' });
    });
  });

  describe('Validation', () => {
    it('should show error when required and both fields are empty after being touched', () => {
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          required={true}
          value={null}
        />
      );

      // Error only shows after user interacts with the fields
      const enInput = screen.getByLabelText('English (en)');

      // Touch the input by changing and clearing it
      fireEvent.change(enInput, { target: { value: 'test' } });
      fireEvent.change(enInput, { target: { value: '' } });

      expect(screen.getByText(/At least one locale \(English or Spanish\) is required/)).toBeInTheDocument();
    });

    it('should not show error when required and at least one field has value', () => {
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          required={true}
          value={{ en: 'English Text', es: '' }}
        />
      );

      expect(screen.queryByText(/At least one translation is required/)).not.toBeInTheDocument();
    });

    it('should not show error when not required and fields are empty', () => {
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          required={false}
          value={null}
        />
      );

      expect(screen.queryByText(/At least one translation is required/)).not.toBeInTheDocument();
    });

    it('should show error alert when required and empty after being touched', () => {
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          required={true}
          value={null}
        />
      );

      const enInput = screen.getByLabelText('English (en)');

      // Touch the input by changing and clearing it
      fireEvent.change(enInput, { target: { value: 'test' } });
      fireEvent.change(enInput, { target: { value: '' } });

      // Check for error alert (there may be multiple alerts, so find the error one)
      const alerts = screen.getAllByRole('alert');
      const errorAlert = alerts.find(alert => alert.textContent?.includes('At least one locale'));
      expect(errorAlert).toHaveTextContent('At least one locale (English or Spanish) is required.');
    });
  });

  describe('Disabled state', () => {
    it('should disable inputs when disabled prop is true', () => {
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          disabled={true}
        />
      );

      const enInput = screen.getByLabelText('English (en)') as HTMLInputElement;
      const esInput = screen.getByLabelText('Spanish (es)') as HTMLInputElement;

      expect(enInput.disabled).toBe(true);
      expect(esInput.disabled).toBe(true);
    });

    it('should enable inputs when disabled prop is false', () => {
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          disabled={false}
        />
      );

      const enInput = screen.getByLabelText('English (en)') as HTMLInputElement;
      const esInput = screen.getByLabelText('Spanish (es)') as HTMLInputElement;

      expect(enInput.disabled).toBe(false);
      expect(esInput.disabled).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in translations', () => {
      const onChange = vi.fn();
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          onChange={onChange}
        />
      );

      const enInput = screen.getByLabelText('English (en)');
      const esInput = screen.getByLabelText('Spanish (es)');

      fireEvent.change(enInput, { target: { value: 'Text with "quotes" and \'apostrophes\'' } });
      fireEvent.change(esInput, { target: { value: 'Texto con áccéntos y ñ' } });

      expect(onChange).toHaveBeenLastCalledWith({
        en: 'Text with "quotes" and \'apostrophes\'',
        es: 'Texto con áccéntos y ñ'
      });
    });

    it('should handle very long translations', () => {
      const onChange = vi.fn();
      const longText = 'A'.repeat(500);

      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          onChange={onChange}
        />
      );

      const enInput = screen.getByLabelText('English (en)');
      fireEvent.change(enInput, { target: { value: longText } });

      expect(onChange).toHaveBeenCalledWith({ en: longText, es: '' });
    });

    it('should handle whitespace-only input', () => {
      const onChange = vi.fn();
      renderWithTheme(
        <I18nFieldEditor
          {...defaultProps}
          onChange={onChange}
        />
      );

      const enInput = screen.getByLabelText('English (en)');
      fireEvent.change(enInput, { target: { value: '   ' } });

      // Whitespace-only is considered as having a value
      expect(onChange).toHaveBeenCalledWith({ en: '   ', es: '' });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      renderWithTheme(<I18nFieldEditor {...defaultProps} />);

      expect(screen.getByLabelText('English (en)')).toBeInTheDocument();
      expect(screen.getByLabelText('Spanish (es)')).toBeInTheDocument();
    });

    it('should have proper helper text for each input', () => {
      renderWithTheme(<I18nFieldEditor {...defaultProps} />);

      expect(screen.getByText("Displayed when user's locale is 'en'")).toBeInTheDocument();
      expect(screen.getByText("Displayed when user's locale is 'es'")).toBeInTheDocument();
    });

    it('should have proper placeholder text', () => {
      renderWithTheme(<I18nFieldEditor {...defaultProps} />);

      expect(screen.getByPlaceholderText('English translation')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Traducción en español')).toBeInTheDocument();
    });
  });
});
