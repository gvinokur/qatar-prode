import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);


export function getLocalGameTime(date: Date, gameTimezone?: string): string {
  const d = dayjs(date);
  if (gameTimezone && Intl.supportedValuesOf('timeZone').includes(gameTimezone)) {
    return d.tz(gameTimezone).format('MMM D, YYYY - HH:mm') + ' (Horario Local)';
  }
  return d.format('MMM D, YYYY - HH:mm') + ' (Tu horario)';
}

export function getUserLocalTime(date: Date): string {
  return dayjs(date).format('MMM D, YYYY - HH:mm') + ' (Tu horario)';
}
