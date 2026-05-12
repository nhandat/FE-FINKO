'use client'
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import type { RowCount, RiskLevel, WinRecord } from '@/types/plinko'
import type { PlinkoEngine } from '@/game/PlinkoEngine'

export interface PlinkoCanvasHandle {
  dropBall: (bet: number) => void
  setRowCount: (rc: RowCount) => void
  setRiskLevel: (rl: RiskLevel) => void
  getBinsWidthFraction: () => number
}

interface Props {
  rowCount:  RowCount
  riskLevel: RiskLevel
  onWin:     (record: Omit<WinRecord, 'id'>) => void
}

const PlinkoCanvas = forwardRef<PlinkoCanvasHandle, Props>(function PlinkoCanvas(
  { rowCount, riskLevel, onWin },
  ref,
) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const engineRef  = useRef<PlinkoEngine | null>(null)
  // Keep latest callbacks in refs so engine closure stays up-to-date
  const onWinRef     = useRef(onWin)
  const rowCountRef  = useRef(rowCount)
  const riskLevelRef = useRef(riskLevel)

  useEffect(() => { onWinRef.current = onWin }, [onWin])

  useImperativeHandle(ref, () => ({
    dropBall:           (bet)  => engineRef.current?.dropBall(bet),
    setRowCount:        (rc)   => engineRef.current?.setRowCount(rc),
    setRiskLevel:       (rl)   => engineRef.current?.setRiskLevel(rl),
    getBinsWidthFraction: ()   => engineRef.current?.binsWidthFraction ?? ((760 - 104) / 760),
  }))

  // Sync rowCount / riskLevel changes into a running engine
  useEffect(() => {
    if (rowCountRef.current !== rowCount) {
      rowCountRef.current = rowCount
      engineRef.current?.setRowCount(rowCount)
    }
  }, [rowCount])

  useEffect(() => {
    if (riskLevelRef.current !== riskLevel) {
      riskLevelRef.current = riskLevel
      engineRef.current?.setRiskLevel(riskLevel)
    }
  }, [riskLevel])

  // Mount engine once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let destroyed = false

    async function init() {
      const { PlinkoEngine } = await import('@/game/PlinkoEngine')
      if (destroyed || !canvasRef.current) return
      engineRef.current = new PlinkoEngine(
        canvasRef.current,
        rowCountRef.current,
        riskLevelRef.current,
        (record) => onWinRef.current(record),
      )
    }

    init()

    return () => {
      destroyed = true
      engineRef.current?.stop()
      engineRef.current = null
    }
  }, [])

  return (
    // Canvas renders at 760×570 internally; CSS width:100% scales it
    <canvas
      ref={canvasRef}
      width={760}
      height={570}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      className="rounded-xl"
    />
  )
})

export default PlinkoCanvas
