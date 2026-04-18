import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  getFavoriteGroupIds,
  getMainGroupId,
  addFavoriteGroup,
  removeFavoriteGroup,
  setMainGroup,
  clearMainGroup,
} from '../../app/db/favorite-groups-repository'
import {
  createMockSelectQuery,
  createMockInsertQuery,
  createMockUpdateQuery,
  createMockDeleteQuery,
  createMockNullQuery,
  expectKyselyQuery,
} from './mock-helpers'

const mockDb = vi.hoisted(() => ({
  selectFrom: vi.fn(),
  insertInto: vi.fn(),
  updateTable: vi.fn(),
  deleteFrom: vi.fn(),
}))

vi.mock('../../app/db/database', () => ({ db: mockDb }))

const USER_ID = 'user-1'
const GROUP_ID = 'group-1'

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// getFavoriteGroupIds
// ---------------------------------------------------------------------------

describe('getFavoriteGroupIds', () => {
  it('returns group ids for the user', async () => {
    const rows = [{ group_id: 'group-1' }, { group_id: 'group-2' }]
    const mockQuery = createMockSelectQuery(rows)
    mockDb.selectFrom.mockReturnValue(mockQuery)

    const result = await getFavoriteGroupIds(USER_ID)

    expect(result).toEqual(['group-1', 'group-2'])
    expectKyselyQuery(mockDb, mockQuery)
      .toHaveCalledSelectFrom('user_favorite_groups')
      .toHaveCalledWhere('user_id', '=', USER_ID)
      .toHaveCalledExecute()
  })

  it('returns empty array when user has no favorites', async () => {
    const mockQuery = createMockSelectQuery([])
    mockDb.selectFrom.mockReturnValue(mockQuery)

    const result = await getFavoriteGroupIds(USER_ID)

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getMainGroupId
// ---------------------------------------------------------------------------

describe('getMainGroupId', () => {
  it('returns the group id when a main group is set', async () => {
    const mockQuery = createMockSelectQuery({ group_id: GROUP_ID })
    mockDb.selectFrom.mockReturnValue(mockQuery)

    const result = await getMainGroupId(USER_ID)

    expect(result).toBe(GROUP_ID)
    expectKyselyQuery(mockDb, mockQuery)
      .toHaveCalledSelectFrom('user_favorite_groups')
      .toHaveCalledWhere('user_id', '=', USER_ID)
      .toHaveCalledWhere('is_main', '=', true)
      .toHaveCalledExecuteTakeFirst()
  })

  it('returns null when no main group is set', async () => {
    const mockQuery = createMockNullQuery()
    mockDb.selectFrom.mockReturnValue(mockQuery)

    const result = await getMainGroupId(USER_ID)

    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// addFavoriteGroup
// ---------------------------------------------------------------------------

describe('addFavoriteGroup', () => {
  it('inserts a new favorite row with is_main=false', async () => {
    const mockQuery = createMockInsertQuery({ user_id: USER_ID, group_id: GROUP_ID, is_main: false })
    mockDb.insertInto.mockReturnValue(mockQuery)

    await addFavoriteGroup(USER_ID, GROUP_ID)

    expectKyselyQuery(mockDb, mockQuery).toHaveCalledInsertInto('user_favorite_groups')
    expect(mockQuery.values).toHaveBeenCalledWith({
      user_id: USER_ID,
      group_id: GROUP_ID,
      is_main: false,
    })
    expect(mockQuery.onConflict).toHaveBeenCalled()
    expectKyselyQuery(mockDb, mockQuery).toHaveCalledExecute()
  })
})

// ---------------------------------------------------------------------------
// removeFavoriteGroup
// ---------------------------------------------------------------------------

describe('removeFavoriteGroup', () => {
  it('deletes the favorite row for the given user and group', async () => {
    const mockQuery = createMockDeleteQuery({})
    mockDb.deleteFrom.mockReturnValue(mockQuery)

    await removeFavoriteGroup(USER_ID, GROUP_ID)

    expectKyselyQuery(mockDb, mockQuery)
      .toHaveCalledDeleteFrom('user_favorite_groups')
      .toHaveCalledWhere('user_id', '=', USER_ID)
      .toHaveCalledWhere('group_id', '=', GROUP_ID)
      .toHaveCalledExecute()
  })
})

// ---------------------------------------------------------------------------
// setMainGroup
// ---------------------------------------------------------------------------

describe('setMainGroup', () => {
  it('clears any existing main group then upserts the new main group', async () => {
    const mockUpdateQuery = createMockUpdateQuery({})
    const mockInsertQuery = createMockInsertQuery({})
    mockDb.updateTable.mockReturnValue(mockUpdateQuery)
    mockDb.insertInto.mockReturnValue(mockInsertQuery)

    await setMainGroup(USER_ID, GROUP_ID)

    // First: clear existing main
    expectKyselyQuery(mockDb, mockUpdateQuery)
      .toHaveCalledUpdateTable('user_favorite_groups')
      .toHaveCalledWhere('user_id', '=', USER_ID)
      .toHaveCalledWhere('is_main', '=', true)
      .toHaveCalledExecute()
    expect(mockUpdateQuery.set).toHaveBeenCalledWith({ is_main: false })

    // Then: upsert the new main
    expectKyselyQuery(mockDb, mockInsertQuery).toHaveCalledInsertInto('user_favorite_groups')
    expect(mockInsertQuery.values).toHaveBeenCalledWith({
      user_id: USER_ID,
      group_id: GROUP_ID,
      is_main: true,
    })
    expect(mockInsertQuery.onConflict).toHaveBeenCalled()
    expectKyselyQuery(mockDb, mockInsertQuery).toHaveCalledExecute()
  })
})

// ---------------------------------------------------------------------------
// clearMainGroup
// ---------------------------------------------------------------------------

describe('clearMainGroup', () => {
  it('sets is_main=false for the user current main group', async () => {
    const mockQuery = createMockUpdateQuery({})
    mockDb.updateTable.mockReturnValue(mockQuery)

    await clearMainGroup(USER_ID)

    expectKyselyQuery(mockDb, mockQuery)
      .toHaveCalledUpdateTable('user_favorite_groups')
      .toHaveCalledWhere('user_id', '=', USER_ID)
      .toHaveCalledWhere('is_main', '=', true)
      .toHaveCalledExecute()
    expect(mockQuery.set).toHaveBeenCalledWith({ is_main: false })
  })
})
