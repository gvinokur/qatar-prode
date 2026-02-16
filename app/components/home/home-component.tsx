"use client";

import {ProdeGroup, Tournament} from "../../db/tables-definition";
import {Box, Card, CardContent, CardHeader, Grid, Typography, useTheme} from "@mui/material";
import {Fragment} from "react";
import Rules from "../tournament-page/rules";
import FriendGroupsList from "../tournament-page/friend-groups-list";
import Link from "next/link";
import { DevTournamentBadge } from "../common/dev-tournament-badge";
import { useLocale } from 'next-intl';

type HomeProps = {
  tournaments: Tournament[]
  groups?: {
    userGroups: ProdeGroup[]
    participantGroups: ProdeGroup[]
  }
}

export default function Home({tournaments, groups} : HomeProps) {
  const theme = useTheme()
  const locale = useLocale()

  return (
    <Grid container spacing={2} p={2} maxWidth={'1000px'} mx={'auto'}>
      <Grid
        size={{
          xs: 12,
          md: 8
        }}>
        <Card>
          <CardHeader
            title={'Torneos Disponibles'}
            sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
            />
          <CardContent>
            <Grid container spacing={1}>
              {tournaments.map(tournament => (
                <Fragment key={tournament.id}>
                  <Grid size={12}>
                    <Link href={`/${locale}/tournaments/${tournament.id}`}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {tournament.dev_only && <DevTournamentBadge />}
                        <Typography
                        variant={'h6'}
                          sx={{
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden'
                          }}>
                          {tournament.long_name}
                        </Typography>
                      </Box>
                    </Link>
                  </Grid>
                </Fragment>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid
        size={{
          xs: 12,
          md: 4
        }}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Rules expanded={false}/>
          </Grid>
          {!!groups && (
            <Grid size={12}>
              <FriendGroupsList userGroups={groups.userGroups} participantGroups={groups.participantGroups}/>
            </Grid>
          )}
        </Grid>
      </Grid>

    </Grid>
  );
}
