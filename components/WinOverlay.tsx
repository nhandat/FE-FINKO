'use client'
import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import type { GameState } from '@/types/plinko'

interface Props {
  state: GameState
  multiplier: number
  winAmount: number
  onClose: () => void
}

export default function WinOverlay({ state, multiplier, winAmount, onClose }: Props) {
  const wrapRef    = useRef<HTMLDivElement>(null)
  const cardRef    = useRef<HTMLDivElement>(null)
  const numRef     = useRef<HTMLSpanElement>(null)
  const starsRef   = useRef<HTMLDivElement>(null)

  const isSuper = state === 'superwin'
  const isWin   = state === 'win' || isSuper
  const tl       = useRef<gsap.core.Timeline | null>(null)

  const handleClose = useCallback(() => {
    const card = cardRef.current
    if (!card) { onClose(); return }
    gsap.to(card, { scale: 0.88, opacity: 0, duration: 0.18, ease: 'power2.in', onComplete: onClose })
  }, [onClose])

  useEffect(() => {
    if (!isWin) return
    const card = cardRef.current
    const num  = numRef.current
    if (!card) return

    tl.current?.kill()
    tl.current = gsap.timeline()

    // Card entrance
    tl.current.fromTo(card,
      { scale: 0.55, opacity: 0, rotate: -4 },
      { scale: 1,    opacity: 1, rotate: 0,  duration: 0.32, ease: 'back.out(1.8)' },
    )

    // Stars radiate
    if (starsRef.current && isSuper) {
      const stars = starsRef.current.querySelectorAll('.star')
      tl.current.fromTo(stars,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(2)' },
        '-=0.1',
      )
    }

    // Count-up
    if (num) {
      const obj = { v: 0 }
      const dur = isSuper ? 1.5 : 0.75
      tl.current.to(obj, {
        v: winAmount, duration: dur, ease: 'power2.out',
        onUpdate: () => { num.textContent = Math.round(obj.v).toLocaleString() },
      }, '-=0.15')
    }

    // Auto-close regular wins
    if (!isSuper) {
      tl.current.to(card, { scale: 0.9, opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: onClose }, '+=1.4')
    }
  }, [state, winAmount, isSuper, isWin, onClose])

  if (!isWin) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      style={{ background: isSuper ? 'rgba(4,1,16,0.82)' : 'transparent' }}
    >
      {isSuper && (
        /* Radial star burst layer */
        <div ref={starsRef} className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => {
            const angle  = (i / 16) * 360
            const dist   = 48 + (i % 3) * 22
            const size   = 6 + (i % 3) * 5
            return (
              <div
                key={i}
                className="star absolute rounded-full"
                style={{
                  width: size, height: size,
                  background: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FF2D78' : '#B026FF',
                  left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * (100 + dist)}px)`,
                  top:  `calc(50% + ${Math.sin((angle * Math.PI) / 180) * (100 + dist)}px)`,
                  boxShadow: `0 0 ${size * 2}px currentColor`,
                  opacity: 0,
                }}
              />
            )
          })}
        </div>
      )}

      <div
        ref={wrapRef}
        className="pointer-events-auto"
        onClick={isSuper ? handleClose : undefined}
      >
        <div
          ref={cardRef}
          className="relative flex flex-col items-center text-center px-8 py-8 rounded-3xl overflow-hidden"
          style={{
            background: isSuper
              ? 'linear-gradient(145deg,#1C0840,#2A0E5C,#1A0840)'
              : 'linear-gradient(145deg,rgba(20,8,45,0.92),rgba(10,4,22,0.92))',
            border: `2px solid ${isSuper ? '#FFD700' : '#FF2D78'}`,
            boxShadow: isSuper
              ? '0 0 0 1px #FFD70033, 0 0 60px rgba(255,215,0,0.45), 0 8px 48px rgba(0,0,0,0.7)'
              : '0 0 30px rgba(255,45,120,0.4), 0 8px 32px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(16px)',
            minWidth: 260,
          }}
        >
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.07) 50%, transparent 65%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2.5s linear infinite',
            }}
          />

          {isSuper ? (
            <>
              {/* Crown */}
              <div className="text-6xl mb-2 drop-shadow-[0_0_16px_#FFD700]">👑</div>

              {/* SUPER WIN text */}
              <div className="relative mb-1">
                <div
                  className="text-5xl font-black tracking-widest uppercase"
                  style={{
                    background: 'linear-gradient(180deg,#FFE566 0%,#FFD700 45%,#CC8800 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 12px #FFD700) drop-shadow(0 0 24px #FFD70066)',
                  }}
                >
                  SUPER
                </div>
                <div
                  className="text-4xl font-black tracking-[0.3em] uppercase -mt-1"
                  style={{
                    background: 'linear-gradient(180deg,#FF80AA 0%,#FF2D78 50%,#CC0044 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 10px #FF2D78)',
                  }}
                >
                  WIN!
                </div>
              </div>
            </>
          ) : (
            <div
              className="text-3xl font-black tracking-wider uppercase mb-2"
              style={{
                background: 'linear-gradient(135deg,#FF80AA,#FF2D78)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 10px #FF2D78)',
              }}
            >
              WIN!
            </div>
          )}

          {/* Divider */}
          <div
            className="w-full h-px my-3 opacity-40"
            style={{ background: `linear-gradient(90deg, transparent, ${isSuper ? '#FFD700' : '#FF2D78'}, transparent)` }}
          />

          {/* Coin amount */}
          <div className="flex items-center gap-2 my-1">
            <span className="text-3xl">🪙</span>
            <span
              ref={numRef}
              className="font-black tabular-nums"
              style={{
                fontSize: isSuper ? 44 : 32,
                background: isSuper
                  ? 'linear-gradient(180deg,#FFE566,#FFD700)'
                  : 'linear-gradient(180deg,#FFFFFF,#DDDDFF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: isSuper ? 'drop-shadow(0 0 10px #FFD700)' : 'none',
              }}
            >
              0
            </span>
          </div>

          {/* Multiplier badge */}
          <div
            className="px-4 py-1 rounded-full text-xs font-bold mt-1"
            style={{
              background: isSuper ? 'rgba(255,215,0,0.15)' : 'rgba(255,45,120,0.15)',
              border: `1px solid ${isSuper ? '#FFD70055' : '#FF2D7855'}`,
              color: isSuper ? '#FFD700' : '#FF2D78',
            }}
          >
            ×{multiplier} MULTIPLIER
          </div>

          {isSuper && (
            <button
              onClick={handleClose}
              className="mt-6 px-9 py-3 rounded-full text-white font-black text-sm tracking-widest uppercase active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(135deg,#FF2D78,#B026FF)',
                boxShadow: '0 4px 20px rgba(255,45,120,0.5), 0 0 0 1px rgba(255,45,120,0.3)',
              }}
            >
              TIẾP TỤC ▶
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
