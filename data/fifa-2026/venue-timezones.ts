import { Venues } from './base-data';

/**
 * FIFA 2026 World Cup Venue Timezones
 * Maps venue constants to their IANA timezone identifiers
 */

export const VenueTimezones = {
  // USA - Eastern Time (ET)
  [Venues.NYC]: 'America/New_York',
  [Venues.BOS]: 'America/New_York',
  [Venues.PHI]: 'America/New_York',
  [Venues.ATL]: 'America/New_York',
  [Venues.MIA]: 'America/New_York',

  // USA - Central Time (CT)
  [Venues.HOU]: 'America/Chicago',
  [Venues.DAL]: 'America/Chicago',
  [Venues.KC]: 'America/Chicago',

  // USA - Pacific Time (PT)
  [Venues.LA]: 'America/Los_Angeles',
  [Venues.SF]: 'America/Los_Angeles',
  [Venues.SEA]: 'America/Los_Angeles',

  // Canada - Eastern Time
  [Venues.TOR]: 'America/Toronto',

  // Canada - Pacific Time
  [Venues.VAN]: 'America/Vancouver',

  // Mexico - Central Time
  [Venues.MEX]: 'America/Mexico_City',
  [Venues.GDL]: 'America/Mexico_City',
  [Venues.MTY]: 'America/Monterrey',
} as const;

/**
 * Helper to get timezone for a venue
 */
export function getVenueTimezone(venue: string): string {
  const timezone = VenueTimezones[venue as keyof typeof VenueTimezones];
  if (!timezone) {
    throw new Error(`Unknown venue: ${venue}`);
  }
  return timezone;
}

/**
 * Time offsets from Central Time (PDF times are in CT)
 * CT = Central Time (reference)
 */
export const TimeOffsetFromCT = {
  'America/New_York': +1,        // ET is CT + 1 hour
  'America/Chicago': 0,           // CT is the reference
  'America/Los_Angeles': -2,      // PT is CT - 2 hours
  'America/Toronto': +1,          // Toronto ET is CT + 1 hour
  'America/Vancouver': -2,        // Vancouver PT is CT - 2 hours
  'America/Mexico_City': 0,       // Mexico City is same as CT
  'America/Monterrey': 0,         // Monterrey is same as CT
} as const;

/**
 * Convert Central Time (from PDF) to local time for a venue
 */
export function convertCTToLocal(ctHour: number, venue: string): number {
  const timezone = getVenueTimezone(venue);
  const offset = TimeOffsetFromCT[timezone as keyof typeof TimeOffsetFromCT];

  if (offset === undefined) {
    throw new Error(`Unknown timezone offset: ${timezone}`);
  }

  return ctHour + offset;
}
