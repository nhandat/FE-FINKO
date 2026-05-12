'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { GameState } from '@/types/plinko'

interface Props {
  state: GameState
  multiplier: number
  winAmount: number
  onClose: () => void
}

export default function WinOverlay({ state, multiplier, winAmount, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const numRef     = useRef<HTMLSpanElement>(null)

  const isSuper = state === 'superwin'
  const isWin   = state === 'win' || isSuper

  useEffect(() => {
    const el = overlayRef.current
    if (!el || !isWin) return

    gsap.fromTo(el, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(1.4)' })

    // Count-up number
    const span = numRef.current
    if (span) {
      const obj = { v: 0 }
      gsap.to(obj, {
        v: winAmount,
        duration: isSuper ? 1.4 : 0.7,
        ease: 'power2.out',
        onUpdate: () => { span.textContent = Math.round(obj.v).toLocaleString() },
      })
    }

    // Auto-dismiss regular wins
    if (!isSuper) {
      gsap.to(el, { opacity: 0, scale: 0.9, duration: 0.25, delay: 1.8, onComplete: onClose })
    }
  }, [state, winAmount, isSuper, isWin, onClose])

  if (!isWin) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: isSuper ? 'rgba(0,0,0,0.75)' : 'transparent' }}
      onClick={isSuper ? onClose : undefined}
    >
      <div
        ref={overlayRef}
        className="flex flex-col items-center text-center px-8 py-7 rounded-3xl"
        style={{
          background: isSuper
            ? 'linear-gradient(145deg,#1E0B40,#2D0F5E)'
            : 'linear-gradient(145deg,#160830cc,#0C0520cc)',
          border: `2px solid ${isSuper ? '#FFD700' : '#FF2D78'}`,
          boxShadow: isSuper
            ? '0 0 60px rgba(255,215,0,0.4), 0 0 120px rgba(255,215,0,0.15)'
            : '0 0 30px rgba(255,45,120,0.35)',
          backdropFilter: 'blur(10px)',
          pointerEvents: 'auto',
        }}
      >
        {isSuper ? (
          <>
            <div className="text-5xl mb-2">🏆</div>
            <div
              className="text-4xl font-black mb-1 tracking-widest"
              style={{ color: '#FFD700', textShadow: '0 0 20px #FFD700, 0 0 40px #FFD70066' }}
            >
              SUPER WIN!
            </div>
          </>
        ) : (
          <div
            className="text-2xl font-black mb-1 tracking-wider"
            style={{ color: '#FF2D78', textShadow: '0 0 14px #FF2D7888' }}
          >
            WIN!
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl">🪙</span>
          <span
            ref={numRef}
            className="font-black tabular-nums"
            style={{
              fontSize: isSuper ? 40 : 28,
              color: isSuper ? '#FFD700' : '#FFFFFF',
              textShadow: isSuper ? '0 0 16px #FFD700' : 'none',
            }}
          >
            0
          </span>
        </div>

        <div className="mt-1 text-sm font-bold"
          style={{ color: isSuper ? '#FFD700aa' : '#ffffff88' }}>
          ×{multiplier} multiplier
        </div>

        {isSuper && (
          <button
            onClick={onClose}
            className="mt-5 px-8 py-2.5 rounded-full text-white font-bold text-sm tracking-wider"
            style={{ background: 'linear-gradient(135deg,#FF2D78,#B026FF)', boxShadow: '0 4px 18px rgba(255,45,120,0.45)' }}
          >
            TIẾP TỤC
          </button>
        )}
      </div>
    </div>
  )
}
