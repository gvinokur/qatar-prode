'use client'

import Link from 'next/link';
import { Typography, Button, Box, Chip } from "../mui-wrappers/";
import {
  Card,
  CardActionArea,
  CardContent,
  CardActions,
  Stack,
  IconButton
} from "@mui/material";
import {Groups as GroupsIcon, Share as ShareIcon, MonetizationOn as MonetizationOnIcon} from "@mui/icons-material";
import type { TournamentGroupStats } from "../../definitions";
import InviteFriendsDialog from "../invite-friends-dialog";
import { useLocale, useTranslations } from 'next-intl';
import PrivacyIndicatorIcon from '../friend-groups/privacy-indicator-icon';

export interface DiscoveryGroupData {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  owner: { id: string; name: string };
  memberCount: number;
  userStatus: 'none' | 'pending' | 'member';
  bettingEnabled: boolean;
}

// my-groups variant props
interface MyGroupsCardProps {
  readonly variant?: 'my-groups';
  readonly group: TournamentGroupStats;
  readonly tournamentId: string;
  readonly isPending?: boolean;
}

// discovery variant props
interface DiscoveryCardProps {
  readonly variant: 'discovery';
  readonly group: DiscoveryGroupData;
  readonly tournamentId: string;
  readonly onRequestJoin?: (groupId: string) => void;
  readonly isPending?: never;
}

type TournamentGroupCardProps = MyGroupsCardProps | DiscoveryCardProps;

export default function TournamentGroupCard(props: TournamentGroupCardProps) {
  const locale = useLocale();
  const t = useTranslations('groups.card');
  const tPending = useTranslations('groups.pendingRequest');
  const tDiscovery = useTranslations('groups.discovery');
  const tBetting = useTranslations('groups.betting');

  if (props.variant === 'discovery') {
    const { group, tournamentId, onRequestJoin } = props;

    const actionButton = (() => {
      if (group.userStatus === 'member') {
        return (
          <Button
            component={Link}
            href={`/${locale}/tournaments/${tournamentId}/friend-groups/${group.id}`}
            variant="outlined"
            color="primary"
            size="small"
            fullWidth
          >
            {tDiscovery('viewLeaderboard')}
          </Button>
        );
      }
      if (group.userStatus === 'pending') {
        return (
          <Button
            variant="outlined"
            color="warning"
            size="small"
            disabled
            fullWidth
          >
            {tDiscovery('pending')}
          </Button>
        );
      }
      return (
        <Button
          variant="contained"
          color="primary"
          size="small"
          fullWidth
          onClick={() => onRequestJoin?.(group.id)}
          startIcon={<GroupsIcon />}
        >
          {tDiscovery('requestToJoin')}
        </Button>
      );
    })();

    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Group Name with Public Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <PrivacyIndicatorIcon isPublic={true} size="small" />
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                flexGrow: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {group.name}
            </Typography>
          </Box>

          {/* Description */}
          {group.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4
              }}
            >
              {group.description}
            </Typography>
          )}

          {/* Stats */}
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              👥 {tDiscovery('memberCount', { count: group.memberCount })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {tDiscovery('createdBy', { name: group.owner.name })}
            </Typography>
            {group.bettingEnabled && (
              <Chip
                icon={<MonetizationOnIcon fontSize="small" />}
                label={tBetting('statusEnabled')}
                size="small"
                color="success"
                variant="outlined"
                sx={{ alignSelf: 'flex-start', fontSize: '0.75rem' }}
              />
            )}
          </Stack>
        </CardContent>

        <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
          {actionButton}
        </CardActions>
      </Card>
    );
  }

  // my-groups variant (original behavior, unchanged)
  const { group, tournamentId, isPending = false } = props;
  const isLeader = group.userPosition === 1;
  const leaderDisplay = isLeader ? t('you') : group.leaderName;

  const cardContent = (
    <>
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {isPending && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={tPending('status')}
              color="warning"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        )}
        {/* Group Name with Owner Badge and Share Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              flexGrow: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {group.groupName}
          </Typography>
          {group.isOwner && (
            <>
              <Chip
                label={t('owner')}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              <InviteFriendsDialog
                trigger={
                  <IconButton size="small" color="primary" aria-label="Compartir grupo">
                    <ShareIcon fontSize="small" />
                  </IconButton>
                }
                groupId={group.groupId}
                groupName={group.groupName}
                tournamentId={tournamentId}
              />
            </>
          )}
          <PrivacyIndicatorIcon isPublic={group.is_public ?? false} size="small" />
        </Box>

        {/* Stats Section */}
        <Stack spacing={1.5} sx={{ filter: isPending ? 'blur(3px)' : 'none', pointerEvents: isPending ? 'none' : 'auto' }}>
          {/* Position and Points - Compact Layout */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                {t('yourPosition')}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: isLeader ? 'primary.main' : 'text.primary' }}>
                {t('positionOf', { position: group.userPosition, total: group.totalParticipants })}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                {t('yourPoints')}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {group.userPoints}
              </Typography>
            </Box>
          </Box>

          {/* Betting */}
          {group.bettingEnabled && (
            <Chip
              icon={<MonetizationOnIcon fontSize="small" />}
              label={tBetting('statusEnabled')}
              size="small"
              color="success"
              variant="outlined"
              sx={{ alignSelf: 'flex-start', fontSize: '0.75rem' }}
            />
          )}

          {/* Leader */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              {t('leader')}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {leaderDisplay} ({group.leaderPoints} pts)
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ pt: 0, pb: 2, px: 2, justifyContent: 'center' }}>
        {isPending ? (
          <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
            {tPending('awaitingApproval')}
          </Typography>
        ) : (
          <Button
            component={Link}
            href={`/${locale}/tournaments/${tournamentId}/friend-groups/${group.groupId}`}
            variant="outlined"
            color="primary"
            size="small"
            fullWidth
          >
            {t('viewLeaderboard')}
          </Button>
        )}
      </CardActions>
    </>
  );

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: isPending ? 0.7 : 1,
        ...(isPending && {
          border: '2px dashed',
          borderColor: 'warning.main'
        })
      }}
    >
      {isPending ? (
        <CardActionArea
          component={Link}
          href={`/${locale}/tournaments/${tournamentId}/friend-groups/join/${group.groupId}`}
          sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'stretch' }}
        >
          {cardContent}
        </CardActionArea>
      ) : (
        cardContent
      )}
    </Card>
  );
}
