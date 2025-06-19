'use client'

import React, { useState } from 'react';
import { Alert, AlertTitle, Button, Snackbar } from '@mui/material';
import { resendVerificationEmail } from '../../actions/user-actions';
import {usePathname} from "next/navigation";


export default function VerificationBanner() {
  const [isResending, setIsResending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname()

  const handleResendVerification = async () => {
    setIsResending(true);
    setError(null);

    try {
      const result = await resendVerificationEmail();

      if (result.success) {
        setShowSuccess(true);
      } else {
        setError( 'Failed to resend verification email');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsResending(false);
    }
  };

  return pathname === '/verify-email' ? null : (
    <div
      style={{
        margin: '16px auto',
        width: '80%',
        maxWidth: '600px'
      }}
    >
      <Alert
        severity="warning"
        sx={{ mb: 2 }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleResendVerification}
            disabled={isResending}
          >
            {isResending ? 'Sending...' : 'Resend'}
          </Button>
        }
      >
        <AlertTitle>Email Not Verified</AlertTitle>
        Please verify your email address to access all features.
        {error && <div style={{ color: '#d32f2f', marginTop: 8 }}>{error}</div>}
      </Alert>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        message="Verification email sent successfully"
      />
    </div>
  );
}
