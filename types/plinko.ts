export type RiskLevel = 'low' | 'medium' | 'high'
export type RowCount = 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16
export type GameState = 'idle' | 'playing'

export interface WinRecord {
  id: number
  binIndex: number
  multiplier: number
  betAmount: number
  profit: number
  rowCount: RowCount
  riskLevel: RiskLevel
}

export const ROW_COUNT_OPTIONS: RowCount[] = [8, 9, 10, 11, 12, 13, 14, 15, 16]
export const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high']
export const BET_OPTIONS = [1, 5, 10, 50, 100, 500]
export const DEFAULT_BALANCE = 1000
export const LOCAL_STORAGE_KEY = 'plinko_balance'
