'use client'

import {Box} from "../mui-wrappers";
import {
  Autocomplete,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  TextField,
  Typography
} from "@mui/material";
import { Fragment, useEffect, useState} from "react";
import { useLocale } from 'next-intl';
import { toLocale } from '../../utils/locale-utils';
import {awardsDefinition, AwardTypes} from "../../utils/award-utils";
import { TournamentUpdate} from "../../db/tables-definition";
import {ExtendedPlayerData} from "../../definitions";
import {findDataForAwards, updateTournamentAwards} from "../../actions/backoffice-actions";
import { BackofficeTabsSkeleton } from "../skeletons";

type Props = {
  readonly tournamentId: string
}
export default function BackofficeAwardsTab({ tournamentId}: Props) {
  const locale = toLocale(useLocale());
  const [saving, setSaving] = useState<boolean>(false)
  const [tournament, setTournament] = useState<TournamentUpdate | undefined>()
  const [players, setPlayers] = useState<ExtendedPlayerData[]>([])

  useEffect(() => {
    const fetchTournamentData = async () => {
      const {tournamentUpdate, players} = await findDataForAwards(tournamentId)
      setTournament(tournamentUpdate)
      setPlayers(players)
    }
    fetchTournamentData()
  }, [tournamentId, setTournament])

  const handleTournamentChange =
    (property: AwardTypes) =>
      (_: any, player: ExtendedPlayerData | null) => {
        setTournament({
          ...tournament,
          [property]: player?.id
        })
      }

  const saveTournament = async () => {
    setSaving(true)
    if(tournament) {
      await updateTournamentAwards(tournamentId, tournament, locale)
    }
    setSaving(false)
  }

  return (
    <Box pt={2}>
      {tournament ? (
        <>
          <Card sx={{ maxWidth: '900px', mr: 'auto', ml: 'auto'}}>
            <CardHeader title={'Premios Individuales'}/>
            <CardContent>
              <Grid container spacing={2}>
                {awardsDefinition.map(awardDefinition => (
                  <Fragment key={awardDefinition.property}>
                    <Grid
                      flexDirection={'column'}
                      justifyContent={'center'}
                      alignContent={'center'}
                      display={'flex'}
                      size={5}>
                      <Typography
                        variant={"h6"}
                        sx={{
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden'
                        }}>
                        {awardDefinition.label}</Typography>
                    </Grid>
                    <Grid size={7}>
                      <Autocomplete
                        id='best-player-autocomplete'
                        options={players
                          .filter(awardDefinition.playerFilter)
                          .sort((a, b) =>
                            a.team.name.localeCompare(b.team.name))
                        }
                        groupBy={(option) => option.team.name}
                        autoHighlight
                        getOptionLabel={(option) => option.name}
                        value={players.find(player => player.id === tournament[awardDefinition.property])}
                        onChange={handleTournamentChange(awardDefinition.property)}
                        renderOption={(props, option) => (
                          <Box component='li' {...props}>
                            {option.name} - {option.team.short_name}
                          </Box>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Elegir Jugador"
                            slotProps={{
                              htmlInput: {
                                ...params.inputProps,
                              }
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Fragment>
                ))}
              </Grid>
            </CardContent>
          </Card>
          <Button loading={saving} variant='contained' size='large' onClick={saveTournament} sx={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translate(-50%, 0)' }}>Guardar Premios</Button>
        </>
      ) : (
        <BackofficeTabsSkeleton />
      )}
    </Box>
  );
}
