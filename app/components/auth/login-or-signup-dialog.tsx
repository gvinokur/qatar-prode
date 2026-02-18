'use client'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import LoginForm from "./login-form";
import SignupForm from "./signup-form";
import ForgotPasswordForm from "./forgot-password-form";
import ResetSentView from "./reset-sent-view";
import VerificationSentView from "./verification-sent-view";
import EmailInputForm from "./email-input-form";
import OTPVerifyForm from "./otp-verify-form";
import AccountSetupForm from "./account-setup-form";
import {User} from "../../db/tables-definition";
import {sendOTPCode} from "../../actions/otp-actions";
import {signIn} from "next-auth/react";
import { Locale } from "@/i18n.config";

type LoginOrSignupProps = {
  handleCloseLoginDialog: (_forceClose?: boolean) => void;
  openLoginDialog: boolean
}

type DialogMode = 'emailInput' | 'login' | 'signup' | 'forgotPassword' | 'resetSent' | 'verificationSent' | 'otpVerify' | 'accountSetup';

export default function LoginOrSignupDialog({ handleCloseLoginDialog, openLoginDialog }: LoginOrSignupProps) {
  const router = useRouter();
  const t = useTranslations('auth');
  const locale = useLocale() as Locale;
  const [dialogMode, setDialogMode] = useState<DialogMode>('emailInput');
  const [resetEmail, setResetEmail] = useState<string>('');
  const [createdUser, setCreatedUser] = useState<User>();
  const [email, setEmail] = useState<string>('');
  const [verifiedOTP, setVerifiedOTP] = useState<string>('');
  const [isNewUserSignup, setIsNewUserSignup] = useState(false);

  const closeDialog = () => {
    handleCloseLoginDialog(!!createdUser);
    setDialogMode('emailInput');
    setEmail('');
  }

  // Switch between dialog modes
  const switchMode = (mode: DialogMode) => {
    setDialogMode(mode);
  };

  // Handle email submission from EmailInputForm
  const handleEmailSubmit = async (submittedEmail: string, methods: { hasPassword: boolean; hasGoogle: boolean; userExists: boolean }) => {
    setEmail(submittedEmail);

    // Check if user is OTP-only (has account but no password, no Google)
    if (methods.userExists && !methods.hasPassword && !methods.hasGoogle) {
      // Auto-send OTP for OTP-only users
      const result = await sendOTPCode(submittedEmail, locale);
      if (result.success) {
        switchMode('otpVerify');
      } else {
        // Error handled in OTP component
      }
      return;
    }

    // Check if user is Google-only (has account with Google but no password)
    if (methods.userExists && !methods.hasPassword && methods.hasGoogle) {
      // Auto-trigger Google sign-in for Google-only users
      await signIn('google', { callbackUrl: '/' });
      return;
    }

    // Determine next step based on auth methods
    if (!methods.userExists) {
      // New user - go to signup
      switchMode('signup');
    } else if (methods.hasPassword) {
      // Existing user with password - go to login
      switchMode('login');
    }
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    handleCloseLoginDialog(true);
    setDialogMode('login');
  };

  // Handle successful signup
  const handleSignupSuccess = (user: User) => {
    // Do Nothing
    setCreatedUser(user);
    switchMode('verificationSent');
  };

  // Handle successful password reset request
  const handleResetRequestSuccess = (email: string) => {
    setResetEmail(email);
    switchMode('resetSent');
  };

  // Handle OTP login click from LoginForm
  const handleOTPLoginClick = async () => {
    const result = await sendOTPCode(email, locale);
    if (result.success) {
      setIsNewUserSignup(false);
      switchMode('otpVerify');
    } else {
      // Error handled in OTP component
    }
  };

  // Handle OTP signup click from SignupForm
  const handleOTPSignupClick = async () => {
    const result = await sendOTPCode(email, locale);
    if (result.success) {
      setIsNewUserSignup(true);
      switchMode('otpVerify');
    } else {
      // Error handled in OTP component
    }
  };

  // Handle OTP verification success
  const handleOTPVerifySuccess = async (verifiedEmail: string, code: string) => {
    setVerifiedOTP(code);

    if (isNewUserSignup) {
      // New user - show account setup
      switchMode('accountSetup');
    } else {
      // Existing user - sign in directly
      const result = await signIn('otp', {
        email: verifiedEmail,
        otp: code,
        redirect: false
      });

      if (result?.ok) {
        handleCloseLoginDialog(true);
        router.refresh();
      } else {
        // Error: Failed to sign in after OTP verification
        switchMode('emailInput');
      }
    }
  };

  // Handle OTP resend
  const handleOTPResend = async () => {
    const result = await sendOTPCode(email, locale);
    if (!result.success) {
      // Error handled in OTP component
    }
  };

  // Handle account setup success
  const handleAccountSetupSuccess = () => {
    handleCloseLoginDialog(true);
  };

  // Get dialog title based on current mode
  const getDialogTitle = () => {
    switch (dialogMode) {
      case 'emailInput':
        return t('dialog.titles.emailInput');
      case 'login':
        return t('dialog.titles.login');
      case 'signup':
        return t('dialog.titles.signup');
      case 'forgotPassword':
        return t('dialog.titles.forgotPassword');
      case 'resetSent':
        return t('dialog.titles.resetSent');
      case 'verificationSent':
        return t('dialog.titles.verificationSent');
      case 'otpVerify':
        return t('dialog.titles.otpVerify');
      case 'accountSetup':
        return t('dialog.titles.accountSetup');
      default:
        return t('dialog.titles.emailInput');
    }
  };

  // Render the appropriate form based on dialog mode
  const renderDialogContent = () => {
    switch (dialogMode) {
      case 'emailInput':
        return (
          <EmailInputForm
            onEmailSubmit={handleEmailSubmit}
          />
        );
      case 'login':
        return (
          <LoginForm
            onSuccess={handleLoginSuccess}
            email={email}
            onOTPLoginClick={handleOTPLoginClick}
          />
        );
      case 'signup':
        return (
          <SignupForm
            onSuccess={handleSignupSuccess}
            email={email}
            onOTPSignupClick={handleOTPSignupClick}
          />
        );
      case 'otpVerify':
        return (
          <OTPVerifyForm
            email={email}
            onSuccess={handleOTPVerifySuccess}
            onCancel={() => switchMode('emailInput')}
            onResend={handleOTPResend}
          />
        );
      case 'accountSetup':
        return (
          <AccountSetupForm
            email={email}
            verifiedOTP={verifiedOTP}
            onSuccess={handleAccountSetupSuccess}
            onCancel={() => switchMode('emailInput')}
          />
        );
      case 'forgotPassword':
        return (
          <ForgotPasswordForm
            onSuccess={handleResetRequestSuccess}
          />
        );
      case 'resetSent':
        return <ResetSentView email={resetEmail} />;
      case 'verificationSent':
        return <VerificationSentView user={createdUser}/>
      default:
        return null;
    }
  };

  // Render navigation links
  const renderNavigationLinks = () => {
    switch (dialogMode) {
      case 'emailInput':
        return null; // No navigation links in email input mode
      case 'login':
        return (
          <DialogActions>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
              <div>
                <Typography
                  color={'primary'}
                  onClick={() => switchMode('emailInput')}
                  sx={{ cursor: 'pointer', display: 'inline' }}
                >
                  {t('dialog.links.backToEmail')}
                </Typography>
              </div>
              <div style={{ marginTop: '8px' }}>
                <Typography
                  color={'primary'}
                  onClick={() => switchMode('forgotPassword')}
                  sx={{ cursor: 'pointer' }}
                >
                  {t('login.forgotPassword')}
                </Typography>
              </div>
            </div>
          </DialogActions>
        );
      case 'signup':
      case 'forgotPassword':
        return (
          <DialogActions>
            <Typography
              color={'primary'}
              onClick={() => switchMode('emailInput')}
              sx={{ cursor: 'pointer' }}
            >
              {t('dialog.links.backToEmail')}
            </Typography>
          </DialogActions>
        );
      default:
        return null;
    }
  };

  // Render dialog actions (buttons)
  const renderDialogActions = () => {
    if (dialogMode === 'resetSent') {
      return (
        <DialogActions>
          <Button onClick={closeDialog}>{t('dialog.buttons.close')}</Button>
        </DialogActions>
      );
    }
    return null;
  };

  return (
    <Dialog
      open={openLoginDialog}
      onClose={closeDialog}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{getDialogTitle()}</DialogTitle>
      <DialogContent>
        {renderDialogContent()}
      </DialogContent>
      {renderDialogActions()}
      {renderNavigationLinks()}
    </Dialog>
  );
}
