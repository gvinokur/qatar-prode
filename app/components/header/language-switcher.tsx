'use client'

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Avatar, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { updateUserLocale } from '../../actions/user-actions';
import type { Locale } from '@/i18n.config';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇦🇷' },
];

export default function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update, status } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (newLocale: string) => {
    // Persist language preference
    if (status === 'authenticated') {
      // If authenticated, update database and session
      await updateUserLocale(newLocale as Locale);
      await update({ preferred_locale: newLocale });
    } else {
      // If not authenticated, still set cookie for persistence
      await updateUserLocale(newLocale as Locale);
    }

    // Replace current locale in pathname
    const segments = pathname.split('/');
    segments[1] = newLocale; // Replace locale segment
    const newPathname = segments.join('/');

    // Preserve query parameters and hash
    const queryString = searchParams.toString();
    const hash = globalThis.location.hash;

    // Build URL without nested template literals
    let fullUrl = newPathname;
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
    fullUrl += hash;

    router.push(fullUrl);
    handleClose();
  };

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <>
      <Avatar
        onClick={handleOpen}
        aria-label={t('language.selectLanguage')}
        sx={{
          width: 40,
          height: 40,
          cursor: 'pointer',
          bgcolor: 'action.hover',
          fontSize: '20px',
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: 'action.selected',
            transform: 'scale(1.05)',
          }
        }}
      >
        {currentLanguage?.flag || '🌐'}
      </Avatar>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === locale}
          >
            <span style={{ marginRight: '8px' }}>{language.flag}</span>
            {language.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
