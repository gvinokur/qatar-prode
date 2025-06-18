'use client'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import * as React from "react";
import { useState } from "react";
import LoginForm from "./login-form";
import SignupForm from "./signup-form";
import ForgotPasswordForm from "./forgot-password-form";
import ResetSentView from "./reset-sent-view";
import VerificationSentView from "./verification-sent-view";
import {User} from "../../db/tables-definition";

type LoginOrSignupProps = {
  handleCloseLoginDialog: (_forceClose?: boolean) => void;
  openLoginDialog: boolean
}

type DialogMode = 'login' | 'signup' | 'forgotPassword' | 'resetSent' | 'verificationSent';

export default function LoginOrSignupDialog({ handleCloseLoginDialog, openLoginDialog }: LoginOrSignupProps) {
  const [dialogMode, setDialogMode] = useState<DialogMode>('login');
  const [resetEmail, setResetEmail] = useState<string>('');
  const [createdUser, setCreatedUser] = useState<User>();

  const closeDialog = () => {
    handleCloseLoginDialog(!!createdUser);
    setDialogMode('login');
  }


  // Switch between dialog modes
  const switchMode = (mode: DialogMode) => {
    setDialogMode(mode);
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
      case 'verificationSent':
        return <VerificationSentView user={createdUser}/>
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
