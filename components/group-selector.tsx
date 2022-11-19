import {Fab, Grid, MenuItem, Select, SelectChangeEvent, useMediaQuery} from "@mui/material";

import {useRouter} from "next/router";

const GroupSelector = ({group} : {group?: string}) => {
  const router = useRouter()
  const xsMatch = useMediaQuery('(min-width:900px)')

  const handleOptionChange = (e: SelectChangeEvent<string>) => {
    if (e.target.value === 'playoffs') {
      router.push('/predictions/playoffs')
    } else if (e.target.value === 'individual_awards') {
      router.push('/predictions/awards')
    } else {
      router.push(`/predictions/groups/group-${e.target.value.charAt(e.target.value.length - 1).toLowerCase()}`)
    }
  }

  return xsMatch ? (
    <Grid container justifyContent={'space-around'} spacing={2}>
      {[ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(groupLetter => (
        <Grid item key={groupLetter}>
          <Fab variant='extended' color={group === `Group ${groupLetter.toUpperCase()}` ? 'primary' : 'secondary'} href={`/predictions/groups/group-${groupLetter}`}>
            Group {groupLetter.toUpperCase()}
          </Fab>
        </Grid>
      ))}
      <Grid item>
        <Fab color={!group ? 'primary' : 'secondary'} variant={'extended'} href={'/predictions/playoffs'}>Playoffs</Fab>
      </Grid>
      <Grid item>
        <Fab color={group === 'individual_awards' ? 'primary' : 'secondary'} variant={'extended'} href={'/predictions/awards'}>Premios</Fab>
      </Grid>
    </Grid>
  ) : (
    <Select sx={{ width: '100%'}} value={group || 'playoffs'} onChange={handleOptionChange}>
      {[ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(groupLetter => (
        <MenuItem key={groupLetter} value={`Group ${groupLetter.toUpperCase()}`}>Group {groupLetter.toUpperCase()}</MenuItem>
      ))}
      <MenuItem value='playoffs'>Playoffs</MenuItem>
      <MenuItem value='individual_awards'>Premios</MenuItem>
    </Select>
  )
}

export default GroupSelector;
