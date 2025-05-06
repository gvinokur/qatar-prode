'use client'

import {Fab, Grid, MenuItem, Select, SelectChangeEvent, useTheme} from "@mui/material";

import {usePathname, useRouter} from "next/navigation";
import {resolveRelativeUrl} from "next/dist/lib/metadata/resolvers/resolve-url";

type Props = {
  groups: { group_letter: string, id: string}[]
  tournamentId: string
}

const GroupSelector = ({groups, tournamentId} : Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()

  const getGroupId = (pathname: string) => {
    const regex = new RegExp('([^/]+)/?$')
    const result = regex.exec(pathname) || []
    if(result?.length > 1) {
      return result[1]
    }
  }

  const selected = pathname && (
    pathname.match('groups') ? getGroupId(pathname) :
      (pathname.match('playoffs') ? 'playoffs' :
          (pathname.match('awards') ? 'individual_awards' : ''))
  )

  const getUrl = (url: string) => `/tournaments/${tournamentId}/${url}`
  const handleOptionChange = (e: SelectChangeEvent<string>) => {
    if (e.target.value === 'playoffs') {
      router.push(getUrl('playoffs'))
    } else if (e.target.value === 'individual_awards') {
      router.push(getUrl('awards'))
    } else {
      router.push(getUrl(`groups/${e.target.value}`))
    }
  }

  return (
    <>
      <Grid container justifyContent={'space-around'} spacing={2}
            sx={{ display: { xs: 'none', md: 'flex'}}}>
        {groups.map(({group_letter, id}) => (
          <Grid key={id}>
            <Fab variant='extended' color={selected === id ? 'primary' : 'secondary'} href={getUrl(`groups/${id}`)}>
              Grupo {group_letter.toUpperCase()}
            </Fab>
          </Grid>
        ))}
        <Grid>
          <Fab color={selected === 'playoffs' ? 'primary' : 'secondary'} variant={'extended'} href={getUrl('playoffs')}>Playoffs</Fab>
        </Grid>
        <Grid>
          <Fab color={selected === 'individual_awards' ? 'primary' : 'secondary'} variant={'extended'} href={getUrl('awards')}>Premios</Fab>
        </Grid>
      </Grid>
      <Select
        value={selected} onChange={handleOptionChange}
        sx={{
          width: '100%',
          display: { xs: 'flex', md: 'none'},
          backgroundColor: theme.palette.background.paper,
      }} >
        {groups.map(({group_letter, id})  => (
          <MenuItem key={group_letter} value={id}>Grupo {group_letter.toUpperCase()}</MenuItem>
        ))}
        <MenuItem value='playoffs'>Playoffs</MenuItem>
        <MenuItem value='individual_awards'>Premios</MenuItem>
      </Select>
    </>
  );
}

export default GroupSelector;
