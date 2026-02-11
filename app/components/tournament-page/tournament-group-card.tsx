'use client'

import Link from 'next/link';
import { Typography, Button, Box, Chip } from "../mui-wrappers/";
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  IconButton
} from "@mui/material";
import {Share as ShareIcon} from "@mui/icons-material";
import type { TournamentGroupStats } from "../../definitions";
import InviteFriendsDialog from "../invite-friends-dialog";

interface TournamentGroupCardProps {
  readonly group: TournamentGroupStats;
  readonly tournamentId: string;
}

export default function TournamentGroupCard({ group, tournamentId }: TournamentGroupCardProps) {
  const isLeader = group.userPosition === 1;
  const leaderDisplay = isLeader ? "¡Tú!" : group.leaderName;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
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
                label="Dueño"
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
              />
            </>
          )}
        </Box>

        {/* Stats Section */}
        <Stack spacing={1.5}>
          {/* Position and Points - Compact Layout */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                Tu Posición
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: isLeader ? 'primary.main' : 'text.primary' }}>
                #{group.userPosition} de {group.totalParticipants}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                Tus Puntos
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {group.userPoints}
              </Typography>
            </Box>
          </Box>

          {/* Leader */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Líder
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {leaderDisplay} ({group.leaderPoints} pts)
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ pt: 0, pb: 2, px: 2, justifyContent: 'flex-end' }}>
        <Button
          component={Link}
          href={`/tournaments/${tournamentId}/friend-groups/${group.groupId}`}
          variant="text"
          color="primary"
          size="small"
        >
          Ver Detalles
        </Button>
      </CardActions>
    </Card>
  );
}
