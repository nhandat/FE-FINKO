import { useStore } from '../store/useStore'
import { QUICK_BETS } from '../constants/game'
import type { RiskLevel } from '../types'

const RISKS: { key: RiskLevel; label: string }[] = [
  { key: 'low', label: 'Thấp' },
  { key: 'medium', label: 'Trung bình' },
  { key: 'high', label: 'Cao' },
]

interface Props {
  onPlay: () => void
  isPlaying: boolean
}

export default function BetControls({ onPlay, isPlaying }: Props) {
  const { risk, setRisk, betAmount, setBetAmount } = useStore()

  const adjustBet = (delta: number) => {
    setBetAmount(Math.max(1, betAmount + delta))
  }

  return (
    <div className="px-4 pb-6 space-y-3">
      {/* Risk selector */}
      <div
        className="flex rounded-xl overflow-hidden border border-purple-800/30"
        style={{ background: 'rgba(10,4,20,0.8)' }}
      >
        {RISKS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setRisk(key)}
            className={`flex-1 py-2.5 text-xs font-bold tracking-wide transition-all ${
              risk === key
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            style={
              risk === key
                ? { background: 'linear-gradient(135deg,#e91e8c,#c21570)', boxShadow: '0 0 12px rgba(233,30,140,0.4)' }
                : {}
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Quick bet amounts */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_BETS.map((amt) => (
          <button
            key={amt}
            onClick={() => setBetAmount(amt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              betAmount === amt
                ? 'text-white border-primary'
                : 'text-gray-400 border-purple-800/30 hover:border-purple-600/50 hover:text-gray-200'
            } border`}
            style={betAmount === amt ? { background: 'rgba(233,30,140,0.2)' } : { background: 'rgba(10,4,20,0.8)' }}
          >
            {amt >= 1000 ? `${amt / 1000}K` : amt}
          </button>
        ))}
      </div>

      {/* Bet amount stepper */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => adjustBet(-10)}
          className="w-10 h-10 rounded-full border border-purple-700/40 text-white text-xl font-bold flex items-center justify-center hover:bg-purple-900/40 transition"
          style={{ background: 'rgba(10,4,20,0.8)' }}
        >
          −
        </button>
        <div
          className="flex-1 text-center py-2.5 rounded-xl border border-purple-700/40 text-white font-bold text-lg tabular-nums"
          style={{ background: 'rgba(10,4,20,0.8)' }}
        >
          {betAmount.toLocaleString('vi-VN')}
        </div>
        <button
          onClick={() => adjustBet(10)}
          className="w-10 h-10 rounded-full border border-purple-700/40 text-white text-xl font-bold flex items-center justify-center hover:bg-purple-900/40 transition"
          style={{ background: 'rgba(10,4,20,0.8)' }}
        >
          +
        </button>
      </div>

      {/* Play button */}
      <button
        onClick={onPlay}
        disabled={isPlaying}
        className="w-full py-4 rounded-full text-white font-black text-base tracking-wider uppercase transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: isPlaying
            ? 'linear-gradient(135deg,#888,#666)'
            : 'linear-gradient(135deg,#e91e8c,#c21570)',
          boxShadow: isPlaying ? 'none' : '0 4px 20px rgba(233,30,140,0.5)',
        }}
      >
        {isPlaying ? 'ĐANG CHƠI...' : 'THỬ ĐỒNG MỚI'}
      </button>
    </div>
  )
}
