import type { RiskLevel } from '../types'

export const ROWS_OPTIONS = [8, 12, 16] as const

export const MULTIPLIERS: Record<RiskLevel, Record<number, number[]>> = {
  low: {
    8:  [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    12: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9, 0, 0],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  },
  medium: {
    8:  [13, 3.0, 1.3, 0.7, 0.4, 0.7, 1.3, 3.0, 13],
    12: [33, 11, 4.0, 2.0, 1.1, 0.6, 0.3, 0.6, 1.1, 2.0, 4.0, 11, 33],
    16: [88, 18, 4.0, 2.0, 1.5, 0.8, 0.5, 0.3, 0.2, 0.3, 0.5, 0.8, 1.5, 2.0, 4.0, 18, 88],
  },
  high: {
    8:  [125, 15, 3.0, 1.0, 0.5, 1.0, 3.0, 15, 125],
    12: [170, 24, 8.1, 2.0, 0.7, 0.2, 0.2, 0.2, 0.7, 2.0, 8.1, 24, 170],
    16: [999, 130, 26, 9.0, 4.0, 2.0, 0.7, 0.2, 0.2, 0.2, 0.7, 2.0, 4.0, 9.0, 26, 130, 999],
  },
}

export function getMultiplierColor(mult: number): string {
  if (mult >= 100) return '#FFD700'
  if (mult >= 15)  return '#FF6B00'
  if (mult >= 5)   return '#22C55E'
  if (mult >= 2)   return '#3B82F6'
  if (mult >= 1)   return '#8B5CF6'
  return '#EF4444'
}

export const QUICK_BETS = [10, 50, 100, 200, 500, 1000]
