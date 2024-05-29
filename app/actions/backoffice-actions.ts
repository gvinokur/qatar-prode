'use server'

import tournaments from "../../data/tournaments";
import {
  createTournament,
  createTournamentTeam,
  deleteTournament,
  findTournamentByName
} from "../db/tournament-repository";
import {createTeam, getTeamByName} from "../db/team-repository";
import {
  createTournamentGroup,
  createTournamentGroupGame,
  createTournamentGroupTeam
} from "../db/tournament-group-repository";
import {games} from "../../data/copa-america/games";
import {createPlayoffRound, createPlayoffRoundGame} from "../db/tournament-playoff-repository";
import {GameNew, Tournament} from "../db/tables-definition";
import {createGame} from "../db/game-repository";

export async function deleteDBTournamentTree(tournament: Tournament) {

}

export async function generateDbTournament(name: string, deletePrevious:boolean = false) {
  const result = await Promise.all(tournaments
    .filter(tournament => tournament.tournament_name === name)
    .map(async (tournament) => {
      //TODO: Delete all tournament data
      const existingDBTournament = await findTournamentByName(name);
      if(existingDBTournament) {
        console.log('The tournament already exists')
        if (deletePrevious) {
          await deleteDBTournamentTree(existingDBTournament)
        } else {
          return 'El torneo ya existe'
        }
      }

      //Create the tournament and get the id
      const { id: tournamentId} = await createTournament({
        short_name: tournament.tournament_short_name,
        long_name: tournament.tournament_name,
        theme: JSON.stringify(tournament.tournament_theme),
        is_active: true
      })

      //Get or create teams
      const teamMap: {[k:string]:string} = Object.fromEntries(await Promise.all(tournament.teams.map(async team => {
        //Check if exists, only create if not
        const dbTeam = await getTeamByName(team.name)
        if (dbTeam) {
          //TODO: Should it update?

          return [dbTeam.name, dbTeam.id]
        }
        // Create if it doesn't
        const {id: teamId} = await createTeam({
          name: team.name,
          short_name: team.short_name,
          theme: JSON.stringify({
            primary_color: team.primary_color,
            secondary_color: team.secondary_color
          })
        })

        return [team.name, teamId]
      })))

      //Create tournament-team association
      await Promise.all(Object.values(teamMap).map(async teamId => {
        return await createTournamentTeam({ tournament_id: tournamentId, team_id: teamId})
      }))

      //Create groups
      const groupIdMap: {[k:string]:string} = Object.fromEntries(await Promise.all(tournament.groups.map(async group => {
        //Create group
        const {id: groupId} = await createTournamentGroup({
          tournament_id: tournamentId,
          group_letter: group.letter,
        })

        //Associate all teams in this group
        await Promise.all(group.teams.map(async (teamName, index) => {
          await createTournamentGroupTeam({
            tournament_group_id: groupId,
            team_id: teamMap[teamName],
            position: index
          })
        }))

        return [group.letter, groupId]
      })))

      const playoffRoundMap: {[K:string]: string} = Object.fromEntries(await Promise.all(
        tournament.playoffs.map(async playoff => {
          const {id: playoffRoundId}  = await createPlayoffRound({
            tournament_id: tournamentId,
            round_name: playoff.stage,
            round_order: playoff.order,
            total_games: playoff.games,
            is_final: playoff.is_final,
            is_third_place: playoff.is_third_place
          })

          return [playoff.stage, playoffRoundId]
        })))

      //Create all games!!
      games.map(async game=> {
        const newGame: GameNew = {
          tournament_id: tournamentId,
          game_number: game.game_number,
          home_team: game.home_team && teamMap[game.home_team],
          away_team: game.away_team && teamMap[game.away_team],
          game_date: game.date,
          location: game.location,
          home_team_rule: game.home_team_rule && JSON.stringify(game.home_team_rule),
          away_team_rule: game.away_team_rule && JSON.stringify(game.away_team_rule)
        }

        const {id: gameId} = await createGame(newGame)

        //Associate game to group or playoff
        if(game.group) {
          await createTournamentGroupGame({
            tournament_group_id: groupIdMap[game.group],
            game_id: gameId
          })
        } else if (game.playoff) {
          await createPlayoffRoundGame({
            tournament_playoff_round_id: playoffRoundMap[game.playoff],
            game_id: gameId
          })
        }
      })
      return 'El campeonato fue creado exitosamente'
    }))

  return result;
}
