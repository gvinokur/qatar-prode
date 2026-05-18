'use client'

import {Box} from "@mui/material";
import GroupBackoffice from "./group-backoffice-tab";
import {useEffect, useState} from "react";
import {BackofficeTabs} from "./backoffice-tabs";
import {ExtendedGroupData} from "../../definitions";
import PlayoffTab from "./playoff-tab";
import {getGroupDataWithGamesAndTeams} from "../../actions/backoffice-actions";
import {createTab} from "./backoffice-tab-utils";
import { BackofficeTabsSkeleton } from "../skeletons";
import type { TiebreakerMode } from "../../db/tables-definition";

type Props = {
  tournamentId: string
}

export default function GroupsTab({tournamentId}:Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [groups, setGroups] = useState<ExtendedGroupData[]>()
  const [tiebreakerMode, setTiebreakerMode] = useState<TiebreakerMode>('standard')

  useEffect(() => {
    const loadGroups = async () => {
      const { groups: groupsData, tiebreakerMode: mode } = await getGroupDataWithGamesAndTeams(tournamentId)
      setGroups(groupsData
        .toSorted((a, b) =>
          a.group_letter.localeCompare(b.group_letter)))
      setTiebreakerMode(mode)
      setLoading(false)
    }
    loadGroups()
  }, [ tournamentId, setGroups, setLoading]);

  return (
    <Box>
      {loading ? (
        <BackofficeTabsSkeleton />
      ) : (
        <BackofficeTabs tabIdParam="group" tabs={[
          ...(groups || []).map(group =>
              createTab(
                `Grupo ${group.group_letter}`,
                (<GroupBackoffice group={group} tournamentId={tournamentId} tiebreakerMode={tiebreakerMode}/>))
          ),
          createTab('Playoffs', (<PlayoffTab tournamentId={tournamentId}/>))
        ]}/>
      )}
    </Box>
  )
}
