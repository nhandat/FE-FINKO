import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import PlinkoBoard from '../components/PlinkoBoard'
import BetControls from '../components/BetControls'
import { useStore } from '../store/useStore'
import { play } from '../services/api'
import { MULTIPLIERS } from '../constants/game'

interface ResultToast { multiplier: number; winAmount: number; won: boolean }

export default function GamePage() {
  const navigate = useNavigate()
  const { user, risk, betAmount, rows, setBalance, setIsPlaying, isPlaying } = useStore()

  // drop = null means no ball; set to a new object to trigger a new drop
  const [drop, setDrop] = useState<{ path: boolean[] | null; target: number | null } | null>(null)
  const [activeBucket, setActiveBucket] = useState<number | null>(null)
  const [toast, setToast] = useState<ResultToast | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  // Store result from API so we can show correct payout after physics lands
  const pendingResult = useRef<{ mults: number[]; betAmt: number } | null>(null)

  if (!user) { navigate('/auth'); return null }

  const handlePlay = async () => {
    if (isPlaying) return
    setIsPlaying(true)
    setActiveBucket(null)
    setDrop(null)          // reset board
    setToast(null)
    setApiError(null)

    try {
      const result = await play({ betAmount, risk, rows })
      setBalance(result.newBalance)
      pendingResult.current = { mults: MULTIPLIERS[risk][rows] ?? [], betAmt: betAmount }
      setDrop({ path: result.path, target: result.bucketIndex })
    } catch {
      // Local demo fallback
      const mults = MULTIPLIERS[risk][rows] ?? []
      pendingResult.current = { mults, betAmt: betAmount }
      setDrop({ path: null, target: null })   // physics runs freely
      setApiError('Backend chưa kết nối — đang chạy demo local')
    }
  }

  const handleAnimationEnd = useCallback((bucketIndex: number) => {
    setActiveBucket(bucketIndex)
    setIsPlaying(false)

    const pr = pendingResult.current
    if (!pr) return
    const mult = pr.mults[bucketIndex] ?? 0
    const win  = Math.round(pr.betAmt * mult * 100) / 100
    // Update balance only for local demo (backend already updated it)
    if (apiError) setBalance(Math.max(0, (user?.balance ?? 0) - pr.betAmt + win))
    setToast({ multiplier: mult, winAmount: win, won: win >= pr.betAmt })
  }, [apiError, user, setBalance, setIsPlaying])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg,#0d0416,#080311)' }}>
      <Header />

      {apiError && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 text-xs text-center">
          {apiError}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center px-2 pt-2">
        <PlinkoBoard
          rows={rows}
          risk={risk}
          activeBucket={activeBucket}
          targetBucket={drop?.target ?? null}
          ballPath={drop?.path ?? (drop ? [] : null)}
          onAnimationEnd={handleAnimationEnd}
        />
      </div>

      <BetControls onPlay={handlePlay} isPlaying={isPlaying} />

      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-30 px-6 py-3 rounded-2xl border text-center shadow-2xl"
          style={toast.won
            ? { background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.5)' }
            : { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.5)' }}
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
