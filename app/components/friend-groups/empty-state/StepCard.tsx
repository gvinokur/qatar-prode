'use client'

import { Box, Typography, Card, CardContent } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface StepCardProps {
  readonly stepNumber: number;
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
  readonly tip: string;
}

export default function StepCard({ stepNumber, icon, title, description, tip }: StepCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Step Number Badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          {stepNumber}
        </Box>

        {/* Icon */}
        <Box
          sx={{
            fontSize: '2.5rem',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </Box>

        {/* Title */}
        <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {description}
        </Typography>

        {/* Tip */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'action.hover',
            alignItems: 'flex-start'
          }}
        >
          <InfoOutlinedIcon
            sx={{
              fontSize: '1rem',
              color: 'primary.main',
              mt: 0.25,
              flexShrink: 0
            }}
          />
          <Typography variant="caption" color="text.secondary">
            <strong>Tip:</strong> {tip}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
