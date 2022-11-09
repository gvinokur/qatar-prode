import * as React from "react";
import { createTheme } from '@mui/material/styles';
import {
  ThemeProvider,
  AppBar,
  Toolbar,
  Paper,
  Typography,
  IconButton,
} from "@mui/material";
import Image from 'next/image';
import { useCurrentUser } from 'thin-backend-react';

type FrameProps = {
  children?: JSX.Element | JSX.Element[],
}

function Layout(props: FrameProps) {
  const userData = useCurrentUser();
  const theme = createTheme({
    palette: {
      primary: {
        main: '#b71c1c',
      },
      secondary: {
        main: '#303f9f',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Paper variant={'outlined'} sx={{backgroundColor: 'primary.contrastText', height: '24px', padding: '2px', paddingLeft: '4px', paddingRight: '4px'}}>
            <Image src={'/logo_qatar.svg'} alt='logo-qatar' height={'20'} width={'100'}/>
          </Paper>
          <Typography variant="h6" component="div">
            Prode Mundial
          </Typography>
          {userData && (
            <div>
              Welcome {userData.email}
            </div>
          )}
        </Toolbar>
      </AppBar>
      <main>{props.children}</main>
    </ThemeProvider>
  );
}

export default Layout;
