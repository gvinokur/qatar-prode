import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/es';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

export function getLocalGameTime(date: Date, gameTimezone?: string): string {
  const d = dayjs(date);
  if (gameTimezone && Intl.supportedValuesOf('timeZone').includes(gameTimezone)) {
    return d.tz(gameTimezone).format('MMM D, YYYY - HH:mm');
  }
  return d.format('MMM D, YYYY - HH:mm');
}

export function getUserLocalTime(date: Date): string {
  return dayjs(date).format('MMM D, YYYY - HH:mm');
}

/**
 * Format game date in compact format with timezone
 * Format: "DD MMM HH:mm GMT±X (Horario Local)"
 * Example: "18 ene 15:00 GMT-5 (Horario Local)"
 */
export function getCompactGameTime(date: Date, gameTimezone?: string): string {
  const d = dayjs(date);
  if (gameTimezone && Intl.supportedValuesOf('timeZone').includes(gameTimezone)) {
    // Format: "18 ene 15:00" + timezone offset
    const formatted = d.tz(gameTimezone).format('D MMM HH:mm');
    const offset = d.tz(gameTimezone).format('Z'); // e.g., "-05:00"
    const offsetShort = `GMT${offset.substring(0, 3)}`; // e.g., "GMT-5"
    return `${formatted} ${offsetShort} (Horario Local)`;
  }
  return d.format('D MMM HH:mm');
}

/**
 * Format user's local time in compact format
 * Format: "DD MMM HH:mm (Tu Horario)"
 * Example: "18 ene 14:00 (Tu Horario)"
 */
export function getCompactUserTime(date: Date): string {
  return `${dayjs(date).format('D MMM HH:mm')} (Tu Horario)`;
}
