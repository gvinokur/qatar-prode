import { db } from './database';
import { ShortUrl, ShortUrlTable } from './tables-definition';
import { createBaseFunctions } from './base-repository';
import { cache } from 'react';
import crypto from 'node:crypto';

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

// Helper to check database constraint errors
function isUniqueConstraintError(error: any, constraintName: string): boolean {
  return error?.code === '23505' &&
         (error?.constraint === constraintName || error?.constraint?.includes(constraintName.split('_').pop() || ''));
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
      const isCodeCollision = isUniqueConstraintError(error, 'idx_short_urls_code');
      const isGroupCollision = isUniqueConstraintError(error, 'idx_short_urls_group');

      if (isGroupCollision) {
        throw new Error(`Group ${groupId} already has a short URL. Use getOrCreateShortUrl instead.`);
      }

      if (isCodeCollision && attempt < maxAttempts - 1) {
        continue; // Try again with new code
      }

      if (isCodeCollision) {
        throw new Error(`Failed to generate unique short code after ${maxAttempts} attempts`);
      }

      throw error; // Some other error
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
