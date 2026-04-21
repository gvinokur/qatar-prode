import { Avatar, Card, CardContent, CardHeader, Typography } from '@mui/material'

type Props = {
  readonly title: string
  readonly icon: React.ReactNode
  readonly count?: React.ReactNode
  readonly children?: React.ReactNode
  readonly urgent?: boolean
}

export function DashboardCard({ title, icon, count, children, urgent }: Props) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderColor: urgent ? 'error.main' : 'divider',
      }}
    >
      <CardHeader
        avatar={
          <Avatar
            sx={{
              bgcolor: 'rgba(167, 139, 250, 0.1)',
              color: 'primary.main',
              width: 32,
              height: 32,
            }}
          >
            {icon}
          </Avatar>
        }
        title={
          <Typography variant="subtitle1" fontWeight={700} fontSize="0.95rem">
            {title}
          </Typography>
        }
        action={
          count === undefined ? undefined : (
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 1, mr: 1 }}>
              {count}
            </Typography>
          )
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ flexGrow: 1, pt: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </CardContent>
    </Card>
  )
}
