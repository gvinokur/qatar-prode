"use client";

import {ProdeGroup, Tournament} from "../../db/tables-definition";
import {Box, Card, CardContent, CardHeader, Grid, Typography, useTheme, alpha} from "@mui/material";
import {Fragment} from "react";
import Rules from "../tournament-page/rules";
import FriendGroupsList from "../tournament-page/friend-groups-list";
import Link from "next/link";
import { DevTournamentBadge } from "../common/dev-tournament-badge";
import { useLocale, useTranslations } from 'next-intl';
import { ScrollShadowContainer } from '../common/scroll-shadow-container';

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
  const t = useTranslations('common')

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 2, height: '100%' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Left column: Available Tournaments (alpha 0.06) */}
        <Grid
          size={{
            xs: 12,
            md: 9
          }}
          sx={{ height: { xs: 'auto', md: '100%' } }}
        >
          <Box sx={{
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
            borderRadius: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <ScrollShadowContainer
              direction="vertical"
              hideScrollbar={true}
              sx={{ flex: 1, minHeight: 0 }}
              scrollContainerSx={{ pt: 2, pb: { xs: '56px', md: 2 }, px: 2 }}
            >
              <Card>
                <CardHeader
                  title={t('home.availableTournaments')}
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
            </ScrollShadowContainer>
          </Box>
        </Grid>

        {/* Right column: Sidebar (alpha 0.04) */}
        <Grid
          size={{
            xs: 12,
            md: 3
          }}
          sx={{ height: { xs: 'auto', md: '100%' } }}
        >
          <Box sx={{
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
            borderRadius: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <ScrollShadowContainer
              direction="vertical"
              hideScrollbar={true}
              sx={{ flex: 1, minHeight: 0 }}
              scrollContainerSx={{ pt: 2, pb: { xs: '56px', md: 2 }, px: 2 }}
            >
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
            </ScrollShadowContainer>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
