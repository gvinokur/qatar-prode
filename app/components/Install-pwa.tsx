'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker } from './service-worker-registration';
import {
  Button,
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ShareIcon from '@mui/icons-material/Share';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import {JSONTree} from "react-json-tree";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPwa() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    registerServiceWorker();

    // Check if on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();

    const { outcome } = await installPrompt.userChoice;
    console.log(`User ${outcome} the installation`);

    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

  const toggleIOSGuide = () => {
    setShowIOSGuide(!showIOSGuide);
  };

  if (isInstalled) {
    return null; // Don't show anything if already installed
  }

  return (!!installPrompt || isIOS) && (
      <Paper elevation={2} sx={{ p: 2, m: 2, borderRadius: 2 }}>
        {installPrompt && (
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Instala esta aplicación en tu dispositivo
            </Typography>
            <Typography variant="body2" paragraph>
              Instala esta aplicación en tu pantalla de inicio para un acceso rápido y fácil cuando estés en movimiento.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleInstallClick}
              startIcon={<AddIcon />}
            >
              Instalar Aplicación
            </Button>
          </Box>
        )}

        {isIOS && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Instala esta aplicación en tu dispositivo iOS
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={toggleIOSGuide}
              endIcon={showIOSGuide ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ mb: 1 }}
            >
              {showIOSGuide ? 'Ocultar guía de instalación' : 'Mostrar guía de instalación'}
            </Button>

            <Collapse in={showIOSGuide}>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                <Typography variant="body1" gutterBottom>
                  Para instalar esta aplicación en tu iPhone:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <ShareIcon />
                    </ListItemIcon>
                    <ListItemText primary="Toca el botón Compartir en la parte inferior de la pantalla" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AddIcon />
                    </ListItemIcon>
                    <ListItemText primary="Desplázate hacia abajo y toca 'Añadir a pantalla de inicio'" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AddIcon />
                    </ListItemIcon>
                    <ListItemText primary="Toca 'Añadir' en la esquina superior derecha" />
                  </ListItem>
                </List>
              </Paper>
            </Collapse>
          </Box>
        )}
      </Paper>
    );
}
