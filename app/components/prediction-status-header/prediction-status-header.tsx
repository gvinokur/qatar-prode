'use client';

import React from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Typography,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import FlagIcon from '@mui/icons-material/Flag';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LoginIcon from '@mui/icons-material/Login';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import Link from 'next/link';
import { BoostCountBadge } from '../boost-badge';
import type { StatusHeaderVariant, StatusHeaderTone, HeaderAction } from './types';

interface PredictionStatusHeaderProps {
  readonly variant: StatusHeaderVariant;
}

function getBgColor(theme: Theme, tone: StatusHeaderTone): string {
  switch (tone) {
    case 'brand':          return alpha(theme.palette.primary.main, 0.06);
    case 'calm':           return theme.palette.background.paper;
    case 'success':        return alpha(theme.palette.success.main, 0.06);
    case 'deadlineSoon':   return alpha(theme.palette.info.main, 0.06);
    case 'deadlineUrgent': return alpha(theme.palette.warning.main, 0.08);
    case 'deadlineNow':    return alpha(theme.palette.error.main, 0.08);
    case 'locked':         return theme.palette.action.hover;
  }
}

function getBorderColor(tone: StatusHeaderTone): string {
  switch (tone) {
    case 'brand':          return 'primary.main';
    case 'calm':           return 'divider';
    case 'success':        return 'success.main';
    case 'deadlineSoon':   return 'info.main';
    case 'deadlineUrgent': return 'warning.main';
    case 'deadlineNow':    return 'error.main';
    case 'locked':         return 'divider';
  }
}

function getToneColor(tone: StatusHeaderTone): string {
  switch (tone) {
    case 'brand':          return 'primary.main';
    case 'calm':           return 'text.secondary';
    case 'success':        return 'success.main';
    case 'deadlineSoon':   return 'info.main';
    case 'deadlineUrgent': return 'warning.main';
    case 'deadlineNow':    return 'error.main';
    case 'locked':         return 'text.secondary';
  }
}

const ICON_SX = { fontSize: 16, flexShrink: 0 };

function LeadIcon({ icon, color }: { readonly icon: StatusHeaderVariant['leadIcon']; readonly color: string }) {
  const sx = { ...ICON_SX, color };
  switch (icon) {
    case 'rocket':  return <RocketLaunchIcon sx={sx} />;
    case 'flag':    return <FlagIcon sx={sx} />;
    case 'check':   return <CheckCircleIcon sx={sx} />;
    case 'info':    return <InfoOutlinedIcon sx={sx} />;
    case 'warning': return <WarningAmberIcon sx={sx} />;
    case 'error':   return <ErrorOutlineIcon sx={sx} />;
    case 'lock':    return <LockOutlinedIcon sx={sx} />;
    case 'trophy':  return <EmojiEventsIcon sx={sx} />;
    case 'login':   return <LoginIcon sx={sx} />;
    case 'clock':   return <AccessTimeIcon sx={sx} />;
    case 'book':    return <MenuBookIcon sx={sx} />;
    case 'mobile':  return <InstallMobileIcon sx={sx} />;
    case 'bell':    return <NotificationsNoneIcon sx={sx} />;
  }
}

export function PredictionStatusHeader({ variant }: PredictionStatusHeaderProps) {
  const accentColor = variant.statusColor ?? getToneColor(variant.tone);
  const borderColor = getBorderColor(variant.tone);
  const isExpanded = !!variant.message;

  function renderAction(action: HeaderAction, buttonVariant: 'text' | 'contained' | 'outlined') {
    const sx = { flexShrink: 0, whiteSpace: 'nowrap', ...(buttonVariant === 'text' ? { fontSize: 12, py: 0.25, minWidth: 0 } : {}) };
    if ('href' in action) {
      return (
        <Button size="small" variant={buttonVariant} color="primary" component={Link} href={action.href} sx={sx}>
          {action.label}
        </Button>
      );
    }
    return (
      <Button size="small" variant={buttonVariant} color="primary" onClick={action.onClick} sx={sx}>
        {action.label}
      </Button>
    );
  }

  const bothActions = variant.action && variant.secondaryAction;

  let expandedActions: React.ReactNode = null;
  if (bothActions) {
    expandedActions = (
      <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
        {renderAction(variant.action!, 'contained')}
        {renderAction(variant.secondaryAction!, 'text')}
      </Box>
    );
  } else if (variant.action) {
    expandedActions = renderAction(variant.action, 'contained');
  }

  return (
    <Card
        sx={{
          bgcolor: (theme) => getBgColor(theme, variant.tone),
          border: 1,
          borderColor,
          overflow: 'hidden',
          mb: 2,
        }}
      >
        {/* Top strip */}
        <Box sx={{ pl: 1.25, pr: 1.25, py: 1, display: 'flex', alignItems: 'center', gap: 1, minHeight: 36 }}>
          <LeadIcon icon={variant.leadIcon} color={accentColor} />

          {variant.stageLabel && (
            <>
              <Typography
                variant="overline"
                sx={{ fontWeight: 700, fontSize: 10, color: 'text.secondary', letterSpacing: 1, lineHeight: 1, flexShrink: 0 }}
              >
                {variant.stageLabel}
              </Typography>
              <Box sx={{ width: '1px', height: 12, bgcolor: 'divider', flexShrink: 0 }} />
            </>
          )}

          <Typography
            sx={{
              fontWeight: 500,
              color: accentColor,
              fontSize: 13,
              lineHeight: 1.3,
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {variant.statusText}
          </Typography>

          {/* Boosts inline */}
          {variant.boosts && (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              {variant.boosts.silverMax > 0 && (
                <BoostCountBadge type="silver" used={variant.boosts.silverUsed} max={variant.boosts.silverMax} />
              )}
              {variant.boosts.goldenMax > 0 && (
                <BoostCountBadge type="golden" used={variant.boosts.goldenUsed} max={variant.boosts.goldenMax} />
              )}
            </Box>
          )}

          {variant.chip && (
            <Chip
              size="small"
              variant={variant.chip.color === 'default' ? 'outlined' : 'filled'}
              color={variant.chip.color}
              label={variant.chip.label}
              sx={{ height: 20, fontSize: 10, fontWeight: 600, flexShrink: 0, '& .MuiChip-label': { px: 0.75 } }}
            />
          )}

          {variant.pointsBadge && (
            <Chip
              size="small"
              variant="filled"
              color="success"
              label={variant.pointsBadge}
              sx={{ height: 22, fontSize: 11, fontWeight: 700, flexShrink: 0, '& .MuiChip-label': { px: 0.875 } }}
            />
          )}

          {!isExpanded && variant.action && renderAction(variant.action, 'text')}
        </Box>

        {/* Expanded section */}
        {isExpanded && (
          <>
            <Divider />
            <Box sx={{ pl: 1.25, pr: 1.25, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Typography
                variant="body2"
                sx={{ flex: 1, minWidth: 0, fontWeight: 600, lineHeight: 1.4, color: 'text.primary', fontSize: 14 }}
              >
                {variant.message}
              </Typography>

              {expandedActions}
            </Box>
          </>
        )}
      </Card>
  );
}
