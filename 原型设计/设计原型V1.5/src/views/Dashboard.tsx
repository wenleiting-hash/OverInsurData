import { TrendingUp, TrendingDown, Building2, Package, Users, DollarSign, AlertTriangle, CheckCircle, Info, Clock, ArrowRight } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts'
import { insurers, premiumTrendData, marketShareData, alertItems, recentActivities, formatCurrency, formatPercent } from '../data/mockData'
import type { ViewId } from '../components/Sidebar'

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
}

const totalPremium = insurers.reduce((s, i) => s + i.totalPremium, 0)
const totalPolicies = insurers.reduce((s, i) => s + i.policyCount, 0)
const totalChannels = 287
const totalCommission = insurers.reduce((s, i) => s + i.commissionIncome, 0)
const avgLossRatio = insurers.filter(i => i.status !== 'inactive').reduce((s, i) => s + i.lossRatio, 0) / insurers.filter(i => i.status !== 'inactive').length

const KPI_CARDS = [
  {
    label: '本年总保费',
    value: formatCurrency(totalPremium, true),
    sub: '↑ 12.4% vs 去年',
    trend: 'up',
    icon: <DollarSign size={20} />,
    color: '#0058BC',
    bg: 'rgba(0,88,188,0.08)',
  },
  {
    label: '有效保单数',
    value: totalPolicies.toLocaleString(),
    sub: '↑ 8.1% vs 去年',
    trend: 'up',
    icon: <Package size={20} />,
    color: '#006687',
    bg: 'rgba(0,102,135,0.08)',
  },
  {
    label: '合作渠道数',
    value: totalChannels.toString(),
    sub: '新增 18 个 | 本月',
    trend: 'up',
    icon: <Users size={20} />,
    color: '#34C759',
    bg: 'rgba(52,199,89,0.08)',
  },
  {
    label: '本年佣金收入',
    value: formatCurrency(totalCommission, true),
    sub: '↑ 14.2% vs 去年',
    trend: 'up',
    icon: <TrendingUp size={20} />,
    color: '#9E3D00',
    bg: 'rgba(158,61,0,0.08)',
  },
]

const alertIcons: Record<string, React.ReactNode> = {
  expiring: <AlertTriangle size={14} />,
  appointment: <Clock size={14} />,
  lossratio: <TrendingUp size={14} />,
  pending: <Info size={14} />,
  license: <AlertTriangle size={14} />,
  settlement: <CheckCircle size={14} />,
}

const alertColors: Record<string, { text: string; bg: string }> = {
  high: { text: '#BA1A1A', bg: 'rgba(186,26,26,0.07)' },
  warning: { text: '#a05800', bg: 'rgba(255,149,0,0.08)' },
  info: { text: '#0058BC', bg: 'rgba(0,88,188,0.07)' },
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong" style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12 }}>
        <div style={{ fontWeight: 600, color: '#181C23', marginBottom: 6 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ color: p.color, marginBottom: 3 }}>
            {p.name}: ${p.value}M
          </div>
        ))}
      </div>
    )
  }
  return null
}

function PieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong" style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12 }}>
        <div style={{ fontWeight: 600 }}>{payload[0].name}</div>
        <div style={{ color: '#414755' }}>占比 {payload[0].value}%</div>
        <div style={{ color: '#414755' }}>保费 {formatCurrency(totalPremium * payload[0].value / 100, true)}</div>
      </div>
    )
  }
  return null
}

export default function Dashboard({ navigateTo }: Props) {
  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#181C23', lineHeight: 1.3 }}>平台总览</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 3 }}>数据截至 2026-08-22 · 美国市场</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input-glass" style={{ fontSize: 13 }}>
            <option>本年度 (2026)</option>
            <option>上年度 (2025)</option>
            <option>近 12 个月</option>
          </select>
          <button className="btn-secondary" style={{ fontSize: 13 }}>导出报告</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {KPI_CARDS.map(card => (
          <div key={card.label} className="kpi-card">
            <div className="flex items-start justify-between mb-3">
              <div style={{ fontSize: 13, color: '#414755', fontWeight: 500 }}>{card.label}</div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace", letterSpacing: -0.5, marginBottom: 6 }}>
              {card.value}
            </div>
            <div className="flex items-center gap-1" style={{ fontSize: 12, color: card.trend === 'up' ? '#1a7a2e' : '#BA1A1A' }}>
              {card.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 20 }}>
        {/* Premium Trend */}
        <div className="card" style={{ padding: 22 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23' }}>保费趋势</div>
              <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>近 12 个月 · 单位：百万美元</div>
            </div>
            <div className="flex gap-1">
              {['新单', '续保', '总计'].map(t => (
                <button key={t} className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6 }}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={premiumTrendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.5)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="premium" name="总计" stroke="#0058BC" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#0058BC' }} />
              <Line type="monotone" dataKey="renewal" name="续保" stroke="#60CDFF" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="newBiz" name="新单" stroke="#34C759" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex gap-4 mt-2 justify-center">
            {[{ color: '#0058BC', label: '总计' }, { color: '#60CDFF', label: '续保' }, { color: '#34C759', label: '新单' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5" style={{ fontSize: 12, color: '#414755' }}>
                <div style={{ width: 20, height: 2.5, background: l.color, borderRadius: 2 }} />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Market Share Pie */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>保费市场份额</div>
          <div style={{ fontSize: 12, color: '#717786', marginBottom: 12 }}>按保险公司分布</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={marketShareData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={2}
                dataKey="value"
              >
                {marketShareData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginTop: 8 }}>
            {marketShareData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5" style={{ fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ color: '#414755', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                <span style={{ color: '#181C23', fontWeight: 600, marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Alerts + Recent Insurers + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 260px', gap: 16 }}>

        {/* Alerts */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ padding: '16px 18px', borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>待处理事项</div>
            <span className="badge badge-red" style={{ fontSize: 11 }}>{alertItems.length} 项</span>
          </div>
          <div style={{ overflow: 'auto', maxHeight: 320 }}>
            {alertItems.map(item => {
              const c = alertColors[item.severity]
              return (
                <div
                  key={item.id}
                  style={{ padding: '12px 18px', borderBottom: '0.5px solid rgba(193,198,215,0.3)', background: c.bg, cursor: 'pointer' }}
                  className="flex items-start gap-2.5"
                >
                  <span style={{ color: c.text, flexShrink: 0, marginTop: 1 }}>{alertIcons[item.type]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: '#181C23', lineHeight: 1.4 }}>{item.message}</div>
                    <div style={{ fontSize: 11, color: '#717786', marginTop: 3 }}>{item.time}</div>
                  </div>
                  <ArrowRight size={12} style={{ color: '#C1C6D7', flexShrink: 0, marginTop: 2 }} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Top insurers table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ padding: '16px 18px', borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>保险公司业绩排名</div>
            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => navigateTo('insurer-list')}>
              查看全部 <ArrowRight size={12} />
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>保险公司</th>
                <th>类型</th>
                <th style={{ textAlign: 'right' }}>总保费</th>
                <th style={{ textAlign: 'right' }}>赔付率</th>
                <th style={{ textAlign: 'right' }}>续保率</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {insurers
                .filter(i => i.status !== 'inactive')
                .sort((a, b) => b.totalPremium - a.totalPremium)
                .slice(0, 6)
                .map((ins, idx) => (
                  <tr key={ins.id} onClick={() => navigateTo('insurer-list')}>
                    <td style={{ color: '#717786', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#181C23', fontSize: 13 }}>{ins.shortName}</div>
                      <div style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>NAIC {ins.naicCode}</div>
                    </td>
                    <td>
                      <span className={`badge ${ins.type === 'Admitted' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: 11 }}>
                        {ins.type === 'Admitted' ? 'Admitted' : 'Non-Adm.'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: '#181C23' }}>
                      {formatCurrency(ins.totalPremium, true)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: 12.5,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: ins.lossRatio > 0.65 ? '#BA1A1A' : ins.lossRatio > 0.60 ? '#a05800' : '#1a7a2e',
                        fontWeight: 500,
                      }}>
                        {formatPercent(ins.lossRatio)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: '#181C23' }}>
                      {formatPercent(ins.renewalRate)}
                    </td>
                    <td>
                      {ins.coopStatus === 'expiring'
                        ? <span className="flex items-center gap-1"><span className="orb orb-orange" /><span style={{ fontSize: 12, color: '#a05800' }}>即将到期</span></span>
                        : ins.status === 'pending'
                          ? <span className="flex items-center gap-1"><span className="orb orb-yellow" /><span style={{ fontSize: 12, color: '#7a5c00' }}>待审核</span></span>
                          : <span className="flex items-center gap-1"><span className="orb orb-green" /><span style={{ fontSize: 12, color: '#1a7a2e' }}>合作中</span></span>
                      }
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>近期操作</div>
          </div>
          <div style={{ padding: '6px 0' }}>
            {recentActivities.map((act, i) => (
              <div
                key={act.id}
                style={{ padding: '10px 18px', borderBottom: i < recentActivities.length - 1 ? '0.5px solid rgba(193,198,215,0.25)' : 'none' }}
              >
                <div style={{ fontSize: 12.5, color: '#181C23', lineHeight: 1.45, fontWeight: 500 }}>{act.action}</div>
                <div style={{ fontSize: 11.5, color: '#414755', marginTop: 2, lineHeight: 1.4 }}>{act.detail}</div>
                <div style={{ fontSize: 11, color: '#717786', marginTop: 4 }}>
                  <span style={{ fontWeight: 500 }}>{act.user}</span>
                  <span style={{ marginLeft: 6 }}>{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
