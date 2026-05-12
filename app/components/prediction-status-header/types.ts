export type StatusHeaderTone =
  | 'brand'          // pre-tournament calm
  | 'calm'           // stage-active, caught up
  | 'success'        // completed pre-lock
  | 'deadlineSoon'   // < 48h
  | 'deadlineUrgent' // < 24h
  | 'deadlineNow'    // < 2h
  | 'locked'         // post-lock

export type HeaderAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never }

export interface StatusHeaderVariant {
  tone: StatusHeaderTone
  stageLabel?: string
  leadIcon: 'rocket' | 'check' | 'info' | 'warning' | 'error' | 'lock' | 'flag' | 'trophy' | 'login' | 'clock' | 'book' | 'mobile' | 'bell'
  /** Overrides icon + status text color (e.g. success.main on a calm-tone caught-up variant) */
  statusColor?: string
  statusText: string
  chip?: { label: string; color: 'default' | 'success' | 'error' | 'warning' | 'info' }
  boosts?: { silverUsed: number; silverMax: number; goldenUsed: number; goldenMax: number }
  pointsBadge?: string
  message?: string
  action?: HeaderAction
  secondaryAction?: HeaderAction
}
