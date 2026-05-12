'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { RowCount, RiskLevel } from '@/types/plinko'
import { ROW_COUNT_OPTIONS, RISK_LEVELS, BET_OPTIONS } from '@/types/plinko'

interface Props {
  balance:    number
  onDrop:     (bet: number) => void
  rowCount:   RowCount
  riskLevel:  RiskLevel
  onRowCount: (rc: RowCount) => void
  onRisk:     (rl: RiskLevel) => void
}

const AUTO_MS = 250

export default function Controls({ balance, onDrop, rowCount, riskLevel, onRowCount, onRisk }: Props) {
  const [bet, setBet]             = useState(10)
  const [mode, setMode]           = useState<'manual' | 'auto'>('manual')
  const [autoBetsLeft, setAutoBetsLeft] = useState(10)
  const [isAutoRunning, setIsAutoRunning] = useState(false)

  // Always-fresh references so interval doesn't capture stale values
  const betRef     = useRef(bet)
  const balanceRef = useRef(balance)
  const onDropRef  = useRef(onDrop)
  const autoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { betRef.current     = bet },     [bet])
  useEffect(() => { balanceRef.current = balance }, [balance])
  useEffect(() => { onDropRef.current  = onDrop },  [onDrop])

  const stopAuto = useCallback(() => {
    if (autoIntervalRef.current) clearInterval(autoIntervalRef.current)
    autoIntervalRef.current = null
    setIsAutoRunning(false)
  }, [])

  useEffect(() => () => stopAuto(), [stopAuto])

  // Stop auto if balance runs out
  useEffect(() => {
    if (isAutoRunning && balance < bet) stopAuto()
  }, [balance, bet, isAutoRunning, stopAuto])

  const handleDrop = useCallback(() => {
    if (balance < bet) return
    onDrop(bet)
  }, [balance, bet, onDrop])

  const toggleAuto = useCallback(() => {
    if (isAutoRunning) { stopAuto(); return }

    let left = autoBetsLeft // local mutable copy
    setIsAutoRunning(true)

    autoIntervalRef.current = setInterval(() => {
      if (balanceRef.current < betRef.current) { stopAuto(); return }
      onDropRef.current(betRef.current)
      if (left > 0) {
        left--
        setAutoBetsLeft(left)
        if (left === 0) stopAuto()
      }
    }, AUTO_MS)
  }, [isAutoRunning, autoBetsLeft, stopAuto])

  const riskLabel: Record<RiskLevel, string> = { low: 'Low', medium: 'Med', high: 'High' }

  return (
    <div className="w-full space-y-2 px-3 pb-4 pt-2">
      {/* Mode tabs */}
      <div className="flex rounded-lg overflow-hidden border border-purple-900">
        {(['manual', 'auto'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); stopAuto() }}
            className={`flex-1 py-1.5 text-xs font-bold capitalize transition-colors ${
              mode === m
                ? 'bg-purple-800 text-white'
                : 'bg-gray-950 text-purple-500 hover:bg-purple-950'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Bet amount row */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-purple-500 mb-1">Bet</label>
        <div className="flex gap-1 items-center">
          <button onClick={() => setBet((b) => Math.max(1, Math.floor(b / 2)))}
            className="px-2 py-1 rounded bg-gray-900 text-purple-300 text-xs hover:bg-gray-800 active:scale-95 border border-purple-900">
            ½
          </button>
          <input
            type="number" min={1} max={balance} value={bet}
            onChange={(e) => setBet(Math.max(1, Math.min(balance, Number(e.target.value))))}
            className="flex-1 bg-gray-900 border border-purple-900 rounded px-2 py-1 text-white text-sm text-center font-bold focus:outline-none focus:border-purple-500"
          />
          <button onClick={() => setBet((b) => Math.min(balance, b * 2))}
            className="px-2 py-1 rounded bg-gray-900 text-purple-300 text-xs hover:bg-gray-800 active:scale-95 border border-purple-900">
            2×
          </button>
        </div>
        {/* Quick chips */}
        <div className="flex gap-1 mt-1">
          {BET_OPTIONS.map((o) => (
            <button key={o} onClick={() => setBet(o)}
              className={`flex-1 py-0.5 rounded text-[10px] font-bold transition-colors border ${
                bet === o
                  ? 'bg-purple-700 text-white border-purple-600'
                  : 'bg-gray-900 text-purple-400 border-purple-900 hover:bg-gray-800'
              }`}>
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Risk + Rows */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-[10px] uppercase tracking-wider text-purple-500 mb-1">Risk</label>
          <div className="flex rounded-lg overflow-hidden border border-purple-900">
            {RISK_LEVELS.map((rl) => (
              <button key={rl} onClick={() => onRisk(rl)}
                className={`flex-1 py-1 text-[10px] font-bold transition-colors ${
                  riskLevel === rl
                    ? 'bg-purple-800 text-white'
                    : 'bg-gray-950 text-purple-500 hover:bg-purple-950'
                }`}>
                {riskLabel[rl]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] uppercase tracking-wider text-purple-500 mb-1">Rows</label>
          <select value={rowCount} onChange={(e) => onRowCount(Number(e.target.value) as RowCount)}
            className="w-full bg-gray-900 border border-purple-900 rounded px-2 py-1 text-white text-xs font-bold focus:outline-none focus:border-purple-500">
            {ROW_COUNT_OPTIONS.map((r) => (
              <option key={r} value={r}>{r} rows</option>
            ))}
          </select>
        </div>
      </div>

      {/* Auto-bet count */}
      {mode === 'auto' && (
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-purple-500 mb-1">
            Bets (0 = ∞)
          </label>
          <input
            type="number" min={0} value={autoBetsLeft}
            onChange={(e) => setAutoBetsLeft(Math.max(0, Number(e.target.value)))}
            className="w-full bg-gray-900 border border-purple-900 rounded px-2 py-1 text-white text-sm text-center font-bold focus:outline-none focus:border-purple-500"
          />
        </div>
      )}

      {/* Action button */}
      {mode === 'manual' ? (
        <button
          onClick={handleDrop}
          disabled={balance < bet}
          className="w-full py-3 rounded-xl font-black text-sm tracking-widest uppercase text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg,#6d28d9,#a21caf)',
            boxShadow: '0 4px 24px rgba(109,40,217,0.55)',
          }}
        >
          DROP BALL 🎱
        </button>
      ) : (
        <button
          onClick={toggleAuto}
          disabled={!isAutoRunning && balance < bet}
          className={`w-full py-3 rounded-xl font-black text-sm tracking-widest uppercase text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
            isAutoRunning ? 'bg-yellow-500' : 'bg-green-700'
          }`}
          style={{
            boxShadow: isAutoRunning
              ? '0 4px 20px rgba(234,179,8,0.5)'
              : '0 4px 20px rgba(21,128,61,0.5)',
          }}
        >
          {isAutoRunning ? 'STOP ⏹' : 'START AUTOBET ▶'}
        </button>
      )}
    </div>
  )
}
