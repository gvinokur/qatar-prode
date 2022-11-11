import * as React from "react";
import { createTheme } from '@mui/material/styles';
import {
  ThemeProvider,
  AppBar,
  Toolbar,
  Paper,
  Typography,
  IconButton,
  Link, Menu, MenuItem, Avatar, Box, Tooltip, Button,
} from "@mui/material";
import {
  Menu as MenuIcon
} from '@mui/icons-material'
import Image from 'next/image';
import { useCurrentUser } from 'thin-backend-react';
import {useRouter} from "next/router";
import {loginWithRedirect, logout} from "thin-backend";
import {useEffect} from "react";

type FrameProps = {
  children?: JSX.Element | JSX.Element[],
}

type Page = {
  name: string,
  link: string,
  children?: Page[]
}

const pages: Page[] = [ {
  name: 'Home',
  link: '/'
}, {
  name: 'Pronosticos',
  link: '/predictions'
}]

function Layout(props: FrameProps) {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const userData = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if(!userData) {
        await loginWithRedirect()
      }
    }, 5000)

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

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar>
          <Paper
            variant={'outlined'}
            sx={{
              backgroundColor: 'primary.contrastText',
              height: '24px',
              padding: '2px',
              paddingLeft: '4px',
              paddingRight: '4px',
              cursor: 'pointer',
              display: { xs: 'none', md: 'flex' },
              mr: 1}}
            onClick={goHome}>
            <Image src={'/logo_qatar.svg'} alt='logo-qatar' height={'20'} width={'100'}/>
          </Paper>
          <Typography
            variant="h6"
            noWrap
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              flexGrow: 0,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              cursor: 'pointer'}}
            onClick={goHome}>
            Prode Mundial
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pages.map((page) => (
                <MenuItem key={page.name} onClick={() => {
                  handleCloseNavMenu();
                  router.push(page.link);
                }}>
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Paper
            variant={'outlined'}
            sx={{
              backgroundColor: 'primary.contrastText',
              height: '24px',
              padding: '2px',
              paddingLeft: '4px',
              paddingRight: '4px',
              cursor: 'pointer',
              display: { xs: 'flex', md: 'none' },
              mr: 1}}
            onClick={goHome}>
            <Image src={'/logo_qatar.svg'} alt='logo-qatar' height={'20'} width={'100'}/>
          </Paper>
          <Typography
            variant="h6"
            noWrap
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              cursor: 'pointer'}}
            onClick={goHome}>
            Prode Mundial
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 0 }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                onClick={() => {
                  handleCloseNavMenu();
                  router.push(page.link);
                }}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page.name}
              </Button>
            ))}
          </Box>


          {userData && (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={(userData.nickname || userData.email)}>{(userData.nickname || userData.email)[0]}</Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem onClick={handleCloseUserMenu}>
                  <Typography textAlign="center" onClick={() => logout()}>Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <main>{userData && props.children}</main>
    </ThemeProvider>
  );
}

export default Layout;
