import { TeamNames } from './base-data';

const group = (letter: string, teams: string[]) => ({
  letter,
  teams,
});

/**
 * FIFA 2026 World Cup Groups
 * Based on the December 2025 draw
 *
 * Note: Some teams are playoff placeholders that will be determined in March 2026:
 * - UEFA Playoff A: Italy/Northern Ireland/Wales/Bosnia and Herzegovina
 * - UEFA Playoff B: Sweden/Ukraine/Poland/Albania
 * - UEFA Playoff C: Turkey/Romania/Slovakia/Kosovo
 * - UEFA Playoff D: Denmark/North Macedonia/Czechia/Republic of Ireland
 * - Intercontinental Playoff 1: DR Congo/Jamaica/New Caledonia
 * - Intercontinental Playoff 2: Iraq/Bolivia/Suriname
 */
export const groups = [
  group('A', [
    TeamNames.Mexico,
    TeamNames.SouthKorea,
    TeamNames.SouthAfrica,
    TeamNames.UEFAPlayoffD,
  ]),
  group('B', [
    TeamNames.Canada,
    TeamNames.Switzerland,
    TeamNames.Qatar,
    TeamNames.UEFAPlayoffA,
  ]),
  group('C', [
    TeamNames.Brazil,
    TeamNames.Morocco,
    TeamNames.Scotland,
    TeamNames.Haiti,
  ]),
  group('D', [
    TeamNames.USA,
    TeamNames.Australia,
    TeamNames.Paraguay,
    TeamNames.UEFAPlayoffC,
  ]),
  group('E', [
    TeamNames.Germany,
    TeamNames.Ecuador,
    TeamNames.IvoryCoast,
    TeamNames.Curacao,
  ]),
  group('F', [
    TeamNames.Netherlands,
    TeamNames.Japan,
    TeamNames.Tunisia,
    TeamNames.UEFAPlayoffB,
  ]),
  group('G', [
    TeamNames.Belgium,
    TeamNames.Iran,
    TeamNames.Egypt,
    TeamNames.NewZealand,
  ]),
  group('H', [
    TeamNames.Spain,
    TeamNames.Uruguay,
    TeamNames.SaudiArabia,
    TeamNames.CapeVerde,
  ]),
  group('I', [
    TeamNames.France,
    TeamNames.Senegal,
    TeamNames.Norway,
    TeamNames.IntercontinentalPlayoff2,
  ]),
  group('J', [
    TeamNames.Argentina,
    TeamNames.Austria,
    TeamNames.Algeria,
    TeamNames.Jordan,
  ]),
  group('K', [
    TeamNames.Portugal,
    TeamNames.Colombia,
    TeamNames.Uzbekistan,
    TeamNames.IntercontinentalPlayoff1,
  ]),
  group('L', [
    TeamNames.England,
    TeamNames.Croatia,
    TeamNames.Panama,
    TeamNames.Ghana,
  ]),
];
