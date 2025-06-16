'use server'

import {
  addParticipantToGroup,
  createProdeGroup,
  deleteAllParticipantsFromGroup,
  deleteProdeGroup,
  findProdeGroupById,
  findProdeGroupsByOwner,
  findProdeGroupsByParticipant,
  updateProdeGroup,
  deleteParticipantFromGroup,
  updateParticipantAdminStatus
} from "../db/prode-group-repository";
import {getLoggedInUser} from "./user-actions";
import {z} from "zod";
import {ProdeGroup} from "../db/tables-definition";
import {createS3Client, deleteThemeLogoFromS3, getS3KeyFromURL} from "./s3";
import { getGameGuessStatisticsForUsers } from '../db/game-guess-repository';
import { findTournamentGuessByUserIdsTournament } from '../db/tournament-guess-repository';
import { customToMap } from "../utils/ObjectUtils";
import { UserScore } from "../definitions";

export async function createDbGroup( groupName: string) {
  const user = await getLoggedInUser()
  if(!user) {
    throw 'Should not call this action from a logged out page'
  }
  const prodeGroup = await createProdeGroup({
    name: groupName,
    owner_user_id: user.id
  })

  return prodeGroup;
}

export async function getGroupsForUser() {
  const user = await getLoggedInUser()
  if(!user) {
    return
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
    await deleteAllParticipantsFromGroup(groupId)
    await deleteProdeGroup(groupId);
  }
}

export async function promoteParticipantToAdmin(groupId: string, userId: string) {
  const user = await getLoggedInUser();
  if (!user) throw 'Should not call this action from a logged out page';
  // Only owner or current admin can promote
  const group = await findProdeGroupById(groupId);
  if (user.id !== group.owner_user_id) throw 'Only owner can promote admins';
  await updateParticipantAdminStatus(groupId, userId, true);
}

export async function demoteParticipantFromAdmin(groupId: string, userId: string) {
  const user = await getLoggedInUser();
  if (!user) throw 'Should not call this action from a logged out page';
  // Only owner or current admin can demote
  const group = await findProdeGroupById(groupId);
  if (user.id !== group.owner_user_id) throw 'Only owner can demote admins';
  await updateParticipantAdminStatus(groupId, userId, false);
}

export async function joinGroup(groupId: string, isAdmin: boolean = false) {
  const user = await getLoggedInUser();
  if(!user) {
    throw 'Should not call this action from a logged out page'
  }
  const group = await findProdeGroupById(groupId)

  await addParticipantToGroup(group, user, isAdmin)

  return group
}

const MAX_FILE_SIZE = 5000000;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// VALIDATE IMAGE WITH ZOD
const imageSchema = z.object({
  image: z
    .any()
    .refine((file: File) => {
      if (file.size === 0 || file.name === undefined) return false;
      else return true;
    }, "Please update or add new image.")

    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    )
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`),
});


export async function updateTheme(groupId: string, formData: any) {
  const currentGroup = await findProdeGroupById(groupId)
  const data = Object.fromEntries(formData)
  let imageUrl: string | undefined = currentGroup.theme?.logo
  let imageKey: string | undefined = currentGroup.theme?.s3_logo_key
  if (data.logo) {
    const validatedFields = imageSchema.safeParse({
      image: data.logo
    })
    console.log(validatedFields)
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Invalid Image",
      };
    }
    try {
      const s3 = createS3Client('prode-group-files')
      await deleteThemeLogoFromS3(currentGroup.theme)
      const res = await s3.uploadFile(Buffer.from(await data.logo.arrayBuffer()));
      console.log(res)
      imageUrl = res.location
      imageKey = res.key
    } catch (e) {
      console.log(e)
      return "Image Upload failed"
    }
  }


  return updateProdeGroup(groupId, {
    ...(data.nombre ? { name: data.nombre } : {}),
    theme: JSON.stringify({
      primary_color: data.primary_color,
      secondary_color: data.secondary_color,
      logo: imageUrl,
      is_s3_logo: true,
      s3_logo_key: imageKey
    })
  })
}

export async function leaveGroupAction(groupId: string) {
  const user = await getLoggedInUser();
  if (!user) {
    throw 'No puedes dejar el grupo si no has iniciado sesión.';
  }
  const group = await findProdeGroupById(groupId);
  if (!group) {
    throw 'El grupo no existe.';
  }
  if (group.owner_user_id === user.id) {
    throw 'El dueño del grupo no puede dejar el grupo.';
  }
  await deleteParticipantFromGroup(groupId, user.id);
  return { success: true };
}

export async function getUserScoresForTournament(userIds: string[], tournamentId: string): Promise<UserScore[]> {
  const allUsersGameStatics = await getGameGuessStatisticsForUsers(userIds, tournamentId);
  const allUserTournamentGuesses = await findTournamentGuessByUserIdsTournament(userIds, tournamentId);
  const gameStatisticsByUserIdMap = customToMap(allUsersGameStatics, (userGameStatistics) => userGameStatistics.user_id);
  const tournamentGuessesByUserIdMap = customToMap(allUserTournamentGuesses, (userTournamentGuess) => userTournamentGuess.user_id);

  return userIds.map(userId => ({
    userId,
    groupStageScore: gameStatisticsByUserIdMap[userId]?.group_score || 0,
    groupStageQualifiersScore: tournamentGuessesByUserIdMap[userId]?.qualified_teams_score || 0,
    playoffScore: gameStatisticsByUserIdMap[userId]?.playoff_score || 0,
    honorRollScore: tournamentGuessesByUserIdMap[userId]?.honor_roll_score || 0,
    individualAwardsScore: tournamentGuessesByUserIdMap[userId]?.individual_awards_score || 0,
    groupPositionScore: tournamentGuessesByUserIdMap[userId]?.group_position_score || 0,
    totalPoints:
      (gameStatisticsByUserIdMap[userId]?.total_score || 0) +
      (tournamentGuessesByUserIdMap[userId]?.qualified_teams_score || 0) +
      (tournamentGuessesByUserIdMap[userId]?.honor_roll_score || 0) +
      (tournamentGuessesByUserIdMap[userId]?.individual_awards_score || 0) +
      (tournamentGuessesByUserIdMap[userId]?.group_position_score || 0)
  })) as UserScore[];
}
