import { db } from './database';
import { ShortUrl, ShortUrlTable } from './tables-definition';
import { createBaseFunctions } from './base-repository';
import { cache } from 'react';
import crypto from 'crypto';

// Base CRUD operations
const baseFunctions = createBaseFunctions<ShortUrlTable, ShortUrl>('short_urls');
export const findShortUrlById = baseFunctions.findById;
export const deleteShortUrl = baseFunctions.delete;

// Find by code (NO caching - called during redirect which doesn't work well with React cache)
export async function getShortUrlByCode(code: string): Promise<ShortUrl | undefined> {
  return db
    .selectFrom('short_urls')
    .selectAll()
    .where('code', '=', code)
    .executeTakeFirst();
}

// Find existing short URL for group (one per group, ignoring tournament context)
export const getShortUrlForGroup = cache(async (groupId: string): Promise<ShortUrl | undefined> => {
  return db
    .selectFrom('short_urls')
    .selectAll()
    .where('group_id', '=', groupId)
    .executeTakeFirst();
});

// Generate short code using cryptographically secure random
function generateShortCode(): string {
  const base62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const codeLength = 6;
  let code = '';

  const bytes = crypto.randomBytes(codeLength);
  for (let i = 0; i < codeLength; i++) {
    code += base62[bytes[i] % 62];
  }

  return code;
}

// Create short URL with collision handling
export async function createShortUrl(
  groupId: string,
  tournamentId?: string
): Promise<ShortUrl> {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateShortCode();

    try {
      return await db
        .insertInto('short_urls')
        .values({
          code,
          group_id: groupId,
          tournament_id: tournamentId ?? null,
          click_count: 0
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error: any) {
      // Check for unique constraint violation on code
      const isCodeCollision = error?.code === '23505' &&
                             (error?.constraint === 'idx_short_urls_code' ||
                              error?.constraint?.includes('code'));

      // Check for unique constraint violation on group_id (shouldn't happen in getOrCreateShortUrl, but defensive)
      const isGroupCollision = error?.code === '23505' &&
                              (error?.constraint === 'idx_short_urls_group' ||
                               error?.constraint?.includes('group'));

      if (isCodeCollision) {
        if (attempt < maxAttempts - 1) {
          // Code collision - try again with new code
          continue;
        } else {
          // Max attempts reached - throw custom error
          throw new Error(`Failed to generate unique short code after ${maxAttempts} attempts`);
        }
      }

      if (isGroupCollision) {
        // Group already has a short URL - this shouldn't happen if using getOrCreateShortUrl correctly
        throw new Error(`Group ${groupId} already has a short URL. Use getOrCreateShortUrl instead.`);
      }

      // Some other error - re-throw
      throw error;
    }
  }

  throw new Error(`Failed to generate unique short code after ${maxAttempts} attempts`);
}

// Get or create short URL (upsert pattern - one per group)
export async function getOrCreateShortUrl(
  groupId: string,
  tournamentId?: string
): Promise<ShortUrl> {
  // Look up by group_id only (one short URL per group)
  const existing = await getShortUrlForGroup(groupId);

  if (existing) {
    // If tournament context changed, UPDATE the short URL to point to new tournament
    // This ensures users are redirected to the CURRENT tournament, not the original one
    if (existing.tournament_id !== tournamentId) {
      return await db
        .updateTable('short_urls')
        .set({ tournament_id: tournamentId ?? null })
        .where('id', '=', existing.id)
        .returningAll()
        .executeTakeFirstOrThrow();
    }
    return existing;
  }

  // Create new short URL with tournament context
  return createShortUrl(groupId, tournamentId);
}

// Increment click count (fire-and-forget)
export async function incrementClickCount(code: string): Promise<void> {
  await db
    .updateTable('short_urls')
    .set(eb => ({
      click_count: eb('click_count', '+', 1)
    }))
    .where('code', '=', code)
    .execute();
}
