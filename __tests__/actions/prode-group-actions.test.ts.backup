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
  getUserScoresForTournament
} from '../../app/actions/prode-group-actions';
import { z } from 'zod';

jest.mock('../../app/db/prode-group-repository', () => ({
  addParticipantToGroup: jest.fn(),
  createProdeGroup: jest.fn(),
  deleteAllParticipantsFromGroup: jest.fn(),
  deleteProdeGroup: jest.fn(),
  findProdeGroupById: jest.fn(),
  findProdeGroupsByOwner: jest.fn(),
  findProdeGroupsByParticipant: jest.fn(),
  updateProdeGroup: jest.fn(),
  deleteParticipantFromGroup: jest.fn(),
  updateParticipantAdminStatus: jest.fn(),
  findParticipantsInGroup: jest.fn(),
}));

jest.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: jest.fn(),
}));

jest.mock('../../app/actions/s3', () => ({
  createS3Client: jest.fn(() => ({
    uploadFile: jest.fn().mockResolvedValue({ location: 'https://s3.amazonaws.com/bucket/file.jpg', key: 'file.jpg' }),
    deleteFile: jest.fn().mockResolvedValue(undefined)
  })),
  deleteThemeLogoFromS3: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../app/db/game-guess-repository', () => ({
  getGameGuessStatisticsForUsers: jest.fn(),
}));

jest.mock('../../app/db/tournament-guess-repository', () => ({
  findTournamentGuessByUserIdsTournament: jest.fn(),
}));

jest.mock('../../app/utils/ObjectUtils', () => ({
  customToMap: jest.fn((arr: any[], fn: (item: any) => string) => Object.fromEntries(arr.map((item: any) => [fn(item), item]))),
}));

describe('Prode Group Actions', () => {
  const mockUser = { id: 'user1', isAdmin: false };
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
    jest.clearAllMocks();
    require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(mockUser);
    require('../../app/db/prode-group-repository').createProdeGroup.mockResolvedValue(mockProdeGroup);
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
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(null);
      await expect(createDbGroup('Test Group')).rejects.toBe('Should not call this action from a logged out page');
    });
  });

  describe('getGroupsForUser', () => {
    it('returns user and participant groups', async () => {
      const result = await getGroupsForUser();
      expect(result).toEqual({ userGroups: [mockGroup], participantGroups: [mockGroup] });
    });
    it('returns undefined if not logged in', async () => {
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(null);
      const result = await getGroupsForUser();
      expect(result).toBeUndefined();
    });
  });

  describe('deleteGroup', () => {
    it('deletes group if user is owner', async () => {
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(mockOwner);
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
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(null);
      await expect(deleteGroup('group1')).rejects.toBe('Should not call this action from a logged out page');
    });
  });

  describe('promoteParticipantToAdmin', () => {
    it('promotes participant if user is owner', async () => {
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(mockOwner);
      await promoteParticipantToAdmin('group1', 'user2');
      expect(require('../../app/db/prode-group-repository').updateParticipantAdminStatus).toHaveBeenCalledWith('group1', 'user2', true);
    });
    it('throws if not logged in', async () => {
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(null);
      await expect(promoteParticipantToAdmin('group1', 'user2')).rejects.toBe('Should not call this action from a logged out page');
    });
    it('throws if user is not owner', async () => {
      await expect(promoteParticipantToAdmin('group1', 'user2')).rejects.toBe('Only owner can promote admins');
    });
  });

  describe('demoteParticipantFromAdmin', () => {
    it('demotes participant if user is owner', async () => {
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(mockOwner);
      await demoteParticipantFromAdmin('group1', 'user2');
      expect(require('../../app/db/prode-group-repository').updateParticipantAdminStatus).toHaveBeenCalledWith('group1', 'user2', false);
    });
    it('throws if not logged in', async () => {
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(null);
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
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(null);
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
        uploadFile: jest.fn().mockRejectedValue(new Error('Upload failed')),
        deleteFile: jest.fn().mockResolvedValue(undefined)
      }));
      const result = await updateTheme('group1', Object.entries(mockFormData));
      expect(result).toBe('Image Upload failed');
    });
  });

  describe('leaveGroupAction', () => {
    it('removes participant from group', async () => {
      require('../../app/db/prode-group-repository').findProdeGroupById.mockResolvedValue(mockGroup);
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(mockUser);
      const result = await leaveGroupAction('group1');
      expect(require('../../app/db/prode-group-repository').deleteParticipantFromGroup).toHaveBeenCalledWith('group1', mockUser.id);
      expect(result).toEqual({ success: true });
    });
    it('throws if not logged in', async () => {
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(null);
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