"use client";

import {ProdeGroup, Tournament} from "../../db/tables-definition";
import {Card, CardContent, CardHeader, Grid, Link, Typography, useTheme} from "@mui/material";
import {Fragment} from "react";
import Rules from "../tournament-page/rules";
import FriendGroupsList from "../tournament-page/friend-groups-list";

type HomeProps = {
  tournaments: Tournament[]
  groups?: {
    userGroups: ProdeGroup[]
    participantGroups: ProdeGroup[]
  }
}

export default function Home({tournaments, groups} : HomeProps) {
  const theme = useTheme()

  const panels = !!groups ? 3 : 2;

  return (
    <>
      <Grid container spacing={2} p={2}>
        <Grid item xs={12} md={12/panels}>
          <Card>
            <CardHeader
              title={'Torneos Disponibles'}
              sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
              />
            <CardContent>
              <Grid container spacing={1}>
                {tournaments.map(tournament => (
                  <Fragment key={tournament.id}>
                    <Grid item xs={12}>
                      <Link href={`/tournaments/${tournament.id}`} variant={'h6'}

                                  sx={{
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden'
                                  }}>
                        {tournament.long_name}
                      </Link>
                    </Grid>
                  </Fragment>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        {!!groups && (
          <Grid item xs={12} md={12/panels}>
            <FriendGroupsList userGroups={groups.userGroups} participantGroups={groups.participantGroups}/>
          </Grid>
        )}
        <Grid item xs={12} md={12/panels}>
          <Rules/>
        </Grid>
      </Grid>
    </>
  );
}
