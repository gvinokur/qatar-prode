import { redirect } from 'next/navigation';
import { getLoggedInUser } from '../../../../actions/user-actions';
import { findProdeGroupById, findParticipantsInGroup } from '../../../../db/prode-group-repository';
import { findPendingJoinRequest } from '../../../../db/prode-group-join-request-repository';
import { Alert, Box, Typography } from '../../../../components/mui-wrappers';
import PendingRequestView from '../../../../components/friend-groups/pending-request-view';
import JoinRequestForm from '../../../../components/friend-groups/join-request-form';

type Props = {
  readonly params: Promise<{
    id: string;
    locale: string;
  }>;
  readonly searchParams: Promise<{
    openSignin?: string;
  }>;
};

export default async function JoinGroup(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const user = await getLoggedInUser();

  // Require authentication
  if (!user) {
    if (searchParams.openSignin) {
      return (
        <Box>
          <Alert severity="info" variant="filled">
            <Typography variant="h6" fontWeight={'bold'}>
              You must sign in or register to join this group.
            </Typography>
          </Alert>
        </Box>
      );
    } else {
      redirect(`/${params.locale}/friend-groups/join/${params.id}/?openSignin=true`);
    }
  }

  // Find the group
  const group = await findProdeGroupById(params.id);
  if (!group) {
    return (
      <Box>
        <Alert variant="filled" severity="error">
          The group you are trying to join does not exist or an error occurred. Please check with the administrator.
        </Alert>
      </Box>
    );
  }

  // Check if user is already a member or owner
  const participants = await findParticipantsInGroup(group.id);
  const isAlreadyMember = participants.some((p) => p.user_id === user.id);

  if (isAlreadyMember || group.owner_user_id === user.id) {
    // Already a member, redirect to group page
    redirect(`/${params.locale}/friend-groups/${group.id}`);
  }

  // Check if user has a pending request
  const pendingRequest = await findPendingJoinRequest(group.id, user.id);

  if (pendingRequest) {
    // Show pending request view
    return (
      <PendingRequestView
        group={group}
        requestId={pendingRequest.id}
        requestedAt={pendingRequest.requested_at}
        memberCount={participants.length}
      />
    );
  }

  // Show join request form
  return <JoinRequestForm group={group} memberCount={participants.length} locale={params.locale as 'en' | 'es'} />;
}
