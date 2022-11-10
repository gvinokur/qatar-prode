import {Fab, Grid} from "@mui/material";

const GroupSelector = ({group} : {group?: string}) => (
  <Grid container alignItems={'space-around'}>
    {[ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(groupLetter => (
      <Grid item key={groupLetter}>
        <Fab variant='extended' color={group === `Group {groupLetter.toUpperCase()}` ? 'primary' : 'secondary'} href={`/predictions/groups/group-${groupLetter}`}>
          Group {groupLetter.toUpperCase()}
        </Fab>
      </Grid>
      ))}
    <Grid item>
      <Fab color={!group ? 'primary' : 'secondary'} variant={'extended'} href={`/predictions/playoffs`}>Playoffs</Fab>
    </Grid>
  </Grid>
)

export default GroupSelector;
