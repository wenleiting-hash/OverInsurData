/**
 * 财务结算 — 容器
 *
 * Tab 1: 账单批次（列表 / 导入向导 / 批次详情）
 * Tab 2: 结算参数配置
 */
import { useEffect, useState } from 'react';
import { Clock, AlertTriangle, FileText, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { useInsurerConfigs, useFinanceBills } from '@/services/financeService';
import BillBatchListView from './finance/BillBatchListView';
import BillImportWizard from './finance/BillImportWizard';
import BillBatchDetailView from './finance/BillBatchDetailView';
import RateConfigView from './finance/RateConfigView';

interface Props {
  navigateTo: (view: ViewId) => void;
}

type MainTab = 'batches' | 'rates';
type Screen = { name: 'list' } | { name: 'wizard'; carrierId?: string } | { name: 'detail'; billId: string };

export default function FinanceDashboardView({ navigateTo: _navigateTo }: Props) {
  const { t } = useTranslation('finance');
  const cfgsQ = useInsurerConfigs();
  const insurers: any[] = Array.isArray(cfgsQ.data) ? cfgsQ.data : (cfgsQ.data?.data ?? []);

  // 拉取批次 summary 用于 header 状态 pill
  const billsQ = useFinanceBills({ page: 1, size: 1 });
  const summary = billsQ.data?.summary;
  const pendingCount = summary?.pending ?? 0;
  const diffCount = (summary?.open_diffs ?? 0) + (summary?.suspended_diffs ?? 0);

  const [tab, setTab] = useState<MainTab>('batches');
  const [screen, setScreen] = useState<Screen>({ name: 'list' });
  const [rateCarrier, setRateCarrier] = useState<string | undefined>(undefined);

  // 合作详情「维护佣金率」带 carrier_id 跳转
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      if (detail.tab === 'rates') {
        setTab('rates');
        if (detail.carrier_id) setRateCarrier(detail.carrier_id);
      } else if (detail.tab === 'batches') {
        setTab('batches');
        setScreen({ name: 'list' });
        if (detail.carrier_id) setScreen({ name: 'wizard', carrierId: detail.carrier_id });
      }
    };
    window.addEventListener('ovwr:finance-open', handler);
    return () => window.removeEventListener('ovwr:finance-open', handler);
  }, []);

  return (
    <div>
      {/* Page header */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.3px] text-[#181C23]">{t('dashboard.title')}</h1>
          <p className="mt-[3px] text-[13px] text-[#717786]">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 9,
                background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.25)',
                fontSize: 12.5, fontWeight: 600, color: '#B06000',
              }}
            >
              <Clock size={13} /> {t('dashboard.pendingPill', { n: pendingCount })}
            </div>
          )}
          {diffCount > 0 && (
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 9,
                background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)',
                fontSize: 12.5, fontWeight: 600, color: '#C0392B',
              }}
            >
              <AlertTriangle size={13} /> {t('dashboard.diffPill', { n: diffCount })}
            </div>
          )}
        </div>
      </header>

      {/* Tab bar — V1.6 原型：激活态圆角顶 + 三边 + 底边 2px */}
      <div className="mb-6 flex items-center gap-1" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
        {([
          { key: 'batches', label: t('dashboard.tabBatches'), icon: <FileText size={15} />, count: pendingCount },
          { key: 'rates', label: t('dashboard.tabRates'), icon: <ArrowUpDown size={15} /> },
        ] as const).map((tb) => {
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className="flex items-center gap-1.5 text-[13px] transition-all duration-150"
              style={{
                padding: '8px 16px',
                borderRadius: '10px 10px 0 0',
                fontWeight: active ? 700 : 500,
                background: active ? 'rgba(0,88,188,0.08)' : 'transparent',
                color: active ? '#0058BC' : '#717786',
                borderTop: active ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent',
                borderLeft: active ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent',
                borderRight: active ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent',
                borderBottom: active ? '2px solid #0058BC' : '2px solid transparent',
              }}
            >
              {tb.icon}
              {tb.label}
              {'count' in tb && tb.count > 0 && (
                <span
                  className="inline-flex items-center rounded-lg px-[5px] leading-none"
                  style={{
                    background: '#FF9F0A', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {tb.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === 'batches' && (
        <>
          {screen.name === 'list' && (
            <BillBatchListView
              insurers={insurers}
              onImport={() => setScreen({ name: 'wizard' })}
              onOpenDetail={(billId) => setScreen({ name: 'detail', billId })}
            />
          )}
          {screen.name === 'wizard' && (
            <BillImportWizard
              insurers={insurers}
              initialCarrierId={screen.carrierId}
              onClose={() => setScreen({ name: 'list' })}
              onImported={(bill) => setScreen({ name: 'detail', billId: bill.bill_id })}
            />
          )}
          {screen.name === 'detail' && (
            <BillBatchDetailView billId={screen.billId} onBack={() => setScreen({ name: 'list' })} />
          )}
        </>
      )}

      {tab === 'rates' && (
        <RateConfigView
          insurers={insurers}
          initialCarrierId={rateCarrier}
        />
      )}
    </div>
  );
}
