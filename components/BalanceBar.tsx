'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { WinRecord } from '@/types/plinko'

interface Props {
  balance: number
  lastWin: WinRecord | null
}

export default function BalanceBar({ balance, lastWin }: Props) {
  const numRef  = useRef<HTMLSpanElement>(null)
  const prevRef = useRef(balance)
  const badgeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = numRef.current
    if (!el) return
    const from = prevRef.current
    prevRef.current = balance
    if (from === balance) return
    const obj = { v: from }
    gsap.to(obj, {
      v: balance, duration: 0.55, ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString() },
    })
  }, [balance])

  useEffect(() => {
    const el = badgeRef.current
    if (!el || !lastWin) return
    gsap.killTweensOf(el)
    gsap.fromTo(el, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.25 })
    gsap.to(el, { opacity: 0, duration: 0.35, delay: 1.8 })
  }, [lastWin])

  const profit = lastWin ? lastWin.profit : 0

  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 shrink-0"
      style={{ background: 'linear-gradient(180deg,#160930 0%,#0c0520 100%)' }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-base border border-purple-800"
          style={{ background: '#1e0b40' }}
        >
          🎰
        </div>
        <span className="text-purple-400 text-xs font-semibold">FINKO</span>
      </div>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-400 text-base">🪙</span>
          <span
            ref={numRef}
            className="text-white font-black text-lg tabular-nums"
            style={{ textShadow: '0 0 10px rgba(255,215,0,0.5)' }}
          >
            {balance.toLocaleString()}
          </span>
        </div>
        <div ref={badgeRef} style={{ opacity: 0, minHeight: 16 }}>
          {lastWin && (
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: profit >= 0 ? '#4ade80' : '#f87171' }}
            >
              {profit >= 0 ? '+' : ''}{profit.toLocaleString()} coins
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1.5">
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-purple-800"
          style={{ background: '#1e0b40' }}
        >
          🔊
        </button>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-purple-800"
          style={{ background: '#1e0b40' }}
        >
          ⚙️
        </button>
      </div>
    </div>
  )
}
