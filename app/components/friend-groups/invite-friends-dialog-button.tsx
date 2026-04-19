'use client'

import InviteFriendsDialog from "../invite-friends-dialog";
import {Button} from "@mui/material";
import {Share} from "@mui/icons-material";
import { useTranslations } from 'next-intl';

export const InviteFriendsDialogButton = ({groupId, groupName, tournamentId, groupLogoUrl, themeColor, hideEmailTab}: { groupId: string, groupName: string, tournamentId?: string, groupLogoUrl?: string, themeColor?: string, hideEmailTab?: boolean }) => {
  const t = useTranslations('groups.actions');

  return (
    <InviteFriendsDialog
      trigger={
        <Button variant={'contained'} color="primary" endIcon={<Share/>}>
          {t('inviteMore')}
        </Button>}
      groupId={groupId}
      groupName={groupName}
      tournamentId={tournamentId}
      groupLogoUrl={groupLogoUrl}
      themeColor={themeColor}
      hideEmailTab={hideEmailTab}/>
  )
}
