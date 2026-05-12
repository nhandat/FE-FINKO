import axios from 'axios'
import type { AuthResponse, LoginPayload, RegisterPayload, PlayPayload, GameResult } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', payload)
  return data
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/register', payload)
  return data
}

export async function getBalance(): Promise<number> {
  const { data } = await api.get<{ balance: number }>('/api/user/balance')
  return data.balance
}

export async function play(payload: PlayPayload): Promise<GameResult> {
  const { data } = await api.post<GameResult>('/api/game/play', payload)
  return data
}
