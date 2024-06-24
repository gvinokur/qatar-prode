'use client'

import {Tournament, User} from "../../db/tables-definition";
import {UserScore} from "../../definitions";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs, Typography, useMediaQuery,
} from "@mui/material";
import {useState} from "react";
import TabPanel from "../tab-panel";

type Props = {
  users: {[k:string]: User},
  userScoresByTournament: {[k:string]: UserScore[]},
  loggedInUser: string,
  tournaments: Tournament[]
}

export default function ProdeGroupTable({users, userScoresByTournament, loggedInUser, tournaments}: Props) {
  const [selectedTab, setSelectedTab] = useState<number>(0)
  const isNotExtraSmallScreen = useMediaQuery('(min-width:600px)')

  return (
    <Card>
      <CardHeader title='Tabla de Posiciones'/>
      <CardContent>
        <Tabs
          value={selectedTab}
          onChange={(event, tabSelected) => setSelectedTab(tabSelected)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="scrollable auto tabs example"
        >
          {tournaments.map(tournament=> (
            <Tab label={tournament.short_name} key={tournament.id}/>
          ))}
        </Tabs>
        {tournaments.map((tournament, index) => (
          <TabPanel index={index} value={selectedTab} key={tournament.id}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>P</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Puntos Totales</TableCell>
                  <TableCell>Fase de Grupos</TableCell>
                  {isNotExtraSmallScreen && <TableCell>Clasificados</TableCell>}
                  <TableCell>Playoffs</TableCell>
                  {isNotExtraSmallScreen && <TableCell>Posiciones</TableCell>}
                  {isNotExtraSmallScreen && <TableCell>Premios</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {userScoresByTournament[tournament.id]
                  .sort((usa, usb) => usb.totalPoints - usa.totalPoints)
                  .map((userScore, index) => (
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
                    {isNotExtraSmallScreen && <TableCell>{userScore.groupStageQualifiersScore}</TableCell>}
                    <TableCell>{userScore.playoffScore}</TableCell>
                    {isNotExtraSmallScreen && <TableCell>{userScore.honorRollScore}</TableCell>}
                    {isNotExtraSmallScreen && <TableCell>{userScore.individualAwardsScore}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabPanel>
        ))}
      </CardContent>
    </Card>
  )
}
