/**
 * FIFA 2026 World Cup Base Data
 * Tournament hosted by USA, Canada, and Mexico
 * 48 teams in 12 groups, knockout stage from Round of 32
 */

export const TeamNames = {
  // Group A
  Mexico: 'Mexico',
  SouthKorea: 'South Korea',
  SouthAfrica: 'South Africa',
  UEFAPlayoffD: 'UEFA Playoff D',

  // Group B
  Canada: 'Canada',
  Switzerland: 'Switzerland',
  Qatar: 'Qatar',
  UEFAPlayoffA: 'UEFA Playoff A',

  // Group C
  Brazil: 'Brasil',
  Morocco: 'Morocco',
  Scotland: 'Scotland',
  Haiti: 'Haiti',

  // Group D
  USA: 'Estados Unidos',
  Australia: 'Australia',
  Paraguay: 'Paraguay',
  UEFAPlayoffC: 'UEFA Playoff C',

  // Group E
  Germany: 'Germany',
  Ecuador: 'Ecuador',
  IvoryCoast: 'Ivory Coast',
  Curacao: 'Curaçao',

  // Group F
  Netherlands: 'Netherlands',
  Japan: 'Japan',
  Tunisia: 'Tunisia',
  UEFAPlayoffB: 'UEFA Playoff B',

  // Group G
  Belgium: 'Belgium',
  Iran: 'Iran',
  Egypt: 'Egypt',
  NewZealand: 'New Zealand',

  // Group H
  Spain: 'Spain',
  Uruguay: 'Uruguay',
  SaudiArabia: 'Saudi Arabia',
  CapeVerde: 'Cape Verde',

  // Group I
  France: 'France',
  Senegal: 'Senegal',
  Norway: 'Norway',
  IntercontinentalPlayoff2: 'Intercontinental Playoff 2',

  // Group J
  Argentina: 'Argentina',
  Austria: 'Austria',
  Algeria: 'Algeria',
  Jordan: 'Jordan',

  // Group K
  Portugal: 'Portugal',
  Colombia: 'Colombia',
  Uzbekistan: 'Uzbekistan',
  IntercontinentalPlayoff1: 'Intercontinental Playoff 1',

  // Group L
  England: 'England',
  Croatia: 'Croatia',
  Panama: 'Panama',
  Ghana: 'Ghana',
} as const;

// Venues across USA, Canada, and Mexico
export const Venues = {
  // USA venues
  ATL: 'Mercedes-Benz Stadium (Atlanta)',
  BOS: 'Gillette Stadium (Boston)',
  DAL: 'AT&T Stadium (Dallas)',
  HOU: 'NRG Stadium (Houston)',
  KC: 'Arrowhead Stadium (Kansas City)',
  LA: 'SoFi Stadium (Los Angeles)',
  MIA: 'Hard Rock Stadium (Miami)',
  NYC: 'MetLife Stadium (New York/New Jersey)',
  PHI: 'Lincoln Financial Field (Philadelphia)',
  SF: 'Levi\'s Stadium (San Francisco Bay Area)',
  SEA: 'Lumen Field (Seattle)',

  // Canada venues
  TOR: 'BMO Field (Toronto)',
  VAN: 'BC Place (Vancouver)',

  // Mexico venues
  MEX: 'Estadio Azteca (Mexico City)',
  GDL: 'Estadio Akron (Guadalajara)',
  MTY: 'Estadio BBVA (Monterrey)',
} as const;

// Tournament dates (June 11 - July 19, 2026)
export const Dates = {
  // Group stage: June 11-27, 2026
  June112026: new Date(2026, 5, 11),
  June122026: new Date(2026, 5, 12),
  June132026: new Date(2026, 5, 13),
  June142026: new Date(2026, 5, 14),
  June152026: new Date(2026, 5, 15),
  June162026: new Date(2026, 5, 16),
  June172026: new Date(2026, 5, 17),
  June182026: new Date(2026, 5, 18),
  June192026: new Date(2026, 5, 19),
  June202026: new Date(2026, 5, 20),
  June212026: new Date(2026, 5, 21),
  June222026: new Date(2026, 5, 22),
  June232026: new Date(2026, 5, 23),
  June242026: new Date(2026, 5, 24),
  June252026: new Date(2026, 5, 25),
  June262026: new Date(2026, 5, 26),
  June272026: new Date(2026, 5, 27),

  // Round of 32: June 28 - July 3, 2026
  June282026: new Date(2026, 5, 28),
  June292026: new Date(2026, 5, 29),
  June302026: new Date(2026, 5, 30),
  July012026: new Date(2026, 6, 1),
  July022026: new Date(2026, 6, 2),
  July032026: new Date(2026, 6, 3),

  // Round of 16: July 4-7, 2026
  July042026: new Date(2026, 6, 4),
  July052026: new Date(2026, 6, 5),
  July062026: new Date(2026, 6, 6),
  July072026: new Date(2026, 6, 7),

  // Quarter-finals: July 9-11, 2026
  July092026: new Date(2026, 6, 9),
  July102026: new Date(2026, 6, 10),
  July112026: new Date(2026, 6, 11),

  // Semi-finals: July 14-15, 2026
  July142026: new Date(2026, 6, 14),
  July152026: new Date(2026, 6, 15),

  // Third-place: July 18, 2026
  July182026: new Date(2026, 6, 18),

  // Final: July 19, 2026
  July192026: new Date(2026, 6, 19),
} as const;

export const PlayoffStages = {
  round32: 'Round of 32',
  round16: 'Round of 16',
  quarters: 'Quarter-finals',
  semis: 'Semi-finals',
  final: 'Final',
  thirdPlace: 'Third Place',
} as const;
