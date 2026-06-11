'use client'

import { useState, useEffect } from 'react'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  getAllGroupsForAdminAction,
  getUserTournamentCompletionsAction,
  type UserTournamentCompletionRow,
} from '../../actions/admin-tournament-actions'

const PAGE_SIZE = 25

interface Props {
  readonly tournamentId: string
}

export default function UserCompletionTab({ tournamentId }: Props) {
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<UserTournamentCompletionRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupId, setGroupId] = useState('')
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    getAllGroupsForAdminAction().then(setGroups).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    getUserTournamentCompletionsAction(tournamentId, page, PAGE_SIZE, groupId || undefined)
      .then(({ rows: fetched, total: count }) => {
        setRows(fetched)
        setTotal(count)
      })
      .catch(() => setError('Failed to load user completion data.'))
      .finally(() => setLoading(false))
  }, [tournamentId, page, groupId])

  function renderGroups(row: UserTournamentCompletionRow) {
    if (row.groupCount === 0) return '—'
    const title = row.groupNames.join(', ')
    return (
      <Tooltip title={title} placement="top">
        <Chip label={row.groupCount} size="small" />
      </Tooltip>
    )
  }

  function renderTableBody() {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
            <CircularProgress size={24} />
          </TableCell>
        </TableRow>
      )
    }
    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={7}>
            <Alert severity="error">{error}</Alert>
          </TableCell>
        </TableRow>
      )
    }
    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No users found
            </Typography>
          </TableCell>
        </TableRow>
      )
    }
    return rows.map((row) => (
      <TableRow
        key={row.userId}
        sx={row.gamesPredicted === 0 && row.qualifiersFilled === 0 && row.awardsFilled === 0
          ? { opacity: 0.6 }
          : undefined}
      >
        <TableCell>{row.nickname}</TableCell>
        <TableCell>
          {row.gamesPredicted > 0 || row.qualifiersFilled > 0 || row.awardsFilled > 0 ? (
            <Chip label="Yes" color="success" size="small" />
          ) : (
            <Chip label="No" size="small" />
          )}
        </TableCell>
        <TableCell>{row.overallPct}%</TableCell>
        <TableCell>{row.gamesPredicted} / {row.totalGames}</TableCell>
        <TableCell>{row.qualifiersFilled} / {row.qualifiersTotal}</TableCell>
        <TableCell>{row.awardsFilled} / {row.awardsTotal}</TableCell>
        <TableCell>{renderGroups(row)}</TableCell>
      </TableRow>
    ))
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="group-filter-label">Filter by group</InputLabel>
          <Select
            labelId="group-filter-label"
            label="Filter by group"
            value={groupId}
            displayEmpty
            onChange={(e) => {
              setPage(0)
              setGroupId(e.target.value)
            }}
          >
            <MenuItem value="">All groups</MenuItem>
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Display Name</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Completion %</TableCell>
              <TableCell>Games</TableCell>
              <TableCell>Qualifiers</TableCell>
              <TableCell>Awards</TableCell>
              <TableCell>Groups</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderTableBody()}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
          onPageChange={(_, newPage) => setPage(newPage)}
        />
      </TableContainer>
    </Box>
  )
}
