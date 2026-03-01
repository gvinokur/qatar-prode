'use server';

import { getOrCreateShortUrl } from '@/app/db/short-url-repository';
import { ShortUrl } from '@/app/db/tables-definition';

/**
 * Get or create a short URL for a friend group
 * @param groupId - The friend group ID
 * @param tournamentId - Optional tournament context
 * @returns Short URL object with code
 */
export async function generateShortUrlForGroup(
  groupId: string,
  tournamentId?: string
): Promise<ShortUrl> {
  return getOrCreateShortUrl(groupId, tournamentId);
}

/**
 * Build full short URL for display/sharing
 * @param code - The short code
 * @returns Full URL (e.g., https://prodemundial.app/j/abc123)
 */
export async function buildShortUrl(code: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prodemundial.app';
  return `${baseUrl}/j/${code}`;
}
