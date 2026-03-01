import { Box, Typography, Button } from '../../../../../components/mui-wrappers';
import Link from 'next/link';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { getPublicGroupsAction } from '../../../../../actions/prode-group-discovery-actions';
import { getLoggedInUser } from '../../../../../actions/user-actions';
import { findJoinRequestsByUser } from '../../../../../db/prode-group-join-request-repository';
import { findProdeGroupsByOwner, findProdeGroupsByParticipant } from '../../../../../db/prode-group-repository';
import { getTranslations } from 'next-intl/server';
import PublicGroupsBrowser from '../../../../../components/friend-groups/public-groups-browser';
import type { DiscoveryGroupData } from '../../../../../components/tournament-page/tournament-group-card';

type Props = {
  readonly params: Promise<{
    id: string;
    locale: string;
  }>;
  readonly searchParams: Promise<{ search?: string; page?: string }>;
};

export default async function DiscoverGroupsPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslations('groups.discovery');
  const tActions = await getTranslations('groups.actions');

  const searchTerm = searchParams.search ?? '';
  const page = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10) || 1);

  // Fetch public groups (no auth required)
  const result = await getPublicGroupsAction(searchTerm || undefined, page, params.id);

  if ('error' in result) {
    return (
      <Box p={3}>
        <Typography color="error">{result.error}</Typography>
      </Box>
    );
  }

  // Get user info if logged in (guests get null)
  const user = await getLoggedInUser();

  // Build a set of group IDs where user has pending requests or is a member
  const pendingGroupIds = new Set<string>();
  const memberGroupIds = new Set<string>();

  if (user) {
    const [joinRequests, ownedGroups, participantGroups] = await Promise.all([
      findJoinRequestsByUser(user.id, 'pending'),
      findProdeGroupsByOwner(user.id),
      findProdeGroupsByParticipant(user.id)
    ]);

    for (const req of joinRequests) {
      pendingGroupIds.add(req.group_id);
    }
    for (const g of ownedGroups) {
      memberGroupIds.add(g.id);
    }
    for (const g of participantGroups) {
      memberGroupIds.add(g.id);
    }
  }

  // Compute userStatus for each group
  const groupsWithStatus: DiscoveryGroupData[] = result.groups.map((group) => {
    let userStatus: 'none' | 'pending' | 'member' = 'none';
    if (memberGroupIds.has(group.id)) {
      userStatus = 'member';
    } else if (pendingGroupIds.has(group.id)) {
      userStatus = 'pending';
    }
    return { ...group, userStatus };
  });

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Back Navigation */}
      <Box sx={{ mb: 1 }}>
        <Button
          component={Link}
          href={`/${params.locale}/tournaments/${params.id}/friend-groups`}
          startIcon={<ArrowBackIcon />}
          size="small"
        >
          {tActions('backToGroups')}
        </Button>
      </Box>

      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 0.5 }}>
          {t('title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('subtitle')}
        </Typography>
      </Box>

      {/* Browser with search + grid + pagination */}
      <PublicGroupsBrowser
        initialGroups={groupsWithStatus}
        initialSearchTerm={searchTerm}
        initialPage={page}
        totalPages={result.totalPages}
        totalCount={result.totalCount}
        tournamentId={params.id}
        currentUserId={user?.id ?? null}
      />
    </Box>
  );
}
