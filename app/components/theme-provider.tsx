'use client'

import {createTheme} from "@mui/material/styles";
import {ThemeProvider} from "@mui/material";

export default function AppThemeProvider({
                                         children,
                                       }: {
  children: React.ReactNode
}) {
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

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

