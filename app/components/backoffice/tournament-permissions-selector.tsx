'use client'

import {
  Box,
  Autocomplete,
  TextField,
  Chip,
  Typography
} from '@mui/material'

type UserOption = {
  id: string
  email: string
  nickname: string | null
  isAdmin: boolean
}

type Props = {
  allUsers: UserOption[]
  selectedUserIds: string[]
  onChange: (_userIds: string[]) => void
  disabled?: boolean
}

export default function TournamentPermissionsSelector({
  allUsers,
  selectedUserIds,
  onChange,
  disabled = false
}: Props) {
  const selectedUsers = allUsers.filter(u => selectedUserIds.includes(u.id))

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={1}>
        Select users who can view this development tournament in production
      </Typography>
      <Autocomplete
        multiple
        id="tournament-permissions-autocomplete"
        options={allUsers}
        value={selectedUsers}
        disabled={disabled}
        getOptionLabel={(option) =>
          `${option.email}${option.nickname ? ` (${option.nickname})` : ''}${option.isAdmin ? ' [Admin]' : ''}`
        }
        onChange={(_, newValue) => {
          onChange(newValue.map(u => u.id))
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Permitted Users"
            placeholder="Search by email or nickname"
            helperText="Only selected users will be able to access this tournament in production"
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.id}
              label={option.nickname || option.email}
              color={option.isAdmin ? 'primary' : 'default'}
              size="small"
            />
          ))
        }
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box>
              <Typography variant="body2">
                {option.email}
                {option.isAdmin && (
                  <Chip label="Admin" size="small" color="primary" sx={{ ml: 1 }} />
                )}
              </Typography>
              {option.nickname && (
                <Typography variant="caption" color="text.secondary">
                  {option.nickname}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterOptions={(options, { inputValue }) => {
          const searchTerm = inputValue.toLowerCase()
          return options.filter(
            opt =>
              opt.email.toLowerCase().includes(searchTerm) ||
              opt.nickname?.toLowerCase().includes(searchTerm)
          )
        }}
      />
    </Box>
  )
}
