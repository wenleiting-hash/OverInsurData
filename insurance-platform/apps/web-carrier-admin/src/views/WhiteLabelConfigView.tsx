import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Building2, 
  Palette, 
  Globe, 
  Mail, 
  Smartphone, 
  Upload, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  Copy,
  Download,
  Plus
} from 'lucide-react';

interface SubBrand {
  id: string;
  brandName: string;
  subOrganization: string;
  parentInsuranceCompany: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  createdBy: string;
}

interface BrandConfig {
  brandName: string;
  portalName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  customDomain: string;
  emailTemplate: string;
  smsProvider: string;
  pushProvider: string;
  featuresEnabled: string[];
  termsOfServiceUrl: string;
  privacyPolicyUrl: string;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Sub-brands
const mockBrands: SubBrand[] = [
  {
    id: 'brand001',
    brandName: '深圳 MGA 品牌',
    subOrganization: 'MGA Shenzhen Branch',
    parentInsuranceCompany: '海外保险数字化平台',
    status: 'active',
    createdAt: '2026-01-15',
    createdBy: '系统管理员',
  },
  {
    id: 'brand002',
    brandName: '纽约 MG 品牌',
    subOrganization: 'MG New York Division',
    parentInsuranceCompany: '海外保险数字化平台',
    status: 'active',
    createdAt: '2026-02-20',
    createdBy: '运营经理',
  },
  {
    id: 'brand003',
    brandName: '上海代理品牌',
    subOrganization: 'Agency Shanghai Office',
    parentInsuranceCompany: '海外保险数字化平台',
    status: 'pending',
    createdAt: '2026-08-25',
    createdBy: '运营专员',
  },
];

// Mock data - Brand configurations
const mockConfigs: Record<string, BrandConfig> = {
  brand001: {
    brandName: '深圳 MGA 品牌',
    portalName: 'MGA 自助服务门户',
    logoUrl: '/brands/mga-shenzhen-logo.png',
    faviconUrl: '/brands/mga-favicon.ico',
    primaryColor: '#1e40af', // blue-800
    secondaryColor: '#06b6d4', // cyan-500
    fontFamily: 'Inter, sans-serif',
    customDomain: 'mga.insure-platform.com',
    emailTemplate: 'mga-email-template-v2.html',
    smsProvider: 'Twilio',
    pushProvider: 'Firebase Cloud Messaging',
    featuresEnabled: ['channel_portal', 'commission_tracking', 'training_lms', 'policy_submission'],
    termsOfServiceUrl: 'https://mga.insure-platform.com/terms',
    privacyPolicyUrl: 'https://mga.insure-platform.com/privacy',
  },
  brand002: {
    brandName: '纽约 MG 品牌',
    portalName: 'MG Portal New York',
    logoUrl: '/brands/mg-ny-logo.png',
    faviconUrl: '/brands/mg-ny-favicon.ico',
    primaryColor: '#7c3aed', // violet-600
    secondaryColor: '#f59e0b', // amber-500
    fontFamily: 'Roboto, sans-serif',
    customDomain: 'mg-ny.insure-platform.com',
    emailTemplate: 'mg-standard-template.html',
    smsProvider: 'Twilio',
    pushProvider: 'OneSignal',
    featuresEnabled: ['channel_portal', 'commission_tracking', 'settlement_reports'],
    termsOfServiceUrl: 'https://mg-ny.insure-platform.com/terms',
    privacyPolicyUrl: 'https://mg-ny.insure-platform.com/privacy',
  },
};

export function WhiteLabelConfigView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [selectedBrand, setSelectedBrand] = useState('brand001');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const config = mockConfigs[selectedBrand];

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('配置已保存！');
  };

  const handleCopyConfig = () => {
    const configText = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(configText);
    alert('配置已复制到剪贴板！');
  };

  const handleDownloadConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedBrand}-config.json`;
    a.click();
  };

  const handleResetDefault = () => {
    if (confirm('确定要重置为默认配置吗？所有自定义设置将被覆盖！')) {
      alert('已重置为默认配置');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              白标配置门户
            </h1>
            <p className="text-gray-600">
              多品牌独立门户定制、子机构个性化配置管理
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Plus size={16} className="mr-2" />
              新增品牌
            </button>
            <button className="btn-primary" onClick={handleSave}>
              <CheckCircle size={16} className="mr-2" />
              保存配置
            </button>
          </div>
        </div>

        {/* Sub-brand Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            选择品牌实例
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockBrands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => setSelectedBrand(brand.id)}
                className={`p-6 rounded-lg border transition-all ${
                  selectedBrand === brand.id
                    ? 'bg-blue-50 border-blue-500 shadow-md'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <Building2 size={24} className="text-blue-600" />
                  {brand.status === 'active' ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <XCircle size={16} className="text-yellow-600" />
                  )}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{brand.brandName}</h3>
                <p className="text-xs text-gray-600 mb-2">{brand.subOrganization}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>父机构：{brand.parentInsuranceCompany}</div>
                  <div>创建时间：{brand.createdAt}</div>
                  <div className={`pt-2 px-2 py-1 rounded-full inline-block text-xs font-semibold ${
                    brand.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {brand.status === 'active' ? '已启用' : '待激活'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Toggle */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">预览实时效果</h2>
            <p className="text-sm text-gray-600">查看当前配置在前端的展示效果</p>
          </div>
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`btn-secondary ${isPreviewMode ? 'bg-green-50 border-green-300 text-green-700' : ''}`}
          >
            <Eye size={16} className="mr-2" />
            {isPreviewMode ? '退出预览' : '进入预览'}
          </button>
        </div>
      </div>

      {/* Preview Mode */}
      {isPreviewMode && (
        <div className="glass p-6 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-blue-600" />
              <h3 className="font-bold text-gray-900">{config.portalName}</h3>
            </div>
            <span className="text-sm text-gray-600">{config.customDomain}</span>
          </div>
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: config.primaryColor }}>
              <Building2 size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: config.primaryColor }}>{config.portalName}</h2>
            <p className="text-gray-600">这是根据当前配置生成的预览效果</p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: config.secondaryColor, color: 'white' }}>
                功能模块 A
              </div>
              <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: config.secondaryColor, color: 'white' }}>
                功能模块 B
              </div>
              <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: config.secondaryColor, color: 'white' }}>
                功能模块 C
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Identity Section */}
        <div className="glass p-8 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Palette size={24} className="text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">品牌识别配置</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">门户名称</label>
              <input
                type="text"
                value={config.portalName}
                onChange={(e) => {}}
                className="input-transparent w-full"
                placeholder="输入门户显示名称"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">主色调</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => {}}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300"
                  />
                  <span className="text-sm text-gray-600 font-mono">{config.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">辅助色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => {}}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300"
                  />
                  <span className="text-sm text-gray-600 font-mono">{config.secondaryColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Logo URL</label>
              <div className="flex items-center gap-3">
                <Upload size={16} className="text-gray-400" />
                <input
                  type="text"
                  value={config.logoUrl}
                  onChange={(e) => {}}
                  className="input-transparent flex-1"
                  placeholder="请输入 Logo 图片 URL"
                />
                <button className="btn-secondary">
                  选择文件
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">字体家族</label>
              <select className="input-transparent w-full">
                <option value="Inter, sans-serif">Inter, sans-serif</option>
                <option value="Roboto, sans-serif">Roboto, sans-serif</option>
                <option value="Open Sans, sans-serif">Open Sans, sans-serif</option>
                <option value="Noto Sans, sans-serif">Noto Sans, sans-serif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Domain & Integration Section */}
        <div className="glass p-8 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Globe size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">域名与集成配置</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">自定义域名</label>
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-gray-400" />
                <input
                  type="text"
                  value={config.customDomain}
                  onChange={(e) => {}}
                  className="input-transparent flex-1"
                  placeholder="如：mga.example.com"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">建议使用 HTTPS 加密证书</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">短信提供商</label>
              <select className="input-transparent w-full">
                <option value="Twilio">Twilio</option>
                <option value="Aliyun SMS">Aliyun SMS</option>
                <option value="AWS SNS">AWS SNS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">推送服务提供商</label>
              <select className="input-transparent w-full">
                <option value="Firebase Cloud Messaging">Firebase Cloud Messaging</option>
                <option value="OneSignal">OneSignal</option>
                <option value="Apple Push Notification">Apple Push Notification</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">邮件模板</label>
              <select className="input-transparent w-full">
                <option value="mga-email-template-v2.html">mga-email-template-v2.html</option>
                <option value="mg-standard-template.html">mg-standard-template.html</option>
                <option value="default-notification.html">default-notification.html</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Enablement Section */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Smartphone size={24} className="text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">功能模块启用清单</h2>
          </div>
          <div className="text-sm text-gray-600">
            已启用 {config.featuresEnabled.length} 个功能模块
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {['channel_portal', 'commission_tracking', 'settlement_reports', 'training_lms', 
            'policy_submission', 'compliance_monitoring', 'agent_management', 'product_catalog'].map((feature) => {
            const isEnabled = config.featuresEnabled.includes(feature);
            return (
              <button
                key={feature}
                className={`p-4 rounded-lg border transition-all ${
                  isEnabled
                    ? 'bg-green-50 border-green-500 shadow-md'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  {isEnabled && <CheckCircle size={20} className="text-green-600" />}
                  {!isEnabled && <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>}
                </div>
                <h4 className="text-sm font-semibold text-gray-900 capitalize">
                  {feature.replace(/_/g, ' ')}
                </h4>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legal URLs Section */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Mail size={24} className="text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">法律文档链接</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">服务协议 URL</label>
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-gray-400" />
              <input
                type="url"
                value={config.termsOfServiceUrl}
                onChange={(e) => {}}
                className="input-transparent flex-1"
                placeholder="https://example.com/terms"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">隐私政策 URL</label>
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-gray-400" />
              <input
                type="url"
                value={config.privacyPolicyUrl}
                onChange={(e) => {}}
                className="input-transparent flex-1"
                placeholder="https://example.com/privacy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            <strong>{config.brandName}</strong> 配置信息 • 最后更新：2026-08-31 14:30:00
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <RefreshCw size={16} className="mr-2" />
              重置默认
            </button>
            <button className="btn-secondary" onClick={handleCopyConfig}>
              <Copy size={16} className="mr-2" />
              复制配置
            </button>
            <button className="btn-secondary" onClick={handleDownloadConfig}>
              <Download size={16} className="mr-2" />
              导出 JSON
            </button>
            <button className="btn-primary" onClick={handleSave}>
              <CheckCircle size={16} className="mr-2" />
              保存所有更改
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
