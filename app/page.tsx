'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import GameLayout from '@/components/GameLayout'
import BalanceBar from '@/components/BalanceBar'
import BetControls from '@/components/BetControls'
import WinOverlay from '@/components/WinOverlay'
import { playPlinko } from '@/lib/mockPlinkoApi'
import { DEFAULT_BALANCE, SUPER_WIN_THRESHOLD } from '@/types/plinko'
import type { GameState } from '@/types/plinko'
import type { PlinkoCanvasHandle } from '@/components/PlinkoCanvas'

// Dynamic import avoids SSR issues with PixiJS
const PlinkoCanvas = dynamic(() => import('@/components/PlinkoCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center text-purple-400 text-sm"
      style={{ width: 390, height: 560 }}>
      Loading game…
    </div>
  ),
})

export default function Home() {
  const [balance, setBalance]   = useState(DEFAULT_BALANCE)
  const [bet, setBet]           = useState(10)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [lastWin, setLastWin]   = useState<number | null>(null)
  const [multiplier, setMultiplier] = useState(1)
  const [winAmount, setWinAmount]   = useState(0)

  const canvasRef = useRef<PlinkoCanvasHandle>(null)

  // Canvas dimensions: fill screen width up to 390, leave room for UI
  const [canvasSize, setCanvasSize] = useState({ w: 390, h: 560 })
  useEffect(() => {
    function calc() {
      const w = Math.min(430, window.innerWidth)
      // header ~72px + controls ~165px + safe ~10px
      const h = Math.max(300, window.innerHeight - 72 - 165 - 10)
      setCanvasSize({ w, h })
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  const handleStart = useCallback(async () => {
    if (gameState !== 'idle' || balance < bet) return

    setGameState('playing')
    setLastWin(null)

    // Deduct bet immediately
    setBalance((b) => b - bet)

    try {
      const result = await playPlinko(bet)

      // Animate the drop (blocks until complete)
      await canvasRef.current?.drop(result.path, result.resultSlot, result.multiplier)

      // Apply winnings
      const win = result.winAmount
      setBalance((b) => b + win)
      setLastWin(win - bet)           // net gain/loss for display
      setMultiplier(result.multiplier)
      setWinAmount(win)

      const nextState: GameState = result.multiplier >= SUPER_WIN_THRESHOLD
        ? 'superwin'
        : win > 0 ? 'win' : 'idle'
      setGameState(nextState)

      // Auto-clear non-super wins after WinOverlay times out
      if (nextState === 'win') {
        setTimeout(() => setGameState('idle'), 2400)
      }
    } catch (e) {
      console.error(e)
      setGameState('idle')
    }
  }, [gameState, balance, bet])

  return (
    <GameLayout>
      {/* Header */}
      <div className="w-full">
        <BalanceBar balance={balance} lastWin={lastWin} />
      </div>

      {/* Plinko canvas */}
      <div className="flex-1 w-full flex items-center justify-center px-1"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(100,30,200,0.1) 0%, transparent 70%)',
        }}
      >
        <PlinkoCanvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
        />
      </div>

      {/* Bet controls */}
      <div className="w-full">
        <BetControls
          bet={bet}
          onBetChange={setBet}
          onStart={handleStart}
          disabled={gameState === 'playing'}
          balance={balance}
        />
      </div>

      {/* Win overlay */}
      <WinOverlay
        state={gameState}
        multiplier={multiplier}
        winAmount={winAmount}
        onClose={() => setGameState('idle')}
      />
    </GameLayout>
  )
}
