import { TeamNames, Venues } from './base-data';
import { getVenueTimezone, convertCTToLocal } from './venue-timezones';

/**
 * FIFA 2026 World Cup - Complete Game Schedule
 * Source: Official FIFA website - https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures
 * All times from PDF are in Central Time (CT), converted to local venue time
 * All 104 games: 72 group stage + 32 knockout
 */

type TeamOrNull = string | null;

/**
 * Helper to create a game Date object with local time
 * @param year - Year (2026)
 * @param month - Month (0-11, where 0=January, 5=June)
 * @param day - Day of month
 * @param ctHour - Hour in Central Time from PDF (0-23)
 * @param ctMinute - Minute (0 or 30)
 * @param venue - Venue string (to determine timezone)
 */
function createGameDateTime(
  year: number,
  month: number,
  day: number,
  ctHour: number,
  ctMinute: number,
  venue: string
): Date {
  // Convert CT hour to local hour for the venue
  const localHour = convertCTToLocal(ctHour, venue);

  // Create Date object with local time
  // Note: JavaScript Date constructor takes local time
  return new Date(year, month, day, localHour, ctMinute, 0);
}

const game = (
  game_number: number,
  year: number,
  month: number,
  day: number,
  ctHour: number,
  ctMinute: number,
  location: string,
  home_team: TeamOrNull,
  away_team: TeamOrNull,
  group?: string,
  playoff?: string,
  home_team_rule?: any,
  away_team_rule?: any
) => ({
  game_number,
  date: createGameDateTime(year, month, day, ctHour, ctMinute, location),
  location,
  timezone: getVenueTimezone(location),
  home_team,
  away_team,
  group,
  playoff,
  home_team_rule,
  away_team_rule,
});

/**
 * GROUP STAGE - 72 Games
 * June 11-27, 2026
 * All times converted from CT to local venue time
 */
export const games = [
  // ========== THURSDAY, JUNE 11, 2026 ==========
  // Game 1: Mexico vs South Africa - 14:00 CT - Group A - Mexico City
  game(1, 2026, 5, 11, 14, 0, Venues.MEX, TeamNames.Mexico, TeamNames.SouthAfrica, 'A'),

  // Game 2: Korea Republic vs UEFA Playoff D - 21:00 CT - Group A - Guadalajara
  game(2, 2026, 5, 11, 21, 0, Venues.GDL, TeamNames.SouthKorea, TeamNames.UEFAPlayoffD, 'A'),

  // ========== FRIDAY, JUNE 12, 2026 ==========
  // Game 3: Canada vs UEFA Playoff A - 14:00 CT - Group B - Toronto
  game(3, 2026, 5, 12, 14, 0, Venues.TOR, TeamNames.Canada, TeamNames.UEFAPlayoffA, 'B'),

  // Game 4: USA vs Paraguay - 20:00 CT - Group D - Los Angeles
  game(4, 2026, 5, 12, 20, 0, Venues.LA, TeamNames.USA, TeamNames.Paraguay, 'D'),

  // ========== SATURDAY, JUNE 13, 2026 ==========
  // Game 5: Qatar vs Switzerland - 14:00 CT - Group B - San Francisco Bay Area
  game(5, 2026, 5, 13, 14, 0, Venues.SF, TeamNames.Qatar, TeamNames.Switzerland, 'B'),

  // Game 6: Brazil vs Morocco - 17:00 CT - Group C - New York/New Jersey
  game(6, 2026, 5, 13, 17, 0, Venues.NYC, TeamNames.Brazil, TeamNames.Morocco, 'C'),

  // Game 7: Haiti vs Scotland - 20:00 CT - Group C - Boston
  game(7, 2026, 5, 13, 20, 0, Venues.BOS, TeamNames.Haiti, TeamNames.Scotland, 'C'),

  // Game 8: Australia vs UEFA Playoff C - 23:00 CT - Group D - Vancouver
  game(8, 2026, 5, 13, 23, 0, Venues.VAN, TeamNames.Australia, TeamNames.UEFAPlayoffC, 'D'),

  // ========== SUNDAY, JUNE 14, 2026 ==========
  // Game 9: Germany vs Curaçao - 12:00 CT - Group E - Houston
  game(9, 2026, 5, 14, 12, 0, Venues.HOU, TeamNames.Germany, TeamNames.Curacao, 'E'),

  // Game 10: Netherlands vs Japan - 15:00 CT - Group F - Dallas
  game(10, 2026, 5, 14, 15, 0, Venues.DAL, TeamNames.Netherlands, TeamNames.Japan, 'F'),

  // Game 11: Ivory Coast vs Ecuador - 18:00 CT - Group E - Philadelphia
  game(11, 2026, 5, 14, 18, 0, Venues.PHI, TeamNames.IvoryCoast, TeamNames.Ecuador, 'E'),

  // Game 12: UEFA Playoff B vs Tunisia - 21:00 CT - Group F - Monterrey
  game(12, 2026, 5, 14, 21, 0, Venues.MTY, TeamNames.UEFAPlayoffB, TeamNames.Tunisia, 'F'),

  // ========== MONDAY, JUNE 15, 2026 ==========
  // Game 13: Spain vs Cape Verde - 11:00 CT - Group H - Atlanta
  game(13, 2026, 5, 15, 11, 0, Venues.ATL, TeamNames.Spain, TeamNames.CapeVerde, 'H'),

  // Game 14: Belgium vs Egypt - 14:00 CT - Group G - Seattle
  game(14, 2026, 5, 15, 14, 0, Venues.SEA, TeamNames.Belgium, TeamNames.Egypt, 'G'),

  // Game 15: Saudi Arabia vs Uruguay - 17:00 CT - Group H - Miami
  game(15, 2026, 5, 15, 17, 0, Venues.MIA, TeamNames.SaudiArabia, TeamNames.Uruguay, 'H'),

  // Game 16: Iran vs New Zealand - 20:00 CT - Group G - Los Angeles
  game(16, 2026, 5, 15, 20, 0, Venues.LA, TeamNames.Iran, TeamNames.NewZealand, 'G'),

  // ========== TUESDAY, JUNE 16, 2026 ==========
  // Game 17: France vs Senegal - 14:00 CT - Group I - New York/New Jersey
  game(17, 2026, 5, 16, 14, 0, Venues.NYC, TeamNames.France, TeamNames.Senegal, 'I'),

  // Game 18: Intercontinental Playoff 2 vs Norway - 17:00 CT - Group I - Boston
  game(18, 2026, 5, 16, 17, 0, Venues.BOS, TeamNames.IntercontinentalPlayoff2, TeamNames.Norway, 'I'),

  // Game 19: Argentina vs Algeria - 20:00 CT - Group J - Kansas City
  game(19, 2026, 5, 16, 20, 0, Venues.KC, TeamNames.Argentina, TeamNames.Algeria, 'J'),

  // Game 20: Austria vs Jordan - 23:00 CT - Group J - San Francisco Bay Area
  game(20, 2026, 5, 16, 23, 0, Venues.SF, TeamNames.Austria, TeamNames.Jordan, 'J'),

  // ========== WEDNESDAY, JUNE 17, 2026 ==========
  // Game 21: Portugal vs Intercontinental Playoff 1 - 12:00 CT - Group K - Houston
  game(21, 2026, 5, 17, 12, 0, Venues.HOU, TeamNames.Portugal, TeamNames.IntercontinentalPlayoff1, 'K'),

  // Game 22: England vs Croatia - 15:00 CT - Group L - Dallas
  game(22, 2026, 5, 17, 15, 0, Venues.DAL, TeamNames.England, TeamNames.Croatia, 'L'),

  // Game 23: Ghana vs Panama - 18:00 CT - Group L - Toronto
  game(23, 2026, 5, 17, 18, 0, Venues.TOR, TeamNames.Ghana, TeamNames.Panama, 'L'),

  // Game 24: Uzbekistan vs Colombia - 21:00 CT - Group K - Mexico City
  game(24, 2026, 5, 17, 21, 0, Venues.MEX, TeamNames.Uzbekistan, TeamNames.Colombia, 'K'),

  // ========== THURSDAY, JUNE 18, 2026 ==========
  // Game 25: UEFA Playoff D vs South Africa - 11:00 CT - Group A - Atlanta
  game(25, 2026, 5, 18, 11, 0, Venues.ATL, TeamNames.UEFAPlayoffD, TeamNames.SouthAfrica, 'A'),

  // Game 26: Switzerland vs UEFA Playoff A - 14:00 CT - Group B - Los Angeles
  game(26, 2026, 5, 18, 14, 0, Venues.LA, TeamNames.Switzerland, TeamNames.UEFAPlayoffA, 'B'),

  // Game 27: Canada vs Qatar - 17:00 CT - Group B - Vancouver
  game(27, 2026, 5, 18, 17, 0, Venues.VAN, TeamNames.Canada, TeamNames.Qatar, 'B'),

  // Game 28: Mexico vs South Korea - 20:00 CT - Group A - Guadalajara
  game(28, 2026, 5, 18, 20, 0, Venues.GDL, TeamNames.Mexico, TeamNames.SouthKorea, 'A'),

  // ========== FRIDAY, JUNE 19, 2026 ==========
  // Game 29: USA vs Australia - 14:00 CT - Group D - Seattle
  game(29, 2026, 5, 19, 14, 0, Venues.SEA, TeamNames.USA, TeamNames.Australia, 'D'),

  // Game 30: Scotland vs Morocco - 17:00 CT - Group C - Boston
  game(30, 2026, 5, 19, 17, 0, Venues.BOS, TeamNames.Scotland, TeamNames.Morocco, 'C'),

  // Game 31: Brazil vs Haiti - 20:00 CT - Group C - Philadelphia
  game(31, 2026, 5, 19, 20, 0, Venues.PHI, TeamNames.Brazil, TeamNames.Haiti, 'C'),

  // Game 32: UEFA Playoff C vs Paraguay - 23:00 CT - Group D - San Francisco Bay Area
  game(32, 2026, 5, 19, 23, 0, Venues.SF, TeamNames.UEFAPlayoffC, TeamNames.Paraguay, 'D'),

  // ========== SATURDAY, JUNE 20, 2026 ==========
  // Game 33: Netherlands vs UEFA Playoff B - 12:00 CT - Group F - Houston
  game(33, 2026, 5, 20, 12, 0, Venues.HOU, TeamNames.Netherlands, TeamNames.UEFAPlayoffB, 'F'),

  // Game 34: Germany vs Ivory Coast - 15:00 CT - Group E - Toronto
  game(34, 2026, 5, 20, 15, 0, Venues.TOR, TeamNames.Germany, TeamNames.IvoryCoast, 'E'),

  // Game 35: Ecuador vs Curaçao - 19:00 CT - Group E - Kansas City
  game(35, 2026, 5, 20, 19, 0, Venues.KC, TeamNames.Ecuador, TeamNames.Curacao, 'E'),

  // Game 36: Tunisia vs Japan - 23:00 CT - Group F - Monterrey
  game(36, 2026, 5, 20, 23, 0, Venues.MTY, TeamNames.Tunisia, TeamNames.Japan, 'F'),

  // ========== SUNDAY, JUNE 21, 2026 ==========
  // Game 37: Spain vs Saudi Arabia - 11:00 CT - Group H - Atlanta
  game(37, 2026, 5, 21, 11, 0, Venues.ATL, TeamNames.Spain, TeamNames.SaudiArabia, 'H'),

  // Game 38: Belgium vs Iran - 14:00 CT - Group G - Los Angeles
  game(38, 2026, 5, 21, 14, 0, Venues.LA, TeamNames.Belgium, TeamNames.Iran, 'G'),

  // Game 39: Uruguay vs Cape Verde - 17:00 CT - Group H - Miami
  game(39, 2026, 5, 21, 17, 0, Venues.MIA, TeamNames.Uruguay, TeamNames.CapeVerde, 'H'),

  // Game 40: New Zealand vs Egypt - 20:00 CT - Group G - Vancouver
  game(40, 2026, 5, 21, 20, 0, Venues.VAN, TeamNames.NewZealand, TeamNames.Egypt, 'G'),

  // ========== MONDAY, JUNE 22, 2026 ==========
  // Game 41: Argentina vs Austria - 12:00 CT - Group J - Dallas
  game(41, 2026, 5, 22, 12, 0, Venues.DAL, TeamNames.Argentina, TeamNames.Austria, 'J'),

  // Game 42: France vs Intercontinental Playoff 2 - 16:00 CT - Group I - Philadelphia
  game(42, 2026, 5, 22, 16, 0, Venues.PHI, TeamNames.France, TeamNames.IntercontinentalPlayoff2, 'I'),

  // Game 43: Norway vs Senegal - 19:00 CT - Group I - New York/New Jersey
  game(43, 2026, 5, 22, 19, 0, Venues.NYC, TeamNames.Norway, TeamNames.Senegal, 'I'),

  // Game 44: Jordan vs Algeria - 22:00 CT - Group J - San Francisco Bay Area
  game(44, 2026, 5, 22, 22, 0, Venues.SF, TeamNames.Jordan, TeamNames.Algeria, 'J'),

  // ========== TUESDAY, JUNE 23, 2026 ==========
  // Game 45: Portugal vs Uzbekistan - 12:00 CT - Group K - Houston
  game(45, 2026, 5, 23, 12, 0, Venues.HOU, TeamNames.Portugal, TeamNames.Uzbekistan, 'K'),

  // Game 46: England vs Ghana - 15:00 CT - Group L - Boston
  game(46, 2026, 5, 23, 15, 0, Venues.BOS, TeamNames.England, TeamNames.Ghana, 'L'),

  // Game 47: Panama vs Croatia - 18:00 CT - Group L - Toronto
  game(47, 2026, 5, 23, 18, 0, Venues.TOR, TeamNames.Panama, TeamNames.Croatia, 'L'),

  // Game 48: Colombia vs Intercontinental Playoff 1 - 21:00 CT - Group K - Guadalajara
  game(48, 2026, 5, 23, 21, 0, Venues.GDL, TeamNames.Colombia, TeamNames.IntercontinentalPlayoff1, 'K'),

  // ========== WEDNESDAY, JUNE 24, 2026 ==========
  // Game 49: Switzerland vs Canada - 14:00 CT - Group B - Vancouver
  game(49, 2026, 5, 24, 14, 0, Venues.VAN, TeamNames.Switzerland, TeamNames.Canada, 'B'),

  // Game 50: UEFA Playoff A vs Qatar - 14:00 CT - Group B - Seattle
  game(50, 2026, 5, 24, 14, 0, Venues.SEA, TeamNames.UEFAPlayoffA, TeamNames.Qatar, 'B'),

  // Game 51: Scotland vs Brazil - 17:00 CT - Group C - Miami
  game(51, 2026, 5, 24, 17, 0, Venues.MIA, TeamNames.Scotland, TeamNames.Brazil, 'C'),

  // Game 52: Morocco vs Haiti - 17:00 CT - Group C - Atlanta
  game(52, 2026, 5, 24, 17, 0, Venues.ATL, TeamNames.Morocco, TeamNames.Haiti, 'C'),

  // Game 53: UEFA Playoff D vs Mexico - 20:00 CT - Group A - Mexico City
  game(53, 2026, 5, 24, 20, 0, Venues.MEX, TeamNames.UEFAPlayoffD, TeamNames.Mexico, 'A'),

  // Game 54: South Africa vs South Korea - 20:00 CT - Group A - Monterrey
  game(54, 2026, 5, 24, 20, 0, Venues.MTY, TeamNames.SouthAfrica, TeamNames.SouthKorea, 'A'),

  // ========== THURSDAY, JUNE 25, 2026 ==========
  // Game 55: Curaçao vs Ivory Coast - 15:00 CT - Group E - Philadelphia
  game(55, 2026, 5, 25, 15, 0, Venues.PHI, TeamNames.Curacao, TeamNames.IvoryCoast, 'E'),

  // Game 56: Ecuador vs Germany - 15:00 CT - Group E - New York/New Jersey
  game(56, 2026, 5, 25, 15, 0, Venues.NYC, TeamNames.Ecuador, TeamNames.Germany, 'E'),

  // Game 57: Japan vs UEFA Playoff B - 18:00 CT - Group F - Dallas
  game(57, 2026, 5, 25, 18, 0, Venues.DAL, TeamNames.Japan, TeamNames.UEFAPlayoffB, 'F'),

  // Game 58: Tunisia vs Netherlands - 18:00 CT - Group F - Kansas City
  game(58, 2026, 5, 25, 18, 0, Venues.KC, TeamNames.Tunisia, TeamNames.Netherlands, 'F'),

  // Game 59: UEFA Playoff C vs USA - 21:00 CT - Group D - Los Angeles
  game(59, 2026, 5, 25, 21, 0, Venues.LA, TeamNames.UEFAPlayoffC, TeamNames.USA, 'D'),

  // Game 60: Paraguay vs Australia - 21:00 CT - Group D - San Francisco Bay Area
  game(60, 2026, 5, 25, 21, 0, Venues.SF, TeamNames.Paraguay, TeamNames.Australia, 'D'),

  // ========== FRIDAY, JUNE 26, 2026 ==========
  // Game 61: Norway vs France - 14:00 CT - Group I - Boston
  game(61, 2026, 5, 26, 14, 0, Venues.BOS, TeamNames.Norway, TeamNames.France, 'I'),

  // Game 62: Senegal vs Intercontinental Playoff 2 - 14:00 CT - Group I - Toronto
  game(62, 2026, 5, 26, 14, 0, Venues.TOR, TeamNames.Senegal, TeamNames.IntercontinentalPlayoff2, 'I'),

  // Game 63: Cape Verde vs Saudi Arabia - 19:00 CT - Group H - Houston
  game(63, 2026, 5, 26, 19, 0, Venues.HOU, TeamNames.CapeVerde, TeamNames.SaudiArabia, 'H'),

  // Game 64: Uruguay vs Spain - 19:00 CT - Group H - Guadalajara
  game(64, 2026, 5, 26, 19, 0, Venues.GDL, TeamNames.Uruguay, TeamNames.Spain, 'H'),

  // Game 65: Egypt vs Iran - 22:00 CT - Group G - Seattle
  game(65, 2026, 5, 26, 22, 0, Venues.SEA, TeamNames.Egypt, TeamNames.Iran, 'G'),

  // Game 66: New Zealand vs Belgium - 22:00 CT - Group G - Vancouver
  game(66, 2026, 5, 26, 22, 0, Venues.VAN, TeamNames.NewZealand, TeamNames.Belgium, 'G'),

  // ========== SATURDAY, JUNE 27, 2026 ==========
  // Game 67: Panama vs England - 16:00 CT - Group L - New York/New Jersey
  game(67, 2026, 5, 27, 16, 0, Venues.NYC, TeamNames.Panama, TeamNames.England, 'L'),

  // Game 68: Croatia vs Ghana - 16:00 CT - Group L - Philadelphia
  game(68, 2026, 5, 27, 16, 0, Venues.PHI, TeamNames.Croatia, TeamNames.Ghana, 'L'),

  // Game 69: Colombia vs Portugal - 18:30 CT - Group K - Miami
  game(69, 2026, 5, 27, 18, 30, Venues.MIA, TeamNames.Colombia, TeamNames.Portugal, 'K'),

  // Game 70: Intercontinental Playoff 1 vs Uzbekistan - 18:30 CT - Group K - Atlanta
  game(70, 2026, 5, 27, 18, 30, Venues.ATL, TeamNames.IntercontinentalPlayoff1, TeamNames.Uzbekistan, 'K'),

  // Game 71: Algeria vs Austria - 21:00 CT - Group J - Kansas City
  game(71, 2026, 5, 27, 21, 0, Venues.KC, TeamNames.Algeria, TeamNames.Austria, 'J'),

  // Game 72: Jordan vs Argentina - 21:00 CT - Group J - Dallas
  game(72, 2026, 5, 27, 21, 0, Venues.DAL, TeamNames.Jordan, TeamNames.Argentina, 'J'),

  // ========================================
  // KNOCKOUT STAGE - 32 Games
  // Round of 32 through Final
  // ========================================

  // ========== ROUND OF 32 - June 28 - July 3, 2026 ==========
  // Game 73: 2A vs 2B - Sunday, June 28 - 14:00 CT - Los Angeles
  game(
    73, 2026, 5, 28, 14, 0, Venues.LA, null, null, undefined, 'Round of 32',
    { group: 'A', position: 2 },
    { group: 'B', position: 2 }
  ),

  // Game 74: 1C vs 2F - Monday, June 29 - 12:00 CT - Houston
  game(
    74, 2026, 5, 29, 12, 0, Venues.HOU, null, null, undefined, 'Round of 32',
    { group: 'C', position: 1 },
    { group: 'F', position: 2 }
  ),

  // Game 75: 1E vs 3ABCDF - Monday, June 29 - 15:30 CT - Boston
  game(
    75, 2026, 5, 29, 15, 30, Venues.BOS, null, null, undefined, 'Round of 32',
    { group: 'E', position: 1 },
    { group: 'ABCDF', position: 3 }
  ),

  // Game 76: 1F vs 2C - Monday, June 29 - 20:00 CT - Monterrey
  game(
    76, 2026, 5, 29, 20, 0, Venues.MTY, null, null, undefined, 'Round of 32',
    { group: 'F', position: 1 },
    { group: 'C', position: 2 }
  ),

  // Game 77: 2E vs 2I - Tuesday, June 30 - 12:00 CT - Dallas
  game(
    77, 2026, 5, 30, 12, 0, Venues.DAL, null, null, undefined, 'Round of 32',
    { group: 'E', position: 2 },
    { group: 'I', position: 2 }
  ),

  // Game 78: 1I vs 3CDFGH - Tuesday, June 30 - 16:00 CT - New York/New Jersey
  game(
    78, 2026, 5, 30, 16, 0, Venues.NYC, null, null, undefined, 'Round of 32',
    { group: 'I', position: 1 },
    { group: 'CDFGH', position: 3 }
  ),

  // Game 79: 1A vs 3CEFHI - Tuesday, June 30 - 20:00 CT - Mexico City
  game(
    79, 2026, 5, 30, 20, 0, Venues.MEX, null, null, undefined, 'Round of 32',
    { group: 'A', position: 1 },
    { group: 'CEFHI', position: 3 }
  ),

  // Game 80: 1L vs 3EHIJK - Wednesday, July 1 - 11:00 CT - Atlanta
  game(
    80, 2026, 6, 1, 11, 0, Venues.ATL, null, null, undefined, 'Round of 32',
    { group: 'L', position: 1 },
    { group: 'EHIJK', position: 3 }
  ),

  // Game 81: 1G vs 3AEHIJ - Wednesday, July 1 - 15:00 CT - Seattle
  game(
    81, 2026, 6, 1, 15, 0, Venues.SEA, null, null, undefined, 'Round of 32',
    { group: 'G', position: 1 },
    { group: 'AEHIJ', position: 3 }
  ),

  // Game 82: 1D vs 3BEFIJ - Wednesday, July 1 - 19:00 CT - San Francisco Bay Area
  game(
    82, 2026, 6, 1, 19, 0, Venues.SF, null, null, undefined, 'Round of 32',
    { group: 'D', position: 1 },
    { group: 'BEFIJ', position: 3 }
  ),

  // Game 83: 1H vs 2J - Thursday, July 2 - 14:00 CT - Los Angeles
  game(
    83, 2026, 6, 2, 14, 0, Venues.LA, null, null, undefined, 'Round of 32',
    { group: 'H', position: 1 },
    { group: 'J', position: 2 }
  ),

  // Game 84: 2K vs 2L - Thursday, July 2 - 18:00 CT - Toronto
  game(
    84, 2026, 6, 2, 18, 0, Venues.TOR, null, null, undefined, 'Round of 32',
    { group: 'K', position: 2 },
    { group: 'L', position: 2 }
  ),

  // Game 85: 1B vs 3EFGIJ - Thursday, July 2 - 22:00 CT - Vancouver
  game(
    85, 2026, 6, 2, 22, 0, Venues.VAN, null, null, undefined, 'Round of 32',
    { group: 'B', position: 1 },
    { group: 'EFGIJ', position: 3 }
  ),

  // Game 86: 2D vs 2G - Friday, July 3 - 13:00 CT - Dallas
  game(
    86, 2026, 6, 3, 13, 0, Venues.DAL, null, null, undefined, 'Round of 32',
    { group: 'D', position: 2 },
    { group: 'G', position: 2 }
  ),

  // Game 87: 1J vs 2H - Friday, July 3 - 17:00 CT - Miami
  game(
    87, 2026, 6, 3, 17, 0, Venues.MIA, null, null, undefined, 'Round of 32',
    { group: 'J', position: 1 },
    { group: 'H', position: 2 }
  ),

  // Game 88: 1K vs 3DEIJL - Friday, July 3 - 20:30 CT - Kansas City
  game(
    88, 2026, 6, 3, 20, 30, Venues.KC, null, null, undefined, 'Round of 32',
    { group: 'K', position: 1 },
    { group: 'DEIJL', position: 3 }
  ),

  // ========== ROUND OF 16 - July 4-7, 2026 ==========
  // Game 89: W73 vs W75 - Saturday, July 4 - 12:00 CT - Houston
  game(
    89, 2026, 6, 4, 12, 0, Venues.HOU, null, null, undefined, 'Round of 16',
    { game: 73, winner: true },
    { game: 75, winner: true }
  ),

  // Game 90: W74 vs W77 - Saturday, July 4 - 16:00 CT - Philadelphia
  game(
    90, 2026, 6, 4, 16, 0, Venues.PHI, null, null, undefined, 'Round of 16',
    { game: 74, winner: true },
    { game: 77, winner: true }
  ),

  // Game 91: W76 vs W78 - Sunday, July 5 - 15:00 CT - New York/New Jersey
  game(
    91, 2026, 6, 5, 15, 0, Venues.NYC, null, null, undefined, 'Round of 16',
    { game: 76, winner: true },
    { game: 78, winner: true }
  ),

  // Game 92: W79 vs W80 - Sunday, July 5 - 19:00 CT - Mexico City
  game(
    92, 2026, 6, 5, 19, 0, Venues.MEX, null, null, undefined, 'Round of 16',
    { game: 79, winner: true },
    { game: 80, winner: true }
  ),

  // Game 93: W83 vs W84 - Monday, July 6 - 14:00 CT - Dallas
  game(
    93, 2026, 6, 6, 14, 0, Venues.DAL, null, null, undefined, 'Round of 16',
    { game: 83, winner: true },
    { game: 84, winner: true }
  ),

  // Game 94: W81 vs W82 - Monday, July 6 - 19:00 CT - Seattle
  game(
    94, 2026, 6, 6, 19, 0, Venues.SEA, null, null, undefined, 'Round of 16',
    { game: 81, winner: true },
    { game: 82, winner: true }
  ),

  // Game 95: W86 vs W88 - Tuesday, July 7 - 11:00 CT - Atlanta
  game(
    95, 2026, 6, 7, 11, 0, Venues.ATL, null, null, undefined, 'Round of 16',
    { game: 86, winner: true },
    { game: 88, winner: true }
  ),

  // Game 96: W85 vs W87 - Tuesday, July 7 - 15:00 CT - Vancouver
  game(
    96, 2026, 6, 7, 15, 0, Venues.VAN, null, null, undefined, 'Round of 16',
    { game: 85, winner: true },
    { game: 87, winner: true }
  ),

  // ========== QUARTER-FINALS - July 9-11, 2026 ==========
  // Game 97: W89 vs W90 - Thursday, July 9 - 15:00 CT - Boston
  game(
    97, 2026, 6, 9, 15, 0, Venues.BOS, null, null, undefined, 'Quarter-finals',
    { game: 89, winner: true },
    { game: 90, winner: true }
  ),

  // Game 98: W93 vs W94 - Friday, July 10 - 14:00 CT - Los Angeles
  game(
    98, 2026, 6, 10, 14, 0, Venues.LA, null, null, undefined, 'Quarter-finals',
    { game: 93, winner: true },
    { game: 94, winner: true }
  ),

  // Game 99: W91 vs W92 - Saturday, July 11 - 16:00 CT - Miami
  game(
    99, 2026, 6, 11, 16, 0, Venues.MIA, null, null, undefined, 'Quarter-finals',
    { game: 91, winner: true },
    { game: 92, winner: true }
  ),

  // Game 100: W95 vs W96 - Saturday, July 11 - 20:00 CT - Kansas City
  game(
    100, 2026, 6, 11, 20, 0, Venues.KC, null, null, undefined, 'Quarter-finals',
    { game: 95, winner: true },
    { game: 96, winner: true }
  ),

  // ========== SEMI-FINALS - July 14-15, 2026 ==========
  // Game 101: W97 vs W98 - Tuesday, July 14 - 14:00 CT - Dallas
  game(
    101, 2026, 6, 14, 14, 0, Venues.DAL, null, null, undefined, 'Semi-finals',
    { game: 97, winner: true },
    { game: 98, winner: true }
  ),

  // Game 102: W99 vs W100 - Wednesday, July 15 - 14:00 CT - Atlanta
  game(
    102, 2026, 6, 15, 14, 0, Venues.ATL, null, null, undefined, 'Semi-finals',
    { game: 99, winner: true },
    { game: 100, winner: true }
  ),

  // ========== THIRD PLACE PLAYOFF - July 18, 2026 ==========
  // Game 103: Loser 101 vs Loser 102 - Saturday, July 18 - 16:00 CT - Miami
  game(
    103, 2026, 6, 18, 16, 0, Venues.MIA, null, null, undefined, 'Third Place',
    { game: 101, winner: false },
    { game: 102, winner: false }
  ),

  // ========== FINAL - July 19, 2026 ==========
  // Game 104: W101 vs W102 - Sunday, July 19 - 14:00 CT - New York/New Jersey
  game(
    104, 2026, 6, 19, 14, 0, Venues.NYC, null, null, undefined, 'Final',
    { game: 101, winner: true },
    { game: 102, winner: true }
  ),
];
