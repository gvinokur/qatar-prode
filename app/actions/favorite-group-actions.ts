'use server'

import { revalidatePath } from 'next/cache'
import { getLoggedInUser } from './user-actions'
import {
  getFavoriteGroupIds,
  addFavoriteGroup,
  removeFavoriteGroup,
  setMainGroup,
  clearMainGroup,
} from '../db/favorite-groups-repository'

export async function toggleFavoriteGroupAction(groupId: string): Promise<{ isFavorite: boolean }> {
  const user = await getLoggedInUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const favoriteIds = await getFavoriteGroupIds(user.id)
  const isFavorite = favoriteIds.includes(groupId)

  if (isFavorite) {
    await removeFavoriteGroup(user.id, groupId)
  } else {
    await addFavoriteGroup(user.id, groupId)
  }

  revalidatePath('/[locale]/tournaments/[id]', 'layout')
  return { isFavorite: !isFavorite }
}

export async function setMainGroupAction(groupId: string): Promise<void> {
  const user = await getLoggedInUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const favoriteIds = await getFavoriteGroupIds(user.id)
  if (!favoriteIds.includes(groupId)) {
    throw new Error('Group must be a favorite before setting as main')
  }

  await setMainGroup(user.id, groupId)
  revalidatePath('/[locale]/tournaments/[id]', 'layout')
}

export async function clearMainGroupAction(): Promise<void> {
  const user = await getLoggedInUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  await clearMainGroup(user.id)
  revalidatePath('/[locale]/tournaments/[id]', 'layout')
}
