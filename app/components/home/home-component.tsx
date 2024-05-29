"use client";

import {Tournament} from "../../db/tables-definition";
import {Card, CardContent, CardHeader, Grid, Link, Typography, useTheme} from "@mui/material";
import {Fragment} from "react";

type HomeProps = {
  tournaments: Tournament[]
}

export default function Home({tournaments} : HomeProps) {
  const theme = useTheme()

  return (
    <>
      <Grid container spacing={2} p={2}>
        <Grid item xs={12} md={4}>
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
      </Grid>
    </>
  );
}
