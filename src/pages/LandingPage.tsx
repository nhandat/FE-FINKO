import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function LandingPage() {
  const navigate = useNavigate()
  const user = useStore((s) => s.user)

  const handleStart = () => {
    if (user) navigate('/game')
    else navigate('/auth')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg overflow-hidden relative">
      {/* Background decorative circles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-purple-800/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm mx-auto px-6">
        {/* Casino chandelier / decoration */}
        <div className="w-full flex justify-center mb-2">
          <svg width="200" height="60" viewBox="0 0 200 60" fill="none">
            <ellipse cx="100" cy="10" rx="80" ry="8" fill="#7B2D8B" opacity="0.6" />
            <rect x="92" y="10" width="16" height="40" rx="8" fill="url(#chand)" />
            <defs>
              <linearGradient id="chand" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#FFD700" />
                <stop offset="1" stopColor="#FF8800" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Logo */}
        <div className="bg-gradient-to-b from-[#1a0a2e] to-[#2d0f4e] rounded-3xl p-8 w-full text-center border border-purple-800/30 shadow-2xl">
          {/* Decorative balls */}
          <div className="flex justify-around mb-4">
            {['🎰', '🃏', '🎱', '🎪', '🎰'].map((icon, i) => (
              <span key={i} className="text-2xl opacity-80">{icon}</span>
            ))}
          </div>

          {/* PINKO text */}
          <div className="mb-1">
            <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">WELCOME TO</div>
            <div
              className="text-5xl font-black tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #FF6B9D 0%, #FF1493 50%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                filter: 'drop-shadow(0 0 20px rgba(233,30,140,0.5))',
              }}
            >
              PINKO
            </div>
            <div className="text-xl font-bold text-white tracking-widest">✦ CASINO ✦</div>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-xs mt-4 mb-6 leading-relaxed px-2">
            Tải may chắm ngao với trò chơi Plinko Casino thú vị.
            Mỗi lần thả bóng là một cơ hội chiến thắng lớn!
          </p>

          {/* CTA Button */}
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-full text-white font-bold text-lg tracking-wider uppercase transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #e91e8c 0%, #c21570 100%)',
              boxShadow: '0 4px 20px rgba(233,30,140,0.5)',
            }}
          >
            BẮT ĐẦU CHƠI
          </button>
        </div>

        {/* Bottom decoration */}
        <div className="mt-6 text-center text-gray-600 text-xs">
          Chơi có trách nhiệm • 18+
        </div>
      </div>
    </div>
  )
}
