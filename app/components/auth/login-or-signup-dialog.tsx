'use client'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import * as React from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import LoginForm, { LoginFormData } from "./login-form";
import SignupForm from "./signup-form";
import ForgotPasswordForm from "./forgot-password-form";
import ResetSentView from "./reset-sent-view";

type LoginOrSignupProps = {
  handleCloseLoginDialog: () => void;
  openLoginDialog: boolean
}

type DialogMode = 'login' | 'signup' | 'forgotPassword' | 'resetSent';

export default function LoginOrSignupDialog({ handleCloseLoginDialog, openLoginDialog }: LoginOrSignupProps) {
  const [dialogMode, setDialogMode] = useState<DialogMode>('login');
  const [resetEmail, setResetEmail] = useState<string>('');

  const closeDialog = () => {
    handleCloseLoginDialog();
    setDialogMode('login');
  }


  // Switch between dialog modes
  const switchMode = (mode: DialogMode) => {
    setDialogMode(mode);
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    closeDialog();
  };

  // Handle successful signup
  const handleSignupSuccess = (loginData: LoginFormData) => {
    // Auto login after signup
    signIn("credentials", {
      ...loginData,
      redirect: false,
    }).then((response: any) => {
      if (response.ok) {
        switchMode('login');
        closeDialog();
      }
    });
  };

  // Handle successful password reset request
  const handleResetRequestSuccess = (email: string) => {
    setResetEmail(email);
    switchMode('resetSent');
  };

  // Get dialog title based on current mode
  const getDialogTitle = () => {
    switch (dialogMode) {
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
      case 'login':
        return (
          <LoginForm
            onSuccess={handleLoginSuccess}
          />
        );
      case 'signup':
        return (
          <SignupForm
            onSuccess={handleSignupSuccess}
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
      default:
        return null;
    }
  };

  // Render navigation links
  const renderNavigationLinks = () => {
    switch (dialogMode) {
      case 'login':
        return (
          <DialogActions>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
              <div>
                No tenes usuario?&nbsp;
                <Typography
                  color={'primary'}
                  onClick={() => switchMode('signup')}
                  sx={{ cursor: 'pointer', display: 'inline' }}
                >
                  Crea uno!
                </Typography>
              </div>
              <div style={{ marginTop: '8px' }}>
                <Typography
                  color={'primary'}
                  onClick={() => switchMode('forgotPassword')}
                  sx={{ cursor: 'pointer' }}
                >
                  ¿Olvidaste tu contraseña?&nbsp;
                </Typography>
              </div>
            </div>
          </DialogActions>
        );
      case 'signup':
        return (
          <DialogActions>
            Ya tenes usuario?&nbsp;
            <Typography
              color={'primary'}
              onClick={() => switchMode('login')}
              sx={{ cursor: 'pointer' }}
            >
              Ingresa aca!
            </Typography>
          </DialogActions>
        );
      case 'forgotPassword':
        return (
          <DialogActions>
            <Typography
              color={'primary'}
              onClick={() => switchMode('login')}
              sx={{ cursor: 'pointer' }}
            >
              Volver al inicio de sesión
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
