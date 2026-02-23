import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface PaletteColor {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  }

  interface PaletteColorOptions {
    main?: string;
    light?: string;
    dark?: string;
    contrastText?: string;
  }

  interface Palette {
    accent: {
      gold: PaletteColor;
      silver: PaletteColor;
    };
  }

  interface PaletteOptions {
    accent?: {
      gold?: PaletteColorOptions;
      silver?: PaletteColorOptions;
    };
  }
}
