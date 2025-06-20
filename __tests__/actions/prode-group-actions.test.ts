import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as userActions from '../../app/actions/user-actions';
import * as prodeGroupRepository from '../../app/db/prode-group-repository';
import * as s3 from '../../app/actions/s3';
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

vi.mock('../../app/actions/user-actions');
vi.mock('../../app/db/prode-group-repository');
vi.mock('../../app/actions/s3');

const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockCreateProdeGroup = vi.mocked(prodeGroupRepository.createProdeGroup);

vi.mock('../../app/db/game-guess-repository', () => ({
  getGameGuessStatisticsForUsers: vi.fn(),
}));

vi.mock('../../app/db/tournament-guess-repository', () => ({
  findTournamentGuessByUserIdsTournament: vi.fn(),
}));

vi.mock('../../app/utils/ObjectUtils', () => ({
  customToMap: vi.fn((arr: any[], fn: (item: any) => string) => Object.fromEntries(arr.map((item: any) => [fn(item), item]))),
}));

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
    require('../../app/db/prode-group-repository').findProdeGroupById.mockResolvedValue(mockGroup);
    require('../../app/db/prode-group-repository').findProdeGroupsByOwner.mockResolvedValue([mockGroup]);
    require('../../app/db/prode-group-repository').findProdeGroupsByParticipant.mockResolvedValue([mockGroup]);
    require('../../app/db/prode-group-repository').deleteAllParticipantsFromGroup.mockResolvedValue(undefined);
    require('../../app/db/prode-group-repository').deleteProdeGroup.mockResolvedValue(undefined);
    require('../../app/db/prode-group-repository').updateProdeGroup.mockResolvedValue(mockGroup);
    require('../../app/db/prode-group-repository').addParticipantToGroup.mockResolvedValue(undefined);
    require('../../app/db/prode-group-repository').updateParticipantAdminStatus.mockResolvedValue(undefined);
    require('../../app/db/prode-group-repository').deleteParticipantFromGroup.mockResolvedValue(undefined);
    require('../../app/db/prode-group-repository').findParticipantsInGroup.mockResolvedValue([mockParticipant]);
    require('../../app/db/game-guess-repository').getGameGuessStatisticsForUsers.mockResolvedValue([{ user_id: 'user1', group_score: 10, playoff_score: 5, total_score: 15 }]);
    require('../../app/db/tournament-guess-repository').findTournamentGuessByUserIdsTournament.mockResolvedValue([{ user_id: 'user1', qualified_teams_score: 2, honor_roll_score: 3, individual_awards_score: 4, group_position_score: 1 }]);
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
      expect(require('../../app/db/prode-group-repository').deleteAllParticipantsFromGroup).toHaveBeenCalledWith('group1');
      expect(require('../../app/db/prode-group-repository').deleteProdeGroup).toHaveBeenCalledWith('group1');
    });
    it('does not delete if user is not owner', async () => {
      await deleteGroup('group1');
      expect(require('../../app/db/prode-group-repository').deleteAllParticipantsFromGroup).not.toHaveBeenCalled();
      expect(require('../../app/db/prode-group-repository').deleteProdeGroup).not.toHaveBeenCalled();
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
      expect(require('../../app/db/prode-group-repository').updateParticipantAdminStatus).toHaveBeenCalledWith('group1', 'user2', true);
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
      expect(require('../../app/db/prode-group-repository').updateParticipantAdminStatus).toHaveBeenCalledWith('group1', 'user2', false);
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
      require('../../app/db/prode-group-repository').findProdeGroupById.mockResolvedValue(mockGroup);
      const result = await joinGroup('group1');
      expect(require('../../app/db/prode-group-repository').addParticipantToGroup).toHaveBeenCalledWith(mockGroup, mockUser, false);
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
      expect(require('../../app/actions/s3').createS3Client).toHaveBeenCalledWith('prode-group-files');
      expect(require('../../app/actions/s3').deleteThemeLogoFromS3).toHaveBeenCalledWith(mockGroup.theme);
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
      require('../../app/actions/s3').createS3Client.mockImplementation(() => ({
        uploadFile: vi.fn().mockRejectedValue(new Error('Upload failed')),
        deleteFile: vi.fn().mockResolvedValue(undefined)
      }));
      const result = await updateTheme('group1', Object.entries(mockFormData));
      expect(result).toBe('Image Upload failed');
    });
  });

  describe('leaveGroupAction', () => {
    it('removes participant from group', async () => {
      require('../../app/db/prode-group-repository').findProdeGroupById.mockResolvedValue(mockGroup);
      mockGetLoggedInUser.mockResolvedValue(mockUser);
      const result = await leaveGroupAction('group1');
      expect(require('../../app/db/prode-group-repository').deleteParticipantFromGroup).toHaveBeenCalledWith('group1', mockUser.id);
      expect(result).toEqual({ success: true });
    });
    it('throws if not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);
      await expect(leaveGroupAction('group1')).rejects.toBe('No puedes dejar el grupo si no has iniciado sesión.');
    });
    it('throws if group does not exist', async () => {
      require('../../app/db/prode-group-repository').findProdeGroupById.mockResolvedValue(null);
      await expect(leaveGroupAction('group1')).rejects.toBe('El grupo no existe.');
    });
    it('throws if user is owner', async () => {
      require('../../app/db/prode-group-repository').findProdeGroupById.mockResolvedValue({ ...mockGroup, owner_user_id: mockUser.id });
      await expect(leaveGroupAction('group1')).rejects.toBe('El dueño del grupo no puede dejar el grupo.');
    });
  });

  describe('getUsersForGroup', () => {
    it('returns owner and participants', async () => {
      require('../../app/db/prode-group-repository').findProdeGroupById.mockResolvedValue(mockGroup);
      require('../../app/db/prode-group-repository').findParticipantsInGroup.mockResolvedValue([mockParticipant]);
      const result = await getUsersForGroup('group1');
      expect(result).toEqual(['owner1', 'user2']);
    });
    it('throws if group does not exist', async () => {
      require('../../app/db/prode-group-repository').findProdeGroupById.mockResolvedValue(null);
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