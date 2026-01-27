import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

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
 * Format: "MMM DD HH:mm tz"
 * Example: "Jan 18 15:00 GMT-5"
 */
export function getCompactGameTime(date: Date, gameTimezone?: string): string {
  const d = dayjs(date);
  if (gameTimezone && Intl.supportedValuesOf('timeZone').includes(gameTimezone)) {
    // Format: "Jan 18 15:00" + timezone offset
    const formatted = d.tz(gameTimezone).format('MMM D HH:mm');
    const offset = d.tz(gameTimezone).format('Z'); // e.g., "-05:00"
    const offsetShort = `GMT${offset.substring(0, 3)}`; // e.g., "GMT-5"
    return `${formatted} ${offsetShort}`;
  }
  return d.format('MMM D HH:mm');
}

/**
 * Format user's local time in compact format
 * Format: "MMM DD HH:mm (Your Time)"
 * Example: "Jan 18 14:00 (Your Time)"
 */
export function getCompactUserTime(date: Date): string {
  return `${dayjs(date).format('MMM D HH:mm')} (Your Time)`;
}
