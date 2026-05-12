'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface Props {
  balance: number
  lastWin?: number | null
}

export default function BalanceBar({ balance, lastWin }: Props) {
  const numRef  = useRef<HTMLSpanElement>(null)
  const prevRef = useRef(balance)
  const winRef  = useRef<HTMLDivElement>(null)

  // Animate balance count-up / count-down
  useEffect(() => {
    const el = numRef.current
    if (!el) return
    const from = prevRef.current
    const to   = balance
    prevRef.current = balance
    if (from === to) return

    const obj = { val: from }
    gsap.to(obj, {
      val: to,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.val).toLocaleString() },
    })
  }, [balance])

  // Flash last win badge
  useEffect(() => {
    const el = winRef.current
    if (!el || !lastWin) return
    gsap.fromTo(el, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.3 })
    gsap.to(el, { opacity: 0, duration: 0.4, delay: 1.6 })
  }, [lastWin])

  return (
    <div className="flex items-center justify-between px-4 py-3 relative z-10"
      style={{ background: 'linear-gradient(180deg,#13082E 0%,#0C0520 100%)' }}>
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full border-2 border-neon-purple/60 flex items-center justify-center text-lg select-none"
        style={{ background: '#1E0B40' }}>
        🎰
      </div>

      {/* Balance */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-neon-yellow text-lg">🪙</span>
          <span
            ref={numRef}
            className="text-white font-bold text-xl tabular-nums"
            style={{ textShadow: '0 0 12px rgba(255,215,0,0.6)' }}
          >
            {balance.toLocaleString()}
          </span>
        </div>

        {/* Last win badge */}
        <div ref={winRef} style={{ opacity: 0 }}
          className="text-neon-yellow text-xs font-bold mt-0.5">
          {lastWin && lastWin > 0 ? `+${lastWin.toLocaleString()}` : ''}
        </div>
      </div>

      {/* Settings / sound */}
      <div className="flex gap-2">
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
          style={{ background: '#1E0B40', border: '1px solid #3D1F70' }}>
          🔊
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
          style={{ background: '#1E0B40', border: '1px solid #3D1F70' }}>
          ⚙️
        </button>
      </div>
    </div>
  )
}
