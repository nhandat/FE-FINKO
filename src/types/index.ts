export type RiskLevel = 'low' | 'medium' | 'high'

export interface User {
  id: string
  username: string
  phone: string
  balance: number
  token: string
}

export interface GameResult {
  path: boolean[]
  bucketIndex: number
  multiplier: number
  winAmount: number
  newBalance: number
}

export interface AuthResponse {
  token: string
  user: Omit<User, 'token'>
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  phone: string
  password: string
  referralCode?: string
}

export interface PlayPayload {
  betAmount: number
  risk: RiskLevel
  rows: number
}
