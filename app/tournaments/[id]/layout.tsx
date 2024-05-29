'use server'

import {Grid} from "../../components/mui-wrappers";
import GroupSelector from "../../components/groups-page/group-selector";
import {getTournamentAndGroupsData} from "../../actions/tournament-actions";

type Props = {
  params: {
    id: string
  }
  searchParams: {[k:string]:string}
  children: React.ReactNode
}

 export default async function TournamentLayout({children, params}: Props) {
  const layoutData = await getTournamentAndGroupsData(params.id)

  return (
    <Grid container xs={12}>
      <Grid item xs={12} md={3} pt={2} pb={1} pl={2} sx={{
        backgroundColor: layoutData.tournament?.theme?.primary_color
      }}>
        <img src={layoutData.tournament?.theme?.logo || ''}/>
      </Grid>
      <Grid item xs={12} md={9} pt={2} pb={1} pl={1} pr={1} sx={{
        backgroundColor: layoutData.tournament?.theme?.primary_color
      }}>
        <GroupSelector
          tournamentId={params.id}
          groups={layoutData.allGroups
            .sort((a, b) => a.group_letter.localeCompare(b.group_letter))
          }/>
      </Grid>
      <Grid item xs={12} ml={2} mr={2} mb={2}>{children}</Grid>
    </Grid>
  )
 }
