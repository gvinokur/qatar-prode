import BugReportIcon from '@mui/icons-material/BugReport'

type Props = Readonly<{
  color?: string
  fontSize?: 'small' | 'medium' | 'large'
}>

export function DevTournamentBadge({ color = 'warning.main', fontSize = 'small' }: Props) {
  return (
    <BugReportIcon
      fontSize={fontSize}
      sx={{ color }}
      titleAccess="Development Tournament"
    />
  )
}
