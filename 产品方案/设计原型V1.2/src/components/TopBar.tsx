import { useState, useRef, useEffect } from 'react'
import { Search, Bell, ChevronRight, Settings, Globe, LogOut, Check, X } from 'lucide-react'
import type { ViewId } from './Sidebar'
import { useLang, type Lang } from '../i18n'

// ─── Settings dropdown ────────────────────────────────────────────────────────

function SettingsDropdown({ onClose }: { onClose: () => void }) {
  const { lang, t, setLang } = useLang()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 300,
        width: 240,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(40px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.6)',
        border: '0.5px solid rgba(193,198,215,0.55)',
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,58,152,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        animation: 'fadeSlideDown 0.14s ease',
      }}
    >
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px 10px',
        borderBottom: '0.5px solid rgba(193,198,215,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Settings size={14} color="#0058BC" />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#181C23' }}>{t.settingsTitle}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0A5B4', padding: 3, lineHeight: 1 }}>
          <X size={14} />
        </button>
      </div>

      {/* Language */}
      <div style={{ padding: '12px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#A0A5B4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          <Globe size={10} />{t.settingsLangSection}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['zh', 'en'] as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 9, fontSize: 13,
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.14s',
                background: lang === l ? '#0058BC' : 'rgba(193,198,215,0.15)',
                color: lang === l ? '#fff' : '#414755',
                border: lang === l ? '1.5px solid #0058BC' : '1.5px solid rgba(193,198,215,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              {lang === l && <Check size={11} />}
              {l === 'zh' ? t.settingsLangZh : t.settingsLangEn}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '0.5px', background: 'rgba(193,198,215,0.4)', margin: '0 14px' }} />

      {/* Logout */}
      <div style={{ padding: '10px 14px 12px' }}>
        <button
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'rgba(186,26,26,0.06)', color: '#BA1A1A',
            border: '0.5px solid rgba(186,26,26,0.18)', transition: 'all 0.14s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(186,26,26,0.11)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(186,26,26,0.06)')}
        >
          <LogOut size={13} />{t.settingsLogout}
        </button>
      </div>
    </div>
  )
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

interface Props {
  currentView: string
  navigateTo: (view: ViewId) => void
}

export default function TopBar({ currentView, navigateTo }: Props) {
  const { t } = useLang()
  const [showSettings, setShowSettings] = useState(false)
  const settingsBtnRef = useRef<HTMLDivElement>(null)

  const info = t.views[currentView] ?? { crumbs: [], title: currentView }

  return (
    <header
      className="glass-strong flex items-center justify-between shrink-0"
      style={{
        height: 56, padding: '0 24px',
        borderBottom: '0.5px solid rgba(193,198,215,0.5)',
        borderRadius: 0, zIndex: 10,
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5" style={{ fontSize: 13.5 }}>
        <button
          className="btn-ghost"
          style={{ padding: '3px 6px', fontSize: 13.5, color: '#717786' }}
          onClick={() => navigateTo('dashboard')}
        >
          InsureOS
        </button>
        {info.crumbs.map((c: string) => (
          <span key={c} className="flex items-center gap-1.5">
            <ChevronRight size={13} style={{ color: '#C1C6D7' }} />
            <span style={{ color: '#717786' }}>{c}</span>
          </span>
        ))}
        {info.title && (
          <span className="flex items-center gap-1.5">
            <ChevronRight size={13} style={{ color: '#C1C6D7' }} />
            <span style={{ color: '#181C23', fontWeight: 600 }}>{info.title}</span>
          </span>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Search */}
        <div className="relative">
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            className="input-glass"
            style={{ paddingLeft: 30, width: 230, fontSize: 13 }}
          />
        </div>

        {/* Notification bell */}
        <button className="btn-ghost relative" style={{ padding: 8 }}>
          <Bell size={17} />
          <span style={{
            position: 'absolute', top: 5, right: 5,
            width: 8, height: 8, borderRadius: '50%',
            background: '#FF3B30', boxShadow: '0 0 5px rgba(255,59,48,0.5)',
            border: '1.5px solid rgba(249,249,255,0.9)',
          }} />
        </button>

        {/* User card + settings dropdown */}
        <div ref={settingsBtnRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSettings(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 8px 4px 5px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: showSettings ? 'rgba(0,88,188,0.08)' : 'rgba(193,198,215,0.15)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!showSettings) e.currentTarget.style.background = 'rgba(193,198,215,0.25)' }}
            onMouseLeave={e => { if (!showSettings) e.currentTarget.style.background = 'rgba(193,198,215,0.15)' }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #0058BC, #60CDFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              {t.adminName.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#181C23', whiteSpace: 'nowrap' }}>{t.adminName}</div>
              <div style={{ fontSize: 11, color: '#717786', whiteSpace: 'nowrap' }}>{t.adminRole}</div>
            </div>
            <Settings size={13} style={{ color: showSettings ? '#0058BC' : '#A0A5B4', marginLeft: 2, flexShrink: 0 }} />
          </button>

          {showSettings && <SettingsDropdown onClose={() => setShowSettings(false)} />}
        </div>
      </div>
    </header>
  )
}
