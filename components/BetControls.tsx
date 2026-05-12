'use client'
import { BET_OPTIONS } from '@/types/plinko'

interface Props {
  bet: number
  onBetChange: (amount: number) => void
  onStart: () => void
  disabled: boolean
  balance: number
}

export default function BetControls({ bet, onBetChange, onStart, disabled, balance }: Props) {
  return (
    <div className="px-4 pb-5 pt-3 space-y-3"
      style={{ background: 'linear-gradient(0deg,#0C0520 0%,#0C052000 100%)' }}>

      {/* Bet chips */}
      <div className="flex gap-2 justify-center">
        {BET_OPTIONS.map((amt) => {
          const active = bet === amt
          return (
            <button
              key={amt}
              disabled={disabled || balance < amt}
              onClick={() => onBetChange(amt)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 disabled:opacity-40"
              style={active
                ? { background: 'linear-gradient(135deg,#B026FF,#6B10CC)', color: '#fff', boxShadow: '0 0 14px #B026FF88' }
                : { background: '#1A0B32', color: '#9B7DC8', border: '1px solid #3D1F70' }}
            >
              {amt >= 1000 ? `${amt / 1000}K` : amt}
            </button>
          )
        })}
      </div>

      {/* Bet display row */}
      <div className="flex items-center gap-3">
        <button
          disabled={disabled}
          onClick={() => {
            const idx = BET_OPTIONS.indexOf(bet)
            if (idx > 0) onBetChange(BET_OPTIONS[idx - 1])
          }}
          className="w-10 h-10 rounded-full text-white text-xl font-bold flex items-center justify-center disabled:opacity-40"
          style={{ background: '#1A0B32', border: '1px solid #3D1F70' }}
        >−</button>

        <div className="flex-1 text-center py-2 rounded-xl font-bold text-white text-lg tabular-nums"
          style={{ background: '#0F0620', border: '1px solid #3D1F70' }}>
          {bet.toLocaleString()} <span className="text-xs text-purple-400">coin</span>
        </div>

        <button
          disabled={disabled}
          onClick={() => {
            const idx = BET_OPTIONS.indexOf(bet)
            if (idx < BET_OPTIONS.length - 1 && balance >= BET_OPTIONS[idx + 1])
              onBetChange(BET_OPTIONS[idx + 1])
          }}
          className="w-10 h-10 rounded-full text-white text-xl font-bold flex items-center justify-center disabled:opacity-40"
          style={{ background: '#1A0B32', border: '1px solid #3D1F70' }}
        >+</button>
      </div>

      {/* START button */}
      <button
        disabled={disabled || balance < bet}
        onClick={onStart}
        className="w-full py-4 rounded-2xl text-white font-black text-lg tracking-widest uppercase transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: disabled
            ? 'linear-gradient(135deg,#555,#333)'
            : 'linear-gradient(135deg,#FF2D78,#CC0055)',
          boxShadow: disabled ? 'none' : '0 4px 24px rgba(255,45,120,0.55), 0 0 0 1px rgba(255,45,120,0.3)',
        }}
      >
        {disabled ? '▶ ĐANG CHƠI…' : '▶ CHƠI'}
      </button>
    </div>
  )
}
