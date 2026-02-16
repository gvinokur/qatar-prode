'use client'

import { useLocale } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇦🇷' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (newLocale: string) => {
    // Replace current locale in pathname
    const segments = pathname.split('/');
    segments[1] = newLocale; // Replace locale segment
    const newPathname = segments.join('/');

    // Preserve query parameters and hash
    const queryString = searchParams.toString();
    const hash = window.location.hash;
    const fullUrl = `${newPathname}${queryString ? `?${queryString}` : ''}${hash}`;

    router.push(fullUrl);
    handleClose();
  };

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <>
      <IconButton
        onClick={handleOpen}
        aria-label="Select language"
        sx={{ color: 'inherit' }}
      >
        <span style={{ fontSize: '20px' }}>{currentLanguage?.flag || '🌐'}</span>
      </IconButton>
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
