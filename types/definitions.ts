export type GroupName = 'Group A' | 'Group B' | 'Group C' | 'Group D' | 'Group E' | 'Group F' | 'Group G' | 'Group H';

export type Game = {
  MatchNumber: number,
  RoundNumber: number,
  DateUtc: string,
  HomeTeam: string | { group: GroupName, position: number} | number,
  AwayTeam: string | { group: GroupName, position: number} | number,
  CalculatedHomeTeam?: string | null,
  CalculatedAwayTeam?: string | null,
  Group: GroupName | null,
  Location: string,
  localScore: number | null,
  awayScore: number | null,
  localPenaltyScore?: number,
  awayPenaltyScore?: number,
  localPenaltyWinner?: boolean,
  awayPenaltyWinner?: boolean,
}

export type Group = {
  name: GroupName,
  teams: string[],
}

export type TeamStats = {
  team: string,
  gamesPlayed: number,
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

export type GameGuessDictionary = {
  [key: number]: GameGuess
};

export type Player = {
  id: string,
  name: string,
  position: string,
  age: number,
  team: string,
}

export type GameStatisticForUser = {
  user_id: string,
  total_correct_guesses: number,
  total_exact_guesses: number,
  total_score: number | null,
  group_correct_guesses: number,
  group_exact_guesses: number,
  group_score: number | null,
  playoff_correct_guesses: number,
  playoff_exact_guesses: number,
  playoff_score: number | null,
}
