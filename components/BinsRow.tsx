'use client'
import { useEffect, useRef } from 'react'
import { binPayouts } from '@/lib/constants/game'
import { binColorsByRowCount } from '@/lib/utils/colors'
import type { RowCount, RiskLevel, WinRecord } from '@/types/plinko'

// Fraction of canvas width occupied by bins — constant based on PADDING_X=52, W=760
const BINS_WIDTH_FRACTION = (760 - 52 * 2) / 760

interface Props {
  rowCount:  RowCount
  riskLevel: RiskLevel
  lastWin:   WinRecord | null
}

export default function BinsRow({ rowCount, riskLevel, lastWin }: Props) {
  const colors   = binColorsByRowCount[rowCount]
  const payouts  = binPayouts[rowCount][riskLevel]
  const binRefs  = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!lastWin || lastWin.rowCount !== rowCount) return
    const el = binRefs.current[lastWin.binIndex]
    if (!el) return
    const anim = el.animate(
      [
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(28%) scale(1.1)' },
        { transform: 'translateY(0) scale(1)' },
      ],
      { duration: 300, easing: 'cubic-bezier(0.18,0.89,0.32,1.28)' },
    )
    return () => anim.cancel()
  }, [lastWin, rowCount])

  return (
    <div className="flex w-full justify-center py-1">
      <div
        className="flex gap-[1%]"
        style={{ width: `${BINS_WIDTH_FRACTION * 100}%` }}
      >
        {payouts.map((payout, i) => (
          <div
            key={i}
            ref={(el) => { binRefs.current[i] = el }}
            className="flex min-w-0 flex-1 items-center justify-center rounded-md py-1
                       text-[9px] font-black text-gray-950
                       shadow-[0_3px_var(--bin-shadow)]"
            style={{
              backgroundColor: colors.background[i],
              ['--bin-shadow' as string]: colors.shadow[i],
            }}
          >
            {payout}{payout < 100 ? '×' : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
