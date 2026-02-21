import {ExtendedPlayerData} from "../definitions";

export type AwardTypes =
  'best_player_id'
  | 'top_goalscorer_player_id'
  | 'best_goalkeeper_player_id'
  | 'best_young_player_id'
  | 'champion_team_id'
  | 'runner_up_team_id'
  | 'third_place_team_id'

interface AwardDefinition {
  label: string
  property: AwardTypes
  playerFilter: (_: ExtendedPlayerData) => boolean
}

/**
 * @deprecated Use getAwardsDefinition(t) instead for i18n support
 */
export const awardsDefinition: AwardDefinition[] = [
  {
    label: 'Mejor Jugador',
    property: 'best_player_id',
    playerFilter: (_: ExtendedPlayerData) => true,
  },
  {
    label: 'Goleador',
    property: 'top_goalscorer_player_id',
    playerFilter: (_: ExtendedPlayerData) => true,
  },
  {
    label: 'Mejor Arquero',
    property: 'best_goalkeeper_player_id',
    playerFilter: (p: ExtendedPlayerData) => p.position.toUpperCase() === 'GK',
  },
  {
    label: 'Mejor Jugador Joven',
    property: 'best_young_player_id',
    playerFilter: (p: ExtendedPlayerData) => p.age_at_tournament < 22,
  }
]

/**
 * Get awards definition with translated labels
 * @param t - Translation function from useTranslations hook or server-side i18n
 * @returns Awards definition array with translated labels
 */
export function getAwardsDefinition(t: any): AwardDefinition[] {
  return [
    {
      label: t('categories.bestPlayer'),
      property: 'best_player_id',
      playerFilter: (_: ExtendedPlayerData) => true,
    },
    {
      label: t('categories.topGoalscorer'),
      property: 'top_goalscorer_player_id',
      playerFilter: (_: ExtendedPlayerData) => true,
    },
    {
      label: t('categories.bestGoalkeeper'),
      property: 'best_goalkeeper_player_id',
      playerFilter: (p: ExtendedPlayerData) => p.position.toUpperCase() === 'GK',
    },
    {
      label: t('categories.bestYoungPlayer'),
      property: 'best_young_player_id',
      playerFilter: (p: ExtendedPlayerData) => p.age_at_tournament < 22,
    }
  ]
}
