'use server'

import tournaments from "../../data/tournaments";
import {
  createTournament,
  createTournamentTeam,
  deleteTournament, deleteTournamentTeams,
  findTournamentByName
} from "../db/tournament-repository";
import {createTeam, findTeamInTournament, getTeamByName} from "../db/team-repository";
import {
  createTournamentGroup,
  createTournamentGroupGame,
  createTournamentGroupTeam, deleteAllGroupsFromTournament
} from "../db/tournament-group-repository";
import {
  createPlayoffRound,
  createPlayoffRoundGame,
  deleteAllPlayoffRoundsInTournament
} from "../db/tournament-playoff-repository";
import {GameNew, PlayerNew, Team, Tournament} from "../db/tables-definition";
import {createGame, deleteAllGamesFromTournament} from "../db/game-repository";
import {players} from "../../data/euro/players";
import {createPlayer, findPlayerByTeamAndTournament, updatePlayer} from "../db/player-repository";

export async function deleteDBTournamentTree(tournament: Tournament) {
  // delete from tournament_playoff_round_games ;
  // delete from tournament_group_games;
  // TODO: Delete GameGuesses
  // delete from games;
  await deleteAllGamesFromTournament(tournament.id);
  // delete from tournament_playoff_rounds;
  await deleteAllPlayoffRoundsInTournament(tournament.id);
  // delete from tournament_group_teams;
  // delete from tournament_groups;
  await deleteAllGroupsFromTournament(tournament.id);
  // delete from tournament_teams;
  await deleteTournamentTeams(tournament.id)
  // TODO: Remove Groups
  // delete from tournaments
  await deleteTournament(tournament.id)
}

export async function generateDbTournamentTeamPlayers(name: string) {
  const result = await Promise.all(tournaments
    .filter(tournament => tournament.tournament_name === name)
    .map(async (tournament) => {
      if(tournament.players.length > 0) {
        const existingDBTournament = await findTournamentByName(name);
        if(!existingDBTournament) {
          console.log('You need to create the tournament first, you d******s')
          throw "Cannot create players for a non existing tournament"
        }
        const teams = await findTeamInTournament(existingDBTournament.id);
        if(teams.length === 0) {
          console.log('You need to create the tournament teams first, you d******s')
          throw "Cannot create players for a tournament without teams"
        }
        const teamsByNameMap: {[k:string]: Team} = Object.fromEntries(
          teams.map(team => [team.name, team])
        )
        await Promise.all(tournament.players.map(async (player) => {
          const playerTeam = teamsByNameMap[player.team]
          if (!playerTeam) {
            console.log('Cannot find team for player', player, teamsByNameMap)
            return
          }
          const existingPlayer = await findPlayerByTeamAndTournament(existingDBTournament.id, playerTeam.id, player.name)
          if(existingPlayer) {
           return updatePlayer(existingPlayer.id, {
             ...existingPlayer,
             age_at_tournament: player.age,
             position: player.position
           })
          } else {
            const newPlayer: PlayerNew = {
              tournament_id: existingDBTournament.id,
              team_id: playerTeam.id,
              name: player.name,
              age_at_tournament: player.age,
              position: player.position
            }

            return createPlayer(newPlayer)
          }

        }))

        return 'All players created'
      }
    }))

  return result
}

export async function generateDbTournament(name: string, deletePrevious:boolean = false) {
  const result = await Promise.all(tournaments
    .filter(tournament => tournament.tournament_name === name)
    .map(async (tournament) => {
      const existingDBTournament = await findTournamentByName(name);
      console.log('torneo ya creado', existingDBTournament)
      try {
        if (existingDBTournament) {
          console.log('The tournament already exists')
          if (deletePrevious) {
            console.log('deleting tournament', tournament.tournament_name)
            await deleteDBTournamentTree(existingDBTournament)
            console.log('torneo borrado')
            return 'Primero lo borro'
          } else {
            return 'El torneo ya existe'
          }
        }

        //Create the tournament and get the id
        const {id: tournamentId} = await createTournament({
          short_name: tournament.tournament_short_name,
          long_name: tournament.tournament_name,
          theme: JSON.stringify(tournament.tournament_theme),
          is_active: true
        })

        //Get or create teams
        const teamMap: {
          [k: string]: string
        } = Object.fromEntries(await Promise.all(tournament.teams.map(async team => {
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
          return await createTournamentTeam({tournament_id: tournamentId, team_id: teamId})
        }))

        //Create groups
        const groupIdMap: {
          [k: string]: string
        } = Object.fromEntries(await Promise.all(tournament.groups.map(async group => {
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

        const playoffRoundMap: { [K: string]: string } = Object.fromEntries(await Promise.all(
          tournament.playoffs.map(async playoff => {
            const {id: playoffRoundId} = await createPlayoffRound({
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
        console.log('Creando los partidos', tournament.games.length)
        await Promise.all(tournament.games.map(async game => {
          console.log('Creando partido', game.game_number)
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
          if (game.group) {
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
          console.log('Partido', game.game_number, 'creado')
        }))
      } catch (e) {
        console.log(e)
        return 'El campeonato no pudo ser creado'
      }
      return 'El campeonato fue creado exitosamente'
    }))

  return result;
}
