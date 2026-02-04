'use client'

import Link from 'next/link';
import { Typography, Button, Box, Chip } from "../mui-wrappers/";
import {
  Card,
  CardContent,
  CardActions,
  Stack
} from "@mui/material";
import type { TournamentGroupStats } from "../../definitions";

interface TournamentGroupCardProps {
  group: TournamentGroupStats;
  tournamentId: string;
}

export default function TournamentGroupCard({ group, tournamentId }: TournamentGroupCardProps) {
  const isLeader = group.userPosition === 1;
  const leaderDisplay = isLeader ? "You!" : group.leaderName;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: 1,
        borderColor: 'divider',
        ...(isLeader && {
          borderColor: 'primary.main',
          borderWidth: 2
        }),
        ...(group.themeColor && {
          borderLeft: `4px solid ${group.themeColor}`
        })
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Group Name with Owner Badge */}
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
            <Chip
              label="Owner"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Box>

        {/* Stats Section */}
        <Stack spacing={1.5}>
          {/* Position */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Your Position
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: isLeader ? 'primary.main' : 'text.primary' }}>
              #{group.userPosition} of {group.totalParticipants}
            </Typography>
          </Box>

          {/* Points */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Your Points
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {group.userPoints}
            </Typography>
          </Box>

          {/* Leader */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Leader
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {leaderDisplay} ({group.leaderPoints} pts)
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
        <Button
          component={Link}
          href={`/friend-groups/${group.groupId}?tournament=${tournamentId}`}
          variant="text"
          color="primary"
          size="small"
          sx={{ ml: 'auto' }}
        >
          View Details →
        </Button>
      </CardActions>
    </Card>
  );
}
