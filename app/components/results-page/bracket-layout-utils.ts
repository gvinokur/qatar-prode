import { ExtendedGameData } from '@/app/definitions'

/**
 * Represents a round in the playoff bracket
 */
export interface BracketRound {
  name: string
  games: ExtendedGameData[]
  columnIndex: number
}

/**
 * Represents the position of a game in the bracket
 */
export interface GamePosition {
  gameId: string
  x: number
  y: number
  roundIndex: number
  gameIndexInRound: number
}

/**
 * Constants for bracket layout dimensions and spacing
 */
export const BRACKET_CONSTANTS = {
  GAME_CARD_HEIGHT: 80, // px
  GAME_CARD_WIDTH: 200, // px
  ROUND_SPACING: 300, // horizontal space between rounds (px)
  BASE_VERTICAL_SPACING: 120, // minimum vertical space between games (px)
  MOBILE_SCALE: 0.7, // scale factor for mobile screens
}

/**
 * Calculate vertical spacing for a round based on number of games.
 * Games double in spacing each round to create visual convergence effect.
 *
 * @param gamesInRound - Number of games in this round
 * @returns Vertical spacing in pixels
 *
 * @example
 * calculateRoundSpacing(8) // Quarter-finals: 240px spacing
 * calculateRoundSpacing(4) // Semi-finals: 480px spacing
 */
export function calculateRoundSpacing(gamesInRound: number): number {
  const { BASE_VERTICAL_SPACING, GAME_CARD_HEIGHT } = BRACKET_CONSTANTS

  // Each subsequent round has 2x spacing (visual convergence)
  // Round of 16: 120px between games
  // Quarters: 240px + 80px (card height) = 320px total between cards
  // Semis: 480px + 80px = 560px
  // Final: centered

  return BASE_VERTICAL_SPACING * (16 / gamesInRound) + GAME_CARD_HEIGHT
}

/**
 * Calculate absolute position for each game in the bracket.
 *
 * @param rounds - Array of bracket rounds with games
 * @returns Array of game positions with x,y coordinates
 */
export function calculateGamePositions(rounds: BracketRound[]): GamePosition[] {
  const positions: GamePosition[] = []
  const { ROUND_SPACING, GAME_CARD_HEIGHT } = BRACKET_CONSTANTS

  rounds.forEach((round, roundIndex) => {
    const spacing = calculateRoundSpacing(round.games.length)
    const x = roundIndex * ROUND_SPACING

    round.games.forEach((game, gameIndex) => {
      const y = gameIndex * spacing

      positions.push({
        gameId: game.id,
        x,
        y,
        roundIndex,
        gameIndexInRound: gameIndex,
      })
    })
  })

  return positions
}

/**
 * Calculate SVG path for connection lines between rounds.
 * Creates an L-shaped connector from the right side of one card
 * to the left side of another card.
 *
 * @param fromPosition - Starting game position
 * @param toPosition - Ending game position
 * @returns SVG path string (M/L commands)
 *
 * @example
 * calculateConnectionPath(pos1, pos2) // Returns "M 200 40 L 250 40 L 250 200 L 300 200"
 */
export function calculateConnectionPath(
  fromPosition: GamePosition,
  toPosition: GamePosition
): string {
  const { GAME_CARD_HEIGHT, GAME_CARD_WIDTH } = BRACKET_CONSTANTS

  // Start from right-center of "from" card
  const x1 = fromPosition.x + GAME_CARD_WIDTH
  const y1 = fromPosition.y + GAME_CARD_HEIGHT / 2

  // End at left-center of "to" card
  const x2 = toPosition.x
  const y2 = toPosition.y + GAME_CARD_HEIGHT / 2

  // Midpoint for vertical line
  const midX = (x1 + x2) / 2

  // SVG path: horizontal → vertical → horizontal
  return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`
}

/**
 * Calculate total bracket dimensions for container sizing.
 *
 * @param rounds - Array of bracket rounds
 * @param isMobile - Whether to apply mobile scaling
 * @returns Object with width and height in pixels
 */
export function calculateBracketDimensions(
  rounds: BracketRound[],
  isMobile: boolean = false
): { width: number; height: number } {
  const { ROUND_SPACING, GAME_CARD_WIDTH, MOBILE_SCALE } = BRACKET_CONSTANTS

  const scale = isMobile ? MOBILE_SCALE : 1

  // Width: number of rounds * spacing + final card width
  const width = (rounds.length * ROUND_SPACING + GAME_CARD_WIDTH) * scale

  // Height: find the round with maximum vertical extent
  let maxHeight = 0
  rounds.forEach((round) => {
    const spacing = calculateRoundSpacing(round.games.length)
    const roundHeight = (round.games.length - 1) * spacing + BRACKET_CONSTANTS.GAME_CARD_HEIGHT
    maxHeight = Math.max(maxHeight, roundHeight)
  })

  const height = maxHeight * scale

  return { width, height }
}
