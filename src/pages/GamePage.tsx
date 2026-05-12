import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import PlinkoBoard from '../components/PlinkoBoard'
import BetControls from '../components/BetControls'
import { useStore } from '../store/useStore'
import { play } from '../services/api'
import { MULTIPLIERS } from '../constants/game'

interface ResultToast {
  multiplier: number
  winAmount: number
  won: boolean
}

export default function GamePage() {
  const navigate = useNavigate()
  const { user, risk, betAmount, rows, setBalance, setIsPlaying, isPlaying } = useStore()

  const [ballPath, setBallPath] = useState<boolean[] | null>(null)
  const [activeBucket, setActiveBucket] = useState<number | null>(null)
  const [toast, setToast] = useState<ResultToast | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  if (!user) {
    navigate('/auth')
    return null
  }

  const handlePlay = async () => {
    if (isPlaying || betAmount > (user?.balance ?? 0)) return
    setIsPlaying(true)
    setActiveBucket(null)
    setBallPath(null)
    setToast(null)
    setApiError(null)

    try {
      const result = await play({ betAmount, risk, rows })
      setBalance(result.newBalance)
      setBallPath(result.path)
      // Toast shown after animation ends
    } catch {
      // Fallback: simulate locally when backend not connected
      const path = Array.from({ length: rows }, () => Math.random() < 0.5) as boolean[]
      const bucket = path.filter(Boolean).length
      const mults = MULTIPLIERS[risk][rows] ?? []
      const mult = mults[bucket] ?? 0
      const win = Math.round(betAmount * mult * 100) / 100
      const newBal = Math.max(0, (user?.balance ?? 0) - betAmount + win)
      setBalance(newBal)
      setBallPath(path)
      setApiError('Backend chưa kết nối — đang chạy demo local')
    }
  }

  const handleAnimationEnd = useCallback(() => {
    if (!ballPath) return
    const bucket = ballPath.filter(Boolean).length
    const mults = MULTIPLIERS[risk][rows] ?? []
    const mult = mults[bucket] ?? 0
    const win = Math.round(betAmount * mult * 100) / 100
    setActiveBucket(bucket)
    setToast({ multiplier: mult, winAmount: win, won: win >= betAmount })
    setIsPlaying(false)
  }, [ballPath, risk, rows, betAmount, setIsPlaying])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg,#0d0416 0%,#080311 100%)' }}
    >
      <Header />

      {/* API error banner */}
      {apiError && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 text-xs text-center">
          {apiError}
        </div>
      )}

      {/* Board */}
      <div className="flex-1 flex flex-col items-center px-2 pt-2">
        <PlinkoBoard
          rows={rows}
          risk={risk}
          activeBucket={activeBucket}
          ballPath={ballPath}
          onAnimationEnd={handleAnimationEnd}
        />
      </div>

      {/* Bet controls */}
      <BetControls onPlay={handlePlay} isPlaying={isPlaying} />

      {/* Result toast */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-30 px-6 py-3 rounded-2xl border text-center shadow-2xl transition-all"
          style={
            toast.won
              ? { background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.5)' }
              : { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.5)' }
          }
          onClick={() => setToast(null)}
        >
          <div className={`text-2xl font-black ${toast.won ? 'text-green-400' : 'text-red-400'}`}>
            {toast.multiplier}x
          </div>
          <div className="text-white text-sm font-bold">
            {toast.won ? `+${toast.winAmount.toLocaleString()}` : `-${betAmount.toLocaleString()}`}
          </div>
        </div>
      )}
    </div>
  )
}
