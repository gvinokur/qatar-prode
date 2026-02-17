import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Locale } from '@/i18n.config';
import 'dayjs/locale/es';
import 'dayjs/locale/en';

dayjs.extend(utc);
dayjs.extend(timezone);
// Note: Default locale removed - each function now accepts locale parameter

export function getLocalGameTime(date: Date, gameTimezone?: string, locale: Locale = 'es'): string {
  const d = dayjs(date).locale(locale);
  if (gameTimezone && Intl.supportedValuesOf('timeZone').includes(gameTimezone)) {
    return d.tz(gameTimezone).format('MMM D, YYYY - HH:mm');
  }
  return d.format('MMM D, YYYY - HH:mm');
}

export function getUserLocalTime(date: Date, locale: Locale = 'es'): string {
  return dayjs(date).locale(locale).format('MMM D, YYYY - HH:mm');
}

/**
 * Format game date in compact format with timezone
 * Format: "DD MMM HH:mm GMT±X (Local Time)" or "DD MMM HH:mm GMT±X (Horario Local)"
 * Example: "18 Jan 15:00 GMT-5 (Local Time)" or "18 ene 15:00 GMT-5 (Horario Local)"
 */
export function getCompactGameTime(date: Date, gameTimezone?: string, locale: Locale = 'es'): string {
  const d = dayjs(date).locale(locale);
  const label = locale === 'en' ? 'Local Time' : 'Horario Local';

  if (gameTimezone && Intl.supportedValuesOf('timeZone').includes(gameTimezone)) {
    // Format: "18 ene 15:00" + timezone offset + label
    const formatted = d.tz(gameTimezone).format('D MMM HH:mm');
    const offset = d.tz(gameTimezone).format('Z'); // e.g., "-05:00"
    const offsetShort = `GMT${offset.substring(0, 3)}`; // e.g., "GMT-5"
    return `${formatted} ${offsetShort} (${label})`;
  }
  return d.format('D MMM HH:mm');
}

/**
 * Format user's local time in compact format
 * Format: "DD MMM HH:mm (Your Time)" or "DD MMM HH:mm (Tu Horario)"
 * Example: "18 Jan 14:00 (Your Time)" or "18 ene 14:00 (Tu Horario)"
 */
export function getCompactUserTime(date: Date, locale: Locale = 'es'): string {
  const label = locale === 'en' ? 'Your Time' : 'Tu Horario';
  return `${dayjs(date).locale(locale).format('D MMM HH:mm')} (${label})`;
}

/**
 * Get today's date as YYYYMMDD integer for daily rank tracking
 * Example: February 6, 2026 → 20260206
 *
 * Note: Currently uses Argentina timezone for tournament score snapshots.
 * This works well for the current user base (primarily Argentina), but should
 * be refactored to use user-specific timezones or UTC if the app goes global.
 *
 * @returns Integer representing today's date in YYYYMMDD format (Argentina timezone)
 */
export function getTodayYYYYMMDD(): number {
  return Number.parseInt(dayjs().tz('America/Argentina/Buenos_Aires').format('YYYYMMDD'), 10);
}
