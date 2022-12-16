import {
  createRecord,
  getCurrentUserId,
  initThinBackend,
  ProdeGroup,
  ProdeGroupParticipant,
  query,
  User
} from "thin-backend";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Table, TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import {useEffect, useState} from "react";
import Image from "next/image";
import {Game, GameGuessDictionary} from "../../types/definitions";
import {
  calculateScoreForAwards,
  calculateScoreForGame,
  calculateScoreForGroupStageQualifiers, calculateScoreForHonorRoll, calculateScoreStatsForGames,
} from "../../utils/score-calculator";
import {
  applyResults,
  final,
  group_games,
  playoff_games,
  round_of_16,
  round_of_eight,
  semifinals,
  third_place
} from "../../data/group-data";


type ProdeGroupPageProps = {
  group: ProdeGroup,
  groupParticipants: ProdeGroupParticipant[],
  groupGames: Game[],
  playoffGames: Game[],
  final: Game,
  thirdPlace: Game
}

initThinBackend({ host: process.env.NEXT_PUBLIC_BACKEND_URL });

type UserScore = {
  user: User,
  groupStageScore: number,
  groupStageQualifiersScore: number,
  playoffScore: number,
  honorRollScore: number,
  totalPoints: number,
}

const ProdeGroupPage = ({ group, groupParticipants, groupGames, playoffGames, final, thirdPlace}: ProdeGroupPageProps) => {
  const [userScores, setUserScores] = useState<UserScore[]>([])
  const [orderBy, setOrderBy] = useState('');

  useEffect(() => {
    const getUserScores = async () => {
      const users = await query('users').whereIn('id', [group.ownerUserId, ...groupParticipants.map(participant => participant.userId)]).fetch();
      const allGroupGameGuesses = await query('game_guesses').whereIn('userId', users.map(user => user.id)).fetch();
      const guessesByUser: { [key: string]: GameGuessDictionary } = Object.fromEntries(users.map(user => [user.id, {}]));
      allGroupGameGuesses.forEach(gameGuess => {
        guessesByUser[gameGuess.userId][gameGuess.gameId] = gameGuess;
      })
      const userScores: UserScore[] = users.map(user => {
        const scoreStatsForGroupStageGames = calculateScoreStatsForGames(groupGames, guessesByUser[user.id]);
        const scoreForGroupStageQualifiers = calculateScoreForGroupStageQualifiers(groupGames, guessesByUser[user.id]);
        const scoreForPlayoffGames = calculateScoreStatsForGames(playoffGames, guessesByUser[user.id]);
        const honorRollScoreData = calculateScoreForHonorRoll(final, thirdPlace, user);
        const awardsScoreData = calculateScoreForAwards(user);
        return {
          user,
          groupStageScore: scoreStatsForGroupStageGames.totalPoints,
          groupStageQualifiersScore: scoreForGroupStageQualifiers,
          playoffScore: scoreForPlayoffGames.totalPoints,
          honorRollScore: honorRollScoreData.points,
          totalPoints: scoreStatsForGroupStageGames.totalPoints +
            scoreForPlayoffGames.totalPoints +
            scoreForGroupStageQualifiers +
            honorRollScoreData.points +
            awardsScoreData.points,
        }
      })
      setUserScores(userScores.sort((a, b) => (b.totalPoints - a.totalPoints)))
    };
    getUserScores();
  }, [group, groupParticipants])

  return (
    <Box p={2}>
      <Grid container spacing={2}>
        <Grid item>
          {group.name.toLowerCase() === 'welltech' && (
            <Image src={'/welltech-logo.jpeg'} alt={'Grupo Welltech'} height={60} width={150}/>
          )}
        </Grid>
        <Grid item>
          <Typography variant={'h2'}>
            {group.name}
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item>
          <Card>
            <CardHeader title='Tabla de Posiciones'/>
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>P</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Puntos Totales</TableCell>
                    <TableCell>Puntos Fase de Grupos</TableCell>
                    <TableCell>Puntos Playoffs</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userScores.map((userScore, index) => (
                    <TableRow key={userScore.user.id} selected={userScore.user.id === getCurrentUserId()}>
                      <TableCell>{index+1}</TableCell>
                      <TableCell sx={{
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        maxWidth: '140px'
                      }}>{userScore.user.nickname || userScore.user.email}</TableCell>
                      <TableCell>{userScore.totalPoints}</TableCell>
                      <TableCell>{userScore.groupStageScore}</TableCell>
                      <TableCell>{userScore.playoffScore}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export const getStaticPaths = async () => {
  const allGroups: ProdeGroup[] = await query('prode_groups').fetch();
  const newPaths = allGroups.map(params => ({ params: {
      group_id: params.id,
    }}));
  return {
    paths: [...newPaths],
    fallback: 'blocking',
  }
}

export const getStaticProps = async ({params}: {params: { group_id: string} }) => {
  await applyResults()
  const group: ProdeGroup = await query('prode_groups').where('id', params.group_id).fetchOne();
  const groupParticipants: ProdeGroupParticipant[] = await query('prode_group_participants').where('prodeGroupId', params.group_id).fetch();
  return {
    props: {
      group,
      groupParticipants,
      groupGames: group_games,
      playoffGames: playoff_games,
      roundOf16: round_of_16,
      roundOf8: round_of_eight,
      semifinals,
      thirdPlace: third_place,
      final
    },
    revalidate: 300,
  }
}

export default ProdeGroupPage
