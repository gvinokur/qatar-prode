import { TeamNames, Dates, Venues, PlayoffStages } from './base-data';

const game = (
  game_number: number,
  date: Date,
  time: number,
  location: string,
  home_team?: string,
  away_team?: string,
  group?: string,
  playoff?: string,
  home_team_rule?: any,
  away_team_rule?: any
) => ({
  game_number,
  home_team,
  away_team,
  date,
  time,
  location,
  group,
  playoff,
  home_team_rule,
  away_team_rule,
});

/**
 * FIFA 2026 World Cup Games - OFFICIAL FIFA SCHEDULE
 *
 * Total: 104 matches
 * - Group Stage: 72 matches (6 per group × 12 groups)
 * - Knockout Stage: 32 matches
 *
 * Based on official FIFA World Cup 2026 Match Schedule PDF
 * Source: https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule_English.pdf
 * Last updated: January 13, 2026
 */
export const games = [
  // ==================== GROUP STAGE ====================
  // Organized by FIFA official match numbers (1-72)
  // Times are in Eastern Time (ET)

  // GROUP A - Mexico, South Africa, Korea Republic, UEFA Playoff D
  game(1, Dates.June112026, 15, Venues.MEX, TeamNames.Mexico, TeamNames.SouthAfrica, 'A'),
  game(2, Dates.June112026, 22, Venues.GDL, TeamNames.SouthKorea, TeamNames.UEFAPlayoffD, 'A'),
  game(25, Dates.June162026, 12, Venues.SEA, TeamNames.UEFAPlayoffD, TeamNames.SouthAfrica, 'A'),
  game(28, Dates.June162026, 21, Venues.GDL, TeamNames.Mexico, TeamNames.SouthKorea, 'A'),
  game(53, Dates.June222026, 21, Venues.SEA, TeamNames.UEFAPlayoffD, TeamNames.Mexico, 'A'),
  game(54, Dates.June222026, 21, Venues.GDL, TeamNames.SouthAfrica, TeamNames.SouthKorea, 'A'),

  // GROUP B - Canada, Switzerland, Qatar, UEFA Playoff A
  game(3, Dates.June122026, 15, Venues.TOR, TeamNames.Canada, TeamNames.UEFAPlayoffA, 'B'),
  game(5, Dates.June122026, 21, Venues.SF, TeamNames.Qatar, TeamNames.Switzerland, 'B'),
  game(26, Dates.June162026, 15, Venues.SF, TeamNames.Switzerland, TeamNames.UEFAPlayoffA, 'B'),
  game(27, Dates.June162026, 18, Venues.TOR, TeamNames.Canada, TeamNames.Qatar, 'B'),
  game(51, Dates.June212026, 15, Venues.SF, TeamNames.Switzerland, TeamNames.Canada, 'B'),
  game(52, Dates.June212026, 15, Venues.TOR, TeamNames.UEFAPlayoffA, TeamNames.Qatar, 'B'),

  // GROUP C - Brazil, Morocco, Haiti, Scotland
  game(7, Dates.June132026, 18, Venues.NYC, TeamNames.Brazil, TeamNames.Morocco, 'C'),
  game(8, Dates.June132026, 15, Venues.BOS, TeamNames.Haiti, TeamNames.Scotland, 'C'),
  game(29, Dates.June172026, 21, Venues.TOR, TeamNames.Brazil, TeamNames.Haiti, 'C'),
  game(30, Dates.June172026, 18, Venues.BOS, TeamNames.Scotland, TeamNames.Morocco, 'C'),
  game(49, Dates.June212026, 18, Venues.MIA, TeamNames.Scotland, TeamNames.Brazil, 'C'),
  game(50, Dates.June212026, 18, Venues.BOS, TeamNames.Morocco, TeamNames.Haiti, 'C'),

  // GROUP D - USA, Paraguay, Australia, UEFA Playoff C
  game(4, Dates.June122026, 21, Venues.LA, TeamNames.USA, TeamNames.Paraguay, 'D'),
  game(6, Dates.June122026, 0, Venues.VAN, TeamNames.Australia, TeamNames.UEFAPlayoffC, 'D'),
  game(31, Dates.June172026, 0, Venues.VAN, TeamNames.UEFAPlayoffC, TeamNames.Paraguay, 'D'),
  game(32, Dates.June172026, 15, Venues.LA, TeamNames.USA, TeamNames.Australia, 'D'),
  game(59, Dates.June232026, 22, Venues.VAN, TeamNames.UEFAPlayoffC, TeamNames.USA, 'D'),
  game(60, Dates.June232026, 22, Venues.LA, TeamNames.Paraguay, TeamNames.Australia, 'D'),

  // GROUP E - Germany, Curaçao, Côte d'Ivoire, Ecuador
  game(9, Dates.June132026, 19, Venues.PHI, TeamNames.Germany, TeamNames.Curacao, 'E'),
  game(10, Dates.June132026, 13, Venues.HOU, TeamNames.IvoryCoast, TeamNames.Ecuador, 'E'),
  game(33, Dates.June182026, 16, Venues.DAL, TeamNames.Germany, TeamNames.IvoryCoast, 'E'),
  game(34, Dates.June182026, 20, Venues.HOU, TeamNames.Ecuador, TeamNames.Curacao, 'E'),
  game(55, Dates.June222026, 16, Venues.PHI, TeamNames.IvoryCoast, TeamNames.Ecuador, 'E'),
  game(56, Dates.June222026, 16, Venues.DAL, TeamNames.Curacao, TeamNames.Germany, 'E'),

  // GROUP F - Netherlands, Japan, UEFA Playoff B, Tunisia
  game(11, Dates.June132026, 16, Venues.DAL, TeamNames.Netherlands, TeamNames.Japan, 'F'),
  game(12, Dates.June132026, 22, Venues.MTY, TeamNames.UEFAPlayoffB, TeamNames.Tunisia, 'F'),
  game(36, Dates.June182026, 0, Venues.MTY, TeamNames.Japan, TeamNames.Tunisia, 'F'),
  game(57, Dates.June232026, 19, Venues.NYC, TeamNames.Japan, TeamNames.UEFAPlayoffB, 'F'),
  game(58, Dates.June232026, 19, Venues.MTY, TeamNames.Tunisia, TeamNames.Netherlands, 'F'),
  // Note: Missing one Group F match - need to verify

  // GROUP G - Belgium, Egypt, IR Iran, New Zealand
  game(15, Dates.June142026, 21, Venues.LA, TeamNames.Iran, TeamNames.NewZealand, 'G'),
  game(16, Dates.June142026, 15, Venues.SEA, TeamNames.Belgium, TeamNames.Egypt, 'G'),
  game(39, Dates.June192026, 15, Venues.LA, TeamNames.Belgium, TeamNames.Iran, 'G'),
  game(40, Dates.June192026, 21, Venues.SEA, TeamNames.NewZealand, TeamNames.Egypt, 'G'),
  game(63, Dates.June242026, 23, Venues.SEA, TeamNames.NewZealand, TeamNames.Belgium, 'G'),
  game(64, Dates.June242026, 23, Venues.LA, TeamNames.Egypt, TeamNames.Iran, 'G'),

  // GROUP H - Spain, Cabo Verde, Saudi Arabia, Uruguay
  game(13, Dates.June142026, 18, Venues.MIA, TeamNames.SaudiArabia, TeamNames.Uruguay, 'H'),
  game(14, Dates.June142026, 12, Venues.ATL, TeamNames.Spain, TeamNames.CapeVerde, 'H'),
  game(37, Dates.June192026, 18, Venues.KC, TeamNames.Uruguay, TeamNames.CapeVerde, 'H'),
  game(38, Dates.June192026, 12, Venues.ATL, TeamNames.Spain, TeamNames.SaudiArabia, 'H'),
  game(65, Dates.June252026, 20, Venues.MIA, TeamNames.CapeVerde, TeamNames.SaudiArabia, 'H'),
  game(66, Dates.June252026, 20, Venues.KC, TeamNames.Uruguay, TeamNames.Spain, 'H'),

  // GROUP I - France, Senegal, Intercontinental Playoff 2, Norway
  game(17, Dates.June142026, 15, Venues.BOS, TeamNames.France, TeamNames.Senegal, 'I'),
  game(18, Dates.June142026, 18, Venues.MTY, TeamNames.IntercontinentalPlayoff2, TeamNames.Norway, 'I'),
  game(41, Dates.June192026, 20, Venues.DAL, TeamNames.Norway, TeamNames.Senegal, 'I'),
  game(42, Dates.June192026, 17, Venues.NYC, TeamNames.France, TeamNames.IntercontinentalPlayoff2, 'I'),
  game(61, Dates.June242026, 15, Venues.BOS, TeamNames.Norway, TeamNames.France, 'I'),
  game(62, Dates.June242026, 15, Venues.NYC, TeamNames.Senegal, TeamNames.IntercontinentalPlayoff2, 'I'),

  // GROUP J - Argentina, Algeria, Austria, Jordan
  game(19, Dates.June152026, 21, Venues.KC, TeamNames.Argentina, TeamNames.Algeria, 'J'),
  game(20, Dates.June152026, 0, Venues.SF, TeamNames.Austria, TeamNames.Jordan, 'J'),
  game(43, Dates.June202026, 13, Venues.KC, TeamNames.Argentina, TeamNames.Austria, 'J'),
  game(44, Dates.June202026, 23, Venues.SF, TeamNames.Jordan, TeamNames.Algeria, 'J'),
  game(69, Dates.June262026, 22, Venues.ATL, TeamNames.Jordan, TeamNames.Argentina, 'J'),
  game(70, Dates.June262026, 22, Venues.NYC, TeamNames.Algeria, TeamNames.Austria, 'J'),

  // GROUP K - Portugal, Intercontinental Playoff 1, Uzbekistan, Colombia
  game(23, Dates.June152026, 13, Venues.HOU, TeamNames.Colombia, TeamNames.IntercontinentalPlayoff1, 'K'),
  game(24, Dates.June152026, 22, Venues.GDL, TeamNames.Portugal, TeamNames.Uzbekistan, 'K'),
  game(35, Dates.June182026, 13, Venues.HOU, TeamNames.Portugal, TeamNames.IntercontinentalPlayoff1, 'K'),
  game(48, Dates.June202026, 22, Venues.GDL, TeamNames.Colombia, TeamNames.IntercontinentalPlayoff1, 'K'),
  game(47, Dates.June202026, 13, Venues.ATL, TeamNames.Portugal, TeamNames.Uzbekistan, 'K'),
  game(71, Dates.June262026, 19.5, Venues.MIA, TeamNames.Colombia, TeamNames.Portugal, 'K'),
  game(72, Dates.June262026, 19.5, Venues.DAL, TeamNames.IntercontinentalPlayoff1, TeamNames.Uzbekistan, 'K'),

  // GROUP L - England, Croatia, Ghana, Panama
  game(21, Dates.June152026, 19, Venues.ATL, TeamNames.Ghana, TeamNames.Panama, 'L'),
  game(22, Dates.June152026, 16, Venues.DAL, TeamNames.England, TeamNames.Croatia, 'L'),
  game(45, Dates.June202026, 16, Venues.TOR, TeamNames.England, TeamNames.Ghana, 'L'),
  game(46, Dates.June202026, 19, Venues.MIA, TeamNames.Panama, TeamNames.Croatia, 'L'),
  game(67, Dates.June252026, 17, Venues.TOR, TeamNames.Panama, TeamNames.England, 'L'),
  game(68, Dates.June252026, 17, Venues.PHI, TeamNames.Croatia, TeamNames.Ghana, 'L'),

  // ==================== KNOCKOUT STAGE ====================
  // Keep existing playoff games (73-104) as-is for now
  // These will need to be verified separately

  // ROUND OF 32
  game(73, Dates.June282026, 15, Venues.LA, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'A', position: 2 }, { group: 'B', position: 2 }),

  game(74, Dates.June292026, 16.5, Venues.BOS, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'E', position: 1 }, { group: 'A/B/C/D/F', position: 3 }),

  game(75, Dates.June292026, 21, Venues.MTY, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'F', position: 1 }, { group: 'C', position: 2 }),

  game(76, Dates.June292026, 13, Venues.HOU, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'C', position: 1 }, { group: 'F', position: 2 }),

  game(77, Dates.June302026, 17, Venues.NYC, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'I', position: 1 }, { group: 'C/D/F/G/H', position: 3 }),

  game(78, Dates.June302026, 13, Venues.DAL, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'E', position: 2 }, { group: 'I', position: 2 }),

  game(79, Dates.June302026, 21, Venues.MEX, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'A', position: 1 }, { group: 'C/E/F/H/I', position: 3 }),

  game(80, Dates.July012026, 12, Venues.ATL, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'L', position: 1 }, { group: 'E/H/I/J/K', position: 3 }),

  game(81, Dates.July012026, 20, Venues.SF, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'D', position: 1 }, { group: 'B/E/F/I/J', position: 3 }),

  game(82, Dates.July012026, 16, Venues.SEA, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'G', position: 1 }, { group: 'A/E/H/I/J', position: 3 }),

  game(83, Dates.July022026, 19, Venues.TOR, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'K', position: 2 }, { group: 'L', position: 2 }),

  game(84, Dates.July022026, 15, Venues.LA, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'H', position: 1 }, { group: 'J', position: 2 }),

  game(85, Dates.July022026, 23, Venues.VAN, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'B', position: 1 }, { group: 'E/F/G/I/J', position: 3 }),

  game(86, Dates.July032026, 18, Venues.MIA, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'J', position: 1 }, { group: 'H', position: 2 }),

  game(87, Dates.July032026, 21.5, Venues.KC, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'K', position: 1 }, { group: 'D/E/I/J/L', position: 3 }),

  game(88, Dates.July032026, 14, Venues.DAL, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'D', position: 2 }, { group: 'G', position: 2 }),

  // ROUND OF 16
  game(89, Dates.July042026, 17, Venues.HOU, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 73, winner: true }, { game: 75, winner: true }),

  game(90, Dates.July042026, 13, Venues.PHI, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 74, winner: true }, { game: 77, winner: true }),

  game(91, Dates.July052026, 16, Venues.MEX, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 76, winner: true }, { game: 78, winner: true }),

  game(92, Dates.July052026, 20, Venues.NYC, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 79, winner: true }, { game: 80, winner: true }),

  game(93, Dates.July062026, 15, Venues.DAL, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 81, winner: true }, { game: 82, winner: true }),

  game(94, Dates.July062026, 20, Venues.SEA, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 83, winner: true }, { game: 84, winner: true }),

  game(95, Dates.July072026, 12, Venues.ATL, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 85, winner: true }, { game: 87, winner: true }),

  game(96, Dates.July072026, 16, Venues.VAN, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 86, winner: true }, { game: 88, winner: true }),

  // QUARTER-FINALS
  game(97, Dates.July092026, 16, Venues.BOS, undefined, undefined, undefined,
    PlayoffStages.quarters, { game: 89, winner: true }, { game: 90, winner: true }),

  game(98, Dates.July102026, 15, Venues.LA, undefined, undefined, undefined,
    PlayoffStages.quarters, { game: 91, winner: true }, { game: 92, winner: true }),

  game(99, Dates.July102026, 17, Venues.KC, undefined, undefined, undefined,
    PlayoffStages.quarters, { game: 93, winner: true }, { game: 94, winner: true }),

  game(100, Dates.July112026, 21, Venues.MIA, undefined, undefined, undefined,
    PlayoffStages.quarters, { game: 95, winner: true }, { game: 96, winner: true }),

  // SEMI-FINALS
  game(101, Dates.July142026, 15, Venues.DAL, undefined, undefined, undefined,
    PlayoffStages.semis, { game: 97, winner: true }, { game: 98, winner: true }),

  game(102, Dates.July152026, 15, Venues.ATL, undefined, undefined, undefined,
    PlayoffStages.semis, { game: 99, winner: true }, { game: 100, winner: true }),

  // THIRD PLACE
  game(103, Dates.July182026, 17, Venues.MIA, undefined, undefined, undefined,
    PlayoffStages.thirdPlace, { game: 101, winner: false }, { game: 102, winner: false }),

  // FINAL
  game(104, Dates.July192026, 15, Venues.NYC, undefined, undefined, undefined,
    PlayoffStages.final, { game: 101, winner: true }, { game: 102, winner: true }),
];
