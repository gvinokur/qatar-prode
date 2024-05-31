import {TeamNames} from "./base-data";

const group = (letter: string, teams: string[]) => ({
  letter, teams
})

export const groups = [
  group('A', [TeamNames.Germany, TeamNames.Scotland, TeamNames.Hungary, TeamNames.Switzerland]),
  group('B', [TeamNames.Spain, TeamNames.Croatia, TeamNames.Italy, TeamNames.Albania]),
  group('C', [TeamNames.Slovenia, TeamNames.Denmark, TeamNames.Serbia, TeamNames.England]),
  group('D', [TeamNames.Netherlands, TeamNames.France, TeamNames.Poland, TeamNames.Austria]),
  group('E', [TeamNames.Ukraine, TeamNames.Slovakia, TeamNames.Belgium, TeamNames.Romania]),
  group('F', [TeamNames.Portugal, TeamNames.Czechia, TeamNames.Georgia, TeamNames.Turkey])
]
