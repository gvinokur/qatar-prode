'use server';

import { findPublicGroups, countPublicGroups } from '../db/prode-group-repository';

const PAGE_SIZE = 20;
const MAX_PAGE = 100;

export interface PublicGroupResult {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  owner: { id: string; name: string };
  memberCount: number;
  bettingEnabled: boolean;
}

export interface GetPublicGroupsResult {
  groups: PublicGroupResult[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

/**
 * Get paginated public groups for discovery page.
 * No authentication required — guests can browse.
 */
export async function getPublicGroupsAction(
  searchTerm?: string,
  page = 1,
  tournamentId?: string
): Promise<GetPublicGroupsResult | { error: string }> {
  if (page < 1 || page > MAX_PAGE) {
    return { error: `Page must be between 1 and ${MAX_PAGE}` };
  }

  const cleanSearchTerm = searchTerm?.trim() || undefined;
  const offset = (page - 1) * PAGE_SIZE;

  const [groups, totalCount] = await Promise.all([
    findPublicGroups(cleanSearchTerm, PAGE_SIZE, offset, tournamentId),
    countPublicGroups(cleanSearchTerm)
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    groups,
    totalCount,
    currentPage: page,
    totalPages
  };
}
