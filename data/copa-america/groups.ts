import {TeamNames} from "./base-data";

const group = (letter: string, teams: string[]) => ({
  letter, teams
})

export const groups = [
  group('A', [TeamNames.Arg, TeamNames.Per, TeamNames.Chi, TeamNames.Can]),
  group('B', [TeamNames.Mex, TeamNames.Ecu, TeamNames.Ven, TeamNames.Jam]),
  group('C', [TeamNames.Usa, TeamNames.Uru, TeamNames.Pan, TeamNames.Bol]),
  group('D', [TeamNames.Bra, TeamNames.Col, TeamNames.Par, TeamNames.Crc])
]
