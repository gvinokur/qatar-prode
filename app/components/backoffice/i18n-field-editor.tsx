'use client'

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  Alert
} from '@mui/material';

interface I18nFieldEditorProps {
  /**
   * Label for the i18n field (e.g., "Long Name (Localized)")
   */
  label: string;

  /**
   * Current i18n values ({ en: "...", es: "..." })
   * Can be null/undefined for new records
   */
  value: { en?: string; es?: string } | null | undefined;

  /**
   * Callback when values change
   * Always returns both locales (may be empty strings)
   */
  onChange: (value: { en: string; es: string }) => void;

  /**
   * Original non-localized value to display as reference
   * (e.g., the current value of `long_name` field)
   */
  originalValue?: string;

  /**
   * Whether at least one locale is required
   * @default false
   */
  required?: boolean;

  /**
   * Helper text to display below the inputs
   */
  helperText?: string;

  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * Reusable component for editing i18n JSONB fields in backoffice forms
 *
 * Displays two text fields (English and Spanish) for entering localized values.
 * Validates that at least one locale is provided when required=true.
 *
 * @example
 * ```tsx
 * <I18nFieldEditor
 *   label="Long Name (Localized)"
 *   value={tournament.long_name_i18n}
 *   originalValue={tournament.long_name}
 *   onChange={(v) => setTournament({ ...tournament, long_name_i18n: v })}
 *   required
 *   helperText="Provide at least one translation (en or es)"
 * />
 * ```
 */
export default function I18nFieldEditor({
  label,
  value,
  onChange,
  originalValue,
  required = false,
  helperText,
  disabled = false
}: I18nFieldEditorProps) {
  // Local state for the two locale inputs
  const [enValue, setEnValue] = useState<string>('');
  const [esValue, setEsValue] = useState<string>('');
  const [touched, setTouched] = useState(false);

  // Initialize from props
  useEffect(() => {
    setEnValue(value?.en || '');
    setEsValue(value?.es || '');
  }, [value]);

  // Validation: at least one locale required if required=true
  const hasError = required && touched && !enValue.trim() && !esValue.trim();

  // Handle changes and propagate to parent
  const handleEnChange = (newEn: string) => {
    setEnValue(newEn);
    setTouched(true);
    onChange({ en: newEn, es: esValue });
  };

  const handleEsChange = (newEs: string) => {
    setEsValue(newEs);
    setTouched(true);
    onChange({ en: enValue, es: newEs });
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* Label */}
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
        {label}
        {required && <span style={{ color: 'red' }}> *</span>}
      </Typography>

      {/* Original value reference (if provided) */}
      {originalValue && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Current value:</strong> {originalValue}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            The localized values below will override this when a matching locale is requested.
          </Typography>
        </Alert>
      )}

      {/* Locale input fields */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="English (en)"
            value={enValue}
            onChange={(e) => handleEnChange(e.target.value)}
            disabled={disabled}
            placeholder="English translation"
            helperText="Displayed when user's locale is 'en'"
            error={hasError && !enValue.trim()}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Spanish (es)"
            value={esValue}
            onChange={(e) => handleEsChange(e.target.value)}
            disabled={disabled}
            placeholder="Traducción en español"
            helperText="Displayed when user's locale is 'es'"
            error={hasError && !esValue.trim()}
          />
        </Grid>
      </Grid>

      {/* Helper text or validation error */}
      {helperText && !hasError && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {helperText}
        </Typography>
      )}

      {hasError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          At least one locale (English or Spanish) is required.
        </Alert>
      )}
    </Box>
  );
}
