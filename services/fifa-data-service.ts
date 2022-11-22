import {Game, Player} from "../types/definitions";

type Country = {
  IdTeam: string,
  ShortClubName: string;
}

type CountriesResult = {
  Results: Country[]
}

type LocaleName = {
  Locale: string,
  Description: string
}

type PlayerData = {
  IdPlayer: string,
  PlayerName: LocaleName[],
  PositionLocalized: LocaleName[],
  BirthDate: string,
}

type SquadData = {
  Players: PlayerData[]
}

type MatchData = {
  MatchNumber: number
  HomeTeamScore: number | null,
  AwayTeamScore: number | null,
  AggregateHomeTeamScore: number | null,
  AggregateAwayTeamScore: number | null,
  HomeTeamPenaltyScore: number | null,
  AwayTeamPenaltyScore: number | null,
}

type MatchesData = {
  Results: MatchData[]
}

const calculateAge = (birthDate: string) => {
  const currentDateMillis = Date.now();
  const birthDateMillis = Date.parse(birthDate);
  return new Date(currentDateMillis - birthDateMillis).getFullYear() - 1970
}

const fetchPlayerData = async (): Promise<Player[]> => {
  const allCountriesResult = await fetch('https://api.fifa.com/api/v3/competitions/teams/255711?language=en');
  const allCountriesData: CountriesResult = await allCountriesResult.json() as CountriesResult
  const squads = await Promise.all(allCountriesData['Results'].map(async (country) => {
    const squadResult = await fetch(`https://api.fifa.com/api/v3/teams/${country.IdTeam}/squad?idCompetition=17&idSeason=255711&language=en`);
    const squadData: SquadData = await squadResult.json() as SquadData;
    return squadData.Players.map(player => ({
      id: player.IdPlayer,
      name: player.PlayerName[0].Description,
      position: player.PositionLocalized[0].Description,
      age: calculateAge(player.BirthDate),
      team: country.ShortClubName,
    }))
  }))
  return squads.flat()
}

const fetchMatchResultData = async (): Promise<Partial<Game>[]> => {
  const allMatchesResult = await fetch('https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=255711');
  const allMatchesData: MatchesData = await allMatchesResult.json()
  return allMatchesData.Results.map(matchData => ({
    MatchNumber: matchData.MatchNumber,
    localScore: matchData.HomeTeamScore !== null ? matchData.HomeTeamScore + (matchData.AggregateHomeTeamScore || 0) : null,
    awayScore: matchData.AwayTeamScore !== null ? matchData.AwayTeamScore + (matchData.AggregateAwayTeamScore || 0) : null,
    localPenaltyScore: matchData.HomeTeamPenaltyScore ? matchData.HomeTeamPenaltyScore : undefined,
    awayPenaltyScore: matchData.AwayTeamPenaltyScore ? matchData.AwayTeamPenaltyScore : undefined,
  }))
}

export {fetchPlayerData, fetchMatchResultData}
