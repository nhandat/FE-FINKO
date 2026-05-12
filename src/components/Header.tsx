import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { user, logout } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const balance = user?.balance ?? 0

  return (
    <div
      className="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
      style={{ background: 'linear-gradient(180deg,#1a0a2e 0%,#0d0d1a 100%)' }}
    >
      {/* Left: icons */}
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-full bg-purple-900/50 flex items-center justify-center text-lg">
          👑
        </button>
        <button className="w-9 h-9 rounded-full bg-purple-900/50 flex items-center justify-center text-lg">
          🎁
        </button>
      </div>

      {/* Center: balance */}
      <div
        className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-700/30"
        style={{ background: 'rgba(30,10,60,0.8)' }}
      >
        <span className="text-gold text-lg">🪙</span>
        <span className="text-white font-bold text-sm tabular-nums">
          {balance.toLocaleString('vi-VN')}
        </span>
      </div>

      {/* Right: user / logout */}
      <div className="flex items-center gap-2">
        {user && (
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs text-primary font-bold"
          >
            {user.username.slice(0, 2).toUpperCase()}
          </button>
        )}
        <button className="w-9 h-9 rounded-full bg-purple-900/50 flex items-center justify-center text-lg">
          🔔
        </button>
      </div>
    </div>
  )
}
