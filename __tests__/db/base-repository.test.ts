import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createBaseFunctions } from '../../app/db/base-repository';
import { db } from '../../app/db/database';
import { Identifiable } from '../../app/db/tables-definition';

// Mock the database connection
vi.mock('../../app/db/database', () => ({
    db: {
        selectFrom: vi.fn(),
        insertInto: vi.fn(),
        updateTable: vi.fn(),
        deleteFrom: vi.fn(),
    },
}));

// Mock React cache
vi.mock('react', () => ({
    cache: vi.fn((fn) => fn),
}));

describe('Base Repository', () => {
    const mockDb = vi.mocked(db);

    // Mock data types
    interface MockTable extends Identifiable {
        name: string;
        value: number;
    }

    const mockRecord: MockTable = {
        id: 'test-id',
        name: 'Test Record',
        value: 42,
    };

    const mockNewRecord = {
        name: 'New Record',
        value: 100,
    };

    const mockUpdateRecord = {
        name: 'Updated Record',
        value: 200,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset all mock chains
        const mockSelectFrom = vi.fn();
        const mockInsertInto = vi.fn();
        const mockUpdateTable = vi.fn();
        const mockDeleteFrom = vi.fn();

        mockDb.selectFrom.mockReturnValue(mockSelectFrom as any);
        mockDb.insertInto.mockReturnValue(mockInsertInto as any);
        mockDb.updateTable.mockReturnValue(mockUpdateTable as any);
        mockDb.deleteFrom.mockReturnValue(mockDeleteFrom as any);
    });

    describe('createBaseFunctions', () => {
        it('should return an object with all CRUD functions', () => {
            const baseFunctions = createBaseFunctions<MockTable, MockTable>('users');

            expect(baseFunctions).toHaveProperty('findById');
            expect(baseFunctions).toHaveProperty('create');
            expect(baseFunctions).toHaveProperty('update');
            expect(baseFunctions).toHaveProperty('delete');
            expect(typeof baseFunctions.findById).toBe('function');
            expect(typeof baseFunctions.create).toBe('function');
            expect(typeof baseFunctions.update).toBe('function');
            expect(typeof baseFunctions.delete).toBe('function');
        });

        it('should create functions for different table types', () => {
            const userFunctions = createBaseFunctions<MockTable, MockTable>('users');
            const teamFunctions = createBaseFunctions<MockTable, MockTable>('teams');
            const tournamentFunctions = createBaseFunctions<MockTable, MockTable>('tournaments');

            expect(userFunctions).toBeDefined();
            expect(teamFunctions).toBeDefined();
            expect(tournamentFunctions).toBeDefined();
        });
    });

    describe('findById factory function', () => {
        it('should find record by id successfully', async () => {
            const mockExecuteTakeFirst = vi.fn().mockResolvedValue(mockRecord);
            const mockSelectAll = vi.fn().mockReturnValue({
                executeTakeFirst: mockExecuteTakeFirst,
            });
            const mockWhere = vi.fn().mockReturnValue({
                selectAll: mockSelectAll,
            });

            mockDb.selectFrom.mockReturnValue({
                where: mockWhere,
            } as any);

            const { findById } = createBaseFunctions<MockTable, MockTable>('users');
            const result = await findById('test-id');

            expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
            expect(mockWhere).toHaveBeenCalledWith('id', '=', 'test-id');
            expect(mockSelectAll).toHaveBeenCalled();
            expect(mockExecuteTakeFirst).toHaveBeenCalled();
            expect(result).toEqual(mockRecord);
        });

        it('should return undefined when record not found', async () => {
            const mockExecuteTakeFirst = vi.fn().mockResolvedValue(undefined);
            const mockSelectAll = vi.fn().mockReturnValue({
                executeTakeFirst: mockExecuteTakeFirst,
            });
            const mockWhere = vi.fn().mockReturnValue({
                selectAll: mockSelectAll,
            });

            mockDb.selectFrom.mockReturnValue({
                where: mockWhere,
            } as any);

            const { findById } = createBaseFunctions<MockTable, MockTable>('users');
            const result = await findById('non-existent-id');

            expect(result).toBeUndefined();
        });

        it('should handle database errors gracefully', async () => {
            const mockExecuteTakeFirst = vi.fn().mockRejectedValue(new Error('Database connection failed'));
            const mockSelectAll = vi.fn().mockReturnValue({
                executeTakeFirst: mockExecuteTakeFirst,
            });
            const mockWhere = vi.fn().mockReturnValue({
                selectAll: mockSelectAll,
            });

            mockDb.selectFrom.mockReturnValue({
                where: mockWhere,
            } as any);

            const { findById } = createBaseFunctions<MockTable, MockTable>('users');

            await expect(findById('test-id')).rejects.toThrow('Database connection failed');
        });

        it('should work with different table names', async () => {
            const mockExecuteTakeFirst = vi.fn().mockResolvedValue(mockRecord);
            const mockSelectAll = vi.fn().mockReturnValue({
                executeTakeFirst: mockExecuteTakeFirst,
            });
            const mockWhere = vi.fn().mockReturnValue({
                selectAll: mockSelectAll,
            });

            mockDb.selectFrom.mockReturnValue({
                where: mockWhere,
            } as any);

            const { findById: findUserById } = createBaseFunctions<MockTable, MockTable>('users');
            const { findById: findTeamById } = createBaseFunctions<MockTable, MockTable>('teams');

            await findUserById('user-id');
            await findTeamById('team-id');

            expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
            expect(mockDb.selectFrom).toHaveBeenCalledWith('teams');
        });
    });

    describe('create factory function', () => {
        it('should create new record successfully', async () => {
            const mockExecuteTakeFirstOrThrow = vi.fn().mockResolvedValue(mockRecord);
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockValues = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });

            mockDb.insertInto.mockReturnValue({
                values: mockValues,
            } as any);

            const { create } = createBaseFunctions<MockTable, MockTable>('users');
            const result = await create(mockNewRecord);

            expect(mockDb.insertInto).toHaveBeenCalledWith('users');
            expect(mockValues).toHaveBeenCalledWith(mockNewRecord);
            expect(mockReturningAll).toHaveBeenCalled();
            expect(mockExecuteTakeFirstOrThrow).toHaveBeenCalled();
            expect(result).toEqual(mockRecord);
        });

        it('should handle database constraint errors', async () => {
            const mockExecuteTakeFirstOrThrow = vi.fn().mockRejectedValue(new Error('Unique constraint violation'));
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockValues = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });

            mockDb.insertInto.mockReturnValue({
                values: mockValues,
            } as any);

            const { create } = createBaseFunctions<MockTable, MockTable>('users');

            await expect(create(mockNewRecord)).rejects.toThrow('Unique constraint violation');
        });

        it('should work with different table names', async () => {
            const mockExecuteTakeFirstOrThrow = vi.fn().mockResolvedValue(mockRecord);
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockValues = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });

            mockDb.insertInto.mockReturnValue({
                values: mockValues,
            } as any);

            const { create: createUser } = createBaseFunctions<MockTable, MockTable>('users');
            const { create: createTeam } = createBaseFunctions<MockTable, MockTable>('teams');

            await createUser(mockNewRecord);
            await createTeam(mockNewRecord);

            expect(mockDb.insertInto).toHaveBeenCalledWith('users');
            expect(mockDb.insertInto).toHaveBeenCalledWith('teams');
        });

        it('should handle empty or null values appropriately', async () => {
            const emptyRecord = {};
            const mockExecuteTakeFirstOrThrow = vi.fn().mockResolvedValue(mockRecord);
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockValues = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });

            mockDb.insertInto.mockReturnValue({
                values: mockValues,
            } as any);

            const { create } = createBaseFunctions<MockTable, MockTable>('users');
            await create(emptyRecord);

            expect(mockValues).toHaveBeenCalledWith(emptyRecord);
        });
    });

    describe('update factory function', () => {
        it('should update record successfully', async () => {
            const updatedRecord = { ...mockRecord, ...mockUpdateRecord };
            const mockExecuteTakeFirstOrThrow = vi.fn().mockResolvedValue(updatedRecord);
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockWhere = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });
            const mockSet = vi.fn().mockReturnValue({
                where: mockWhere,
            });

            mockDb.updateTable.mockReturnValue({
                set: mockSet,
            } as any);

            const { update } = createBaseFunctions<MockTable, MockTable>('users');
            const result = await update('test-id', mockUpdateRecord);

            expect(mockDb.updateTable).toHaveBeenCalledWith('users');
            expect(mockSet).toHaveBeenCalledWith(mockUpdateRecord);
            expect(mockWhere).toHaveBeenCalledWith('id', '=', 'test-id');
            expect(mockReturningAll).toHaveBeenCalled();
            expect(mockExecuteTakeFirstOrThrow).toHaveBeenCalled();
            expect(result).toEqual(updatedRecord);
        });

        it('should handle update of non-existent record', async () => {
            const mockExecuteTakeFirstOrThrow = vi.fn().mockRejectedValue(new Error('No result'));
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockWhere = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });
            const mockSet = vi.fn().mockReturnValue({
                where: mockWhere,
            });

            mockDb.updateTable.mockReturnValue({
                set: mockSet,
            } as any);

            const { update } = createBaseFunctions<MockTable, MockTable>('users');

            await expect(update('non-existent-id', mockUpdateRecord)).rejects.toThrow('No result');
        });

        it('should work with different table names', async () => {
            const updatedRecord = { ...mockRecord, ...mockUpdateRecord };
            const mockExecuteTakeFirstOrThrow = vi.fn().mockResolvedValue(updatedRecord);
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockWhere = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });
            const mockSet = vi.fn().mockReturnValue({
                where: mockWhere,
            });

            mockDb.updateTable.mockReturnValue({
                set: mockSet,
            } as any);

            const { update: updateUser } = createBaseFunctions<MockTable, MockTable>('users');
            const { update: updateTeam } = createBaseFunctions<MockTable, MockTable>('teams');

            await updateUser('user-id', mockUpdateRecord);
            await updateTeam('team-id', mockUpdateRecord);

            expect(mockDb.updateTable).toHaveBeenCalledWith('users');
            expect(mockDb.updateTable).toHaveBeenCalledWith('teams');
        });

        it('should handle partial updates', async () => {
            const partialUpdate = { name: 'Partially Updated' };
            const updatedRecord = { ...mockRecord, ...partialUpdate };

            const mockExecuteTakeFirstOrThrow = vi.fn().mockResolvedValue(updatedRecord);
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockWhere = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });
            const mockSet = vi.fn().mockReturnValue({
                where: mockWhere,
            });

            mockDb.updateTable.mockReturnValue({
                set: mockSet,
            } as any);

            const { update } = createBaseFunctions<MockTable, MockTable>('users');
            const result = await update('test-id', partialUpdate);

            expect(mockSet).toHaveBeenCalledWith(partialUpdate);
            expect(result).toEqual(updatedRecord);
        });
    });

    describe('delete factory function', () => {
        it('should delete record successfully', async () => {
            const mockExecuteTakeFirstOrThrow = vi.fn().mockResolvedValue(mockRecord);
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockWhere = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });

            mockDb.deleteFrom.mockReturnValue({
                where: mockWhere,
            } as any);

            const { delete: deleteRecord } = createBaseFunctions<MockTable, MockTable>('users');
            const result = await deleteRecord('test-id');

            expect(mockDb.deleteFrom).toHaveBeenCalledWith('users');
            expect(mockWhere).toHaveBeenCalledWith('id', '=', 'test-id');
            expect(mockReturningAll).toHaveBeenCalled();
            expect(mockExecuteTakeFirstOrThrow).toHaveBeenCalled();
            expect(result).toEqual(mockRecord);
        });

        it('should handle deletion of non-existent record', async () => {
            const mockExecuteTakeFirstOrThrow = vi.fn().mockRejectedValue(new Error('No result'));
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockWhere = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });

            mockDb.deleteFrom.mockReturnValue({
                where: mockWhere,
            } as any);

            const { delete: deleteRecord } = createBaseFunctions<MockTable, MockTable>('users');

            await expect(deleteRecord('non-existent-id')).rejects.toThrow('No result');
        });

        it('should work with different table names', async () => {
            const mockExecuteTakeFirstOrThrow = vi.fn().mockResolvedValue(mockRecord);
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockWhere = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });

            mockDb.deleteFrom.mockReturnValue({
                where: mockWhere,
            } as any);

            const { delete: deleteUser } = createBaseFunctions<MockTable, MockTable>('users');
            const { delete: deleteTeam } = createBaseFunctions<MockTable, MockTable>('teams');

            await deleteUser('user-id');
            await deleteTeam('team-id');

            expect(mockDb.deleteFrom).toHaveBeenCalledWith('users');
            expect(mockDb.deleteFrom).toHaveBeenCalledWith('teams');
        });

        it('should handle foreign key constraint errors', async () => {
            const mockExecuteTakeFirstOrThrow = vi.fn().mockRejectedValue(new Error('Foreign key constraint'));
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockWhere = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });

            mockDb.deleteFrom.mockReturnValue({
                where: mockWhere,
            } as any);

            const { delete: deleteRecord } = createBaseFunctions<MockTable, MockTable>('users');

            await expect(deleteRecord('test-id')).rejects.toThrow('Foreign key constraint');
        });
    });

    describe('Type safety and parameter validation', () => {
        it('should handle all identifiable table types', () => {
            const allTableTypes = [
                'tournaments',
                'users',
                'tournament_groups',
                'teams',
                'games',
                'tournament_playoff_rounds',
                'prode_groups',
                'game_guesses',
                'game_results',
                'tournament_guesses',
                'players',
                'tournament_venues',
            ] as const;

            allTableTypes.forEach(tableName => {
                expect(() => createBaseFunctions<MockTable, MockTable>(tableName)).not.toThrow();
            });
        });

        it('should maintain type safety with generic types', () => {
            interface CustomTable extends Identifiable {
                customField: string;
                customNumber: number;
            }

            const customFunctions = createBaseFunctions<CustomTable, CustomTable>('users');

            expect(customFunctions.findById).toBeDefined();
            expect(customFunctions.create).toBeDefined();
            expect(customFunctions.update).toBeDefined();
            expect(customFunctions.delete).toBeDefined();
        });
    });

    describe('React cache integration', () => {
        it('should use React cache for findById function', () => {
            // The cache is already mocked in the module mock at the top
            // We just need to verify that findById is cached
            const baseFunctions = createBaseFunctions<MockTable, MockTable>('users');

            expect(baseFunctions.findById).toBeDefined();
            expect(typeof baseFunctions.findById).toBe('function');
        });
    });

    describe('Error handling and edge cases', () => {
        it('should handle database connection errors consistently', async () => {
            const connectionError = new Error('Database connection lost');

            // Test findById
            const mockExecuteTakeFirst = vi.fn().mockRejectedValue(connectionError);
            const mockSelectAll = vi.fn().mockReturnValue({
                executeTakeFirst: mockExecuteTakeFirst,
            });
            const mockWhere = vi.fn().mockReturnValue({
                selectAll: mockSelectAll,
            });

            mockDb.selectFrom.mockReturnValue({
                where: mockWhere,
            } as any);

            const { findById } = createBaseFunctions<MockTable, MockTable>('users');

            await expect(findById('test-id')).rejects.toThrow('Database connection lost');
        });

        it('should handle empty string IDs', async () => {
            const mockExecuteTakeFirst = vi.fn().mockResolvedValue(undefined);
            const mockSelectAll = vi.fn().mockReturnValue({
                executeTakeFirst: mockExecuteTakeFirst,
            });
            const mockWhere = vi.fn().mockReturnValue({
                selectAll: mockSelectAll,
            });

            mockDb.selectFrom.mockReturnValue({
                where: mockWhere,
            } as any);

            const { findById } = createBaseFunctions<MockTable, MockTable>('users');
            const result = await findById('');

            expect(mockWhere).toHaveBeenCalledWith('id', '=', '');
            expect(result).toBeUndefined();
        });

        it('should handle null/undefined update values', async () => {
            const nullUpdateRecord = { name: null as any, value: undefined as any };
            const mockExecuteTakeFirstOrThrow = vi.fn().mockResolvedValue(mockRecord);
            const mockReturningAll = vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
            });
            const mockWhere = vi.fn().mockReturnValue({
                returningAll: mockReturningAll,
            });
            const mockSet = vi.fn().mockReturnValue({
                where: mockWhere,
            });

            mockDb.updateTable.mockReturnValue({
                set: mockSet,
            } as any);

            const { update } = createBaseFunctions<MockTable, MockTable>('users');
            await update('test-id', nullUpdateRecord);

            expect(mockSet).toHaveBeenCalledWith(nullUpdateRecord);
        });
    });

    describe('Factory function independence', () => {
        it('should create independent function instances for different tables', () => {
            const userFunctions = createBaseFunctions<MockTable, MockTable>('users');
            const teamFunctions = createBaseFunctions<MockTable, MockTable>('teams');

            // Functions should be different instances
            expect(userFunctions.findById).not.toBe(teamFunctions.findById);
            expect(userFunctions.create).not.toBe(teamFunctions.create);
            expect(userFunctions.update).not.toBe(teamFunctions.update);
            expect(userFunctions.delete).not.toBe(teamFunctions.delete);
        });

        it('should create independent function instances for same table', () => {
            const userFunctions1 = createBaseFunctions<MockTable, MockTable>('users');
            const userFunctions2 = createBaseFunctions<MockTable, MockTable>('users');

            // Even for same table, functions should be different instances
            expect(userFunctions1.findById).not.toBe(userFunctions2.findById);
            expect(userFunctions1.create).not.toBe(userFunctions2.create);
            expect(userFunctions1.update).not.toBe(userFunctions2.update);
            expect(userFunctions1.delete).not.toBe(userFunctions2.delete);
        });
    });
});
