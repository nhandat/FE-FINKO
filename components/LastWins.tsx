'use client'
import { binColorsByRowCount } from '@/lib/utils/colors'
import type { WinRecord } from '@/types/plinko'

interface Props {
  records: WinRecord[]
  maxCount?: number
}

export default function LastWins({ records, maxCount = 6 }: Props) {
  const recent = [...records].reverse().slice(0, maxCount)

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400 text-center">
        Last
      </p>
      <div className="flex flex-col gap-[3px]">
        {recent.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-center rounded text-[10px] font-black text-gray-950 px-1 py-[2px]"
            style={{ backgroundColor: binColorsByRowCount[r.rowCount].background[r.binIndex] }}
          >
            {r.multiplier}{r.multiplier < 100 ? '×' : ''}
          </div>
        ))}
        {recent.length === 0 && (
          <div className="text-[10px] text-purple-600 text-center">—</div>
        )}
      </div>
    </div>
  )
}
