import * as React from "react";
import { createTheme } from '@mui/material/styles';
import {
  ThemeProvider,
  AppBar,
  Toolbar,
  Paper,
  Typography,
  IconButton, Link,
} from "@mui/material";
import Image from 'next/image';
import { useCurrentUser } from 'thin-backend-react';
import {useRouter} from "next/router";
import {loginWithRedirect, logout} from "thin-backend";
import {useEffect} from "react";

type FrameProps = {
  children?: JSX.Element | JSX.Element[],
}

function Layout(props: FrameProps) {
  const userData = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if(!userData) {
        await loginWithRedirect()
      }
    }, 500)

    return () => {
      clearTimeout(timeout)
    }
  }, [userData]);

  const theme = createTheme({
    palette: {
      primary: {
        main: '#b71c1c',
        contrastText: '#dddddd'
      },
      secondary: {
        main: '#90caf9',
      },
    },
  });

  const goHome = () => {
    router.push('/')
  }

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Paper variant={'outlined'} sx={{backgroundColor: 'primary.contrastText', height: '24px', padding: '2px', paddingLeft: '4px', paddingRight: '4px', cursor: 'pointer'}} onClick={goHome}>
            <Image src={'/logo_qatar.svg'} alt='logo-qatar' height={'20'} width={'100'}/>
          </Paper>
          <Typography variant="h6" component="div" sx={{ cursor: 'pointer'}} onClick={goHome}>
            Prode Mundial
          </Typography>
          {userData && (
            <div>
              Welcome {userData.nickname || userData.email}
              &nbsp;<Link onClick={() => logout()} title={'logout'} color={'primary.contrastText'}>Logout</Link>
            </div>
          )}
        </Toolbar>
      </AppBar>
      <main>{userData && props.children}</main>
    </ThemeProvider>
  );
}

export default Layout;
