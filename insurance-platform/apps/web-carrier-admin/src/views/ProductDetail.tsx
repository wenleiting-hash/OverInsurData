// Product Detail View - One-stop product information display with tab navigation and charts (功能点 10-14)
// Features: KPI summary, multi-tab navigation, performance charts, document management, audit history

import { useState } from 'react'
import { 
  ArrowLeft, MoreVertical, Edit, Trash2, Download, Upload, Eye, FileText,
  TrendingUp, TrendingDown, CheckCircle, XCircle, AlertTriangle, Shield, Calendar, FileCheck
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'
import { products, formatCurrency, formatPercent, type InsuranceProduct, productPremiumTrendData } from './data/mockProductData'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  productId: string
  navigateTo: (view: ViewId) => void
}

const TABS = [
  { id: 'info', label: '基本信息', icon: Eye },
  { id: 'ratingPlan', label: '费率方案', icon: TrendingUp },
  { id: 'availableStates', label: '可售州', icon: CheckCircle },
  { id: 'performance', label: '业绩表现', icon: TrendingUp },
  { id: 'documents', label: '附件文件', icon: FileText },
  { id: 'auditHistory', label: '变更历史', icon: MoreVertical },
]

export default function ProductDetail({ productId, navigateTo }: Props) {
  const { t } = useTranslation('product')
  const [activeTab, setActiveTab] = useState('info')
  
  const product = products.find(p => p.productId === productId)
  const [toastMessage, setToastMessage] = useState<string>('')
  const [showToast, setShowToast] = useState<boolean>(false)

  if (!product) {
    return (
      <div className="w-full h-full flex" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '16px', color: '#9CA3AF' }}>产品不存在</div>
      </div>
    )
  }

  const showToastMsg = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const downloadDocument = (docName: string) => {
    showToastMsg(`正在下载：${docName}`)
  }

  // KPI Summary Cards
  const kpiCards = [
    { label: '本年保费', value: `$${((product.premiumYTD ?? 0) / 1000000).toFixed(1)}M`, sub: 'YTD 2026', warn: false },
    { label: '保单数量', value: (product.policyCount ?? 0).toLocaleString(), sub: '有效保单', warn: false },
    { label: '赔付率', value: `${((product.lossRatio ?? 0) * 100).toFixed(1)}%`, sub: product.lossRatio! > 0.65 ? '⚠ 超预警' : '正常', warn: product.lossRatio! > 0.65 },
    { label: '续保率', value: `${((product.renewalRate ?? 0) * 100).toFixed(1)}%`, sub: '本年', warn: false },
    { label: '授权渠道', value: (product.authorizedChannels?.length || 0).toString(), sub: '个渠道', warn: false },
    { label: '可售州数', value: product.availableStates.length.toString(), sub: '获批州', warn: false },
  ]

  // Performance Chart Data
  const premiumTrendData = productPremiumTrendData.map(d => ({
    ...d,
    newBizStr: `新业务 $${d.newBiz.toFixed(1)}M`,
    renewalStr: `续保 $${d.renewal.toFixed(1)}M`,
    totalStr: `总计 $${d.premium.toFixed(1)}M`,
  }))

  const monthlyPerformanceData = [
    { month: '1 月', premium: 12.5, policies: 650 },
    { month: '2 月', premium: 14.2, policies: 720 },
    { month: '3 月', premium: 15.8, policies: 810 },
    { month: '4 月', premium: 16.9, policies: 850 },
    { month: '5 月', premium: 18.3, policies: 920 },
    { month: '6 月', premium: 19.1, policies: 980 },
    { month: '7 月', premium: 20.5, policies: 1050 },
    { month: '8 月', premium: 21.8, policies: 1120 },
  ]

  const renderKpiSection = () => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#404757', marginBottom: '16px' }}>核心指标概览</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px' }}>
        {kpiCards.map(card => (
          <div key={card.label} style={{
            padding: '14px 16px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(247,248,250,0.8) 100%)',
            border: `1px solid ${card.warn ? 'rgba(186,26,26,0.2)' : 'rgba(24,28,35,0.08)'}`,
            boxShadow: card.warn ? '0 4px 16px rgba(186,26,26,0.1)' : '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>{card.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: card.warn ? '#BA1A1A' : '#181C23' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '11px', color: card.warn ? '#BA1A1A' : '#9CA3AF', marginTop: '4px' }}>{card.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderInfoTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>产品全称</div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#181C23' }}>{product.productName}</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>产品简称</div>
        <div style={{ fontSize: '16px', fontWeight: 500, color: '#404757' }}>{product.shortName || '-'}</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>产品代码</div>
        <div style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace', color: '#181C23' }}>{product.productCode}</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>NAIC 表单编号</div>
        <div style={{ fontSize: '14px', color: '#404757' }}>{product.naicFormNumber || '-'}</div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>所属保险公司</div>
        <div style={{ fontSize: '16px', fontWeight: 500, color: '#181C23' }}>{product.insurerName}</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>业务线</div>
        <div style={{ fontSize: '16px', fontWeight: 500, color: '#181C23' }}>{t(`values.lob${product.lineOfBusiness}`)}</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>子险种</div>
        <div style={{ fontSize: '16px', fontWeight: 500, color: '#404757' }}>{product.subLine || '-'}</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>产品类型</div>
        <div style={{ fontSize: '16px', fontWeight: 500, color: '#181C23' }}>{t(`values.type${product.type}`)}</div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}><Shield size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>{t('fields.underwritingMode')}</div>
        <div style={{ fontSize: '16px', fontWeight: 500, color: '#181C23' }}>{t(`values.underwriting${product.underwritingMode}`)}</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>最大出单限额</div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#181C23', fontFamily: 'monospace' }}>
          ${product.maxPolicyLimit?.toLocaleString() || '-'}
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>核保期限</div>
        <div style={{ fontSize: '16px', fontWeight: 500, color: '#404757' }}>{product.policyTermYears}年</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>销售状态</div>
        <span className={`status-badge ${product.status.toLowerCase()}`} style={{ fontSize: '14px', padding: '6px 14px' }}>{t(`values.status${product.status}`)}</span>
      </div>
    </div>
  )

  const renderRatingPlanTab = () => (
    <div>
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#404757' }}>
        该产品在各州的费率方案配置（模拟数据）
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
          <thead>
            <tr style={{ background: 'rgba(247,248,250,0.8)', borderBottom: '2px solid rgba(24,28,35,0.08)' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#404757' }}>州</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#404757' }}>费率版本</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#404757' }}>生效日期</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#404757' }}>失效日期</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#404757' }}>状态</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#404757' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {product.availableStates.map((state, idx) => (
              <tr key={state} style={{ borderBottom: '1px solid rgba(24,28,35,0.06)' }}>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#181C23' }}>{state}</td>
                <td style={{ padding: '16px', fontSize: '13px', color: '#404757' }}>{`v${1 + idx}.${idx}`}</td>
                <td style={{ padding: '16px', fontSize: '13px', color: '#404757' }}>{new Date(product.effectiveDate).toLocaleDateString()}</td>
                <td style={{ padding: '16px', fontSize: '13px', color: '#404757' }}>{product.expirationDate ? new Date(product.expirationDate).toLocaleDateString() : '-'}</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span className="status-badge active">已生效</span>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button className="icon-btn" onClick={() => showToastMsg('费率编辑功能开发中...')} style={{ padding: '6px 12px', fontSize: '12px' }}>
                    <Edit size={12} />
                    <span style={{ marginLeft: '4px' }}>编辑</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderAvailableStatesTab = () => (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: '#404757' }}>获批销售的州列表 (共 {product.availableStates.length} 个州)</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
        {product.availableStates.map(state => (
          <div key={state} style={{
            padding: '12px 16px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0, 88, 188, 0.1) 0%, rgba(255,255,255,0.8) 100%)',
            border: '2px solid #0058BC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 600, color: '#181C23'
          }}>
            {state}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0, 88, 188, 0.08)', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
          <AlertTriangle size={18} style={{ color: '#0058BC', marginTop: '2px' }} />
          <div style={{ fontSize: '13px', color: '#0058BC' }}>每个州均需单独获得监管批准才能销售。未获批的州将无法生成保单。</div>
        </div>
      </div>
    </div>
  )

  const renderPerformanceTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {/* Premium Trend Chart */}
      <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.7)', height: '320px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#181C23', marginBottom: '16px' }}>月度保费趋势</div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={premiumTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#606778' }} />
            <YAxis tick={{ fontSize: 12, fill: '#606778' }} tickFormatter={(v: any) => `$${v}M`} />
            <Tooltip formatter={(value: any) => [`$${value}M`, '保费']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="newBiz" stroke="#34C759" name="新业务" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="renewal" stroke="#0058BC" name="续保" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="premium" stroke="#9E3D00" name="总计" strokeWidth={2} dot={{ r: 4, fill: '#9E3D00', strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Policies & Average Premium */}
      <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.7)', height: '320px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#181C23', marginBottom: '16px' }}>月度保单量与件均</div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={monthlyPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#606778' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#606778' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#606778' }} />
            <Tooltip formatter={(value: any, name: any) => {
              if (name === 'premium') return [`$${value}M`, '保费'];
              return [value.toLocaleString(), '保单数'];
            }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar yAxisId="left" dataKey="policies" fill="#0058BC" name="保单数" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="premium" fill="#34C759" name="保费" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const renderDocumentsTab = () => (
    <div>
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#606778' }}>{t('documents.uploadHint')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          { key: 'terms', label: 'documents.docs.terms', icon: FileText },
          { key: 'rateBook', label: '费率手册', icon: FileText },
          { key: 'salesGuide', label: 'documents.docs.salesGuide', icon: FileText },
          { key: 'underwritingGuide', label: 'documents.docs.underwritingGuide', icon: Shield },
          { key: 'complianceCertificate', label: 'documents.docs.complianceCertificate', icon: Shield },
        ].map(doc => (
          <div key={doc.key} style={{
            padding: '20px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(24,28,35,0.08)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(52, 199, 89, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck size={24} style={{ color: '#34C759' }} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#181C23' }}>{t(doc.label)}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>v1.0 • 2026-01-15</div>
            <button className="icon-btn" onClick={() => downloadDocument(t(doc.label))}>
              <Download size={14} />
              <span style={{ marginLeft: '4px' }}>下载</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAuditHistoryTab = () => (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: '#404757' }}>所有变更记录追溯 (模拟数据)</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[
          { date: '2026-08-20T14:30:00Z', action: '更新', user: '管理员', changes: ['费率方案 v2.0'], details: '修改了 CA 州的费率结构' },
          { date: '2026-07-15T09:20:00Z', action: '新增', user: '产品经理', changes: ['初版发布'], details: '初始产品配置并提交审核' },
          { date: '2026-06-01T16:45:00Z', action: '更新', user: '合规专员', changes: ['扩展可售州'], details: '新增 NY、NJ、PA 三个州的销售许可' },
          { date: '2026-05-10T11:00:00Z', action: '提交', user: '申请人', changes: ['审核提交'], details: '提交至财务部审核' },
        ].map((log, idx) => (
          <div key={idx} style={{
            padding: '16px 20px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(24,28,35,0.08)',
            display: 'flex', gap: '16px', alignItems: 'start'
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0, 88, 188, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={16} style={{ color: '#0058BC' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#181C23' }}>{log.action} - {log.details}</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{new Date(log.date).toLocaleString()}</div>
              </div>
              <div style={{ fontSize: '13px', color: '#404757' }}>操作人：{log.user}</div>
              <div style={{ fontSize: '12px', color: '#606778' }}>变更项：{log.changes.join(', ')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="w-full h-full flex">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div style={{ padding: '32px 36px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button className="icon-btn" onClick={() => navigateTo('product-list')}>
              <ArrowLeft size={16} />
              <span>{t('navigation.backToList')}</span>
            </button>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#181C23', margin: 0 }}>{product.productName}</h1>
                <div style={{ fontSize: '14px', color: '#717786', marginTop: '4px' }}>
                  {product.productCode} • {product.insurerName}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="action-btn" onClick={() => showToastMsg('查看详情功能开发中...')}>
                <Eye size={16} />
                <span style={{ marginLeft: '6px' }}>{t('actions.viewDetails')}</span>
              </button>
              <button className="action-btn" style={{ background: '#0058BC', color: '#FFFFFF' }} onClick={() => navigateTo(`product-edit`, { productId })}>
                <Edit size={16} />
                <span style={{ marginLeft: '6px' }}>{t('actions.edit')}</span>
              </button>
              <button className="action-btn" style={{ background: '#BA1A1A', color: '#FFFFFF' }} onClick={() => showToastMsg('删除功能开发中...')}>
                <Trash2 size={16} />
                <span style={{ marginLeft: '6px' }}>{t('actions.delete')}</span>
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          {renderKpiSection()}

          {/* Tab Navigation */}
          <div className="glass-card rounded-xl" style={{ overflow: 'hidden' }}>
            <div style={{ borderBottom: '1px solid rgba(24,28,35,0.08)', overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: '8px', padding: '14px 16px' }}>
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      className={`tab-button ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {Icon && <Icon size={16} style={{ marginRight: '6px' }} />}
                      <span>{t(tab.label)}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div style={{ padding: '28px' }}>
              {activeTab === 'info' && renderInfoTab()}
              {activeTab === 'ratingPlan' && renderRatingPlanTab()}
              {activeTab === 'availableStates' && renderAvailableStatesTab()}
              {activeTab === 'performance' && renderPerformanceTab()}
              {activeTab === 'documents' && renderDocumentsTab()}
              {activeTab === 'auditHistory' && renderAuditHistoryTab()}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div style={{ position: 'fixed', top: '56px', right: '24px', zIndex: 9999, animation: 'slideIn 0.3s ease-out' }}>
          <div style={{
            padding: '14px 20px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(247,248,250,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(24, 28, 35, 0.1)',
            display: 'flex', alignItems: 'center', gap: '12px',
            minWidth: '300px'
          }}>
            <CheckCircle size={20} style={{ color: '#34C759' }} />
            <div style={{ fontSize: '14px', color: '#181C23', fontWeight: 500 }}>{toastMessage}</div>
            <button onClick={() => setShowToast(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}>
              <XCircle size={16} style={{ color: '#9CA3AF' }} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .glass-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(247,248,250,0.7) 100%);
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(24, 28, 35, 0.08);
        }
        .icon-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(24,28,35,0.1);
          background: rgba(255,255,255,0.8); color: #404757; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .icon-btn:hover:not(:disabled) { background: rgba(255,255,255,1); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .action-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 14px; border-radius: 8px; border: none;
          background: rgba(240,242,245,0.9); color: #404757; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .action-btn:hover { background: rgba(240,242,245,1); transform: translateY(-1px); }
        .tab-button {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 16px; border-radius: 8px; border: none;
          background: transparent; color: #606778; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
          white-space: nowrap;
        }
        .tab-button.active {
          background: rgba(0, 88, 188, 0.15); color: #0058BC;
        }
        .tab-button:hover:not(.active) {
          background: rgba(247,248,250,0.8);
        }
        .status-badge {
          display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 600;
          font-family: system-ui;
        }
        .status-badge.active { background: rgba(52, 199, 89, 0.15); color: #1E8E4C; }
        .status-badge.paused { background: rgba(255, 173, 50, 0.15); color: #BF690B; }
        .status-badge.inactive { background: rgba(149, 159, 175, 0.15); color: #5A606C; }
        .status-badge.pending { background: rgba(0, 88, 188, 0.12); color: #0058BC; }
      `}</style>
    </div>
  )
}
