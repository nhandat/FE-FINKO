import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { login, register } from '../services/api'
import type { User } from '../types'

type Tab = 'login' | 'register'
type ModalState = 'none' | 'success' | 'fail'

export default function AuthPage() {
  const navigate = useNavigate()
  const setUser = useStore((s) => s.setUser)

  const [tab, setTab] = useState<Tab>('register')
  const [modal, setModal] = useState<ModalState>('none')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [regForm, setRegForm] = useState({
    username: '', phone: '', password: '', confirm: '', referral: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginForm.username || !loginForm.password) return
    setLoading(true)
    try {
      const res = await login({ username: loginForm.username, password: loginForm.password })
      const user: User = { ...res.user, token: res.token }
      setUser(user)
      navigate('/game')
    } catch {
      setErrorMsg('Sai tên tài khoản hoặc mật khẩu')
      setModal('fail')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (regForm.password !== regForm.confirm) {
      setErrorMsg('Mật khẩu xác nhận không khớp')
      setModal('fail')
      return
    }
    setLoading(true)
    try {
      const res = await register({
        username: regForm.username,
        phone: regForm.phone,
        password: regForm.password,
        referralCode: regForm.referral || undefined,
      })
      const user: User = { ...res.user, token: res.token }
      setUser(user)
      setModal('success')
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.'
      setErrorMsg(msg)
      setModal('fail')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full bg-black/30 border border-purple-800/40 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/70 transition'

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <div className="w-full max-w-sm">
        {/* Logo mini */}
        <div className="text-center mb-6">
          <div
            className="text-4xl font-black tracking-wider inline-block"
            style={{
              background: 'linear-gradient(135deg, #FF6B9D, #FFD700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PINKO
          </div>
          <div className="text-white text-sm font-bold tracking-widest">✦ CASINO ✦</div>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-b from-[#1a0a2e] to-[#120820] rounded-3xl border border-purple-800/30 overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-purple-800/30">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-4 text-sm font-bold tracking-wide transition ${
                  tab === t
                    ? 'text-white border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  className={inputCls}
                  placeholder="Tên tài khoản / Số điện thoại"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                />
                <div className="relative">
                  <input
                    className={inputCls + ' pr-10'}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Mật khẩu"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full text-white font-bold text-sm tracking-wider uppercase mt-2 disabled:opacity-50 transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #e91e8c, #c21570)', boxShadow: '0 4px 15px rgba(233,30,140,0.4)' }}
                >
                  {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
                </button>

                <div className="text-center text-gray-500 text-sm py-1">Hoặc</div>
                <SocialButtons />
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <input
                  className={inputCls}
                  placeholder="Tên tài khoản / Số điện thoại"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="Số điện thoại"
                  type="tel"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                />
                <div className="relative">
                  <input
                    className={inputCls + ' pr-10'}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Mật Khẩu"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    className={inputCls + ' pr-10'}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Xác nhận mật khẩu"
                    value={regForm.confirm}
                    onChange={(e) => setRegForm({ ...regForm, confirm: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirm ? '🙈' : '👁'}
                  </button>
                </div>
                <input
                  className={inputCls}
                  placeholder="Mã giới thiệu (không bắt buộc)"
                  value={regForm.referral}
                  onChange={(e) => setRegForm({ ...regForm, referral: e.target.value })}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full text-white font-bold text-sm tracking-wider uppercase mt-2 disabled:opacity-50 transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #e91e8c, #c21570)', boxShadow: '0 4px 15px rgba(233,30,140,0.4)' }}
                >
                  {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ'}
                </button>

                <div className="text-center text-gray-500 text-sm py-1">Hoặc</div>
                <SocialButtons />
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {modal === 'success' && (
        <Modal>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-4 border-green-400 flex items-center justify-center mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">ĐĂNG KÝ THÀNH CÔNG</h2>
            <p className="text-gray-400 text-sm mb-6">
              Chào mừng bạn đến với Pinko Casino!
              Chúc bạn có những phút giây giải trí vui vẻ và thắng lớn.
            </p>
            <button
              onClick={() => { setModal('none'); navigate('/game') }}
              className="w-full py-3.5 rounded-full text-white font-bold text-sm tracking-wider uppercase"
              style={{ background: 'linear-gradient(135deg, #e91e8c, #c21570)' }}
            >
              BẮT ĐẦU CHƠI
            </button>
          </div>
        </Modal>
      )}

      {/* Fail Modal */}
      {modal === 'fail' && (
        <Modal>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-4 border-red-400 flex items-center justify-center mb-4">
              <span className="text-4xl">✕</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">ĐĂNG KÝ THẤT BẠI</h2>
            <p className="text-gray-400 text-sm mb-6">
              {errorMsg || 'Vui lòng kiểm tra lại thông tin và thử lại.'}
            </p>
            <button
              onClick={() => setModal('none')}
              className="w-full py-3.5 rounded-full text-white font-bold text-sm tracking-wider uppercase"
              style={{ background: 'linear-gradient(135deg, #e91e8c, #c21570)' }}
            >
              THỬ LẠI
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gradient-to-b from-[#1a0a2e] to-[#120820] rounded-3xl border border-purple-800/30 p-8 w-full max-w-sm shadow-2xl">
        {children}
      </div>
    </div>
  )
}

function SocialButtons() {
  return (
    <div className="flex gap-3 justify-center">
      {[
        { label: 'Facebook', bg: '#1877F2', icon: 'f' },
        { label: 'Google', bg: '#fff', icon: 'G', textColor: '#555' },
        { label: 'Apple', bg: '#000', icon: '' },
      ].map((s) => (
        <button
          key={s.label}
          type="button"
          className="flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-white/10"
          style={{ backgroundColor: s.bg, color: s.textColor || 'white' }}
        >
          <span>{s.icon}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  )
}
