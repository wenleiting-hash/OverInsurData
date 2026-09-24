import React from 'react'
import { useTranslation } from 'react-i18next'
import { Settings2, RefreshCw } from 'lucide-react'
import { useCommissionRates } from '@/services/financeService'
import { lobLabel, type Notify } from '../constants'
import type { CooperationRecord } from '@/lib/user-api-client'
import type { ViewId } from '@/App'

interface Props {
  partnership: CooperationRecord
  notify: Notify
  navigateTo: (view: ViewId) => void
}

const DIMENSION_KEY: Record<string, string> = {
  product_state: 'view.rates.dimProductState',
  product_all: 'view.rates.dimProductAll',
  lob_state: 'view.rates.dimLobState',
  lob_all: 'view.rates.dimLobAll',
}

function ratePct(v: any): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(2)}%`
}

function day(v: any): string {
  return v ? String(v).slice(0, 10) : '—'
}

/**
 * V1.0.15 B7：合作详情内佣金率只读视图；
 * 维护统一收敛到「财务结算 → 结算比例配置」，通过事件带 carrier_id 跳转。
 */
export default function RatesTab({ partnership, navigateTo }: Props) {
  const { t } = useTranslation('cooperation')
  const ratesQ = useCommissionRates({ carrier_id: partnership.carrier_id })
  const rates: any[] = ratesQ.data?.data ?? []

  const goMaintain = () => {
    window.dispatchEvent(new CustomEvent('ovwr:finance-open', {
      detail: { tab: 'rates', carrier_id: partnership.carrier_id },
    }))
    navigateTo('finance-dashboard')
  }

  const header = (
    <div className="flex items-center justify-between" style={{ marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12.5, color: '#717786' }}>{t('view.rates.readonlyHint')}</span>
      <div className="flex gap-2">
        <button className="btn-secondary" style={{ fontSize: 13 }} disabled={ratesQ.isFetching} onClick={() => ratesQ.refetch()}>
          <RefreshCw size={13} />{t('view.common.refresh')}
        </button>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={goMaintain}>
          <Settings2 size={13} />{t('view.rates.maintain')}
        </button>
      </div>
    </div>
  )

  if (ratesQ.isLoading) {
    return <div>{header}<div className="card" style={{ padding: 40, textAlign: 'center', color: '#717786' }}>{t('view.common.loading')}</div></div>
  }
  if (ratesQ.isError) {
    return (
      <div>{header}
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: '#BA1A1A', fontSize: 13.5, marginBottom: 12 }}>{t('view.common.loadError')}</div>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => ratesQ.refetch()}>{t('view.common.retry')}</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {header}
      {rates.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: '#717786' }}>{t('view.empty.rates')}</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: 'rgba(0,88,188,0.05)' }}>
                  <th style={th}>{t('view.rates.dimension')}</th>
                  <th style={th}>{t('view.rates.target')}</th>
                  <th style={th}>{t('view.rates.state')}</th>
                  <th style={{ ...th, textAlign: 'right' }}>{t('view.rates.rate')}</th>
                  <th style={th}>{t('view.rates.effectiveFrom')}</th>
                  <th style={th}>{t('view.rates.effectiveTo')}</th>
                  <th style={th}>{t('view.rates.remark')}</th>
                  <th style={{ ...th, textAlign: 'center' }}>{t('view.rates.status')}</th>
                  <th style={{ ...th, textAlign: 'center' }}>{t('view.rates.version')}</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => {
                  const active = (r.status ?? 'active') === 'active'
                  return (
                    <tr key={r.rate_id ?? r.id} style={{ borderTop: '0.5px solid rgba(193,198,215,0.25)' }}>
                      <td style={td}>{DIMENSION_KEY[r.trial_level] ? t(DIMENSION_KEY[r.trial_level]) : (r.dimension === 'product' ? t('view.rates.byProduct') : t('view.rates.byLob'))}</td>
                      <td style={td}>
                        {r.dimension === 'product'
                          ? (r.product_name || r.product_code || r.product_id || '—')
                          : lobLabel(r.line_of_business)}
                      </td>
                      <td style={td}>
                        {r.state
                          ? <span className="badge badge-blue" style={{ fontSize: 10.5 }}>{String(r.state).toUpperCase()}</span>
                          : <span className="badge badge-gray" style={{ fontSize: 10.5 }}>{t('view.rates.allStates')}</span>}
                      </td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#0058BC' }}>
                        {ratePct(r.rate)}
                      </td>
                      <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace" }}>{day(r.effective_from)}</td>
                      <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace" }}>{day(r.effective_to)}</td>
                      <td style={{ ...td, color: '#717786', maxWidth: 180 }}>{r.remark || '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span className={`badge ${active ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10.5 }}>
                          {active ? t('view.rates.statusActive') : t('view.rates.statusExpired')}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'center', color: '#717786' }}>v{r.version ?? 1}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 11.5,
  fontWeight: 600,
  color: '#414755',
  whiteSpace: 'nowrap',
}

const td: React.CSSProperties = {
  padding: '10px 12px',
  color: '#181C23',
  whiteSpace: 'nowrap',
}
