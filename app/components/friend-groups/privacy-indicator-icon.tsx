'use client';

import { Tooltip } from '@mui/material';
import { Lock as LockIcon, Public as PublicIcon } from '@mui/icons-material';
import { useTranslations } from 'next-intl';

interface PrivacyIndicatorIconProps {
  readonly isPublic: boolean;
  readonly size?: 'small' | 'medium';
}

export default function PrivacyIndicatorIcon({ isPublic, size = 'small' }: PrivacyIndicatorIconProps) {
  const t = useTranslations('groups.privacy.tooltip');

  if (isPublic) {
    return (
      <Tooltip title={t('public')} arrow>
        <PublicIcon fontSize={size} color="action" />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={t('private')} arrow>
      <LockIcon fontSize={size} color="action" />
    </Tooltip>
  );
}
