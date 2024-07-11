import {ExtendedPlayerData} from "../definitions";

export type AwardTypes =
  'best_player_id'
  | 'top_goalscorer_player_id'
  | 'best_goalkeeper_player_id'
  | 'best_young_player_id'

interface AwardDefinition {
  label: string
  property: AwardTypes
  playerFilter: (p: ExtendedPlayerData) => boolean
}

export const awardsDefinition: AwardDefinition[] = [
  {
    label: 'Mejor Jugador',
    property: 'best_player_id',
    playerFilter: (p: ExtendedPlayerData) => true,
  },
  {
    label: 'Goleador',
    property: 'top_goalscorer_player_id',
    playerFilter: (p: ExtendedPlayerData) => true,
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
