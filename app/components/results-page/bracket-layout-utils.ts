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
 * Calculate absolute position for each game in the bracket.
 * First round: games positioned at regular intervals
 * Subsequent rounds: each game centered between its two feeder games
 *
 * @param rounds - Array of bracket rounds with games
 * @returns Array of game positions with x,y coordinates
 */
export function calculateGamePositions(rounds: BracketRound[]): GamePosition[] {
  const positions: GamePosition[] = []
  const { ROUND_SPACING, BASE_VERTICAL_SPACING } = BRACKET_CONSTANTS

  rounds.forEach((round, roundIndex) => {
    const x = roundIndex * ROUND_SPACING

    if (roundIndex === 0) {
      // First round: position at regular intervals
      round.games.forEach((game, gameIndex) => {
        const y = gameIndex * BASE_VERTICAL_SPACING

        positions.push({
          gameId: game.id,
          x,
          y,
          roundIndex,
          gameIndexInRound: gameIndex,
        })
      })
    } else {
      // Subsequent rounds: position each game at midpoint of its two feeder games
      const prevRoundPositions = positions.filter((p) => p.roundIndex === roundIndex - 1)

      round.games.forEach((game, gameIndex) => {
        const feeder1 = prevRoundPositions[gameIndex * 2]
        const feeder2 = prevRoundPositions[gameIndex * 2 + 1]

        if (feeder1 && feeder2) {
          // Position at 1/4 from top feeder, 3/4 from bottom feeder (biased upward)
          const y = feeder1.y + 0.25 * (feeder2.y - feeder1.y)
          positions.push({
            gameId: game.id,
            x,
            y,
            roundIndex,
            gameIndexInRound: gameIndex,
          })
        } else if (feeder1) {
          // Only one feeder (edge case, shouldn't happen in proper bracket)
          const y = feeder1.y
          positions.push({
            gameId: game.id,
            x,
            y,
            roundIndex,
            gameIndexInRound: gameIndex,
          })
        }
      })
    }
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
 * Height is determined by the first round (which has the most games spread out).
 *
 * @param rounds - Array of bracket rounds
 * @param isMobile - Whether to apply mobile scaling
 * @param hasThirdPlace - Whether third place game exists
 * @returns Object with width and height in pixels
 */
export function calculateBracketDimensions(
  rounds: BracketRound[],
  isMobile: boolean = false,
  hasThirdPlace: boolean = false
): { width: number; height: number } {
  const { ROUND_SPACING, GAME_CARD_WIDTH, GAME_CARD_HEIGHT, BASE_VERTICAL_SPACING, MOBILE_SCALE } =
    BRACKET_CONSTANTS

  const scale = isMobile ? MOBILE_SCALE : 1

  // Width: number of rounds * spacing + final card width
  const width = (rounds.length * ROUND_SPACING + GAME_CARD_WIDTH) * scale

  // Height: based on first round (which has the most games)
  let maxHeight = 0
  const firstRound = rounds[0]
  if (firstRound) {
    maxHeight = (firstRound.games.length - 1) * BASE_VERTICAL_SPACING + GAME_CARD_HEIGHT
  }

  // Add extra height for third place game if present (positioned 150px below final)
  if (hasThirdPlace) {
    maxHeight += 150 + GAME_CARD_HEIGHT + 20 // 150px spacing + card height + 20px padding
  }

  const height = maxHeight * scale

  return { width, height }
}
