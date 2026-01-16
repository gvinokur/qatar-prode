import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  findTournamentVenueById,
  findAllTournamentVenues,
  findTournamentVenueByName,
  createTournamentVenue,
  createManyTournamentVenues,
  updateTournamentVenue,
  deleteTournamentVenue,
  deleteAllTournamentVenues,
} from '../../app/db/tournament-venue-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';
import { createMockSelectQuery, createMockDeleteQuery } from './mock-helpers';

// Mock the database
vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    updateTable: vi.fn(),
    deleteFrom: vi.fn(),
  },
}));

// Mock base-repository
const mockBaseFunctions = vi.hoisted(() => ({
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('../../app/db/base-repository', () => ({
  createBaseFunctions: vi.fn(() => mockBaseFunctions),
}));

describe('Tournament Venue Repository', () => {
  const mockDb = vi.mocked(db);
  const mockVenue = testFactories.tournamentVenue();
  const mockVenues = [
    testFactories.tournamentVenue({ id: 'venue-1', name: 'Stadium A', location: 'City A' }),
    testFactories.tournamentVenue({ id: 'venue-2', name: 'Stadium B', location: 'City B' }),
    testFactories.tournamentVenue({ id: 'venue-3', name: 'Stadium C', location: 'City C' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Base CRUD Functions', () => {
    describe('findTournamentVenueById', () => {
      it('should call base findById function', async () => {
        mockBaseFunctions.findById.mockResolvedValue(mockVenue);

        const result = await findTournamentVenueById('venue-1');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('venue-1');
        expect(result).toEqual(mockVenue);
      });

      it('should return null when venue not found', async () => {
        mockBaseFunctions.findById.mockResolvedValue(null);

        const result = await findTournamentVenueById('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('createTournamentVenue', () => {
      it('should call base create function', async () => {
        const newVenue = testFactories.tournamentVenue({ name: 'New Stadium' });
        mockBaseFunctions.create.mockResolvedValue(newVenue);

        const result = await createTournamentVenue({
          tournament_id: 'tournament-1',
          name: 'New Stadium',
          location: 'New City',
          picture_url: null,
        });

        expect(mockBaseFunctions.create).toHaveBeenCalledWith({
          tournament_id: 'tournament-1',
          name: 'New Stadium',
          location: 'New City',
          picture_url: null,
        });
        expect(result).toEqual(newVenue);
      });
    });

    describe('updateTournamentVenue', () => {
      it('should call base update function', async () => {
        const updatedVenue = testFactories.tournamentVenue({ name: 'Updated Stadium' });
        mockBaseFunctions.update.mockResolvedValue(updatedVenue);

        const result = await updateTournamentVenue('venue-1', { name: 'Updated Stadium' });

        expect(mockBaseFunctions.update).toHaveBeenCalledWith('venue-1', { name: 'Updated Stadium' });
        expect(result).toEqual(updatedVenue);
      });
    });

    describe('deleteTournamentVenue', () => {
      it('should call base delete function', async () => {
        mockBaseFunctions.delete.mockResolvedValue(mockVenue);

        const result = await deleteTournamentVenue('venue-1');

        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('venue-1');
        expect(result).toEqual(mockVenue);
      });
    });
  });

  describe('Custom Query Functions', () => {
    describe('findAllTournamentVenues', () => {
      it('should find all venues for tournament ordered by name', async () => {
        const mockQuery = createMockSelectQuery(mockVenues);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllTournamentVenues('tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_venues');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.orderBy).toHaveBeenCalledWith('name', 'asc');
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockVenues);
      });

      it('should return empty array when tournament has no venues', async () => {
        const mockQuery = createMockSelectQuery([]);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllTournamentVenues('empty-tournament');

        expect(result).toEqual([]);
      });

      it('should order venues alphabetically by name', async () => {
        const unorderedVenues = [mockVenues[2], mockVenues[0], mockVenues[1]];
        const mockQuery = createMockSelectQuery(unorderedVenues);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await findAllTournamentVenues('tournament-1');

        expect(mockQuery.orderBy).toHaveBeenCalledWith('name', 'asc');
      });
    });

    describe('findTournamentVenueByName', () => {
      it('should find venue by exact name', async () => {
        const mockQuery = createMockSelectQuery(mockVenue);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findTournamentVenueByName('Test Stadium');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_venues');
        expect(mockQuery.where).toHaveBeenCalledWith('name', '=', 'Test Stadium');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toEqual(mockVenue);
      });

      it('should return undefined when venue not found by name', async () => {
        const mockQuery = createMockSelectQuery(null);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findTournamentVenueByName('Nonexistent Stadium');

        expect(result).toBeNull();
      });

      it('should handle special characters in venue name', async () => {
        const mockQuery = createMockSelectQuery(mockVenue);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await findTournamentVenueByName("Stade de l'Amitié");

        expect(mockQuery.where).toHaveBeenCalledWith('name', '=', "Stade de l'Amitié");
      });

      it('should be case-sensitive in name matching', async () => {
        const mockQuery = createMockSelectQuery(null);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await findTournamentVenueByName('test stadium');

        expect(mockQuery.where).toHaveBeenCalledWith('name', '=', 'test stadium');
      });
    });

    describe('createManyTournamentVenues', () => {
      it('should create multiple venues using Promise.all', async () => {
        const newVenues = [
          { tournament_id: 'tournament-1', name: 'Venue 1', location: 'City 1', picture_url: null },
          { tournament_id: 'tournament-1', name: 'Venue 2', location: 'City 2', picture_url: null },
          { tournament_id: 'tournament-1', name: 'Venue 3', location: 'City 3', picture_url: null },
        ];
        const createdVenues = mockVenues;

        mockBaseFunctions.create
          .mockResolvedValueOnce(createdVenues[0])
          .mockResolvedValueOnce(createdVenues[1])
          .mockResolvedValueOnce(createdVenues[2]);

        const result = await createManyTournamentVenues(newVenues);

        expect(mockBaseFunctions.create).toHaveBeenCalledTimes(3);
        expect(mockBaseFunctions.create).toHaveBeenCalledWith(newVenues[0]);
        expect(mockBaseFunctions.create).toHaveBeenCalledWith(newVenues[1]);
        expect(mockBaseFunctions.create).toHaveBeenCalledWith(newVenues[2]);
        expect(result).toEqual(createdVenues);
      });

      it('should handle empty array', async () => {
        const result = await createManyTournamentVenues([]);

        expect(mockBaseFunctions.create).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });

      it('should handle single venue', async () => {
        const newVenue = { tournament_id: 'tournament-1', name: 'Single Venue', location: 'City', picture_url: null };
        mockBaseFunctions.create.mockResolvedValue(mockVenue);

        const result = await createManyTournamentVenues([newVenue]);

        expect(mockBaseFunctions.create).toHaveBeenCalledTimes(1);
        expect(mockBaseFunctions.create).toHaveBeenCalledWith(newVenue);
        expect(result).toHaveLength(1);
      });

      it('should handle creation errors properly', async () => {
        const newVenues = [
          { tournament_id: 'tournament-1', name: 'Venue 1', location: 'City 1', picture_url: null },
          { tournament_id: 'tournament-1', name: 'Venue 2', location: 'City 2', picture_url: null },
        ];

        mockBaseFunctions.create
          .mockResolvedValueOnce(mockVenues[0])
          .mockRejectedValueOnce(new Error('Creation failed'));

        await expect(createManyTournamentVenues(newVenues)).rejects.toThrow('Creation failed');
        expect(mockBaseFunctions.create).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection errors', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockRejectedValue(new Error('Connection lost')),
      };
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await expect(findTournamentVenueByName('Test')).rejects.toThrow('Connection lost');
    });

    it('should handle null picture_url correctly', async () => {
      const venueWithoutPicture = testFactories.tournamentVenue({ picture_url: null });
      mockBaseFunctions.create.mockResolvedValue(venueWithoutPicture);

      const result = await createTournamentVenue({
        tournament_id: 'tournament-1',
        name: 'No Picture Venue',
        location: 'City',
        picture_url: null,
      });

      expect(result.picture_url).toBeNull();
    });

    it('should handle empty tournament ID gracefully', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findAllTournamentVenues('');

      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', '');
      expect(result).toEqual([]);
    });
  });

  describe('deleteAllTournamentVenues', () => {
    it('should delete all venues for a tournament', async () => {
      const mockQuery = createMockDeleteQuery(mockVenues);
      mockDb.deleteFrom.mockReturnValue(mockQuery as any);

      await deleteAllTournamentVenues('tournament-1');

      expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_venues');
      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
      expect(mockQuery.execute).toHaveBeenCalled();
    });

    it('should handle deleting from tournament with no venues', async () => {
      const mockQuery = createMockDeleteQuery([]);
      mockDb.deleteFrom.mockReturnValue(mockQuery as any);

      const result = await deleteAllTournamentVenues('empty-tournament');

      expect(mockQuery.execute).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
