'use client'

import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardHeader,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Theme,
  Typography,
  useTheme,
} from '@mui/material'
import {
  AccountTree as AccountTreeIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as EmojiEventsIcon,
  ExpandMore as ExpandMoreIcon,
  Gavel as GavelIcon,
  Info as InfoIcon,
  Language as LanguageIcon,
  Schedule as ScheduleIcon,
  SportsSoccer as SportsSoccerIcon,
} from '@mui/icons-material'
import { ExpandMore } from './expand-more'
import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import WinnerDrawExample from './rules-examples/winner-draw'
import GoalDifferenceExample from './rules-examples/goal-difference'
import ExactScoreExample from './rules-examples/exact-score'
import RoundOf16Example from './rules-examples/round-of-16'
import ChampionExample from './rules-examples/champion'
import RunnerUpExample from './rules-examples/runner-up'
import ThirdPlaceExample from './rules-examples/third-place'
import IndividualAwardsExample from './rules-examples/individual-awards'
import MatchPredictionTimeExample from './rules-examples/match-prediction-time'
import PodiumPredictionTimeExample from './rules-examples/podium-prediction-time'
import SinglePredictionExample from './rules-examples/single-prediction'
import GroupPositionExample from './rules-examples/group-position'
import QualifiedTeamsPredictionTimeExample from './rules-examples/qualified-teams-prediction-time'
import { DEFAULT_SCORING, type ScoringConfig } from '../../utils/scoring-config'

export type { ScoringConfig } from '../../utils/scoring-config'

const SILVER_COLOR = '#C0C0C0'
const GOLD_COLOR = '#FFD700'

type PointChip = { type: 'points'; value: string } | { type: 'zero' } | { type: 'silver' } | { type: 'gold' }

interface RuleItemData {
  label: string
  chip?: PointChip
  icon: 'check' | 'cancel' | 'schedule' | 'info' | 'silver' | 'gold'
  example?: React.ReactNode
}

interface RuleCategoryData {
  titleKey: string
  headerIcon: React.ReactNode
  scoring: RuleItemData[]
  deadlines: RuleItemData[]
  general: RuleItemData[]
}

interface RulesProps {
  readonly expanded?: boolean
  readonly fullpage?: boolean
  readonly scoringConfig?: ScoringConfig
  readonly tournamentId?: string
  readonly isActive?: boolean
  /** Pre-formatted QT/Awards lock date (e.g. "June 16, 2026"). When omitted, falls back to "2 days after the tournament starts". */
  readonly lockDate?: string
}

function RuleItemChip({ chip }: Readonly<{ chip: PointChip }>) {
  const baseStyle = {
    px: 0.75,
    py: 0.25,
    borderRadius: 1,
    ml: 1,
    fontWeight: 800,
    fontSize: '0.65rem',
    minWidth: 28,
    textAlign: 'center' as const,
    flexShrink: 0,
  }

  if (chip.type === 'zero') {
    return (
      <Box sx={{ ...baseStyle, bgcolor: 'rgba(244,63,94,0.08)', color: 'error.main', border: '1px solid rgba(244,63,94,0.25)' }}>
        0
      </Box>
    )
  }
  if (chip.type === 'silver') {
    return (
      <Box sx={{ ...baseStyle, bgcolor: 'rgba(192,192,192,0.1)', color: SILVER_COLOR, border: `1px solid ${SILVER_COLOR}` }}>
        X2
      </Box>
    )
  }
  if (chip.type === 'gold') {
    return (
      <Box sx={{ ...baseStyle, bgcolor: 'rgba(255,215,0,0.1)', color: GOLD_COLOR, border: `1px solid ${GOLD_COLOR}` }}>
        X3
      </Box>
    )
  }
  return (
    <Box sx={{ ...baseStyle, bgcolor: 'rgba(16,185,129,0.1)', color: 'success.main', border: '1px solid rgba(16,185,129,0.3)' }}>
      {chip.value}
    </Box>
  )
}

function RuleItemIcon({ icon }: Readonly<{ icon: RuleItemData['icon'] }>) {
  if (icon === 'cancel') return <CancelIcon sx={{ fontSize: 18, color: 'error.main', opacity: 0.7 }} />
  if (icon === 'schedule') return <ScheduleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
  if (icon === 'info') return <InfoIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
  if (icon === 'silver') return <EmojiEventsIcon sx={{ fontSize: 18, color: SILVER_COLOR }} />
  if (icon === 'gold') return <EmojiEventsIcon sx={{ fontSize: 18, color: GOLD_COLOR }} />
  return <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main', opacity: 0.8 }} />
}

function RuleRow({
  item,
  itemKey,
  fullpage,
  expandedKeys,
  onToggle,
}: Readonly<{
  item: RuleItemData
  itemKey: string
  fullpage: boolean
  expandedKeys: Set<string>
  onToggle: (key: string) => void
}>) {
  const isExpanded = expandedKeys.has(itemKey)
  const hasExample = fullpage && !!item.example

  return (
    <ListItem
      disableGutters
      alignItems="flex-start"
      sx={{ flexDirection: 'column', py: 0.5 }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          ...(hasExample && { cursor: 'pointer' }),
        }}
        onClick={() => hasExample && onToggle(itemKey)}
      >
        <ListItemAvatar sx={{ minWidth: 30 }}>
          <RuleItemIcon icon={item.icon} />
        </ListItemAvatar>
        <ListItemText
          primary={item.label}
          slotProps={{
            primary: {
              variant: 'body2',
              color: item.icon === 'cancel' ? 'text.secondary' : 'text.primary',
            },
          }}
        />
        {item.chip && <RuleItemChip chip={item.chip} />}
        {hasExample && (
          <ExpandMore
            expand={isExpanded}
            onClick={(e) => { e.stopPropagation(); onToggle(itemKey) }}
            aria-expanded={isExpanded}
            aria-label="show example"
          >
            <ExpandMoreIcon />
          </ExpandMore>
        )}
      </Box>
      {hasExample && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 3.75, pr: 1, py: 1 }}>{item.example}</Box>
        </Collapse>
      )}
    </ListItem>
  )
}

function RuleCategory({
  category,
  fullpage,
  expandedKeys,
  onToggle,
  theme,
  tSections,
}: Readonly<{
  category: RuleCategoryData
  fullpage: boolean
  expandedKeys: Set<string>
  onToggle: (key: string) => void
  theme: Theme
  tSections: (key: string) => string
}>) {
  const hasScoring = category.scoring.length > 0
  const hasDeadlines = category.deadlines.length > 0
  const hasGeneral = category.general.length > 0

  return (
    <Box sx={{ mb: fullpage ? 4 : 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        <Avatar
          sx={{
            bgcolor: 'rgba(255,255,255,0.05)',
            color: 'primary.main',
            width: 36,
            height: 36,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {category.headerIcon}
        </Avatar>
        <Typography variant={fullpage ? 'h6' : 'subtitle1'} fontWeight={700}>
          {tSections(category.titleKey)}
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {hasScoring && (
          <Box sx={{ p: 1.5 }}>
            <Typography
              variant="overline"
              sx={{ color: 'secondary.main', fontWeight: 900, letterSpacing: 1.5, display: 'block', mb: 0.5 }}
            >
              {tSections('scoring')}
            </Typography>
            <List disablePadding>
              {category.scoring.map((item) => (
                <RuleRow
                  key={item.label}
                  item={item}
                  itemKey={item.label}
                  fullpage={fullpage}
                  expandedKeys={expandedKeys}
                  onToggle={onToggle}
                />
              ))}
            </List>
          </Box>
        )}

        {hasScoring && hasDeadlines && <Divider />}

        {hasDeadlines && (
          <Box sx={{ p: 1.5 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', fontWeight: 900, letterSpacing: 1.5, display: 'block', mb: 0.5 }}
            >
              {tSections('deadlines')}
            </Typography>
            <List disablePadding>
              {category.deadlines.map((item) => (
                <RuleRow
                  key={item.label}
                  item={item}
                  itemKey={item.label}
                  fullpage={fullpage}
                  expandedKeys={expandedKeys}
                  onToggle={onToggle}
                />
              ))}
            </List>
          </Box>
        )}

        {hasGeneral && (
          <Box sx={{ p: 1.5 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', fontWeight: 900, letterSpacing: 1.5, display: 'block', mb: 0.5 }}
            >
              {tSections('general')}
            </Typography>
            <List disablePadding>
              {category.general.map((item) => (
                <RuleRow
                  key={item.label}
                  item={item}
                  itemKey={item.label}
                  fullpage={fullpage}
                  expandedKeys={expandedKeys}
                  onToggle={onToggle}
                />
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default function Rules({
  expanded: defaultExpanded = true,
  fullpage = false,
  scoringConfig,
  tournamentId,
  isActive = false,
  lockDate,
}: RulesProps) {
  const locale = useLocale()
  const theme = useTheme()
  const t = useTranslations('rules')
  const tRules = useTranslations('rules.rules')
  const tConstraints = useTranslations('rules.constraints')
  const tActions = useTranslations('rules.actions')
  const tSections = useTranslations('rules.sections')
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const config = scoringConfig || DEFAULT_SCORING

  const plural = (key: string, count: number, params: Record<string, string | number | Date>) =>
    tRules(`${key}.${count === 1 ? 'singular' : 'plural'}`, params)

  const date = lockDate || tConstraints('lockDateFallback')

  const exactScoreBonus = config.game_exact_score_points - (config.game_correct_goal_difference_points || config.game_correct_outcome_points)
  const goalDiffBonus = config.game_correct_goal_difference_points - config.game_correct_outcome_points

  const matchesScoring: RuleItemData[] = [
    {
      label: plural('winnerDraw', config.game_correct_outcome_points, { points: config.game_correct_outcome_points }),
      chip: { type: 'points', value: `+${config.game_correct_outcome_points}` },
      icon: 'check',
      example: <WinnerDrawExample points={config.game_correct_outcome_points} />,
    },
    ...(config.game_correct_goal_difference_points > 0
      ? [{
          label: plural('goalDifference', goalDiffBonus, { bonus: goalDiffBonus, total: config.game_correct_goal_difference_points }),
          chip: { type: 'points', value: `+${goalDiffBonus}` } as PointChip,
          icon: 'check' as const,
          example: <GoalDifferenceExample points={config.game_correct_goal_difference_points} />,
        }]
      : []),
    {
      label: plural('exactScore', exactScoreBonus, { bonus: exactScoreBonus, total: config.game_exact_score_points }),
      chip: { type: 'points', value: `+${exactScoreBonus}` },
      icon: 'check',
      example: <ExactScoreExample total={config.game_exact_score_points} correctOutcome={config.game_correct_outcome_points} bonus={exactScoreBonus} />,
    },
    {
      label: tRules('wrongOutcome'),
      chip: { type: 'zero' },
      icon: 'cancel',
    },
    ...(config.max_silver_games > 0
      ? [{
          label: plural('silverBoost', config.max_silver_games, { count: config.max_silver_games }),
          chip: { type: 'silver' } as PointChip,
          icon: 'silver' as const,
        }]
      : []),
    ...(config.max_golden_games > 0
      ? [{
          label: plural('goldenBoost', config.max_golden_games, { count: config.max_golden_games }),
          chip: { type: 'gold' } as PointChip,
          icon: 'gold' as const,
        }]
      : []),
  ]

  const matchesDeadlines: RuleItemData[] = [
    {
      label: tConstraints('matchPredictionTime'),
      icon: 'schedule',
      example: <MatchPredictionTimeExample />,
    },
    ...(config.max_silver_games > 0 || config.max_golden_games > 0
      ? [{ label: tConstraints('boostDeadline'), icon: 'schedule' as const }]
      : []),
  ]

  const qtScoring: RuleItemData[] = [
    {
      label: plural('qualifiedTeam', config.qualified_team_points, { points: config.qualified_team_points }),
      chip: { type: 'points', value: `+${config.qualified_team_points}` },
      icon: 'check',
      example: <RoundOf16Example points={config.qualified_team_points} />,
    },
    {
      label: plural('exactPosition', config.exact_position_qualified_points, {
        points: config.exact_position_qualified_points,
        total: config.qualified_team_points + config.exact_position_qualified_points,
      }),
      chip: { type: 'points', value: `+${config.exact_position_qualified_points}` },
      icon: 'check',
      example: (
        <GroupPositionExample
          qualifiedPoints={config.qualified_team_points}
          exactPositionPoints={config.exact_position_qualified_points}
          totalPoints={config.qualified_team_points + config.exact_position_qualified_points}
        />
      ),
    },
    {
      label: tRules('teamFailedToQualify'),
      chip: { type: 'zero' },
      icon: 'cancel',
    },
  ]

  const qtDeadlines: RuleItemData[] = [
    {
      label: tConstraints('qualifiedTeamsPredictionTime', { date }),
      icon: 'schedule',
      example: <QualifiedTeamsPredictionTimeExample />,
    },
  ]

  const awardsScoring: RuleItemData[] = [
    {
      label: plural('champion', config.champion_points, { points: config.champion_points }),
      chip: { type: 'points', value: `+${config.champion_points}` },
      icon: 'check',
      example: <ChampionExample points={config.champion_points} />,
    },
    {
      label: plural('runnerUp', config.runner_up_points, { points: config.runner_up_points }),
      chip: { type: 'points', value: `+${config.runner_up_points}` },
      icon: 'check',
      example: <RunnerUpExample points={config.runner_up_points} />,
    },
    {
      label: plural('thirdPlace', config.third_place_points, { points: config.third_place_points }),
      chip: { type: 'points', value: `+${config.third_place_points}` },
      icon: 'check',
      example: <ThirdPlaceExample points={config.third_place_points} />,
    },
    {
      label: plural('individualAwards', config.individual_award_points, { points: config.individual_award_points }),
      chip: { type: 'points', value: `+${config.individual_award_points}` },
      icon: 'check',
      example: <IndividualAwardsExample points={config.individual_award_points} />,
    },
  ]

  const awardsDeadlines: RuleItemData[] = [
    {
      label: tConstraints('podiumPredictionTime', { date }),
      icon: 'schedule',
      example: <PodiumPredictionTimeExample />,
    },
  ]

  const tournamentGeneral: RuleItemData[] = [
    {
      label: tConstraints('singlePrediction'),
      icon: 'info',
      example: <SinglePredictionExample />,
    },
    { label: tRules('sharedPrediction'), icon: 'info' },
    { label: tRules('thirdPlaceCondition'), icon: 'info' },
  ]

  const categories: RuleCategoryData[] = [
    {
      titleKey: 'matches',
      headerIcon: <SportsSoccerIcon sx={{ fontSize: 20 }} />,
      scoring: matchesScoring,
      deadlines: matchesDeadlines,
      general: [],
    },
    {
      titleKey: 'qualifiedTeams',
      headerIcon: <AccountTreeIcon sx={{ fontSize: 20 }} />,
      scoring: qtScoring,
      deadlines: qtDeadlines,
      general: [],
    },
    {
      titleKey: 'awardsChampion',
      headerIcon: <EmojiEventsIcon sx={{ fontSize: 20 }} />,
      scoring: awardsScoring,
      deadlines: awardsDeadlines,
      general: [],
    },
    {
      titleKey: 'tournamentLogic',
      headerIcon: <LanguageIcon sx={{ fontSize: 20 }} />,
      scoring: [],
      deadlines: [],
      general: tournamentGeneral,
    },
  ]

  const handleToggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <Card
      sx={{
        maxWidth: fullpage ? '800px' : '100%',
        mx: fullpage ? 'auto' : 0,
        ...(isActive && {
          borderLeft: 3,
          borderColor: 'primary.main',
          backgroundColor: 'action.selected',
        }),
      }}
    >
      <CardHeader
        title={t('title')}
        slotProps={{ title: { variant: fullpage ? 'h4' : 'h6' } }}
        subheader={isActive ? t('status.youAreHere') : undefined}
        sx={{
          color: theme.palette.primary.main,
          borderBottom: `${theme.palette.primary.light} solid 1px`,
        }}
        action={
          !fullpage && (
            <ExpandMore
              expand={expanded}
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label="show more"
            >
              <ExpandMoreIcon />
            </ExpandMore>
          )
        }
      />
      <Collapse in={fullpage ? true : expanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: fullpage ? 3 : 2 }}>
          {categories.map((category) => (
            <RuleCategory
              key={category.titleKey}
              category={category}
              fullpage={fullpage}
              expandedKeys={expandedKeys}
              onToggle={handleToggle}
              theme={theme}
              tSections={tSections}
            />
          ))}
        </Box>
      </Collapse>
      {!fullpage && (
        <CardActions sx={{ justifyContent: 'center', px: 2, py: 1.5 }}>
          <Button
            component={Link}
            href={tournamentId ? `/${locale}/tournaments/${tournamentId}/rules` : `/${locale}/rules`}
            startIcon={<GavelIcon />}
            variant="outlined"
            color="secondary"
            size="small"
            fullWidth
          >
            {tActions('viewFullRules')}
          </Button>
        </CardActions>
      )}
    </Card>
  )
}
