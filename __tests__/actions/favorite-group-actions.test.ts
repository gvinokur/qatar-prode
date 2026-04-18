import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as userActions from '../../app/actions/user-actions'
import * as favoriteGroupsRepository from '../../app/db/favorite-groups-repository'
import {
  toggleFavoriteGroupAction,
  setMainGroupAction,
  clearMainGroupAction,
} from '../../app/actions/favorite-group-actions'
import { revalidatePath } from 'next/cache'
import { testFactories } from '../db/test-factories'

vi.mock('../../auth', () => ({ auth: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('../../app/actions/user-actions')
vi.mock('../../app/db/favorite-groups-repository')

const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser)
const mockGetFavoriteGroupIds = vi.mocked(favoriteGroupsRepository.getFavoriteGroupIds)
const mockAddFavoriteGroup = vi.mocked(favoriteGroupsRepository.addFavoriteGroup)
const mockRemoveFavoriteGroup = vi.mocked(favoriteGroupsRepository.removeFavoriteGroup)
const mockSetMainGroup = vi.mocked(favoriteGroupsRepository.setMainGroup)
const mockClearMainGroup = vi.mocked(favoriteGroupsRepository.clearMainGroup)
const mockRevalidatePath = vi.mocked(revalidatePath)

const USER_ID = 'user-1'
const GROUP_ID = 'group-1'

const defaultUser = testFactories.user({ id: USER_ID })

beforeEach(() => {
  vi.clearAllMocks()
  mockGetLoggedInUser.mockResolvedValue(defaultUser as any)
  mockGetFavoriteGroupIds.mockResolvedValue([])
  mockAddFavoriteGroup.mockResolvedValue(undefined)
  mockRemoveFavoriteGroup.mockResolvedValue(undefined)
  mockSetMainGroup.mockResolvedValue(undefined)
  mockClearMainGroup.mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// toggleFavoriteGroupAction
// ---------------------------------------------------------------------------

describe('toggleFavoriteGroupAction', () => {
  it('throws Unauthorized when user is not logged in', async () => {
    mockGetLoggedInUser.mockResolvedValue(null as any)

    await expect(toggleFavoriteGroupAction(GROUP_ID)).rejects.toThrow('Unauthorized')
  })

  it('adds the group to favorites when not currently favorited', async () => {
    mockGetFavoriteGroupIds.mockResolvedValue([])

    const result = await toggleFavoriteGroupAction(GROUP_ID)

    expect(mockAddFavoriteGroup).toHaveBeenCalledWith(USER_ID, GROUP_ID)
    expect(mockRemoveFavoriteGroup).not.toHaveBeenCalled()
    expect(result).toEqual({ isFavorite: true })
  })

  it('removes the group from favorites when currently favorited', async () => {
    mockGetFavoriteGroupIds.mockResolvedValue([GROUP_ID])

    const result = await toggleFavoriteGroupAction(GROUP_ID)

    expect(mockRemoveFavoriteGroup).toHaveBeenCalledWith(USER_ID, GROUP_ID)
    expect(mockAddFavoriteGroup).not.toHaveBeenCalled()
    expect(result).toEqual({ isFavorite: false })
  })

  it('calls revalidatePath after toggling', async () => {
    await toggleFavoriteGroupAction(GROUP_ID)

    expect(mockRevalidatePath).toHaveBeenCalledWith('/[locale]/tournaments/[id]', 'layout')
  })

  it('does not affect other favorited groups when removing one', async () => {
    const otherGroupId = 'group-2'
    mockGetFavoriteGroupIds.mockResolvedValue([GROUP_ID, otherGroupId])

    await toggleFavoriteGroupAction(GROUP_ID)

    expect(mockRemoveFavoriteGroup).toHaveBeenCalledWith(USER_ID, GROUP_ID)
    expect(mockRemoveFavoriteGroup).not.toHaveBeenCalledWith(USER_ID, otherGroupId)
  })
})

// ---------------------------------------------------------------------------
// setMainGroupAction
// ---------------------------------------------------------------------------

describe('setMainGroupAction', () => {
  it('throws Unauthorized when user is not logged in', async () => {
    mockGetLoggedInUser.mockResolvedValue(null as any)

    await expect(setMainGroupAction(GROUP_ID)).rejects.toThrow('Unauthorized')
  })

  it('throws when the group is not in the user favorites', async () => {
    mockGetFavoriteGroupIds.mockResolvedValue([])

    await expect(setMainGroupAction(GROUP_ID)).rejects.toThrow(
      'Group must be a favorite before setting as main'
    )
    expect(mockSetMainGroup).not.toHaveBeenCalled()
  })

  it('sets the group as main when it is already a favorite', async () => {
    mockGetFavoriteGroupIds.mockResolvedValue([GROUP_ID])

    await setMainGroupAction(GROUP_ID)

    expect(mockSetMainGroup).toHaveBeenCalledWith(USER_ID, GROUP_ID)
  })

  it('calls revalidatePath after setting main group', async () => {
    mockGetFavoriteGroupIds.mockResolvedValue([GROUP_ID])

    await setMainGroupAction(GROUP_ID)

    expect(mockRevalidatePath).toHaveBeenCalledWith('/[locale]/tournaments/[id]', 'layout')
  })
})

// ---------------------------------------------------------------------------
// clearMainGroupAction
// ---------------------------------------------------------------------------

describe('clearMainGroupAction', () => {
  it('throws Unauthorized when user is not logged in', async () => {
    mockGetLoggedInUser.mockResolvedValue(null as any)

    await expect(clearMainGroupAction()).rejects.toThrow('Unauthorized')
  })

  it('calls clearMainGroup for the logged-in user', async () => {
    await clearMainGroupAction()

    expect(mockClearMainGroup).toHaveBeenCalledWith(USER_ID)
  })

  it('calls revalidatePath after clearing main group', async () => {
    await clearMainGroupAction()

    expect(mockRevalidatePath).toHaveBeenCalledWith('/[locale]/tournaments/[id]', 'layout')
  })

  it('does not call clearMainGroup for other users', async () => {
    const otherUser = testFactories.user({ id: 'other-user' })
    mockGetLoggedInUser.mockResolvedValue(otherUser as any)

    await clearMainGroupAction()

    expect(mockClearMainGroup).toHaveBeenCalledWith('other-user')
    expect(mockClearMainGroup).not.toHaveBeenCalledWith(USER_ID)
  })
})
