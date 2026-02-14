'use client'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import * as React from "react";
import { useState } from "react";
import LoginForm from "./login-form";
import SignupForm from "./signup-form";
import ForgotPasswordForm from "./forgot-password-form";
import ResetSentView from "./reset-sent-view";
import VerificationSentView from "./verification-sent-view";
import EmailInputForm from "./email-input-form";
import {User} from "../../db/tables-definition";

type LoginOrSignupProps = {
  handleCloseLoginDialog: (_forceClose?: boolean) => void;
  openLoginDialog: boolean
}

type DialogMode = 'emailInput' | 'login' | 'signup' | 'forgotPassword' | 'resetSent' | 'verificationSent';

export default function LoginOrSignupDialog({ handleCloseLoginDialog, openLoginDialog }: LoginOrSignupProps) {
  const [dialogMode, setDialogMode] = useState<DialogMode>('emailInput');
  const [resetEmail, setResetEmail] = useState<string>('');
  const [createdUser, setCreatedUser] = useState<User>();
  const [email, setEmail] = useState<string>('');
  const [authMethods, setAuthMethods] = useState<{ hasPassword: boolean; hasGoogle: boolean; userExists: boolean }>();

  const closeDialog = () => {
    handleCloseLoginDialog(!!createdUser);
    setDialogMode('emailInput');
    setEmail('');
    setAuthMethods(undefined);
  }

  // Switch between dialog modes
  const switchMode = (mode: DialogMode) => {
    setDialogMode(mode);
  };

  // Handle email submission from EmailInputForm
  const handleEmailSubmit = (submittedEmail: string, methods: { hasPassword: boolean; hasGoogle: boolean; userExists: boolean }) => {
    setEmail(submittedEmail);
    setAuthMethods(methods);

    // Determine next step based on auth methods
    if (!methods.userExists) {
      // New user - go to signup
      switchMode('signup');
    } else if (methods.hasPassword) {
      // Existing user with password - go to login
      switchMode('login');
    }
    // If OAuth-only user (userExists=true, hasPassword=false, hasGoogle=true),
    // they will sign in via Google button in EmailInputForm
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

  // Get dialog title based on current mode
  const getDialogTitle = () => {
    switch (dialogMode) {
      case 'emailInput':
        return 'Ingresar o Registrarse';
      case 'login':
        return 'Ingresar';
      case 'signup':
        return 'Registrarse';
      case 'forgotPassword':
        return 'Recuperar Contraseña';
      case 'resetSent':
        return 'Enlace Enviado';
      default:
        return 'Ingresar';
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
          />
        );
      case 'signup':
        return (
          <SignupForm
            onSuccess={handleSignupSuccess}
            email={email}
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
                  ← Volver a email
                </Typography>
              </div>
              <div style={{ marginTop: '8px' }}>
                <Typography
                  color={'primary'}
                  onClick={() => switchMode('forgotPassword')}
                  sx={{ cursor: 'pointer' }}
                >
                  ¿Olvidaste tu contraseña?
                </Typography>
              </div>
            </div>
          </DialogActions>
        );
      case 'signup':
        return (
          <DialogActions>
            <Typography
              color={'primary'}
              onClick={() => switchMode('emailInput')}
              sx={{ cursor: 'pointer' }}
            >
              ← Volver a email
            </Typography>
          </DialogActions>
        );
      case 'forgotPassword':
        return (
          <DialogActions>
            <Typography
              color={'primary'}
              onClick={() => switchMode('emailInput')}
              sx={{ cursor: 'pointer' }}
            >
              ← Volver a email
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
          <Button onClick={closeDialog}>Cerrar</Button>
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
