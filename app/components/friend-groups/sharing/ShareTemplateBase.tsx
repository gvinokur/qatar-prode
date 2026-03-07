import { Box, Typography } from '@mui/material'

interface ShareTemplateBaseProps {
  readonly accentColor: string
  readonly title: string
  readonly subtitle: string
  readonly children: React.ReactNode
  readonly footerText: string
}

export default function ShareTemplateBase({
  accentColor,
  title,
  subtitle,
  children,
  footerText,
}: ShareTemplateBaseProps) {
  return (
    <Box
      sx={{
        width: 540,
        fontFamily: 'Arial, Helvetica, sans-serif',
        bgcolor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ bgcolor: accentColor, px: 2.5, py: 1.5 }}>
        <Typography
          sx={{
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: 17,
            lineHeight: 1.3,
            fontFamily: 'inherit',
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      {/* Content */}
      {children}

      {/* Footer */}
      <Box
        sx={{
          borderTop: '1px solid #eeeeee',
          px: 2.5,
          py: 1,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Typography sx={{ color: '#999999', fontSize: 11, fontFamily: 'inherit' }}>
          {footerText}
        </Typography>
      </Box>
    </Box>
  )
}
