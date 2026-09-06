import { useState } from 'react'
import { ArrowLeft, Search, RefreshCw, GitMerge, CheckCircle, X, AlertTriangle, Eye, ArrowRight, Shield } from 'lucide-react'
import { duplicateGroups } from '../data/insurerDetails'
import type { MatchFieldKey } from '../data/insurerDetails'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
}

type GroupStatus = 'unresolved' | 'merged' | 'dismissed'

export default function InsurerDuplicate({ navigateTo }: Props) {
  const { t } = useLang()
  const [detecting, setDetecting] = useState(false)
  const [detected, setDetected] = useState(true)
  const [selected, setSelected] = useState<string | null>(duplicateGroups[0].id)
  const [groupStatus, setGroupStatus] = useState<Record<string, GroupStatus>>({})
  const [primaryRecord, setPrimaryRecord] = useState<Record<string, string>>({})

  const mfLabel: Record<MatchFieldKey, string> = {
    nameFuzzy: t.insDupMfNameFuzzy,
    naicPartial: t.insDupMfNaicPartial,
    hqState: t.insDupMfHqState,
    nameSimilar: t.insDupMfNameSimilar,
    hqCity: t.insDupMfHqCity,
    shortNameEqual: t.insDupMfShortNameEqual,
    naicFormat: t.insDupMfNaicFormat,
  }

  const startDetect = () => {
    setDetecting(true)
    setTimeout(() => { setDetecting(false); setDetected(true) }, 1800)
  }

  const currentGroup = duplicateGroups.find(g => g.id === selected)
  const currentPrimary = selected ? (primaryRecord[selected] ?? currentGroup?.records[0]?.id) : null

  const markMerge = (groupId: string) => {
    setGroupStatus(p => ({ ...p, [groupId]: 'merged' }))
    const next = duplicateGroups.find(g => g.id !== groupId && !groupStatus[g.id])
    if (next) setSelected(next.id)
  }

  const dismiss = (groupId: string) => {
    setGroupStatus(p => ({ ...p, [groupId]: 'dismissed' }))
    const next = duplicateGroups.find(g => g.id !== groupId && !groupStatus[g.id])
    if (next) setSelected(next.id)
  }

  const unresolved = duplicateGroups.filter(g => !groupStatus[g.id] || groupStatus[g.id] === 'unresolved')
  const resolved = duplicateGroups.filter(g => groupStatus[g.id] && groupStatus[g.id] !== 'unresolved')

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button className="btn-ghost" onClick={() => navigateTo('insurer-list')}><ArrowLeft size={15} /></button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{t.insDupTitle}</h1>
            <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>{t.insDupSubtitle}</p>
          </div>
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={startDetect} disabled={detecting}>
          {detecting
            ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />{t.insDupDetecting}</>
            : <><RefreshCw size={14} />{t.insDupRedetect}</>
          }
        </button>
      </div>

      {!detected ? (
        /* Not yet run */
        <div className="card" style={{ padding: '72px 40px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(0,88,188,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Search size={32} style={{ color: '#0058BC' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 10 }}>{t.insDupStartTitle}</h2>
          <p style={{ fontSize: 14, color: '#717786', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}>
            {t.insDupStartDesc}
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 28 }}>
            {[
              { label: t.insDupRule1Label, desc: t.insDupRule1Desc },
              { label: t.insDupRule2Label, desc: t.insDupRule2Desc },
              { label: t.insDupRule3Label, desc: t.insDupRule3Desc },
            ].map(c => (
              <div key={c.label} style={{ background: 'rgba(241,243,254,0.8)', borderRadius: 12, padding: '14px 18px', textAlign: 'center', maxWidth: 160 }}>
                <CheckCircle size={16} style={{ color: '#0058BC', marginBottom: 6 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 12, color: '#717786' }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ fontSize: 14, padding: '11px 32px' }} onClick={startDetect}>
            <Search size={14} />{t.insDupStartBtn}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Left: group list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{t.insDupGroupsTitle}</div>
              <div className="flex gap-1">
                {unresolved.length > 0 && <span className="badge badge-red" style={{ fontSize: 10.5 }}>{t.insDupPendingCount(unresolved.length)}</span>}
                {resolved.length > 0 && <span className="badge badge-green" style={{ fontSize: 10.5 }}>{t.insDupResolvedCount(resolved.length)}</span>}
              </div>
            </div>
            <div>
              {duplicateGroups.map(group => {
                const st = groupStatus[group.id]
                const isActive = selected === group.id
                return (
                  <div
                    key={group.id}
                    onClick={() => setSelected(group.id)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '0.5px solid rgba(193,198,215,0.3)',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(0,88,188,0.08)' : 'transparent',
                      transition: 'background 120ms',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#0058BC' : '#181C23' }}>
                        {group.records[0].shortName} × {group.records[1].shortName}
                      </div>
                      {st === 'merged' && <span className="badge badge-green" style={{ fontSize: 10 }}>{t.insDupBadgeMerged}</span>}
                      {st === 'dismissed' && <span className="badge badge-gray" style={{ fontSize: 10 }}>{t.insDupBadgeDismissed}</span>}
                      {!st && <span className="badge badge-red" style={{ fontSize: 10 }}>{t.insDupBadgePending}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 5, background: 'rgba(193,198,215,0.3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${group.similarity * 100}%`, background: group.similarity > 0.9 ? '#BA1A1A' : '#FFCC00', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", color: group.similarity > 0.9 ? '#BA1A1A' : '#a05800', fontWeight: 600 }}>
                        {(group.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#717786', marginTop: 4 }}>
                      {group.matchFields.slice(0, 2).map(k => mfLabel[k]).join(' · ')}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: comparison */}
          {currentGroup ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Group header */}
              <div style={{ padding: '16px 22px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', background: 'rgba(241,243,254,0.5)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23', marginBottom: 4 }}>
                      {t.insDupSimilarity}<span style={{ color: currentGroup.similarity > 0.9 ? '#BA1A1A' : '#a05800', fontFamily: "'JetBrains Mono', monospace" }}>{(currentGroup.similarity * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#717786' }}>
                      {t.insDupMatchBasis}{currentGroup.matchFields.map(k => mfLabel[k]).join(' · ')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary" style={{ fontSize: 13, color: '#717786' }} onClick={() => dismiss(currentGroup.id)}>
                      <X size={14} />{t.insDupMarkNotDup}
                    </button>
                    <button
                      className="btn-primary"
                      style={{ fontSize: 13, background: '#0058BC' }}
                      onClick={() => markMerge(currentGroup.id)}
                      disabled={!currentPrimary}
                    >
                      <GitMerge size={14} />{t.insDupMergeBtn}
                    </button>
                  </div>
                </div>
              </div>

              {/* Select primary */}
              <div style={{ padding: '14px 22px', borderBottom: '0.5px solid rgba(193,198,215,0.3)', background: 'rgba(0,88,188,0.03)' }}>
                <span style={{ fontSize: 12.5, color: '#414755', fontWeight: 500 }}>
                  {t.insDupSelectPrimary}
                </span>
                {currentGroup.records.map(r => (
                  <label key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 16, cursor: 'pointer' }}>
                    <input type="radio" name="primary" value={r.id} checked={currentPrimary === r.id}
                      onChange={() => setPrimaryRecord(p => ({ ...p, [currentGroup.id]: r.id }))}
                      style={{ accentColor: '#0058BC' }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: currentPrimary === r.id ? '#0058BC' : '#181C23' }}>{r.shortName}</span>
                    {r.status === 'active' && <span className="orb orb-green" />}
                  </label>
                ))}
              </div>

              {/* Side-by-side comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {currentGroup.records.map((rec, i) => (
                  <div
                    key={rec.id}
                    style={{
                      padding: '22px 24px',
                      borderRight: i === 0 ? '0.5px solid rgba(193,198,215,0.4)' : 'none',
                      background: currentPrimary === rec.id ? 'rgba(0,88,188,0.04)' : 'transparent',
                      position: 'relative',
                    }}
                  >
                    {currentPrimary === rec.id && (
                      <div style={{ position: 'absolute', top: 14, right: 14 }}>
                        <span className="badge badge-blue" style={{ fontSize: 11 }}><Shield size={10} />{t.insDupPrimaryBadge}</span>
                      </div>
                    )}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 4 }}>{rec.name}</div>
                      <div style={{ fontSize: 12.5, color: '#717786' }}>
                        {rec.status === 'active'
                          ? <span className="flex items-center gap-1.5"><span className="orb orb-green" />{t.insStatusActive}</span>
                          : <span className="flex items-center gap-1.5"><span className="orb orb-yellow" />{t.insStatusPending}</span>
                        }
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { key: 'shortName', label: t.insFShortName, value: rec.shortName },
                        { key: 'naicCode', label: t.insFNaic, value: rec.naicCode },
                        { key: 'type', label: t.insFType, value: rec.type },
                        { key: 'headquarters', label: t.insDupFHq, value: rec.headquarters },
                        { key: 'createdAt', label: t.insDupFCreatedAt, value: rec.createdAt },
                        { key: 'createdBy', label: t.insDupFCreatedBy, value: rec.createdBy },
                      ].map(f => {
                        const other = currentGroup.records.find(r => r.id !== rec.id)
                        const isDiff = other && (other as any)[Object.keys(other).find(k => (other as any)[k] === f.value) ?? ''] !== f.value
                        return (
                          <div key={f.key} style={{ padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(193,198,215,0.3)' }}>
                            <div style={{ fontSize: 11, color: '#717786', marginBottom: 3 }}>{f.label}</div>
                            <div style={{ fontSize: 13.5, color: '#181C23', fontFamily: ['naicCode', 'createdAt'].includes(f.key) ? "'JetBrains Mono', monospace" : undefined, fontWeight: 500 }}>
                              {f.value}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {currentPrimary !== rec.id && (
                      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(186,26,26,0.06)', borderRadius: 10, border: '0.5px solid rgba(186,26,26,0.15)' }}>
                        <div style={{ fontSize: 12, color: '#BA1A1A', fontWeight: 500 }}>
                          {t.insDupWillDelete}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#717786', marginTop: 3 }}>
                          {t.insDupDataMigrates}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ padding: '16px 22px', borderTop: '0.5px solid rgba(193,198,215,0.4)', background: 'rgba(241,243,254,0.4)', display: 'flex', gap: 10 }}>
                <button className="btn-ghost" style={{ fontSize: 13 }}><Eye size={14} />{t.insDupViewFull}</button>
                <button
                  onClick={() => markMerge(currentGroup.id)}
                  className="btn-primary"
                  style={{ fontSize: 13, marginLeft: 'auto' }}
                  disabled={!currentPrimary}
                >
                  <GitMerge size={14} />{t.insDupMergeAs(currentGroup.records.find(r => r.id === currentPrimary)?.shortName ?? '—')}
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <CheckCircle size={40} style={{ color: '#34C759', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#181C23', marginBottom: 6 }}>{t.insDupAllDone}</div>
              <p style={{ fontSize: 13.5, color: '#717786' }}>{t.insDupDoneSub(resolved.length)}</p>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
