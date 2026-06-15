'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useLocale, useTranslations } from 'next-intl'
import { getRecentUnscoredGames, saveAndPublishSingleGameResult } from '../../actions/backoffice-actions'
import { ExtendedGameData } from '../../definitions'
import { Team } from '../../db/tables-definition'
import BackofficeGameResultEditControls from '../backoffice/backoffice-game-result-edit-controls'

type Props = {
  readonly open: boolean
  readonly onClose: () => void
}

export default function QuickScoreWizardDialog({ open, onClose }: Props) {
  const t = useTranslations('backoffice')
  const locale = useLocale()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [games, setGames] = useState<ExtendedGameData[]>([])
  const [teamsMap, setTeamsMap] = useState<Record<string, Team>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [editHomeScore, setEditHomeScore] = useState<number | undefined>()
  const [editAwayScore, setEditAwayScore] = useState<number | undefined>()
  const [editHomePenaltyScore, setEditHomePenaltyScore] = useState<number | undefined>()
  const [editAwayPenaltyScore, setEditAwayPenaltyScore] = useState<number | undefined>()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setGames([])
    setCurrentIndex(0)
    setSaveError(null)
    getRecentUnscoredGames(locale)
      .then(({ games: loadedGames, teamsMap: loadedTeamsMap }) => {
        setGames(loadedGames)
        setTeamsMap(loadedTeamsMap)
        resetScoresForGame(loadedGames[0])
      })
      .catch(() => setSaveError(t('wizard.saveError')))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    resetScoresForGame(games[currentIndex])
    setSaveError(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  function resetScoresForGame(game?: ExtendedGameData) {
    const result = game?.gameResult
    setEditHomeScore(result?.home_score ?? undefined)
    setEditAwayScore(result?.away_score ?? undefined)
    setEditHomePenaltyScore(result?.home_penalty_score ?? undefined)
    setEditAwayPenaltyScore(result?.away_penalty_score ?? undefined)
  }

  const currentGame = games[currentIndex]
  const isDone = !loading && (games.length === 0 || currentIndex >= games.length)
  const progress = games.length > 0 ? (currentIndex / games.length) * 100 : 0

  const handleSaveAndPublish = async () => {
    if (!currentGame) return
    setSaving(true)
    setSaveError(null)
    try {
      const updatedGame: ExtendedGameData = {
        ...currentGame,
        gameResult: {
          game_id: currentGame.id,
          ...currentGame.gameResult,
          home_score: editHomeScore,
          away_score: editAwayScore,
          home_penalty_score: editHomePenaltyScore,
          away_penalty_score: editAwayPenaltyScore,
          is_draft: false,
        },
      }
      await saveAndPublishSingleGameResult(updatedGame, locale)
      setCurrentIndex(i => i + 1)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('wizard.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    setCurrentIndex(i => i + 1)
  }

  const formatGameDate = (date: Date | string) => {
    const d = new Date(date)
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant="h6" component="span">{t('wizard.title')}</Typography>
          {!loading && !isDone && (
            <Typography variant="body2" color="text.secondary">
              {t('wizard.progress', { current: currentIndex + 1, total: games.length })}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small" aria-label={t('wizard.close')}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {!loading && !isDone && (
        <LinearProgress variant="determinate" value={progress} />
      )}

      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
            <CircularProgress />
            <Typography color="text.secondary">{t('wizard.loading')}</Typography>
          </Box>
        )}

        {isDone && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main' }} />
            <Typography variant="h6">{t('wizard.emptyTitle')}</Typography>
            <Typography color="text.secondary" textAlign="center">{t('wizard.emptyDescription')}</Typography>
            <Button onClick={onClose} variant="outlined" sx={{ mt: 1 }}>
              {t('wizard.close')}
            </Button>
          </Box>
        )}

        {!loading && !isDone && currentGame && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {formatGameDate(currentGame.game_date)}
              {currentGame.playoffStage && (
                <> · {currentGame.playoffStage.round_name_i18n?.[locale] ?? currentGame.playoffStage.round_name}</>
              )}
            </Typography>

            <BackofficeGameResultEditControls
              homeTeamName={(currentGame.home_team ? teamsMap[currentGame.home_team]?.name : null) ?? currentGame.home_team ?? ''}
              awayTeamName={(currentGame.away_team ? teamsMap[currentGame.away_team]?.name : null) ?? currentGame.away_team ?? ''}
              isPlayoffGame={!!currentGame.playoffStage}
              homeScore={editHomeScore}
              awayScore={editAwayScore}
              homePenaltyScore={editHomePenaltyScore}
              awayPenaltyScore={editAwayPenaltyScore}
              onHomeScoreChange={setEditHomeScore}
              onAwayScoreChange={setEditAwayScore}
              onHomePenaltyScoreChange={setEditHomePenaltyScore}
              onAwayPenaltyScoreChange={setEditAwayPenaltyScore}
              loading={saving}
              error={saveError}
              onSave={handleSaveAndPublish}
              onCancel={handleSkip}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
