'use client'

import InviteFriendsDialog from "../invite-friends-dialog";
import {Button} from "@mui/material";
import {Share} from "@mui/icons-material";

export const InviteFriendsDialogButton = ({groupId, groupName}: { groupId: string, groupName: string }) => {

  return (
    <InviteFriendsDialog
      trigger={
        <Button variant={'contained'} endIcon={<Share/>}>
          Invitar mas amigos
        </Button>}
      groupId={groupId}
      groupName={groupName}/>
  )
}
