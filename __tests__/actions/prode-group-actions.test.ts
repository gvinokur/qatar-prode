import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as userActions from '../../app/actions/user-actions';
import * as prodeGroupRepository from '../../app/db/prode-group-repository';
import * as s3 from '../../app/actions/s3';
import * as gameGuessRepository from '../../app/db/game-guess-repository';
import * as tournamentGuessRepository from '../../app/db/tournament-guess-repository';
import * as objectUtils from '../../app/utils/ObjectUtils';
import {
  createDbGroup,
  getGroupsForUser,
  deleteGroup,
  promoteParticipantToAdmin,
  demoteParticipantFromAdmin,
  joinGroup,
  updateTheme,
  leaveGroupAction,
  getUsersForGroup,
  getUserScoresForTournament,
} from '../../app/actions/prode-group-actions';
import { z } from 'zod';

// Mock the auth module to prevent Next-auth module resolution errors
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('../../app/actions/user-actions');
vi.mock('../../app/db/prode-group-repository');
vi.mock('../../app/actions/s3');
vi.mock('../../app/db/game-guess-repository');
vi.mock('../../app/db/tournament-guess-repository');
vi.mock('../../app/utils/ObjectUtils');

const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockCreateProdeGroup = vi.mocked(prodeGroupRepository.createProdeGroup);
const mockFindProdeGroupById = vi.mocked(prodeGroupRepository.findProdeGroupById);
const mockFindProdeGroupsByOwner = vi.mocked(prodeGroupRepository.findProdeGroupsByOwner);
const mockFindProdeGroupsByParticipant = vi.mocked(prodeGroupRepository.findProdeGroupsByParticipant);
const mockDeleteAllParticipantsFromGroup = vi.mocked(prodeGroupRepository.deleteAllParticipantsFromGroup);
const mockDeleteProdeGroup = vi.mocked(prodeGroupRepository.deleteProdeGroup);
const mockUpdateProdeGroup = vi.mocked(prodeGroupRepository.updateProdeGroup);
const mockAddParticipantToGroup = vi.mocked(prodeGroupRepository.addParticipantToGroup);
const mockUpdateParticipantAdminStatus = vi.mocked(prodeGroupRepository.updateParticipantAdminStatus);
const mockDeleteParticipantFromGroup = vi.mocked(prodeGroupRepository.deleteParticipantFromGroup);
const mockFindParticipantsInGroup = vi.mocked(prodeGroupRepository.findParticipantsInGroup);
const mockGetGameGuessStatisticsForUsers = vi.mocked(gameGuessRepository.getGameGuessStatisticsForUsers);
const mockFindTournamentGuessByUserIdsTournament = vi.mocked(tournamentGuessRepository.findTournamentGuessByUserIdsTournament);
const mockCustomToMap = vi.mocked(objectUtils.customToMap);
const mockCreateS3Client = vi.mocked(s3.createS3Client);
const mockDeleteThemeLogoFromS3 = vi.mocked(s3.deleteThemeLogoFromS3);

describe('Prode Group Actions', () => {
  const mockUser = { id: 'user1', email: 'test@example.com', emailVerified: new Date() };
  const mockOwner = { id: 'owner1', isAdmin: false };
  const mockGroup = { id: 'group1', owner_user_id: 'owner1', theme: { logo: 'logo.png', s3_logo_key: 'logo.png' } };
  const mockParticipant = { user_id: 'user2' };

  const mockProdeGroup = { id: 'group1', name: 'Test Group', owner_user_id: 'user1' };

  const mockFormData = {
    nombre: 'New Group Name',
    primary_color: '#ff0000',
    secondary_color: '#00ff00',
    logo: { size: 100, name: 'logo.png', type: 'image/png', arrayBuffer: async () => new Uint8Array([1,2,3]) },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockUser as any);
    mockCreateProdeGroup.mockResolvedValue(mockProdeGroup);
    mockFindProdeGroupById.mockResolvedValue(mockGroup);
    mockFindProdeGroupsByOwner.mockResolvedValue([mockGroup]);
    mockFindProdeGroupsByParticipant.mockResolvedValue([mockGroup]);
    mockDeleteAllParticipantsFromGroup.mockResolvedValue(undefined);
    mockDeleteProdeGroup.mockResolvedValue(undefined);
    mockUpdateProdeGroup.mockResolvedValue(mockGroup);
    mockAddParticipantToGroup.mockResolvedValue(undefined);
    mockUpdateParticipantAdminStatus.mockResolvedValue(undefined);
    mockDeleteParticipantFromGroup.mockResolvedValue(undefined);
    mockFindParticipantsInGroup.mockResolvedValue([mockParticipant]);
    mockGetGameGuessStatisticsForUsers.mockResolvedValue([{ user_id: 'user1', group_score: 10, playoff_score: 5, total_score: 15 }]);
    mockFindTournamentGuessByUserIdsTournament.mockResolvedValue([{ user_id: 'user1', qualified_teams_score: 2, honor_roll_score: 3, individual_awards_score: 4, group_position_score: 1 }]);
    mockCustomToMap.mockImplementation((data, keyExtractor) => {
      if (data.length > 0 && data[0]?.group_score !== undefined) {
        // Game statistics data
        return { 
          user1: { 
            user_id: 'user1', 
            group_score: 10, 
            playoff_score: 5, 
            total_score: 15 
          } 
        };
      } else if (data.length > 0 && data[0]?.qualified_teams_score !== undefined) {
        // Tournament guesses data
        return { 
          user1: { 
            user_id: 'user1', 
            qualified_teams_score: 2, 
            honor_roll_score: 3, 
            individual_awards_score: 4, 
            group_position_score: 1 
          } 
        };
      }
      return {};
    });
    mockCreateS3Client.mockReturnValue({
      uploadFile: vi.fn().mockResolvedValue('uploaded-file-key'),
      deleteFile: vi.fn().mockResolvedValue(undefined)
    });
    mockDeleteThemeLogoFromS3.mockResolvedValue(undefined);
  });

  describe('createDbGroup', () => {
    it('creates a group for a logged in user', async () => {
      const result = await createDbGroup('Test Group');
      expect(result).toEqual(mockProdeGroup);
    });
    it('throws if not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);
      await expect(createDbGroup('Test Group')).rejects.toBe('Should not call this action from a logged out page');
    });
  });

  describe('getGroupsForUser', () => {
    it('returns user and participant groups', async () => {
      const result = await getGroupsForUser();
      expect(result).toEqual({ userGroups: [mockGroup], participantGroups: [mockGroup] });
    });
    it('returns undefined if not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);
      const result = await getGroupsForUser();
      expect(result).toBeUndefined();
    });
  });

  describe('deleteGroup', () => {
    it('deletes group if user is owner', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner);
      await deleteGroup('group1');
      expect(mockDeleteAllParticipantsFromGroup).toHaveBeenCalledWith('group1');
      expect(mockDeleteProdeGroup).toHaveBeenCalledWith('group1');
    });
    it('does not delete if user is not owner', async () => {
      await deleteGroup('group1');
      expect(mockDeleteAllParticipantsFromGroup).not.toHaveBeenCalled();
      expect(mockDeleteProdeGroup).not.toHaveBeenCalled();
    });
    it('throws if not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);
      await expect(deleteGroup('group1')).rejects.toBe('Should not call this action from a logged out page');
    });
  });

  describe('promoteParticipantToAdmin', () => {
    it('promotes participant if user is owner', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner);
      await promoteParticipantToAdmin('group1', 'user2');
      expect(mockUpdateParticipantAdminStatus).toHaveBeenCalledWith('group1', 'user2', true);
    });
    it('throws if not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);
      await expect(promoteParticipantToAdmin('group1', 'user2')).rejects.toBe('Should not call this action from a logged out page');
    });
    it('throws if user is not owner', async () => {
      await expect(promoteParticipantToAdmin('group1', 'user2')).rejects.toBe('Only owner can promote admins');
    });
  });

  describe('demoteParticipantFromAdmin', () => {
    it('demotes participant if user is owner', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner);
      await demoteParticipantFromAdmin('group1', 'user2');
      expect(mockUpdateParticipantAdminStatus).toHaveBeenCalledWith('group1', 'user2', false);
    });
    it('throws if not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);
      await expect(demoteParticipantFromAdmin('group1', 'user2')).rejects.toBe('Should not call this action from a logged out page');
    });
    it('throws if user is not owner', async () => {
      await expect(demoteParticipantFromAdmin('group1', 'user2')).rejects.toBe('Only owner can demote admins');
    });
  });

  describe('joinGroup', () => {
    it('adds participant to group', async () => {
      mockFindProdeGroupById.mockResolvedValue(mockGroup);
      const result = await joinGroup('group1');
      expect(mockAddParticipantToGroup).toHaveBeenCalledWith(mockGroup, mockUser, false);
      expect(result).toEqual(mockGroup);
    });
    it('throws if not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);
      await expect(joinGroup('group1')).rejects.toBe('Should not call this action from a logged out page');
    });
  });

  describe('updateTheme', () => {
    it('updates theme and uploads logo', async () => {
      const result = await updateTheme('group1', Object.entries(mockFormData));
      expect(mockCreateS3Client).toHaveBeenCalledWith('prode-group-files');
      expect(mockDeleteThemeLogoFromS3).toHaveBeenCalledWith(mockGroup.theme);
      expect(result).toEqual(mockGroup);
    });
    it('returns error if image validation fails', async () => {
      const badFormData = {
        nombre: 'New Group Name',
        primary_color: '#ff0000',
        secondary_color: '#00ff00',
        logo: { size: 0, name: undefined, type: 'image/png', arrayBuffer: async () => new Uint8Array([1,2,3]) },
      };
      const result = await updateTheme('group1', Object.entries(badFormData));
      expect((result as any).errors).toBeDefined();
      expect((result as any).message).toBe('Invalid Image');
    });
    it('returns error if image upload fails', async () => {
      mockCreateS3Client.mockImplementation(() => ({
        uploadFile: vi.fn().mockRejectedValue(new Error('Upload failed')),
        deleteFile: vi.fn().mockResolvedValue(undefined)
      }));
      const result = await updateTheme('group1', Object.entries(mockFormData));
      expect(result).toBe('Image Upload failed');
    });
  });

  describe('leaveGroupAction', () => {
    it('removes participant from group', async () => {
      mockFindProdeGroupById.mockResolvedValue(mockGroup);
      mockGetLoggedInUser.mockResolvedValue(mockUser);
      const result = await leaveGroupAction('group1');
      expect(mockDeleteParticipantFromGroup).toHaveBeenCalledWith('group1', mockUser.id);
      expect(result).toEqual({ success: true });
    });
    it('throws if not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);
      await expect(leaveGroupAction('group1')).rejects.toBe('No puedes dejar el grupo si no has iniciado sesión.');
    });
    it('throws if group does not exist', async () => {
      mockFindProdeGroupById.mockResolvedValue(null);
      await expect(leaveGroupAction('group1')).rejects.toBe('El grupo no existe.');
    });
    it('throws if user is owner', async () => {
      mockFindProdeGroupById.mockResolvedValue({ ...mockGroup, owner_user_id: mockUser.id });
      await expect(leaveGroupAction('group1')).rejects.toBe('El dueño del grupo no puede dejar el grupo.');
    });
  });

  describe('getUsersForGroup', () => {
    it('returns owner and participants', async () => {
      mockFindProdeGroupById.mockResolvedValue(mockGroup);
      mockFindParticipantsInGroup.mockResolvedValue([mockParticipant]);
      const result = await getUsersForGroup('group1');
      expect(result).toEqual(['owner1', 'user2']);
    });
    it('throws if group does not exist', async () => {
      mockFindProdeGroupById.mockResolvedValue(null);
      await expect(getUsersForGroup('group1')).rejects.toBe('El grupo no existe.');
    });
  });

  describe('getUserScoresForTournament', () => {
    it('returns user scores for tournament', async () => {
      const result = await getUserScoresForTournament(['user1'], 'tournament1');
      expect(result).toEqual([
        {
          userId: 'user1',
          groupStageScore: 10,
          groupStageQualifiersScore: 2,
          playoffScore: 5,
          honorRollScore: 3,
          individualAwardsScore: 4,
          groupPositionScore: 1,
          totalPoints: 25
        }
      ]);
    });
  });
}); 