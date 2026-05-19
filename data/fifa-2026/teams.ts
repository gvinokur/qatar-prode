import { TeamNames } from './base-data';

const team = (
  name: string,
  short_name: string,
  primary_color: string,
  secondary_color: string,
  rank?: number
) => ({
  name,
  short_name,
  primary_color,
  secondary_color,
  rank,
});

/**
 * FIFA 2026 World Cup Teams
 * All 48 participating teams with their official colors and FIFA World Rankings.
 *
 * Colors are based on national team kits (home jersey colors).
 * Rankings: April 1, 2026 for top 20; November 19, 2025 (draw seedings) for positions 21+.
 * Playoff-qualified teams (settled March 31, 2026) use their placeholder short_names.
 */
export const teams = [
  // Group A
  team(TeamNames.Mexico, 'MEX', '#006847', '#FFFFFF', 15),
  team(TeamNames.SouthKorea, 'KOR', '#C60C30', '#FFFFFF', 22),
  team(TeamNames.SouthAfrica, 'RSA', '#007749', '#FFB81C', 61),
  team(TeamNames.UEFAPlayoffD, 'PO-D', '#CCCCCC', '#333333', 41), // Czech Republic

  // Group B
  team(TeamNames.Canada, 'CAN', '#FF0000', '#FFFFFF', 27),
  team(TeamNames.Switzerland, 'SUI', '#FF0000', '#FFFFFF', 19),
  team(TeamNames.Qatar, 'QAT', '#8A1538', '#FFFFFF', 51),
  team(TeamNames.UEFAPlayoffA, 'PO-A', '#CCCCCC', '#333333', 65), // Bosnia & Herzegovina

  // Group C
  team(TeamNames.Brazil, 'BRA', '#009C3B', '#FFDF00', 6),
  team(TeamNames.Morocco, 'MAR', '#C1272D', '#006233', 8),
  team(TeamNames.Scotland, 'SCO', '#0065BF', '#FFFFFF', 36),
  team(TeamNames.Haiti, 'HAI', '#00209F', '#D21034', 84),

  // Group D
  team(TeamNames.USA, 'USA', '#002868', '#FFFFFF', 16),
  team(TeamNames.Australia, 'AUS', '#FFC72C', '#00843D', 26),
  team(TeamNames.Paraguay, 'PAR', '#D40000', '#0038A8', 39),
  team(TeamNames.UEFAPlayoffC, 'PO-C', '#CCCCCC', '#333333', 22), // Turkey

  // Group E
  team(TeamNames.Germany, 'GER', '#FFFFFF', '#000000', 10),
  team(TeamNames.Ecuador, 'ECU', '#FFE000', '#003893', 23),
  team(TeamNames.IvoryCoast, 'CIV', '#FF7900', '#009E49', 42),
  team(TeamNames.Curacao, 'CUW', '#003893', '#FFD100', 82),

  // Group F
  team(TeamNames.Netherlands, 'NED', '#FF4F00', '#21468B', 7),
  team(TeamNames.Japan, 'JPN', '#002395', '#FFFFFF', 18),
  team(TeamNames.Tunisia, 'TUN', '#E70013', '#FFFFFF', 40),
  team(TeamNames.UEFAPlayoffB, 'PO-B', '#CCCCCC', '#333333', 38), // Sweden

  // Group G
  team(TeamNames.Belgium, 'BEL', '#ED1C24', '#000000', 9),
  team(TeamNames.Iran, 'IRN', '#FFFFFF', '#239F40', 20),
  team(TeamNames.Egypt, 'EGY', '#CE1126', '#FFFFFF', 34),
  team(TeamNames.NewZealand, 'NZL', '#FFFFFF', '#000000', 86),

  // Group H
  team(TeamNames.Spain, 'ESP', '#AA151B', '#F1BF00', 2),
  team(TeamNames.Uruguay, 'URU', '#5DADE2', '#FFFFFF', 17),
  team(TeamNames.SaudiArabia, 'KSA', '#165C3A', '#FFFFFF', 60),
  team(TeamNames.CapeVerde, 'CPV', '#003893', '#CF2027', 68),

  // Group I
  team(TeamNames.France, 'FRA', '#0055A4', '#FFFFFF', 1),
  team(TeamNames.Senegal, 'SEN', '#00A650', '#FFD100', 14),
  team(TeamNames.Norway, 'NOR', '#BA0C2F', '#FFFFFF', 29),
  team(TeamNames.IntercontinentalPlayoff2, 'IC-2', '#CCCCCC', '#333333', 57), // Iraq

  // Group J
  team(TeamNames.Argentina, 'ARG', '#75AADB', '#FFFFFF', 3),
  team(TeamNames.Austria, 'AUT', '#ED1C24', '#FFFFFF', 24),
  team(TeamNames.Algeria, 'ALG', '#006233', '#FFFFFF', 35),
  team(TeamNames.Jordan, 'JOR', '#CE1126', '#000000', 66),

  // Group K
  team(TeamNames.Portugal, 'POR', '#FF0000', '#006600', 5),
  team(TeamNames.Colombia, 'COL', '#FFD100', '#003893', 13),
  team(TeamNames.Uzbekistan, 'UZB', '#1EB53A', '#FFFFFF', 50),
  team(TeamNames.IntercontinentalPlayoff1, 'IC-1', '#CCCCCC', '#333333', 46), // DR Congo

  // Group L
  team(TeamNames.England, 'ENG', '#FFFFFF', '#1C2E4D', 4),
  team(TeamNames.Croatia, 'CRO', '#FF0000', '#171796', 11),
  team(TeamNames.Panama, 'PAN', '#D21034', '#005293', 30),
  team(TeamNames.Ghana, 'GHA', '#FFFFFF', '#006B3F', 72),
];
