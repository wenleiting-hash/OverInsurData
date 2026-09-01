import { Construction } from 'lucide-react'

const VIEW_INFO: Record<string, { title: string; desc: string }> = {
  cooperation: { title: '合作管理', desc: '管理我司与保险公司的合作关系、合同协议、结算参数、对接人、续约评估，以及向渠道的产品授权链路。' },
  finance: { title: '财务与结算', desc: '处理保险公司佣金账单导入与解析、多维对账、差异处理、结算周期配置及保费对账。' },
  'insurer-analytics': { title: '数据分析', desc: '保险公司业绩总览、产品业绩对比、区域热力图、渠道贡献分析、赔付率监控与续保率趋势。' },
  'channel-hierarchy': { title: '渠道层级与组织架构', desc: '可视化渠道层级树、上下级关系管理、业绩汇总层级穿透。' },
  'channel-onboarding': { title: '渠道入驻与准入管理', desc: '渠道申请受理、资质审核、OFAC筛查、准入决策、协议签署、开通权限。' },
  'product-auth': { title: '产品授权与出单权限', desc: '配置渠道可销售的产品范围与出单保费限额，支持渠道级与代理人级管控。' },
  'commission-scheme': { title: '佣金方案配置', desc: '多层级佣金方案设计，支持阶梯提成、超额奖励、绩效奖金、覆写机制配置。' },
  'commission-settlement': { title: '佣金计算与结算', desc: '自动佣金计算、结算单生成、扣款管理、税务预扣（1099-MISC）、支付执行。' },
  'channel-performance': { title: '渠道绩效考核', desc: 'KPI 配置与追踪、绩效看板、达标率分析、排名与对比、绩效报告生成。' },
  'channel-training': { title: '渠道培训与认证', desc: '培训材料管理（文档/视频）、在线考试题库、认证有效期追踪、学习数据统计。' },
  'channel-portal': { title: '渠道门户 Portal', desc: '渠道自助报价出单、保单查询、佣金核对、培训学习、合规文件下载的一站式门户。' },
  'channel-analytics': { title: '渠道数据分析', desc: '渠道保费排名、业务质量对比、增长趋势、产品偏好、区域分布、留存率分析。' },
}

interface Props {
  viewId: string
}

export default function PlaceholderView({ viewId }: Props) {
  const info = VIEW_INFO[viewId] ?? { title: viewId, desc: '该模块正在开发中。' }
  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23', marginBottom: 6 }}>{info.title}</h1>
      <p style={{ fontSize: 13, color: '#717786', marginBottom: 24 }}>{info.desc}</p>
      <div
        className="card"
        style={{ padding: 64, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'rgba(0,88,188,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Construction size={32} style={{ color: '#0058BC' }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#181C23' }}>{info.title}</div>
        <p style={{ fontSize: 14, color: '#717786', maxWidth: 480, lineHeight: 1.6 }}>{info.desc}</p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(0,88,188,0.07)',
            color: '#0058BC',
            padding: '8px 18px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            marginTop: 8,
          }}
        >
          <span className="orb orb-purple" />
          该模块原型设计中，功能规格已在产品文档中定义
        </div>
      </div>
    </div>
  )
}
