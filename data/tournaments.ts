import CopaAmericaDef from "./copa-america";
import Euro2024Def from './euro'

export interface TournamentBaseData  {tournament_theme: {web_page: string, logo: string, secondary_color: string, primary_color: string}, teams: {name: string, short_name: string, secondary_color: string, primary_color: string}[], tournament_name: string, players: {name: string, team: string, position: string, age: number}[], games: {date: Date, home_team_rule: any, location: string, game_number: number, home_team: string | undefined, away_team_rule: any, away_team: string | undefined, group: string | undefined, playoff: string | undefined}[], tournament_short_name: string, groups: {teams: string[], letter: string}[], playoffs: {is_final: boolean | undefined, stage: string, games: number, is_third_place: boolean | undefined, order: number}[]}

export default [
  CopaAmericaDef,
  Euro2024Def,
  //Copa America copy for test, TODO: delete
  // {
  //   ...CopaAmericaDef,
  //   tournament_name: 'Copia de la Copa America 2024'
  // }
]
