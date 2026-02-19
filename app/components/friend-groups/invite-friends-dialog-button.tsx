'use client'

import InviteFriendsDialog from "../invite-friends-dialog";
import {Button} from "@mui/material";
import {Share} from "@mui/icons-material";
import { useTranslations } from 'next-intl';

export const InviteFriendsDialogButton = ({groupId, groupName}: { groupId: string, groupName: string }) => {
  const t = useTranslations('groups.actions');

  return (
    <InviteFriendsDialog
      trigger={
        <Button variant={'contained'} endIcon={<Share/>}>
          {t('inviteMore')}
        </Button>}
      groupId={groupId}
      groupName={groupName}/>
  )
}
