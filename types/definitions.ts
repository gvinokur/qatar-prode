export type GroupName = 'Group A' | 'Group B' | 'Group C' | 'Group D' | 'Group E' | 'Group F' | 'Group G' | 'Group H';

export type Game = {
  MatchNumber: number,
  RoundNumber: number,
  DateUtc: string,
  HomeTeam: string | { group: GroupName, position: number} | number,
  AwayTeam: string | { group: GroupName, position: number} | number,
  CalculatedHomeTeam?: string,
  CalculatedAwayTeam?: string,
  Group: GroupName | null,
  Location: string,
  HomeTeamScore: number | null,
  AwayTeamScore: number | null,
  HomeTeamPenaltyScore?: number,
  AwayTeamPenaltyScore?: number,
}

export type Group = {
  name: GroupName,
  teams: string[],
}

export type TeamStats = {
  team: string,
  points: number,
  win: number,
  draw: number,
  loss: number,
  goalsFor: number,
  goalsAgainst: number,
  goalDifference: number,
}

export type GameGuess = {
  id?: string,
  gameId: number,
  localScore: number | null,
  awayScore: number | null,
  localTeam?: string | null,
  awayTeam?: string | null,
  localPenaltyWinner?: boolean,
  awayPenaltyWinner?: boolean,
}
