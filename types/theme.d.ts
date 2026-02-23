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

  interface TypographyVariants {
    h7: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    h7?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    h7: true;
  }
}
