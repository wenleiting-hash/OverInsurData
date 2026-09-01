// Product Rate Plan Management - State-level rate table configuration (功能点 16-17)
// Features: Multi-state rate plan editor, version management, approval workflow

import { useState } from 'react'
import { 
  ArrowLeft, Plus, Download, Upload, Edit, Save, X, Check, AlertTriangle,
  Shield, FileText, TrendingUp, Filter, Search
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { InsuranceProduct } from './data/mockProductData'
import { products } from './data/mockProductData'

interface Props {
  productId: string
}

export default function ProductRatePlan({ productId }: Props) {
  const { t } = useTranslation('product')
  
  const product = products.find((p: InsuranceProduct) => p.productId === productId)
  const [toastMessage, setToastMessage] = useState<string>('')
  const [showToast, setShowToast] = useState<boolean>(false)

  if (!product) return null

  const showToastMsg = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // Mock data for rate plans
  const [ratePlans, setRatePlans] = useState([
    { state: 'CA', version: 'v2.0', effectiveDate: '2024-01-15', expirationDate: '2027-12-31', status: 'active', rates: { liability: 1250, collision: 980, comprehensive: 650 } },
    { state: 'NV', version: 'v1.5', effectiveDate: '2024-03-01', expirationDate: '2027-12-31', status: 'active', rates: { liability: 1180, collision: 920, comprehensive: 610 } },
    { state: 'AZ', version: 'v1.3', effectiveDate: '2024-06-01', expirationDate: '2027-12-31', status: 'pending', rates: { liability: 1320, collision: 1050, comprehensive: 690 } },
    { state: 'NY', version: 'v2.1', effectiveDate: '2024-02-01', expirationDate: '2027-12-31', status: 'active', rates: { liability: 1420, collision: 1150, comprehensive: 780 } },
    { state: 'NJ', version: 'v1.8', effectiveDate: '2024-04-01', expirationDate: '2027-12-31', status: 'active', rates: { liability: 1380, collision: 1090, comprehensive: 720 } },
  ])

  const [editingState, setEditingState] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const handleEditRatePlan = (state: string) => {
    setEditingState(state)
    setIsEditMode(true)
  }

  const handleSaveRatePlan = () => {
    showToastMsg('费率方案已保存并进入审核流程')
    setIsEditMode(false)
    setEditingState(null)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditingState(null)
  }

  const downloadRateSheet = () => {
    showToastMsg('正在导出费率表（CSV 格式）')
  }

  const uploadRateSheet = () => {
    showToastMsg('正在导入费率表（需核对数据）')
  }

  return (
    <div className="w-full h-full flex">
      {/* Main Content */}
      <div className="flex-1 overflow-auto" style={{ background: '#F7F8FA' }}>
        <div style={{ padding: '32px 36px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button className="icon-btn" onClick={() => window.history.back()}>
                <ArrowLeft size={16} />
                <span>{t('navigation.backToList')}</span>
              </button>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#181C23', margin: 0 }}>{product.productName}</h1>
                <div style={{ fontSize: '14px', color: '#717786', marginTop: '4px' }}>
                  费率方案管理 • {product.availableStates.length} 个州
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="action-btn" onClick={downloadRateSheet}>
                <Download size={16} />
                <span style={{ marginLeft: '6px' }}>导出费率表</span>
              </button>
              <button className="action-btn" onClick={uploadRateSheet}>
                <Upload size={16} />
                <span style={{ marginLeft: '6px' }}>导入费率表</span>
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(0, 88, 188, 0.08)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
              <AlertTriangle size={18} style={{ color: '#0058BC', marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: '#0058BC' }}>
                每个州均需单独配置费率方案。所有费率变更需经过财务审批后方可生效。NAIC 标准对齐验证已启用。
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="glass-card rounded-xl" style={{ padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="text"
                  placeholder="按州名称或版本搜索..."
                  style={{
                    width: '100%', height: '42px', paddingLeft: '42px', paddingRight: '14px',
                    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(24,28,35,0.1)',
                    borderRadius: '10px', fontSize: '14px', color: '#181C23',
                    outline: 'none', transition: 'border 0.2s'
                  }}
                />
              </div>

              <select
                style={{
                  height: '42px', padding: '0 14px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(24,28,35,0.1)',
                  fontSize: '14px', color: '#181C23', outline: 'none', minWidth: '160px'
                }}
              >
                <option value="">全部状态</option>
                <option value="active">已生效</option>
                <option value="pending">审核中</option>
              </select>

              <button className="icon-btn">
                <Filter size={16} />
                <span style={{ marginLeft: '6px' }}>高级筛选</span>
              </button>
            </div>
          </div>

          {/* Rate Plans Table */}
          <div className="glass-card rounded-xl" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(247,248,250,0.6) 100%)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#404757', borderBottom: '1px solid rgba(24,28,35,0.08)' }}>州名</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#404757', borderBottom: '1px solid rgba(24,28,35,0.08)' }}>版本号</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#404757', borderBottom: '1px solid rgba(24,28,35,0.08)' }}>生效日期</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#404757', borderBottom: '1px solid rgba(24,28,35,0.08)' }}>失效日期</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#404757', borderBottom: '1px solid rgba(24,28,35,0.08)' }}>Liability</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#404757', borderBottom: '1px solid rgba(24,28,35,0.08)' }}>Collision</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#404757', borderBottom: '1px solid rgba(24,28,35,0.08)' }}>Comprehensive</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#404757', borderBottom: '1px solid rgba(24,28,35,0.08)' }}>状态</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#404757', borderBottom: '1px solid rgba(24,28,35,0.08)' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {ratePlans.map((plan, idx) => (
                  <tr key={plan.state} style={{ borderBottom: '1px solid rgba(24,28,35,0.06)' }}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#181C23' }}>{plan.state}</td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#404757', fontFamily: 'monospace' }}>{plan.version}</td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#606778' }}>{new Date(plan.effectiveDate).toLocaleDateString()}</td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#606778' }}>{new Date(plan.expirationDate).toLocaleDateString()}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500, color: '#181C23', fontFamily: 'monospace' }}>${plan.rates.liability.toLocaleString()}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500, color: '#181C23', fontFamily: 'monospace' }}>${plan.rates.collision.toLocaleString()}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500, color: '#181C23', fontFamily: 'monospace' }}>${plan.rates.comprehensive.toLocaleString()}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span className={`status-badge ${plan.status === 'active' ? 'active' : 'pending'}`}>
                        {plan.status === 'active' ? '已生效' : '审核中'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        {plan.status === 'pending' && (
                          <button className="table-action-btn" title="批准" onClick={() => showToastMsg('已批准该州的费率方案')} style={{ color: '#34C759' }}>
                            <Check size={14} />
                          </button>
                        )}
                        <button className="table-action-btn" onClick={() => handleEditRatePlan(plan.state)} title="编辑">
                          <Edit size={14} />
                        </button>
                        <button className="table-action-btn" title="历史记录" onClick={() => showToastMsg('费率变更历史记录功能开发中...')}>
                          <FileText size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <Shield size={20} style={{ color: '#34C759' }} />
            <div style={{ fontSize: '14px', color: '#181C23', fontWeight: 500 }}>{toastMessage}</div>
            <button onClick={() => setShowToast(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}>
              <X size={16} style={{ color: '#9CA3AF' }} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Overlay for Editing */}
      {isEditMode && editingState && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.4)',
          animation: 'fadeIn 0.2s'
        }}>
          <div style={{
            padding: '28px 32px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(247,248,250,0.95) 100%)',
            backdropFilter: 'blur(30px)',
            borderRadius: '16px',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(24, 28, 35, 0.1)',
            maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            animation: 'scaleIn 0.2s'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#181C23', marginBottom: '20px' }}>
              编辑 {editingState} 州费率方案
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#404757', marginBottom: '8px' }}>
                  Liability 保费限额
                </label>
                <input
                  type="number"
                  defaultValue={250000}
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(24,28,35,0.1)',
                    borderRadius: '8px', fontSize: '14px', color: '#181C23'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#404757', marginBottom: '8px' }}>
                  Collision 保费限额
                </label>
                <input
                  type="number"
                  defaultValue={250000}
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(24,28,35,0.1)',
                    borderRadius: '8px', fontSize: '14px', color: '#181C23'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#404757', marginBottom: '8px' }}>
                  Comprehensive 保费限额
                </label>
                <input
                  type="number"
                  defaultValue={100000}
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(24,28,35,0.1)',
                    borderRadius: '8px', fontSize: '14px', color: '#181C23'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#404757', marginBottom: '8px' }}>
                  生效日期
                </label>
                <input
                  type="date"
                  defaultValue="2024-01-15"
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(24,28,35,0.1)',
                    borderRadius: '8px', fontSize: '14px', color: '#181C23'
                  }}
                />
              </div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(0, 88, 188, 0.08)', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                <TrendingUp size={16} style={{ color: '#0058BC', marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#0058BC' }}>
                  修改将生成新版本 v3.0，原有版本保留为审计追踪。变更需在下次 NAIC 申报前提交审批。
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="icon-btn" onClick={handleCancelEdit}>取消</button>
              <button className="action-btn" style={{ background: '#0058BC', color: '#FFFFFF' }} onClick={handleSaveRatePlan}>
                <Save size={16} />
                <span style={{ marginLeft: '6px' }}>保存并提交</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
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
        .table-action-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 6px; border-radius: 6px; background: transparent; border: none;
          color: #606778; cursor: pointer; transition: all 0.2s;
        }
        .table-action-btn:hover { background: rgba(56, 62, 73, 0.08); color: #181C23; }
        .status-badge {
          display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 600;
          font-family: system-ui;
        }
        .status-badge.active { background: rgba(52, 199, 89, 0.15); color: #1E8E4C; }
        .status-badge.pending { background: rgba(0, 88, 188, 0.12); color: #0058BC; }
      `}</style>
    </div>
  )
}
