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
  updateParticipantAdminStatus,
  findParticipantsInGroup,
  updateGroupPrivacy,
  getGroupTournamentBettingConfig
} from "../db/prode-group-repository";
import {getLoggedInUser} from "./user-actions";
import { findJoinRequestsByUser } from "../db/prode-group-join-request-repository";
import { generateShortUrlForGroup, buildShortUrl } from "./short-url-actions";
import { generateGroupInvitationEmail } from "../utils/email-templates";
import { sendEmail } from "../utils/email";
import {z} from "zod";
import {createS3Client, deleteThemeLogoFromS3} from "./s3";
import { getGameGuessStatisticsForUsers, getBoostStatsForUsersInTournament } from '../db/game-guess-repository';
import { findTournamentGuessByUserIdsTournament } from '../db/tournament-guess-repository';
import { customToMap } from "../utils/ObjectUtils";
import { TournamentGroupStats, UserScore } from "../definitions";
import { findUsersByIds } from "../db/users-repository";
import { getFavoriteGroupIds } from "../db/favorite-groups-repository";

export async function createDbGroup( groupName: string) {
  const user = await getLoggedInUser()
  if(!user) {
    throw new Error('Should not call this action from a logged out page')
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
  const [userGroups, participantGroups, pendingRequests, favoriteGroupIds] = await Promise.all([
    findProdeGroupsByOwner(user.id),
    findProdeGroupsByParticipant(user.id),
    findJoinRequestsByUser(user.id, 'pending'),
    getFavoriteGroupIds(user.id),
  ])

  return ({
    userGroups,
    participantGroups,
    pendingRequests: pendingRequests.map(r => ({
      id: r.id,
      group_id: r.group_id,
      group_name: r.group_name
    })),
    favoriteGroupIds,
  })
}

export async function deleteGroup(groupId: string) {
  const user = await getLoggedInUser()
  if(!user) {
    throw new Error('Should not call this action from a logged out page')
  }
  const group = await findProdeGroupById(groupId)
  //Only support deletion  of the group if the user in the session is the same as the owner
  if(user && group && user.id === group.owner_user_id) {
    await deleteAllParticipantsFromGroup(groupId)
    await deleteProdeGroup(groupId);
  }
}

export async function promoteParticipantToAdmin(groupId: string, userId: string) {
  const user = await getLoggedInUser();
  if (!user) throw new Error('Should not call this action from a logged out page');
  // Only owner or current admin can promote
  const group = await findProdeGroupById(groupId);
  if (!group) throw new Error('Group not found');
  if (user.id !== group.owner_user_id) throw new Error('Only owner can promote admins');
  await updateParticipantAdminStatus(groupId, userId, true);
}

export async function demoteParticipantFromAdmin(groupId: string, userId: string) {
  const user = await getLoggedInUser();
  if (!user) throw new Error('Should not call this action from a logged out page');
  // Only owner or current admin can demote
  const group = await findProdeGroupById(groupId);
  if (!group) throw new Error('Group not found');
  if (user.id !== group.owner_user_id) throw new Error('Only owner can demote admins');
  await updateParticipantAdminStatus(groupId, userId, false);
}

/**
 * @deprecated Use requestToJoinGroup from prode-group-join-request-actions.ts instead
 * Auto-join has been replaced with request/approval workflow
 */
export async function joinGroup(groupId: string, isAdmin: boolean = false) {
  const user = await getLoggedInUser();
  if(!user) {
    throw new Error('Should not call this action from a logged out page')
  }
  const group = await findProdeGroupById(groupId)
  if (!group) throw new Error('Group not found');

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
  if (!currentGroup) throw new Error('Group not found');
  
  const data = Object.fromEntries(formData)
  let imageUrl: string | undefined = currentGroup.theme?.logo
  let imageKey: string | undefined = currentGroup.theme?.s3_logo_key
  if (data.logo) {
    const validatedFields = imageSchema.safeParse({
      image: data.logo
    })
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
      imageUrl = res.location
      imageKey = res.key
    } catch (error) {
      console.error('Error uploading logo:', error);
      
      // Check if error is related to body size limit
      if (error instanceof Error && error.message.includes('Body exceeded')) {
        return "Logo file is too large. Maximum file size allowed is 5MB. Please choose a smaller image file."
      }
      
      return "Image Upload failed. Please try again with a smaller file."
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

const privacySchema = z.object({
  isPublic: z.boolean(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional()
}).refine(
  (data) => !data.isPublic || (data.description && data.description.trim().length > 0),
  { message: 'Description is required for public groups', path: ['description'] }
);

/**
 * Update group privacy settings (owner or admin only)
 */
export async function updateGroupPrivacyAction(
  groupId: string,
  isPublic: boolean,
  description?: string
): Promise<{ success: true } | { error: string }> {
  const user = await getLoggedInUser();
  if (!user) {
    return { error: 'You must be logged in' };
  }

  const group = await findProdeGroupById(groupId);
  if (!group) {
    return { error: 'Group not found' };
  }

  // Check owner or admin access
  const participants = await findParticipantsInGroup(groupId);
  const isOwner = group.owner_user_id === user.id;
  const participantRecord = participants.find(p => p.user_id === user.id);
  const isAdmin = isOwner || !!participantRecord?.is_admin;

  if (!isAdmin) {
    return { error: 'Only group owner or admin can change privacy settings' };
  }

  const validation = privacySchema.safeParse({ isPublic, description });
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return { error: firstError.message };
  }

  await updateGroupPrivacy(groupId, isPublic, description?.trim() || null);
  return { success: true };
}

export async function leaveGroupAction(groupId: string) {
  const user = await getLoggedInUser();
  if (!user) {
    throw new Error('No puedes dejar el grupo si no has iniciado sesión.');
  }
  const group = await findProdeGroupById(groupId);
  if (!group) {
    throw new Error('El grupo no existe.');
  }
  if (group.owner_user_id === user.id) {
    throw new Error('El dueño del grupo no puede dejar el grupo.');
  }
  await deleteParticipantFromGroup(groupId, user.id);
  return { success: true };
}

export async function getUsersForGroup(groupId: string): Promise<string[]> {
  const group = await findProdeGroupById(groupId);
  if (!group) {
    throw new Error('El grupo no existe.');
  }
  return [group.owner_user_id, ...(await findParticipantsInGroup(group.id)).map((p) => p.user_id)];
}

export async function getUserScoresForTournament(userIds: string[], tournamentId: string): Promise<UserScore[]> {
  const [allUsersGameStatics, allUserTournamentGuesses, boostStats] = await Promise.all([
    getGameGuessStatisticsForUsers(userIds, tournamentId),
    findTournamentGuessByUserIdsTournament(userIds, tournamentId),
    getBoostStatsForUsersInTournament(userIds, tournamentId),
  ]);
  const gameStatisticsByUserIdMap = customToMap(allUsersGameStatics, (userGameStatistics) => userGameStatistics.user_id);
  const tournamentGuessesByUserIdMap = customToMap(allUserTournamentGuesses, (userTournamentGuess) => userTournamentGuess.user_id);
  const boostStatsByUserIdMap = customToMap(boostStats, (s) => s.user_id);

  return userIds.map(userId => {
    const gameStats = gameStatisticsByUserIdMap[userId];
    const tournamentGuess = tournamentGuessesByUserIdMap[userId];
    const boostStat = boostStatsByUserIdMap[userId];

    return {
      userId,
      groupStageScore: gameStats?.group_score || 0,
      groupStageQualifiersScore: tournamentGuess?.qualified_teams_score || 0,
      playoffScore: gameStats?.playoff_score || 0,
      honorRollScore: tournamentGuess?.honor_roll_score || 0,
      individualAwardsScore: tournamentGuess?.individual_awards_score || 0,
      groupPositionScore: tournamentGuess?.group_position_score || 0,
      groupBoostBonus: gameStats?.group_boost_bonus || 0,
      playoffBoostBonus: gameStats?.playoff_boost_bonus || 0,
      totalBoostBonus: gameStats?.total_boost_bonus || 0,
      totalPoints:
        (gameStats?.total_score || 0) +
        (gameStats?.total_boost_bonus || 0) +
        (tournamentGuess?.qualified_teams_score || 0) +
        (tournamentGuess?.honor_roll_score || 0) +
        (tournamentGuess?.individual_awards_score || 0) +
        (tournamentGuess?.group_position_score || 0),
      totalExactGuesses: tournamentGuess?.total_exact_guesses || 0,
      totalCorrectGuesses: tournamentGuess?.total_correct_guesses || 0,
      qualifiedTeamsCorrect: tournamentGuess?.qualified_teams_correct || 0,
      boostsUsed: boostStat?.boosts_used || 0,
      scoredBoosts: boostStat?.scored_boosts || 0,
    };
  }) as UserScore[];
}

/**
 * Calculate tournament-specific statistics for a friend group
 * @param groupId - Friend group ID
 * @param tournamentId - Tournament ID
 * @param userId - Current user ID
 * @returns TournamentGroupStats with position, points, leader info
 */
export async function calculateTournamentGroupStats(
  groupId: string,
  tournamentId: string,
  userId: string
): Promise<TournamentGroupStats> {
  // Get group info
  const group = await findProdeGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Get all participants (owner + participants)
  const participants = await findParticipantsInGroup(groupId);
  const userIds = [group.owner_user_id, ...participants.map(p => p.user_id)];

  // Get tournament scores and betting config in parallel
  const [scores, bettingConfig] = await Promise.all([
    getUserScoresForTournament(userIds, tournamentId),
    getGroupTournamentBettingConfig(groupId, tournamentId)
  ]);

  // Sort by total points descending to get positions
  const sortedScores = [...scores].sort((a, b) => b.totalPoints - a.totalPoints);

  // Find user's score and position
  const userScore = sortedScores.find(s => s.userId === userId);
  const userPosition = sortedScores.findIndex(s => s.userId === userId) + 1; // 1-indexed

  // Get leader info
  const leader = sortedScores[0];
  const users = await findUsersByIds([leader.userId]);
  const leaderUser = users.find(u => u.id === leader.userId);

  return {
    groupId: group.id,
    groupName: group.name,
    isOwner: group.owner_user_id === userId,
    totalParticipants: userIds.length,
    userPosition,
    userPoints: userScore?.totalPoints || 0,
    leaderName: leaderUser?.nickname || leaderUser?.email || 'Unknown',
    leaderPoints: leader.totalPoints,
    themeColor: group.theme?.primary_color || null,
    bettingEnabled: bettingConfig?.betting_enabled ?? false
  };
}

export async function sendGroupEmailInvitations(
  groupId: string,
  recipients: Array<{name: string; email: string}>,
  customMessage: string | undefined,
  locale: string,
  groupLogoUrl?: string,
  themeColor?: string
): Promise<{sent: number; failed: string[]}> {
  const user = await getLoggedInUser();
  if (!user) throw new Error('Unauthorized');

  const [group, participants] = await Promise.all([
    findProdeGroupById(groupId),
    findParticipantsInGroup(groupId),
  ]);
  if (!group) throw new Error('Group not found');

  const isOwner = group.owner_user_id === user.id;
  const participantRecord = participants.find(p => p.user_id === user.id);
  const isAdmin = isOwner || !!participantRecord?.is_admin;
  if (!isAdmin) throw new Error('Forbidden');

  if (recipients.length > 50) throw new Error('Too many recipients');

  // Deduplicate by email (case-insensitive)
  const seen = new Set<string>();
  const uniqueRecipients = recipients.filter(r => {
    const key = r.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const shortUrlResult = await generateShortUrlForGroup(groupId);
  const inviteLink = await buildShortUrl(shortUrlResult.code);
  const senderDisplayName = user.nickname ?? user.name ?? user.email ?? 'Someone';

  const results = await Promise.allSettled(
    uniqueRecipients.map(async (recipient) => {
      const emailContent = await generateGroupInvitationEmail({
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        senderDisplayName,
        groupName: group.name,
        inviteLink,
        customMessage,
        locale: locale as 'es' | 'en',
        groupLogoUrl,
        themeColor,
      });
      await sendEmail(emailContent);
      return recipient.email;
    })
  );

  const failed: string[] = [];
  let sent = 0;
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled') {
      sent++;
    } else {
      failed.push(uniqueRecipients[i].email);
    }
  }

  return { sent, failed };
}
