'use client'

import {Box} from "@mui/material";
import {usePathname} from "next/navigation";

export function VerificationOverlay() {
  const pathname = usePathname()
  // Remove locale prefix if present (pathname could be /en/verify-email or /verify-email)
  // Only strip if first segment is a 2-letter locale code
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');

  return <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      zIndex: 3,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 3,
      backdropFilter: pathWithoutLocale === '/verify-email'? 'none' : 'blur(2px)',
    }}
  >
  </Box>;
}
