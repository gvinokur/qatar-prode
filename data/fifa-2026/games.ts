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
 * FIFA 2026 World Cup Games
 *
 * Total: 104 matches
 * - Group Stage: 48 matches (6 per group × 12 groups)
 * - Knockout Stage: 32 matches
 *
 * Note: Specific dates, times, and venues are placeholders
 * Update with official FIFA schedule when available
 */
export const games = [
  // ==================== GROUP STAGE ====================
  // Group stage games will be assigned specific dates/times based on official schedule
  // For now, using placeholder dates in June 2026

  // GROUP A (Mexico, South Korea, South Africa, UEFA Playoff D)
  game(1, Dates.June112026, 12, Venues.MEX, TeamNames.Mexico, TeamNames.SouthKorea, 'A'),
  game(2, Dates.June122026, 15, Venues.LA, TeamNames.SouthAfrica, TeamNames.UEFAPlayoffD, 'A'),
  game(3, Dates.June162026, 18, Venues.MEX, TeamNames.Mexico, TeamNames.SouthAfrica, 'A'),
  game(4, Dates.June172026, 15, Venues.ATL, TeamNames.SouthKorea, TeamNames.UEFAPlayoffD, 'A'),
  game(5, Dates.June222026, 20, Venues.MEX, TeamNames.Mexico, TeamNames.UEFAPlayoffD, 'A'),
  game(6, Dates.June222026, 20, Venues.LA, TeamNames.SouthKorea, TeamNames.SouthAfrica, 'A'),

  // GROUP B (Canada, Switzerland, Qatar, UEFA Playoff A)
  game(7, Dates.June122026, 12, Venues.TOR, TeamNames.Canada, TeamNames.Switzerland, 'B'),
  game(8, Dates.June132026, 15, Venues.HOU, TeamNames.Qatar, TeamNames.UEFAPlayoffA, 'B'),
  game(9, Dates.June172026, 18, Venues.TOR, TeamNames.Canada, TeamNames.Qatar, 'B'),
  game(10, Dates.June182026, 15, Venues.PHI, TeamNames.Switzerland, TeamNames.UEFAPlayoffA, 'B'),
  game(11, Dates.June232026, 20, Venues.TOR, TeamNames.Canada, TeamNames.UEFAPlayoffA, 'B'),
  game(12, Dates.June232026, 20, Venues.HOU, TeamNames.Switzerland, TeamNames.Qatar, 'B'),

  // GROUP C (Brazil, Morocco, Scotland, Haiti)
  game(13, Dates.June132026, 12, Venues.LA, TeamNames.Brazil, TeamNames.Morocco, 'C'),
  game(14, Dates.June142026, 15, Venues.HOU, TeamNames.Scotland, TeamNames.Haiti, 'C'),
  game(15, Dates.June182026, 18, Venues.LA, TeamNames.Brazil, TeamNames.Scotland, 'C'),
  game(16, Dates.June192026, 15, Venues.NYC, TeamNames.Morocco, TeamNames.Haiti, 'C'),
  game(17, Dates.June242026, 20, Venues.LA, TeamNames.Brazil, TeamNames.Haiti, 'C'),
  game(18, Dates.June242026, 20, Venues.HOU, TeamNames.Morocco, TeamNames.Scotland, 'C'),

  // GROUP D (USA, Australia, Paraguay, UEFA Playoff C)
  game(19, Dates.June142026, 12, Venues.LA, TeamNames.USA, TeamNames.Australia, 'D'),
  game(20, Dates.June152026, 15, Venues.HOU, TeamNames.Paraguay, TeamNames.UEFAPlayoffC, 'D'),
  game(21, Dates.June192026, 18, Venues.LA, TeamNames.USA, TeamNames.Paraguay, 'D'),
  game(22, Dates.June202026, 15, Venues.KC, TeamNames.Australia, TeamNames.UEFAPlayoffC, 'D'),
  game(23, Dates.June252026, 20, Venues.LA, TeamNames.USA, TeamNames.UEFAPlayoffC, 'D'),
  game(24, Dates.June252026, 20, Venues.HOU, TeamNames.Australia, TeamNames.Paraguay, 'D'),

  // GROUP E (Germany, Ecuador, Ivory Coast, Curaçao)
  game(25, Dates.June152026, 12, Venues.NYC, TeamNames.Germany, TeamNames.Ecuador, 'E'),
  game(26, Dates.June162026, 15, Venues.HOU, TeamNames.IvoryCoast, TeamNames.Curacao, 'E'),
  game(27, Dates.June202026, 18, Venues.NYC, TeamNames.Germany, TeamNames.IvoryCoast, 'E'),
  game(28, Dates.June212026, 15, Venues.ATL, TeamNames.Ecuador, TeamNames.Curacao, 'E'),
  game(29, Dates.June262026, 20, Venues.NYC, TeamNames.Germany, TeamNames.Curacao, 'E'),
  game(30, Dates.June262026, 20, Venues.HOU, TeamNames.Ecuador, TeamNames.IvoryCoast, 'E'),

  // GROUP F (Netherlands, Japan, Tunisia, UEFA Playoff B)
  game(31, Dates.June162026, 12, Venues.NYC, TeamNames.Netherlands, TeamNames.Japan, 'F'),
  game(32, Dates.June172026, 15, Venues.PHI, TeamNames.Tunisia, TeamNames.UEFAPlayoffB, 'F'),
  game(33, Dates.June212026, 18, Venues.NYC, TeamNames.Netherlands, TeamNames.Tunisia, 'F'),
  game(34, Dates.June222026, 15, Venues.SEA, TeamNames.Japan, TeamNames.UEFAPlayoffB, 'F'),
  game(35, Dates.June272026, 20, Venues.NYC, TeamNames.Netherlands, TeamNames.UEFAPlayoffB, 'F'),
  game(36, Dates.June272026, 20, Venues.PHI, TeamNames.Japan, TeamNames.Tunisia, 'F'),

  // GROUP G (Belgium, Iran, Egypt, New Zealand)
  game(37, Dates.June132026, 18, Venues.TOR, TeamNames.Belgium, TeamNames.Iran, 'G'),
  game(38, Dates.June142026, 18, Venues.VAN, TeamNames.Egypt, TeamNames.NewZealand, 'G'),
  game(39, Dates.June182026, 12, Venues.TOR, TeamNames.Belgium, TeamNames.Egypt, 'G'),
  game(40, Dates.June192026, 12, Venues.VAN, TeamNames.Iran, TeamNames.NewZealand, 'G'),
  game(41, Dates.June232026, 16, Venues.TOR, TeamNames.Belgium, TeamNames.NewZealand, 'G'),
  game(42, Dates.June232026, 16, Venues.VAN, TeamNames.Iran, TeamNames.Egypt, 'G'),

  // GROUP H (Spain, Uruguay, Saudi Arabia, Cape Verde)
  game(43, Dates.June142026, 18, Venues.MIA, TeamNames.Spain, TeamNames.Uruguay, 'H'),
  game(44, Dates.June152026, 18, Venues.ATL, TeamNames.SaudiArabia, TeamNames.CapeVerde, 'H'),
  game(45, Dates.June192026, 12, Venues.MIA, TeamNames.Spain, TeamNames.SaudiArabia, 'H'),
  game(46, Dates.June202026, 12, Venues.ATL, TeamNames.Uruguay, TeamNames.CapeVerde, 'H'),
  game(47, Dates.June242026, 16, Venues.MIA, TeamNames.Spain, TeamNames.CapeVerde, 'H'),
  game(48, Dates.June242026, 16, Venues.ATL, TeamNames.Uruguay, TeamNames.SaudiArabia, 'H'),

  // GROUP I (France, Senegal, Norway, Intercontinental Playoff 2)
  game(49, Dates.June152026, 18, Venues.NYC, TeamNames.France, TeamNames.Senegal, 'I'),
  game(50, Dates.June162026, 18, Venues.BOS, TeamNames.Norway, TeamNames.IntercontinentalPlayoff2, 'I'),
  game(51, Dates.June202026, 12, Venues.NYC, TeamNames.France, TeamNames.Norway, 'I'),
  game(52, Dates.June212026, 12, Venues.BOS, TeamNames.Senegal, TeamNames.IntercontinentalPlayoff2, 'I'),
  game(53, Dates.June252026, 16, Venues.NYC, TeamNames.France, TeamNames.IntercontinentalPlayoff2, 'I'),
  game(54, Dates.June252026, 16, Venues.BOS, TeamNames.Senegal, TeamNames.Norway, 'I'),

  // GROUP J (Argentina, Austria, Algeria, Jordan)
  game(55, Dates.June162026, 18, Venues.MIA, TeamNames.Argentina, TeamNames.Austria, 'J'),
  game(56, Dates.June172026, 18, Venues.DAL, TeamNames.Algeria, TeamNames.Jordan, 'J'),
  game(57, Dates.June212026, 12, Venues.MIA, TeamNames.Argentina, TeamNames.Algeria, 'J'),
  game(58, Dates.June222026, 12, Venues.DAL, TeamNames.Austria, TeamNames.Jordan, 'J'),
  game(59, Dates.June262026, 16, Venues.MIA, TeamNames.Argentina, TeamNames.Jordan, 'J'),
  game(60, Dates.June262026, 16, Venues.DAL, TeamNames.Austria, TeamNames.Algeria, 'J'),

  // GROUP K (Portugal, Colombia, Uzbekistan, Intercontinental Playoff 1)
  game(61, Dates.June172026, 12, Venues.MIA, TeamNames.Portugal, TeamNames.Colombia, 'K'),
  game(62, Dates.June182026, 12, Venues.DAL, TeamNames.Uzbekistan, TeamNames.IntercontinentalPlayoff1, 'K'),
  game(63, Dates.June222026, 12, Venues.MIA, TeamNames.Portugal, TeamNames.Uzbekistan, 'K'),
  game(64, Dates.June232026, 12, Venues.DAL, TeamNames.Colombia, TeamNames.IntercontinentalPlayoff1, 'K'),
  game(65, Dates.June272026, 16, Venues.MIA, TeamNames.Portugal, TeamNames.IntercontinentalPlayoff1, 'K'),
  game(66, Dates.June272026, 16, Venues.DAL, TeamNames.Colombia, TeamNames.Uzbekistan, 'K'),

  // GROUP L (England, Croatia, Panama, Ghana)
  game(67, Dates.June172026, 18, Venues.NYC, TeamNames.England, TeamNames.Croatia, 'L'),
  game(68, Dates.June182026, 18, Venues.PHI, TeamNames.Panama, TeamNames.Ghana, 'L'),
  game(69, Dates.June222026, 18, Venues.NYC, TeamNames.England, TeamNames.Panama, 'L'),
  game(70, Dates.June232026, 18, Venues.PHI, TeamNames.Croatia, TeamNames.Ghana, 'L'),
  game(71, Dates.June272026, 20, Venues.NYC, TeamNames.England, TeamNames.Ghana, 'L'),
  game(72, Dates.June272026, 20, Venues.PHI, TeamNames.Croatia, TeamNames.Panama, 'L'),

  // ==================== ROUND OF 32 ====================
  // Official FIFA bracket structure from:
  // https://worldcupwiki.com/2026-fifa-world-cup-round-of-32/
  // Third-place team assignments depend on Annex C rules (495 combinations)

  // Match 73: Runner-up Group A vs. Runner-up Group B
  game(73, Dates.June282026, 20, Venues.LA, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'A', position: 2 }, { group: 'B', position: 2 }),

  // Match 74: Winner Group E vs. 3rd Place (A/B/C/D/F)
  game(74, Dates.June292026, 21, Venues.BOS, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'E', position: 1 }, { group: 'A/B/C/D/F', position: 3 }),

  // Match 75: Winner Group F vs. Runner-up Group C
  game(75, Dates.June292026, 2, Venues.MTY, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'F', position: 1 }, { group: 'C', position: 2 }),

  // Match 76: Winner Group C vs. Runner-up Group F
  game(76, Dates.June292026, 18, Venues.HOU, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'C', position: 1 }, { group: 'F', position: 2 }),

  // Match 77: Winner Group I vs. 3rd Place (C/D/F/G/H)
  game(77, Dates.June302026, 22, Venues.NYC, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'I', position: 1 }, { group: 'C/D/F/G/H', position: 3 }),

  // Match 78: Runner-up Group E vs. Runner-up Group I
  game(78, Dates.June302026, 18, Venues.DAL, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'E', position: 2 }, { group: 'I', position: 2 }),

  // Match 79: Winner Group A vs. 3rd Place (C/E/F/H/I)
  game(79, Dates.June302026, 2, Venues.MEX, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'A', position: 1 }, { group: 'C/E/F/H/I', position: 3 }),

  // Match 80: Winner Group L vs. 3rd Place (E/H/I/J/K)
  game(80, Dates.July012026, 17, Venues.ATL, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'L', position: 1 }, { group: 'E/H/I/J/K', position: 3 }),

  // Match 81: Winner Group D vs. 3rd Place (B/E/F/I/J)
  game(81, Dates.July012026, 20, Venues.SF, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'D', position: 1 }, { group: 'B/E/F/I/J', position: 3 }),

  // Match 82: Winner Group G vs. 3rd Place (A/E/H/I/J)
  game(82, Dates.July012026, 21, Venues.SEA, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'G', position: 1 }, { group: 'A/E/H/I/J', position: 3 }),

  // Match 83: Runner-up Group K vs. Runner-up Group L
  game(83, Dates.July022026, 18, Venues.TOR, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'K', position: 2 }, { group: 'L', position: 2 }),

  // Match 84: Winner Group H vs. Runner-up Group J
  game(84, Dates.July022026, 20, Venues.LA, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'H', position: 1 }, { group: 'J', position: 2 }),

  // Match 85: Winner Group B vs. 3rd Place (E/F/G/I/J)
  game(85, Dates.July022026, 21, Venues.VAN, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'B', position: 1 }, { group: 'E/F/G/I/J', position: 3 }),

  // Match 86: Winner Group J vs. Runner-up Group H
  game(86, Dates.July032026, 23, Venues.MIA, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'J', position: 1 }, { group: 'H', position: 2 }),

  // Match 87: Winner Group K vs. 3rd Place (D/E/I/J/L)
  game(87, Dates.July032026, 2.5, Venues.KC, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'K', position: 1 }, { group: 'D/E/I/J/L', position: 3 }),

  // Match 88: Runner-up Group D vs. Runner-up Group G
  game(88, Dates.July032026, 19, Venues.DAL, undefined, undefined, undefined,
    PlayoffStages.round32, { group: 'D', position: 2 }, { group: 'G', position: 2 }),

  // ==================== ROUND OF 16 ====================

  game(89, Dates.July042026, 15, Venues.LA, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 73, winner: true }, { game: 74, winner: true }),

  game(90, Dates.July042026, 21, Venues.MEX, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 75, winner: true }, { game: 76, winner: true }),

  game(91, Dates.July052026, 15, Venues.NYC, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 77, winner: true }, { game: 78, winner: true }),

  game(92, Dates.July052026, 21, Venues.TOR, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 79, winner: true }, { game: 80, winner: true }),

  game(93, Dates.July062026, 15, Venues.HOU, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 81, winner: true }, { game: 82, winner: true }),

  game(94, Dates.July062026, 21, Venues.KC, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 83, winner: true }, { game: 84, winner: true }),

  game(95, Dates.July072026, 15, Venues.PHI, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 85, winner: true }, { game: 86, winner: true }),

  game(96, Dates.July072026, 21, Venues.MIA, undefined, undefined, undefined,
    PlayoffStages.round16, { game: 87, winner: true }, { game: 88, winner: true }),

  // ==================== QUARTER-FINALS ====================

  game(97, Dates.July092026, 15, Venues.LA, undefined, undefined, undefined,
    PlayoffStages.quarters, { game: 89, winner: true }, { game: 90, winner: true }),

  game(98, Dates.July092026, 21, Venues.MEX, undefined, undefined, undefined,
    PlayoffStages.quarters, { game: 91, winner: true }, { game: 92, winner: true }),

  game(99, Dates.July102026, 15, Venues.NYC, undefined, undefined, undefined,
    PlayoffStages.quarters, { game: 93, winner: true }, { game: 94, winner: true }),

  game(100, Dates.July102026, 21, Venues.MIA, undefined, undefined, undefined,
    PlayoffStages.quarters, { game: 95, winner: true }, { game: 96, winner: true }),

  // ==================== SEMI-FINALS ====================

  game(101, Dates.July142026, 20, Venues.DAL, undefined, undefined, undefined,
    PlayoffStages.semis, { game: 97, winner: true }, { game: 98, winner: true }),

  game(102, Dates.July152026, 20, Venues.ATL, undefined, undefined, undefined,
    PlayoffStages.semis, { game: 99, winner: true }, { game: 100, winner: true }),

  // ==================== THIRD PLACE ====================

  game(103, Dates.July182026, 16, Venues.MIA, undefined, undefined, undefined,
    PlayoffStages.thirdPlace, { game: 101, winner: false }, { game: 102, winner: false }),

  // ==================== FINAL ====================

  game(104, Dates.July192026, 15, Venues.NYC, undefined, undefined, undefined,
    PlayoffStages.final, { game: 101, winner: true }, { game: 102, winner: true }),
];
