/**
 * FIFA 2026 World Cup Venue Timezones
 * Maps venues to their IANA timezone identifiers
 */

export const VenueTimezones = {
  // USA - Eastern Time (ET)
  'MetLife Stadium (New York/New Jersey)': 'America/New_York',
  'Gillette Stadium (Boston)': 'America/New_York',
  'Lincoln Financial Field (Philadelphia)': 'America/New_York',
  'Mercedes-Benz Stadium (Atlanta)': 'America/New_York',
  'Hard Rock Stadium (Miami)': 'America/New_York',

  // USA - Central Time (CT)
  'NRG Stadium (Houston)': 'America/Chicago',
  'AT&T Stadium (Dallas)': 'America/Chicago',
  'Arrowhead Stadium (Kansas City)': 'America/Chicago',

  // USA - Pacific Time (PT)
  'SoFi Stadium (Los Angeles)': 'America/Los_Angeles',
  'Levi\'s Stadium (San Francisco Bay Area)': 'America/Los_Angeles',
  'Lumen Field (Seattle)': 'America/Los_Angeles',

  // Canada - Eastern Time
  'BMO Field (Toronto)': 'America/Toronto',

  // Canada - Pacific Time
  'BC Place (Vancouver)': 'America/Vancouver',

  // Mexico - Central Time
  'Estadio Azteca (Mexico City)': 'America/Mexico_City',
  'Estadio Akron (Guadalajara)': 'America/Mexico_City',
  'Estadio BBVA (Monterrey)': 'America/Monterrey',
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
