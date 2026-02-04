'use client'

import {useState, useEffect, useCallback} from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Paper, Alert } from '../../components/mui-wrappers';
import {signOut} from "next-auth/react";
import {verifyUserEmail} from "../../actions/user-actions";
import {CircularProgress} from "@mui/material";
import { AuthPageSkeleton } from '../skeletons';

interface EmailVerifierProps {
  readonly token: string;
}

export default function EmailVerifier({ token }: EmailVerifierProps) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verifyToken = useCallback(
    async (
      token: string,
      setIsVerifying: (_value: boolean) => void,
      setError: (_error: string | null) => void) => {
        try {
          const result = await verifyUserEmail(token);

          if (result.success) {
            // Redirect to login page with success message
            await signOut({ redirect: true, callbackUrl: '/?verified=true' });
            setIsVerifying(false)
          } else {
            setError(result.error || 'The verification link is invalid or has expired.');
            setIsVerifying(false);
          }
        } catch {
          setError('An unexpected error occurred during verification.');
          setIsVerifying(false);
        }
      }, []);

  useEffect(() => {
    if(token) {
      verifyToken(token, setIsVerifying, setError);
    }
  }, [token, verifyToken, setIsVerifying, setError]);

  if (isVerifying) {
    return <AuthPageSkeleton />;
  }

  return error ? (
    <Box
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
      onLoad={() => {
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Typography variant="h5" gutterBottom align="center">
          Email Verification Failed
        </Typography>

        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>

        <Typography sx={{ mt: 3 }} align="center">
          Please try to log in again or request a new verification email.
        </Typography>
      </Paper>
    </Box>
  ) : (<></>);
}
