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
import {Share as ShareIcon} from "@mui/icons-material";
import type { TournamentGroupStats } from "../../definitions";
import InviteFriendsDialog from "../invite-friends-dialog";
import { useLocale, useTranslations } from 'next-intl';

interface TournamentGroupCardProps {
  readonly group: TournamentGroupStats;
  readonly tournamentId: string;
  readonly isPending?: boolean;
}

export default function TournamentGroupCard({ group, tournamentId, isPending = false }: TournamentGroupCardProps) {
  const locale = useLocale();
  const t = useTranslations('groups.card');
  const tPending = useTranslations('groups.pendingRequest');
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
            🏆 {group.groupName}
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
                  <IconButton size="small" aria-label="Compartir grupo">
                    <ShareIcon fontSize="small" />
                  </IconButton>
                }
                groupId={group.groupId}
                groupName={group.groupName}
                tournamentId={tournamentId}
              />
            </>
          )}
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
      <CardActions sx={{ pt: 0, pb: 2, px: 2, justifyContent: 'flex-end' }}>
        {isPending ? (
          <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
            {tPending('awaitingApproval')}
          </Typography>
        ) : (
          <Button
            component={Link}
            href={`/${locale}/tournaments/${tournamentId}/friend-groups/${group.groupId}`}
            variant="text"
            color="primary"
            size="small"
          >
            {t('viewDetails')}
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
