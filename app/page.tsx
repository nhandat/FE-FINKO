'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import BalanceBar from '@/components/BalanceBar'
import BinsRow from '@/components/BinsRow'
import LastWins from '@/components/LastWins'
import Controls from '@/components/Controls'
import type { RowCount, RiskLevel, WinRecord } from '@/types/plinko'
import { DEFAULT_BALANCE, LOCAL_STORAGE_KEY } from '@/types/plinko'
import type { PlinkoCanvasHandle } from '@/components/PlinkoCanvas'

const PlinkoCanvas = dynamic(() => import('@/components/PlinkoCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[760/570] bg-[#080318] rounded-xl flex items-center justify-center text-purple-600 text-sm">
      Loading…
    </div>
  ),
})

let nextId = 1

export default function Home() {
  const [balance, setBalance]       = useState(DEFAULT_BALANCE)
  const [rowCount, setRowCount]     = useState<RowCount>(8)
  const [riskLevel, setRiskLevel]   = useState<RiskLevel>('low')
  const [winRecords, setWinRecords] = useState<WinRecord[]>([])
  const [lastWin, setLastWin]       = useState<WinRecord | null>(null)

  const canvasRef = useRef<PlinkoCanvasHandle>(null)

  // Persist balance in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) setBalance(Math.max(1, Number(stored)))
  }, [])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, String(balance))
  }, [balance])

  const handleWin = useCallback((record: Omit<WinRecord, 'id'>) => {
    const full: WinRecord = { ...record, id: nextId++ }
    setBalance((b) => b + record.betAmount * record.multiplier)
    setLastWin(full)
    setWinRecords((prev) => [...prev.slice(-99), full])
  }, [])

  const handleDrop = useCallback((bet: number) => {
    if (balance < bet) return
    setBalance((b) => b - bet)
    canvasRef.current?.dropBall(bet)
  }, [balance])

  const handleRowCount = useCallback((rc: RowCount) => {
    setRowCount(rc)
    canvasRef.current?.setRowCount(rc)
  }, [])

  const handleRisk = useCallback((rl: RiskLevel) => {
    setRiskLevel(rl)
    canvasRef.current?.setRiskLevel(rl)
  }, [])

  return (
    <div
      className="flex flex-col h-dvh overflow-hidden max-w-[430px] mx-auto"
      style={{ background: '#080318' }}
    >
      {/* Header */}
      <BalanceBar balance={balance} lastWin={lastWin} />

      {/* Game area: canvas + last-wins sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Centre column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Canvas (aspect-ratio keeps it proportional) */}
          <div className="flex-1 min-h-0 flex items-end">
            <PlinkoCanvas
              ref={canvasRef}
              rowCount={rowCount}
              riskLevel={riskLevel}
              onWin={handleWin}
            />
          </div>
          {/* Bins row aligned under the canvas */}
          <BinsRow
            rowCount={rowCount}
            riskLevel={riskLevel}
            lastWin={lastWin}
          />
        </div>

        {/* Last-wins sidebar */}
        <div
          className="w-10 shrink-0 flex flex-col pt-2 px-1"
          style={{ background: '#060215' }}
        >
          <LastWins records={winRecords} maxCount={10} />
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="shrink-0 border-t border-purple-950"
        style={{ background: '#0d0525' }}
      >
        <Controls
          balance={balance}
          onDrop={handleDrop}
          rowCount={rowCount}
          riskLevel={riskLevel}
          onRowCount={handleRowCount}
          onRisk={handleRisk}
        />
      </div>
    </div>
  )
}
