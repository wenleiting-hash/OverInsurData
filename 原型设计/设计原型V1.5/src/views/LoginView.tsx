import { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Globe, Lock } from 'lucide-react'

export type LoginMode = 'standalone' | 'sso'
type LoginLang = 'zh' | 'en'

export interface SSOUser {
  name: string
  role: string
  avatar?: string
  platform: string
  token: string
}

interface LoginViewProps {
  onLogin: (user?: SSOUser) => void
}

const loginI18n = {
  zh: {
    tagline: '海外保险管理平台',
    tabAccount: '账号密码登录',
    tabSSO: '集成平台登录',
    labelUsername: '用户名',
    labelPassword: '密码',
    placeholderUsername: '请输入用户名',
    placeholderPassword: '请输入密码',
    forgotPassword: '忘记密码？',
    loginBtn: '登录',
    loggingIn: '登录中…',
    errEmpty: '请输入用户名和密码',
    errWrong: '用户名或密码错误，请重试',
    demoLabel: '演示账号',
    demoUser: '用户名',
    demoPass: '密码',
    ssoVerified: '已验证',
    ssoFrom: '来自',
    ssoEnterBtn: '进入 InsureOS',
    ssoEntering: '进入系统中…',
    ssoTitle: '通过集成平台登录',
    ssoDesc: '本系统支持作为子系统集成到其他平台。\n当由集成平台跳转过来时，用户信息将自动携带，无需再次输入。',
    ssoParamsTitle: '集成参数说明',
    ssoParams: [
      ['token', '用户认证令牌（必填）'],
      ['user', '用户姓名（必填）'],
      ['role', '用户角色（可选）'],
      ['platform', '来源平台名称（可选）'],
    ],
    ssoExample: '示例',
    ssoNoUser: '当前未检测到集成平台传入的用户信息，请由集成平台携带参数跳转至本页面。',
    footer: '© 2025 InsureOS · 海外保险管理平台 · 保留所有权利',
  },
  en: {
    tagline: 'Overseas Insurance Management Platform',
    tabAccount: 'Account Login',
    tabSSO: 'Platform SSO',
    labelUsername: 'Username',
    labelPassword: 'Password',
    placeholderUsername: 'Enter username',
    placeholderPassword: 'Enter password',
    forgotPassword: 'Forgot password?',
    loginBtn: 'Sign In',
    loggingIn: 'Signing in…',
    errEmpty: 'Please enter your username and password',
    errWrong: 'Incorrect username or password, please try again',
    demoLabel: 'Demo account',
    demoUser: 'Username',
    demoPass: 'Password',
    ssoVerified: 'Verified',
    ssoFrom: 'From',
    ssoEnterBtn: 'Enter InsureOS',
    ssoEntering: 'Entering…',
    ssoTitle: 'Sign in via Integrated Platform',
    ssoDesc: 'InsureOS supports sub-system integration.\nWhen redirected from an integrated platform, user credentials are carried automatically.',
    ssoParamsTitle: 'Integration Parameters',
    ssoParams: [
      ['token', 'Auth token (required)'],
      ['user', 'User name (required)'],
      ['role', 'User role (optional)'],
      ['platform', 'Source platform name (optional)'],
    ],
    ssoExample: 'Example',
    ssoNoUser: 'No integrated platform user info detected. Please redirect from your integrated platform with the required parameters.',
    footer: '© 2025 InsureOS · All rights reserved',
  },
} as const

function detectSSOParams(): SSOUser | null {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token') || params.get('sso_token') || params.get('access_token')
  const name = params.get('user') || params.get('username') || params.get('name')
  const role = params.get('role') || params.get('user_role')
  const platform = params.get('platform') || params.get('source')
  if (token && name) {
    return {
      token,
      name: decodeURIComponent(name),
      role: role ? decodeURIComponent(role) : 'Platform User',
      platform: platform ? decodeURIComponent(platform) : '集成平台',
    }
  }
  return null
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [lang, setLang] = useState<LoginLang>('zh')
  const [mode, setMode] = useState<LoginMode>('standalone')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ssoUser, setSSOUser] = useState<SSOUser | null>(null)
  const [ssoLoading, setSSOLoading] = useState(false)

  const t = loginI18n[lang]

  useEffect(() => {
    const detected = detectSSOParams()
    if (detected) {
      setMode('sso')
      setSSOUser(detected)
    }
  }, [])

  const handleStandaloneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError(t.errEmpty)
      return
    }
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
    if (username !== 'admin' || password !== 'admin123') {
      setError(t.errWrong)
      return
    }
    onLogin({ name: '管理员', role: 'Platform Admin', platform: 'standalone', token: 'mock' })
  }

  const handleSSOLogin = async () => {
    if (!ssoUser) return
    setSSOLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSSOLoading(false)
    onLogin(ssoUser)
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at 15% 25%, rgba(0,88,188,0.18) 0%, transparent 50%),' +
          'radial-gradient(ellipse at 85% 75%, rgba(0,112,235,0.12) 0%, transparent 50%),' +
          'radial-gradient(ellipse at 50% 50%, rgba(173,198,255,0.25) 0%, #EEF2FF 100%)',
      }}
    >
      {/* Decorative orbs */}
      <div style={{ position: 'absolute', top: '8%', left: '6%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,88,188,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,112,235,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Language switcher — top right */}
      <div style={{ position: 'absolute', top: 20, right: 24, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)', border: '1px solid rgba(193,198,215,0.5)', borderRadius: 10, padding: '3px 4px' }}>
        {(['zh', 'en'] as LoginLang[]).map((l) => (
          <button
            key={l}
            onClick={() => { setLang(l); setError('') }}
            style={{
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: lang === l ? 600 : 400,
              color: lang === l ? 'white' : '#717786',
              background: lang === l ? 'linear-gradient(135deg, #0058BC, #0070EB)' : 'none',
              border: 'none',
              borderRadius: 7,
              cursor: 'pointer',
              transition: 'all 0.18s',
              boxShadow: lang === l ? '0 2px 8px rgba(0,88,188,0.25)' : 'none',
            }}
          >
            {l === 'zh' ? '中文' : 'EN'}
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,88,188,0.35)', marginBottom: 14,
            }}
          >
            <Shield size={26} color="white" strokeWidth={2} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 700, color: '#0058BC', letterSpacing: '-0.4px', marginBottom: 4 }}>
            InsureOS
          </h1>
          <p style={{ fontSize: 13, color: '#717786', fontWeight: 400 }}>{t.tagline}</p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.72)', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,58,152,0.10), 0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

          {/* Mode tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(193,198,215,0.5)' }}>
            {([['standalone', <Lock size={13} />, t.tabAccount], ['sso', <Globe size={13} />, t.tabSSO]] as const).map(([m, icon, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                style={{
                  flex: 1, padding: '14px 0', fontSize: 13,
                  fontWeight: mode === m ? 600 : 400,
                  color: mode === m ? '#0058BC' : '#717786',
                  background: 'none', border: 'none',
                  borderBottom: mode === m ? '2px solid #0058BC' : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          <div style={{ padding: '28px 32px 32px' }}>
            {mode === 'standalone' ? (
              <form onSubmit={handleStandaloneLogin}>
                {/* Username */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#414755', marginBottom: 6 }}>
                    {t.labelUsername}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError('') }}
                    placeholder={t.placeholderUsername}
                    autoComplete="username"
                    style={{ width: '100%', padding: '10px 14px', fontSize: 14, color: '#181C23', background: 'rgba(241,243,254,0.8)', border: `1px solid ${error ? '#BA1A1A' : 'rgba(193,198,215,0.7)'}`, borderRadius: 10, outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.borderColor = '#0058BC'; e.target.style.boxShadow = '0 0 0 3px rgba(0,88,188,0.12)' }}
                    onBlur={(e) => { e.target.style.borderColor = error ? '#BA1A1A' : 'rgba(193,198,215,0.7)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#414755', marginBottom: 6 }}>
                    {t.labelPassword}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                      placeholder={t.placeholderPassword}
                      autoComplete="current-password"
                      style={{ width: '100%', padding: '10px 40px 10px 14px', fontSize: 14, color: '#181C23', background: 'rgba(241,243,254,0.8)', border: `1px solid ${error ? '#BA1A1A' : 'rgba(193,198,215,0.7)'}`, borderRadius: 10, outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.target.style.borderColor = '#0058BC'; e.target.style.boxShadow = '0 0 0 3px rgba(0,88,188,0.12)' }}
                      onBlur={(e) => { e.target.style.borderColor = error ? '#BA1A1A' : 'rgba(193,198,215,0.7)'; e.target.style.boxShadow = 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#717786', padding: 2, display: 'flex' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '8px 12px', background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.2)', borderRadius: 8, fontSize: 13, color: '#BA1A1A' }}>
                    <AlertCircle size={14} />{error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '11px 0', fontSize: 14, fontWeight: 600, color: 'white', background: loading ? 'rgba(0,88,188,0.6)' : 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 14px rgba(0,88,188,0.35)', transition: 'all 0.2s' }}
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? t.loggingIn : t.loginBtn}
                </button>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button type="button" style={{ fontSize: 12, color: '#0058BC', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {t.forgotPassword}
                  </button>
                </div>

                <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(241,243,254,0.9)', border: '1px dashed rgba(193,198,215,0.8)', borderRadius: 8, fontSize: 12, color: '#717786', lineHeight: 1.7 }}>
                  <span style={{ fontWeight: 600, color: '#414755' }}>{t.demoLabel}</span>
                  &nbsp;&nbsp;{t.demoUser}：<code style={{ fontFamily: 'var(--font-mono)', color: '#0058BC' }}>admin</code>
                  &nbsp;&nbsp;{t.demoPass}：<code style={{ fontFamily: 'var(--font-mono)', color: '#0058BC' }}>admin123</code>
                </div>
              </form>
            ) : (
              <SSOPanel ssoUser={ssoUser} loading={ssoLoading} onLogin={handleSSOLogin} t={t} />
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#9EA6B4' }}>{t.footer}</p>
      </div>
    </div>
  )
}

function SSOPanel({
  ssoUser, loading, onLogin, t,
}: {
  ssoUser: SSOUser | null
  loading: boolean
  onLogin: () => void
  t: typeof loginI18n['zh'] | typeof loginI18n['en']
}) {
  if (ssoUser) {
    return (
      <div>
        <div style={{ background: 'rgba(0,88,188,0.05)', border: '1px solid rgba(0,88,188,0.15)', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #0058BC, #0070EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'white', fontWeight: 600, flexShrink: 0 }}>
              {ssoUser.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23' }}>{ssoUser.name}</div>
              <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{ssoUser.role}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#0058BC', background: 'rgba(0,88,188,0.08)', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>
              <CheckCircle size={11} />{t.ssoVerified}
            </div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,88,188,0.1)', fontSize: 12, color: '#717786', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Globe size={12} />
            {t.ssoFrom}&nbsp;<span style={{ color: '#414755', fontWeight: 500 }}>{ssoUser.platform}</span>
          </div>
        </div>

        <button
          onClick={onLogin}
          disabled={loading}
          style={{ width: '100%', padding: '11px 0', fontSize: 14, fontWeight: 600, color: 'white', background: loading ? 'rgba(0,88,188,0.6)' : 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 14px rgba(0,88,188,0.35)', transition: 'all 0.2s' }}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? t.ssoEntering : t.ssoEnterBtn}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,88,188,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Globe size={24} color="#0058BC" />
        </div>
        <p style={{ fontSize: 14, color: '#414755', fontWeight: 500, marginBottom: 6 }}>{t.ssoTitle}</p>
        <p style={{ fontSize: 12, color: '#717786', lineHeight: 1.6 }}>
          {t.ssoDesc.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
        </p>
      </div>

      <div style={{ background: 'rgba(241,243,254,0.8)', border: '1px solid rgba(193,198,215,0.5)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#414755', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {t.ssoParamsTitle}
        </p>
        {t.ssoParams.map(([key, desc]) => (
          <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 12 }}>
            <code style={{ background: 'rgba(0,88,188,0.08)', color: '#0058BC', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11, whiteSpace: 'nowrap' }}>{key}</code>
            <span style={{ color: '#717786' }}>{desc}</span>
          </div>
        ))}
        <p style={{ fontSize: 11, color: '#9EA6B4', marginTop: 8 }}>
          {t.ssoExample}：<code style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>?token=xxx&user=张三&role=Admin&platform=ERP</code>
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#717786', padding: '10px 12px', background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.3)', borderRadius: 8 }}>
        <AlertCircle size={14} color="#B8860B" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{t.ssoNoUser}</span>
      </div>
    </div>
  )
}
