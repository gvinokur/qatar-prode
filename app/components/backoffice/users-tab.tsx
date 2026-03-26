'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { getUsersPaginated } from '../../actions/user-actions'

const PROVIDER_LABELS: Record<string, string> = {
  credentials: 'Password',
  google: 'Google',
  otp: 'OTP / Magic Link',
}

const PAGE_SIZE = 25

type UserRow = Awaited<ReturnType<typeof getUsersPaginated>>['users'][number]

export default function UsersTab() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when search changes
  useEffect(() => {
    setPage(0)
  }, [debouncedSearch])

  // Fetch when debouncedSearch or page changes
  useEffect(() => {
    setLoading(true)
    getUsersPaginated(debouncedSearch, page, PAGE_SIZE)
      .then(({ users: fetched, total: count }) => {
        setUsers(fetched)
        setTotal(count)
      })
      .finally(() => setLoading(false))
  }, [debouncedSearch, page])

  function renderTableBody() {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
            <CircularProgress size={24} />
          </TableCell>
        </TableRow>
      )
    }
    if (users.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No users found
            </Typography>
          </TableCell>
        </TableRow>
      )
    }
    return users.map((user) => {
      const providers = (user.auth_providers as string[] | null) ?? []
      return (
        <TableRow key={user.id}>
          <TableCell>{user.nickname ?? '(no nickname)'}</TableCell>
          <TableCell>{user.email}</TableCell>
          <TableCell>
            {providers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                (no login method)
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {providers.map((p) => (
                  <Chip
                    key={p}
                    label={PROVIDER_LABELS[p] ?? p}
                    size="small"
                  />
                ))}
              </Box>
            )}
          </TableCell>
          <TableCell>{user.is_admin ? 'Admin' : 'User'}</TableCell>
          <TableCell>
            {user.email_verified ? (
              <CheckIcon fontSize="small" color="success" />
            ) : (
              <CloseIcon fontSize="small" color="error" />
            )}
          </TableCell>
        </TableRow>
      )
    })
  }

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        label="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2, width: 320 }}
      />

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Display Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Login Method(s)</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Verified</TableCell>
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
