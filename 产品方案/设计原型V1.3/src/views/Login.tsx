import { useState, type CSSProperties, type FormEvent } from 'react'
import { ShieldCheck, Lock, Globe, Eye, EyeOff, Info } from 'lucide-react'

interface Props {
  onSuccess: () => void
}

type LoginLang = 'zh' | 'en'

// ─── Login ────────────────────────────────────────────────────────────────────

export default function Login({ onSuccess }: Props) {
  // 登录页语言独立于系统语言设置：初始跟随系统语言，切换时不回写 localStorage
  const [loginLang, setLoginLang] = useState<LoginLang>(() => {
    try { return (localStorage.getItem('insure-os-lang') as LoginLang) ?? 'zh' } catch { return 'zh' }
  })
  const en = loginLang === 'en'
  const [tab, setTab] = useState<'password' | 'sso'>('password')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  const inputStyle: CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14, color: '#181C23',
    background: 'rgba(241,243,254,0.8)', border: '1px solid rgba(193,198,215,0.7)',
    borderRadius: 10, outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box', fontFamily: 'var(--font-sans)',
  }
  const codeStyle: CSSProperties = {
    fontFamily: 'var(--font-mono)', color: '#0058BC',
  }
  const paramRowStyle: CSSProperties = {
    display: 'flex', gap: 8, marginBottom: 4, fontSize: 12,
  }
  const chipStyle: CSSProperties = {
    ...codeStyle, fontSize: 11, background: 'rgba(0,88,188,0.08)',
    padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap',
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#0058BC'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,88,188,0.12)'
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(193,198,215,0.7)'
    e.currentTarget.style.boxShadow = 'none'
  }

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError(en ? 'Please enter your username and password' : '请输入用户名和密码')
      return
    }
    // 演示环境：admin / admin123（与原型一致，错误凭证静默停留在登录页）
    if (username === 'admin' && password === 'admin123') {
      setError('')
      onSuccess()
    }
  }

  const tabButtonStyle = (active: boolean): CSSProperties => ({
    flex: '1 1 0%', padding: '14px 0', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? '#0058BC' : '#717786', background: 'none',
    borderBottom: `2px solid ${active ? '#0058BC' : 'transparent'}`,
    cursor: 'pointer', transition: '0.2s', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'var(--font-sans)',
  })

  const langButtonStyle = (active: boolean): CSSProperties => ({
    padding: '4px 12px', fontSize: 12, fontWeight: active ? 600 : 400,
    color: active ? '#fff' : '#717786',
    background: active ? 'linear-gradient(135deg, #0058BC, #0070EB)' : 'none',
    border: 'none', borderRadius: 7, cursor: 'pointer', transition: '0.18s',
    boxShadow: active ? '0 2px 8px rgba(0,88,188,0.25)' : 'none',
    fontFamily: 'var(--font-sans)',
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        background:
          'radial-gradient(at 15% 25%, rgba(0,88,188,0.18) 0%, transparent 50%),' +
          'radial-gradient(at 85% 75%, rgba(0,112,235,0.12) 0%, transparent 50%),' +
          'radial-gradient(rgba(173,198,255,0.25) 0%, rgb(238,242,255) 100%)',
      }}
    >
      {/* Language toggle（登录页独立语言，与系统设置互不影响） */}
      <div style={{
        position: 'absolute', top: 20, right: 24, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 2,
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(193,198,215,0.5)', borderRadius: 10, padding: '3px 4px',
      }}>
        <button style={langButtonStyle(loginLang === 'zh')} onClick={() => setLoginLang('zh')}>中文</button>
        <button style={langButtonStyle(loginLang === 'en')} onClick={() => setLoginLang('en')}>EN</button>
      </div>
      {/* Decorative orbs */}
      <div style={{
        position: 'absolute', top: '8%', left: '6%', width: 320, height: 320,
        borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(0,88,188,0.09) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '8%', width: 400, height: 400,
        borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(0,112,235,0.07) 0%, transparent 70%)',
      }} />

      {/* Center column */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 448, margin: '0 16px' }}>
        {/* Brand header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,88,188,0.35)', marginBottom: 14,
          }}>
            <ShieldCheck size={26} color="#fff" strokeWidth={2} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 700,
            color: '#0058BC', letterSpacing: -0.4, margin: '0 0 4px', lineHeight: 1.3,
          }}>InsureOS</h1>
          <p style={{ fontSize: 13, color: '#717786', fontWeight: 400, margin: 0 }}>
            {en ? 'Overseas Insurance Management Platform' : '海外保险管理平台'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.72)',
          borderRadius: 20,
          boxShadow: '0 4px 32px rgba(0,58,152,0.10), 0 1px 4px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(193,198,215,0.5)' }}>
            <button style={tabButtonStyle(tab === 'password')} onClick={() => setTab('password')}>
              <Lock size={13} />{en ? 'Account Login' : '账号密码登录'}
            </button>
            <button style={tabButtonStyle(tab === 'sso')} onClick={() => setTab('sso')}>
              <Globe size={13} />{en ? 'Platform SSO' : '集成平台登录'}
            </button>
          </div>

          {tab === 'password' ? (
            /* ── Tab 1: account & password ── */
            <div style={{ padding: '28px 32px 32px' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#414755', marginBottom: 6 }}>
                    {en ? 'Username' : '用户名'}
                  </label>
                  <input
                    type="text"
                    placeholder={en ? 'Enter username' : '请输入用户名'}
                    autoComplete="username"
                    value={username}
                    onChange={e => { setUsername(e.target.value); if (error) setError('') }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#414755', marginBottom: 6 }}>
                    {en ? 'Password' : '密码'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder={en ? 'Enter password' : '请输入密码'}
                      autoComplete="current-password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); if (error) setError('') }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      style={{ ...inputStyle, padding: '10px 40px 10px 14px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#717786', padding: 2, display: 'flex',
                      }}
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ fontSize: 12, color: '#BA1A1A', textAlign: 'center', marginBottom: 12 }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '11px 0', fontSize: 14, fontWeight: 600,
                    color: '#fff', background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
                    border: 'none', borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 14px rgba(0,88,188,0.35)', transition: '0.2s',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {en ? 'Sign In' : '登录'}
                </button>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button
                    type="button"
                    style={{ fontSize: 12, color: '#0058BC', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                  >
                    {en ? 'Forgot password?' : '忘记密码？'}
                  </button>
                </div>

                <div style={{
                  marginTop: 20, padding: '10px 14px',
                  background: 'rgba(241,243,254,0.9)',
                  border: '1px dashed rgba(193,198,215,0.8)', borderRadius: 8,
                  fontSize: 12, color: '#717786', lineHeight: 1.7,
                }}>
                  <span style={{ fontWeight: 600, color: '#414755' }}>{en ? 'Demo account' : '演示账号'}</span>
                  &nbsp;&nbsp;{en ? 'Username：' : '用户名：'}<code style={codeStyle}>admin</code>
                  &nbsp;&nbsp;{en ? 'Password：' : '密码：'}<code style={codeStyle}>admin123</code>
                </div>
              </form>
            </div>
          ) : (
            /* ── Tab 2: integration platform ── */
            <div style={{ padding: '28px 32px 32px' }}>
              <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(0,88,188,0.07)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                }}>
                  <Globe size={24} color="#0058BC" strokeWidth={2} />
                </div>
                <p style={{ fontSize: 14, color: '#414755', fontWeight: 500, margin: '0 0 6px' }}>
                  {en ? 'Sign in via Integrated Platform' : '通过集成平台登录'}
                </p>
                <p style={{ fontSize: 12, color: '#717786', lineHeight: 1.6, margin: 0 }}>
                  {en
                    ? <>InsureOS supports sub-system integration.<br />When redirected from an integrated platform, user credentials are carried automatically</>
                    : <>本系统支持作为子系统集成到其他平台。<br />当由集成平台跳转过来时，用户信息将自动携带，无需再次输入。</>}
                </p>
              </div>

              <div style={{
                background: 'rgba(241,243,254,0.8)',
                border: '1px solid rgba(193,198,215,0.5)', borderRadius: 10,
                padding: '14px 16px', marginBottom: 20,
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#414755', marginBottom: 8, letterSpacing: 0.5, margin: '0 0 8px' }}>
                  {en ? 'Integration Parameters' : '集成参数说明'}
                </p>
                <div style={paramRowStyle}>
                  <code style={chipStyle}>token</code>
                  <span style={{ color: '#717786' }}>{en ? 'Auth token (required)' : '用户认证令牌（必填）'}</span>
                </div>
                <div style={paramRowStyle}>
                  <code style={chipStyle}>user</code>
                  <span style={{ color: '#717786' }}>{en ? 'User name (required)' : '用户姓名（必填）'}</span>
                </div>
                <div style={paramRowStyle}>
                  <code style={chipStyle}>role</code>
                  <span style={{ color: '#717786' }}>{en ? 'User role (optional)' : '用户角色（可选）'}</span>
                </div>
                <div style={paramRowStyle}>
                  <code style={chipStyle}>platform</code>
                  <span style={{ color: '#717786' }}>{en ? 'Source platform name (optional)' : '来源平台名称（可选）'}</span>
                </div>
                <p style={{ fontSize: 11, color: '#9EA6B4', marginTop: 8, marginBottom: 0 }}>
                  {en ? 'Example：' : '示例：'}
                  <code style={{ ...codeStyle, fontSize: 10 }}>?token=xxx&amp;user=张三&amp;role=Admin&amp;platform=ERP</code>
                </p>
              </div>

              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12,
                color: '#717786', padding: '10px 12px',
                background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.3)',
                borderRadius: 8,
              }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  {en
                    ? 'No integrated platform user info detected. Please redirect from your integrated platform with the required parameters.'
                    : '当前未检测到集成平台传入的用户信息，请由集成平台携带参数跳转至本页面。'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#9EA6B4', marginBottom: 0 }}>
          {en
            ? <>© 2025 InsureOS · All rights reserved</>
            : <>© 2025 InsureOS · 海外保险管理平台 · 保留所有权利</>}
        </p>
      </div>
    </div>
  )
}
