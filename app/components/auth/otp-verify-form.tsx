'use client'

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { Alert, Box, Button, Link, TextField, Typography } from "@mui/material";
import { useTranslations, useLocale } from 'next-intl';
import { verifyOTPCode } from "@/app/actions/otp-actions";
import { Locale } from "@/i18n.config";

type OTPVerifyFormProps = {
  readonly email: string;
  readonly onSuccess: (_email: string, _code: string) => void;
  readonly onCancel: () => void;
  readonly onResend: () => void;
}

// Constant array for OTP input positions (to avoid using array index in keys)
const OTP_POSITIONS = ['0', '1', '2', '3', '4', '5'] as const;

export default function OTPVerifyForm({ email, onSuccess, onCancel, onResend }: OTPVerifyFormProps) {
  const t = useTranslations('auth');
  const locale = useLocale() as Locale;
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [resendEnabled, setResendEnabled] = useState(false);
  const [resendTimeLeft, setResendTimeLeft] = useState(60); // 1 minute in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP expiration
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError(t('otp.timer.expired'));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [t]);

  // Countdown timer for resend button
  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimeLeft((prev) => {
        if (prev <= 1) {
          setResendEnabled(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on time remaining
  const getTimerColor = (seconds: number): string => {
    if (seconds > 120) return 'success.main'; // Green (> 2 min)
    if (seconds > 60) return 'warning.main';  // Yellow (1-2 min)
    return 'error.main';                       // Red (< 1 min)
  };

  const handleChange = (index: number, value: string) => {
    if (isVerifying) return; // Prevent input during verification

    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    // Update OTP array
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only last character
    setOtp(newOtp);
    setError(''); // Clear error on input

    // Auto-focus next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (index === 5 && value) {
      const fullCode = [...newOtp.slice(0, 5), value].join('');
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (isVerifying) return; // Prevent input during verification

    // Backspace handling
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box is empty, move to previous box
        inputRefs.current[index - 1]?.focus();
      } else if (otp[index]) {
        // If current box has value, delete it
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (isVerifying) return; // Prevent paste during verification

    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Only accept 6-digit numbers
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError(''); // Clear error

      // Focus last box
      inputRefs.current[5]?.focus();

      // Auto-submit
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code: string) => {
    if (isVerifying) return; // Prevent concurrent submissions

    setIsVerifying(true);
    setError('');

    try {
      const result = await verifyOTPCode(email, code, locale);

      if (result.success) {
        onSuccess(email, code);
      } else {
        setError(result.error || t('otp.errors.incorrect'));
        // Clear OTP boxes on error
        setOtp(new Array(6).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError(t('otp.errors.verifyFailed'));
      setOtp(new Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerify = () => {
    const code = otp.join('');
    if (code.length === 6) {
      handleVerify(code);
    } else {
      setError(t('otp.errors.required'));
    }
  };

  const handleResendClick = () => {
    if (resendEnabled) {
      onResend();
      // Reset resend timer
      setResendEnabled(false);
      setResendTimeLeft(60);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" variant="standard" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        {t('otp.instruction')}<br />
        <strong>{email}</strong>
      </Typography>

      {/* 6 OTP input boxes */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
        {otp.map((digit, index) => (
          <TextField
            key={`otp-${OTP_POSITIONS[index]}`}
            inputRef={(el) => (inputRefs.current[index] = el)}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e as any)}
            onPaste={handlePaste}
            disabled={isVerifying}
            variant="outlined"
            slotProps={{
              htmlInput: {
                maxLength: 1,
                style: {
                  textAlign: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  padding: '12px'
                },
                'aria-label': t('otp.digit.ariaLabel', { current: index + 1, total: 6 })
              }
            }}
            sx={{
              width: 50,
              '& input': {
                padding: '12px'
              }
            }}
          />
        ))}
      </Box>

      {/* Countdown timer */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Typography
          variant="body2"
          sx={{
            color: getTimerColor(timeLeft),
            fontWeight: 'medium'
          }}
        >
          {t('otp.timer.expiresIn', { time: formatTime(timeLeft) })}
        </Typography>
      </Box>

      {/* Resend link */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {t('otp.resend.prompt')}{' '}
          {resendEnabled ? (
            <Link
              component="button"
              onClick={handleResendClick}
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
            >
              {t('otp.resend.action')}
            </Link>
          ) : (
            <span style={{ color: '#999' }}>
              {t('otp.resend.countdown', { seconds: resendTimeLeft })}
            </span>
          )}
        </Typography>
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="text"
          onClick={onCancel}
          disabled={isVerifying}
        >
          {t('otp.buttons.back')}
        </Button>
        <Button
          variant="contained"
          onClick={handleManualVerify}
          disabled={isVerifying || otp.join('').length !== 6}
        >
          {isVerifying ? t('otp.buttons.verifying') : t('otp.buttons.verify')}
        </Button>
      </Box>
    </Box>
  );
}
