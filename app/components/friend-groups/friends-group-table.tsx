'use client'

import {User} from "../../db/tables-definition";
import {UserScore} from "../../definitions";
import {Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableRow} from "@mui/material";

type Props = {
  users: {[k:string]: User},
  userScores: UserScore[],
  loggedInUser: string
}

export default function ProdeGroupTable({users, userScores, loggedInUser}: Props) {
  return (
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
              <TableRow key={userScore.userId} selected={userScore.userId === loggedInUser}>
                <TableCell>{index+1}</TableCell>
                <TableCell sx={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  maxWidth: '140px'
                }}>{users[userScore.userId]?.nickname || users[userScore.userId]?.email}</TableCell>
                <TableCell>{userScore.totalPoints}</TableCell>
                <TableCell>{userScore.groupStageScore}</TableCell>
                <TableCell>{userScore.playoffScore}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
