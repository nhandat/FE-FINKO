export type Direction = 'L' | 'R'

export type GameState = 'idle' | 'playing' | 'win' | 'superwin'

export interface PlayResult {
  path: Direction[]
  resultSlot: number
  multiplier: number
  winAmount: number
}

export interface GameConfig {
  rows: number
  multipliers: number[]
}

export const GAME_CONFIGS: Record<number, GameConfig> = {
  8: {
    rows: 8,
    multipliers: [10, 3, 1.5, 1, 0.5, 1, 1.5, 3, 10],
  },
}

export const DEFAULT_BALANCE = 10_000
export const BET_OPTIONS = [10, 50, 100, 500]
export const SUPER_WIN_THRESHOLD = 5 // multiplier >= 5x triggers super win
