'use client'

import {Backdrop, Box, CircularProgress} from "@mui/material";
import GroupBackoffice from "./group-backoffice-tab";
import {useEffect, useState} from "react";
import BackofficeTabs from "./backoffice-tabs";
import {ExtendedGroupData} from "../../definitions";
import PlayoffTab from "./playoff-tab";
import {getGroupDataWithGamesAndTeams} from "../../actions/backoffice-actions";

type Props = {
  tournamentId: string
}

export default function GroupsTab({tournamentId}:Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [groups, setGroups] = useState<ExtendedGroupData[]>()

  useEffect(() => {
    const loadGroups = async () => {
      const groupsData = await getGroupDataWithGamesAndTeams(tournamentId)
      setGroups(groupsData
        .sort((a, b) =>
          a.group_letter.localeCompare(b.group_letter)))
      setLoading(false)
    }
    loadGroups()
  }, [ tournamentId, setGroups, setLoading]);

  return (
    <Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {!loading && (
        <BackofficeTabs tabs={[
          ...(groups?.map(group => ({
              label: `Grupo ${group.group_letter}`,
              component: (
                <GroupBackoffice group={group} tournamentId={tournamentId}/>
              )
            })) || []),
          {
            label: 'Playoffs',
            component: (<PlayoffTab tournamentId={tournamentId}/>)
          }
        ]}/>
      )}
    </Box>
  )
}
