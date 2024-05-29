'use server'

import {
  addGroupToTournament, addParticipantToGroup,
  createProdeGroup, deleteAllParticipantsFromGroup, deleteGroupFromAllTournaments, deleteProdeGroup, findProdeGroupById,
  findProdeGroupsByOwner,
  findProdeGroupsByParticipant
} from "../db/prode-group-repository";
import {getLoggedInUser} from "./user-actions";

export async function createGroupInTournament( tournamentId: string, groupName: string) {
  const user = await getLoggedInUser()
  if(!user) {
    throw 'Should not call this action from a logged out page'
  }
  const prodeGroup = await createProdeGroup({
    name: groupName,
    owner_user_id: user.id
  })

  await addGroupToTournament(prodeGroup.id, tournamentId)

  return prodeGroup;
}

export async function getGroupsForUser() {
  const user = await getLoggedInUser()
  if(!user) {
    throw 'Should not call this action from a logged out page'
  }
  const userGroups = await findProdeGroupsByOwner(user.id)
  const participantGroups = await findProdeGroupsByParticipant(user.id)

  return ({
    userGroups,
    participantGroups
  })
}

export async function deleteGroup(groupId: string) {
  const user = await getLoggedInUser()
  if(!user) {
    throw 'Should not call this action from a logged out page'
  }
  const group = await findProdeGroupById(groupId)
  //Only support deletion  of the group if the user in the session is the same as the owner
  if(user && user.id === group.owner_user_id) {
    await deleteGroupFromAllTournaments(groupId)
    await deleteAllParticipantsFromGroup(groupId)
    await deleteProdeGroup(groupId);
  }
}

export async function joinGroup(groupId: string) {
  const user = await getLoggedInUser();
  if(!user) {
    throw 'Should not call this action from a logged out page'
  }
  const group = await findProdeGroupById(groupId)

  await addParticipantToGroup(group, user)

  return group
}
