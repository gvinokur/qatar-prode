import { db } from './database'

export async function getFavoriteGroupIds(userId: string): Promise<string[]> {
  const rows = await db
    .selectFrom('user_favorite_groups')
    .select('group_id')
    .where('user_id', '=', userId)
    .execute()
  return rows.map((r) => r.group_id)
}

export async function getMainGroupId(userId: string): Promise<string | null> {
  const row = await db
    .selectFrom('user_favorite_groups')
    .select('group_id')
    .where('user_id', '=', userId)
    .where('is_main', '=', true)
    .executeTakeFirst()
  return row?.group_id ?? null
}

export async function addFavoriteGroup(userId: string, groupId: string): Promise<void> {
  await db
    .insertInto('user_favorite_groups')
    .values({ user_id: userId, group_id: groupId, is_main: false })
    .onConflict((oc) => oc.doNothing())
    .execute()
}

export async function removeFavoriteGroup(userId: string, groupId: string): Promise<void> {
  await db
    .deleteFrom('user_favorite_groups')
    .where('user_id', '=', userId)
    .where('group_id', '=', groupId)
    .execute()
}

export async function setMainGroup(userId: string, groupId: string): Promise<void> {
  // Clear any existing main group for this user
  await db
    .updateTable('user_favorite_groups')
    .set({ is_main: false })
    .where('user_id', '=', userId)
    .where('is_main', '=', true)
    .execute()

  // Upsert the row as main (group must already be a favorite)
  await db
    .insertInto('user_favorite_groups')
    .values({ user_id: userId, group_id: groupId, is_main: true })
    .onConflict((oc) =>
      oc.columns(['user_id', 'group_id']).doUpdateSet({ is_main: true })
    )
    .execute()
}

export async function clearMainGroup(userId: string): Promise<void> {
  await db
    .updateTable('user_favorite_groups')
    .set({ is_main: false })
    .where('user_id', '=', userId)
    .where('is_main', '=', true)
    .execute()
}
