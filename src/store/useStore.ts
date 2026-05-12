import { create } from 'zustand'
import type { User, RiskLevel } from '../types'

interface AppState {
  user: User | null
  risk: RiskLevel
  betAmount: number
  rows: number
  isPlaying: boolean

  setUser: (user: User | null) => void
  setBalance: (balance: number) => void
  setRisk: (risk: RiskLevel) => void
  setBetAmount: (amount: number) => void
  setRows: (rows: number) => void
  setIsPlaying: (playing: boolean) => void
  logout: () => void
}

export const useStore = create<AppState>((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) return JSON.parse(stored)
    } catch { /* ignore */ }
    // Default guest so users land directly on the game
    return { id: 'guest', username: 'Guest', phone: '', balance: 10000, token: '' }
  })(),
  risk: 'high',
  betAmount: 10,
  rows: 8,
  isPlaying: false,

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', user.token)
    }
    set({ user })
  },

  setBalance: (balance) =>
    set((state) => {
      if (!state.user) return {}
      const updated = { ...state.user, balance }
      localStorage.setItem('user', JSON.stringify(updated))
      return { user: updated }
    }),

  setRisk: (risk) => set({ risk }),
  setBetAmount: (betAmount) => set({ betAmount }),
  setRows: (rows) => set({ rows }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null })
  },
}))
