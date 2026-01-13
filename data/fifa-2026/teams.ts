import { TeamNames } from './base-data';

const team = (
  name: string,
  short_name: string,
  primary_color: string,
  secondary_color: string
) => ({
  name,
  short_name,
  primary_color,
  secondary_color,
});

/**
 * FIFA 2026 World Cup Teams
 * All 48 participating teams with their official colors
 *
 * Colors are based on national team kits (home jersey colors)
 */
export const teams = [
  // Group A
  team(TeamNames.Mexico, 'MEX', '#006847', '#FFFFFF'),
  team(TeamNames.SouthKorea, 'KOR', '#C60C30', '#FFFFFF'),
  team(TeamNames.SouthAfrica, 'RSA', '#007749', '#FFB81C'),
  team(TeamNames.UEFAPlayoffD, 'PO-D', '#CCCCCC', '#333333'),

  // Group B
  team(TeamNames.Canada, 'CAN', '#FF0000', '#FFFFFF'),
  team(TeamNames.Switzerland, 'SUI', '#FF0000', '#FFFFFF'),
  team(TeamNames.Qatar, 'QAT', '#8A1538', '#FFFFFF'),
  team(TeamNames.UEFAPlayoffA, 'PO-A', '#CCCCCC', '#333333'),

  // Group C
  team(TeamNames.Brazil, 'BRA', '#009C3B', '#FFDF00'),
  team(TeamNames.Morocco, 'MAR', '#C1272D', '#006233'),
  team(TeamNames.Scotland, 'SCO', '#0065BF', '#FFFFFF'),
  team(TeamNames.Haiti, 'HAI', '#00209F', '#D21034'),

  // Group D
  team(TeamNames.USA, 'USA', '#002868', '#FFFFFF'),
  team(TeamNames.Australia, 'AUS', '#FFC72C', '#00843D'),
  team(TeamNames.Paraguay, 'PAR', '#D40000', '#0038A8'),
  team(TeamNames.UEFAPlayoffC, 'PO-C', '#CCCCCC', '#333333'),

  // Group E
  team(TeamNames.Germany, 'GER', '#FFFFFF', '#000000'),
  team(TeamNames.Ecuador, 'ECU', '#FFE000', '#003893'),
  team(TeamNames.IvoryCoast, 'CIV', '#FF7900', '#009E49'),
  team(TeamNames.Curacao, 'CUW', '#003893', '#FFD100'),

  // Group F
  team(TeamNames.Netherlands, 'NED', '#FF4F00', '#21468B'),
  team(TeamNames.Japan, 'JPN', '#002395', '#FFFFFF'),
  team(TeamNames.Tunisia, 'TUN', '#E70013', '#FFFFFF'),
  team(TeamNames.UEFAPlayoffB, 'PO-B', '#CCCCCC', '#333333'),

  // Group G
  team(TeamNames.Belgium, 'BEL', '#ED1C24', '#000000'),
  team(TeamNames.Iran, 'IRN', '#FFFFFF', '#239F40'),
  team(TeamNames.Egypt, 'EGY', '#CE1126', '#FFFFFF'),
  team(TeamNames.NewZealand, 'NZL', '#FFFFFF', '#000000'),

  // Group H
  team(TeamNames.Spain, 'ESP', '#AA151B', '#F1BF00'),
  team(TeamNames.Uruguay, 'URU', '#5DADE2', '#FFFFFF'),
  team(TeamNames.SaudiArabia, 'KSA', '#165C3A', '#FFFFFF'),
  team(TeamNames.CapeVerde, 'CPV', '#003893', '#CF2027'),

  // Group I
  team(TeamNames.France, 'FRA', '#0055A4', '#FFFFFF'),
  team(TeamNames.Senegal, 'SEN', '#00A650', '#FFD100'),
  team(TeamNames.Norway, 'NOR', '#BA0C2F', '#FFFFFF'),
  team(TeamNames.IntercontinentalPlayoff2, 'IC-2', '#CCCCCC', '#333333'),

  // Group J
  team(TeamNames.Argentina, 'ARG', '#75AADB', '#FFFFFF'),
  team(TeamNames.Austria, 'AUT', '#ED1C24', '#FFFFFF'),
  team(TeamNames.Algeria, 'ALG', '#006233', '#FFFFFF'),
  team(TeamNames.Jordan, 'JOR', '#CE1126', '#000000'),

  // Group K
  team(TeamNames.Portugal, 'POR', '#FF0000', '#006600'),
  team(TeamNames.Colombia, 'COL', '#FFD100', '#003893'),
  team(TeamNames.Uzbekistan, 'UZB', '#1EB53A', '#FFFFFF'),
  team(TeamNames.IntercontinentalPlayoff1, 'IC-1', '#CCCCCC', '#333333'),

  // Group L
  team(TeamNames.England, 'ENG', '#FFFFFF', '#1C2E4D'),
  team(TeamNames.Croatia, 'CRO', '#FF0000', '#171796'),
  team(TeamNames.Panama, 'PAN', '#D21034', '#005293'),
  team(TeamNames.Ghana, 'GHA', '#FFFFFF', '#006B3F'),
];
