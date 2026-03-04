'use client'

import React, { useRef, useImperativeHandle } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

// Define the imperative handle interface
export interface ScoreInputHandle {
  focus: () => void;
}

interface StepperScoreInputProps {
  readonly value?: number;                              // Score value (undefined = empty)
  readonly onChange: (value?: number) => void;         // Callback when value changes
  readonly teamName: string;                           // For aria-label
  readonly disabled?: boolean;                         // Loading state
  readonly inputRef?: React.RefObject<unknown>;         // For keyboard navigation (uses useImperativeHandle)
  readonly onKeyDown?: (e: React.KeyboardEvent) => void; // Keyboard event handler
  readonly onFocus?: () => void;                       // Focus event handler
  readonly compact?: boolean;                          // Compact mode (smaller buttons)
}

export default function StepperScoreInput({
  value,
  onChange,
  teamName,
  disabled = false,
  inputRef,
  onKeyDown,
  onFocus,
  compact = false
}: StepperScoreInputProps) {
  const decrementButtonRef = useRef<HTMLButtonElement>(null);

  // Expose focus() method through parent's ref (for keyboard navigation)
  useImperativeHandle(inputRef, () => ({
    focus: () => {
      // Focus the decrement button (first interactive element)
      decrementButtonRef.current?.focus();
    }
  }));

  // Handle increment
  const handleIncrement = () => {
    if (disabled) return;

    // First tap from empty state sets to 0 (not 1)
    if (value === undefined || value === null) {
      onChange(0);
      return;
    }

    // Increment existing value (up to max of 99)
    if (value < 99) {
      onChange(value + 1);
    }
  };

  // Handle decrement
  const handleDecrement = () => {
    if (disabled || value === undefined || value === null) return;
    if (value > 0) {
      onChange(value - 1);
    }
    // Note: When value === 0, do nothing (can't go below 0)
  };

  const isDecrementDisabled = disabled || value === undefined || value === null || value === 0;
  const isIncrementDisabled = disabled || value === 99;

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <IconButton
        ref={decrementButtonRef}
        onClick={handleDecrement}
        disabled={isDecrementDisabled}
        color="secondary"
        size={compact ? 'small' : 'medium'}
        aria-label={`Decrease ${teamName} score`}
        sx={{
          width: compact ? 36 : 44,
          height: compact ? 36 : 44,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'transform 100ms ease-out',
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        <RemoveIcon fontSize={compact ? 'small' : 'medium'} />
      </IconButton>

      <Typography
        variant={compact ? 'body2' : 'body1'}
        fontWeight="medium"
        sx={{
          minWidth: 32,
          textAlign: 'center',
          color: 'primary.main'
        }}
      >
        {value ?? '—'}
      </Typography>

      <IconButton
        onClick={handleIncrement}
        disabled={isIncrementDisabled}
        color="secondary"
        size={compact ? 'small' : 'medium'}
        aria-label={`Increase ${teamName} score`}
        sx={{
          width: compact ? 36 : 44,
          height: compact ? 36 : 44,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'transform 100ms ease-out',
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        <AddIcon fontSize={compact ? 'small' : 'medium'} />
      </IconButton>
    </Box>
  );
}
