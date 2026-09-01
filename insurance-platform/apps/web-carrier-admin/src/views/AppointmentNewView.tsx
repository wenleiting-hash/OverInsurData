import { useState } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import type { ViewId } from '@/App';
import { generateMockAppointmentRecords } from './data/mockComplianceData';
import { useTranslation } from 'react-i18next';

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock channel and insurer data
const mockChannels = [
  { id: 'c1', name: 'Pacific Coast Insurance Group', npn: 'NPN12348901', state: 'CA', agents: 142 },
  { id: 'c2', name: 'Lone Star Brokerage', npn: 'NPN23459012', state: 'TX', agents: 98 },
  { id: 'c3', name: 'Great Lakes Insurance Partners', npn: 'NPN34560123', state: 'IL', agents: 76 },
  { id: 'c4', name: 'Empire State Insurance Services', npn: 'NPN45671234', state: 'NY', agents: 210 },
  { id: 'c5', name: 'Sunshine State Brokers', npn: 'NPN56782345', state: 'FL', agents: 63 },
  { id: 'c6', name: 'Midwest Specialty Risk', npn: 'NPN67893456', state: 'OH', agents: 89 },
  { id: 'c7', name: 'Rocky Mountain Insurance Advisors', npn: 'NPN78904567', state: 'CO', agents: 52 },
  { id: 'c9', name: 'Southwest Insurance Network', npn: 'NPN90126789', state: 'AZ', agents: 45 },
  { id: 'c10', name: 'Northeast Professional Services', npn: 'NPN01237890', state: 'CT', agents: 78 },
];

const mockInsurers = [
  { id: '1', name: 'Travelers', lines: ['P&C', 'Auto', 'Commercial'] },
  { id: '2', name: 'Liberty Mutual', lines: ['Auto', 'Home', 'Commercial'] },
  { id: '3', name: 'Nationwide', lines: ['P&C', 'Life', 'Health'] },
  { id: '4', name: 'Chubb', lines: ['Specialty', 'Commercial', 'P&C'] },
  { id: '5', name: 'AIG', lines: ['Specialty', 'Commercial', 'Surplus Lines'] },
  { id: '6', name: 'Zurich', lines: ['Commercial', 'Specialty'] },
  { id: '7', name: 'Berkshire Hathaway', lines: ['P&C', 'Commercial'] },
  { id: '8', name: 'Hartford', lines: ['P&C', 'Auto', 'Commercial'] },
];

export default function AppointmentNewView({ navigateTo }: Props) {
  const { t } = useTranslation('appointment');
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    channelId: '',
    insurerId: '',
    state: '',
    line: '',
    description: '',
    isUrgent: false,
  });

  // Validation helpers
  const isStep1Valid = formData.channelId !== '';
  const isStep2Valid = formData.insurerId !== '';
  const isStep3Valid = formData.state !== '' && formData.line !== '';

  const nextStepValidated = () => {
    if (currentStep === 1 && !isStep1Valid) return false;
    if (currentStep === 2 && !isStep2Valid) return false;
    if (currentStep === 3 && !isStep3Valid) return false;
    return true;
  };

  const handleNext = () => {
    if (!nextStepValidated()) return;
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    // Here you would submit to backend/API
    console.log('Appointment submission:', formData);
    // Show success message or redirect
    navigateTo('appointment-application');
  };

  const selectedChannel = mockChannels.find(c => c.id === formData.channelId);
  const selectedInsurer = mockInsurers.find(i => i.id === formData.insurerId);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigateTo('appointment')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回列表页
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          新建 Appointment 申请
        </h1>
        <p className="text-gray-600">
          分步向导将引导您完成渠道授权申请流程
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step < currentStep ? <CheckCircle className="w-6 h-6" /> : step}
              </div>
              {step < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">
          步骤 {currentStep} / 4
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-5xl mx-auto">
        {/* Step 1: Select Channel */}
        {currentStep === 1 && (
          <div className="glass p-8 rounded-xl animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              步骤 1 / 4: 选择渠道商
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockChannels.map(channel => (
                <label
                  key={channel.id}
                  className={`glass p-6 rounded-lg cursor-pointer hover:border-blue-400 hover:shadow-md transition-all border-2 ${
                    formData.channelId === channel.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="channel"
                    value={channel.id}
                    checked={formData.channelId === channel.id}
                    onChange={e => setFormData({ ...formData, channelId: e.target.value })}
                    className="hidden"
                  />
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {channel.name}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">NPN:</span>{' '}
                          <span className="font-mono">{channel.npn}</span>
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">所在州:</span> {channel.state}
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">代理人数量:</span> {channel.agents}名
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        formData.channelId === channel.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {formData.channelId === channel.id && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Insurer */}
        {currentStep === 2 && (
          <div className="glass p-8 rounded-xl animate-fade-in">
            {/* Context Display */}
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">已选渠道:</span>{' '}
                {selectedChannel?.name || '-'}
              </p>
              {selectedChannel && (
                <p className="text-xs text-blue-700 mt-1">
                  NPN: {selectedChannel.npn} · {selectedChannel.state} · {selectedChannel.agents}名代理人
                </p>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              步骤 2 / 4: 选择保险公司
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockInsurers.map(insurer => (
                <button
                  key={insurer.id}
                  onClick={() => setFormData({ ...formData, insurerId: insurer.id })}
                  className={`glass p-6 text-left rounded-lg transition-all border-2 hover:shadow-md ${
                    formData.insurerId === insurer.id
                      ? 'border-green-500 bg-green-50 shadow-lg'
                      : 'border-gray-200 hover:border-green-400'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {insurer.name}
                  </h3>
                  
                  <div className="flex gap-2 flex-wrap">
                    {insurer.lines.map(line => (
                      <span
                        key={line}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Configure Details */}
        {currentStep === 3 && (
          <div className="glass p-8 rounded-xl animate-fade-in">
            {/* Context Display */}
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">已选渠道:</span>{' '}
                {selectedChannel?.name || '-'}
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">已选保险公司:</span>{' '}
                {selectedInsurer?.name || '-'}
              </p>
              {(selectedChannel || selectedInsurer) && (
                <p className="text-xs text-blue-700 mt-1">
                  {selectedChannel && selectedInsurer && (
                    <>
                      {selectedChannel.name} · {selectedChannel.npn} · {selectedInsurer.name}
                    </>
                  )}
                </p>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              步骤 3 / 4: 配置申请详情
            </h2>

            {/* State Selection */}
            <div className="mb-8">
              <label className="block text-base font-semibold text-gray-700 mb-3">
                申请州 *
              </label>
              <div className="flex flex-wrap gap-2">
                {['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'].map(state => (
                  <button
                    key={state}
                    onClick={() => setFormData({ ...formData, state })}
                    className={`w-12 h-12 rounded-md border text-sm font-medium transition-all ${
                      formData.state === state
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-110'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>
              {formData.state && (
                <p className="text-xs text-gray-500 mt-2">
                  已选：<span className="font-semibold text-blue-600">{formData.state}</span>
                </p>
              )}
            </div>

            {/* Line of Business Selection */}
            <div className="mb-8">
              <label className="block text-base font-semibold text-gray-700 mb-3">
                业务线 *
              </label>
              <div className="flex flex-wrap gap-3">
                {['P&C', 'Auto', 'Life', 'Health', 'Commercial', 'Specialty', 'Professional', 'Surplus Lines'].map(line => (
                  <button
                    key={line}
                    onClick={() => setFormData({ ...formData, line })}
                    className={`px-5 py-2.5 rounded-md border text-sm font-medium transition-all ${
                      formData.line === line
                        ? 'bg-green-600 text-white border-green-600 shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    {line}
                  </button>
                ))}
              </div>
              {formData.line && (
                <p className="text-xs text-gray-500 mt-2">
                  已选：<span className="font-semibold text-green-600">{formData.line}</span>
                </p>
              )}
            </div>

            {/* Application Description */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                申请说明
              </label>
              <textarea
                rows={4}
                placeholder="请输入申请原因、业务背景等补充说明…"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow hover:shadow-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                （可选，建议填写以加快审批流程）
              </p>
            </div>

            {/* Urgency Checkbox */}
            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <input
                type="checkbox"
                checked={formData.isUrgent}
                onChange={e => setFormData({ ...formData, isUrgent: e.target.checked })}
                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-orange-300"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <label className="text-sm font-semibold text-gray-700">
                    标记为紧急申请
                  </label>
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  启用加急处理通道，预计 3 个工作日内完成审批
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirm Submission */}
        {currentStep === 4 && (
          <div className="glass p-8 rounded-xl animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              步骤 4 / 4: 确认申请信息
            </h2>

            <div className="glass-strong p-6 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-700 mb-4">申请摘要</h3>
              
              <dl className="space-y-3">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <dt className="text-sm text-gray-600">渠道商</dt>
                  <dd className="text-sm font-semibold text-gray-900">{selectedChannel?.name || '-'}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <dt className="text-sm text-gray-600">渠道 NPN</dt>
                  <dd className="text-sm font-mono text-gray-700">{selectedChannel?.npn || '-'}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <dt className="text-sm text-gray-600">保险公司</dt>
                  <dd className="text-sm font-semibold text-gray-900">{selectedInsurer?.name || '-'}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <dt className="text-sm text-gray-600">申请州</dt>
                  <dd className="text-sm font-semibold text-gray-900">{formData.state || '-'}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <dt className="text-sm text-gray-600">业务线</dt>
                  <dd className="text-sm font-semibold text-gray-900">{formData.line || '-'}</dd>
                </div>
                <div className="flex justify-between pb-2">
                  <dt className="text-sm text-gray-600">优先级</dt>
                  <dd className="text-sm font-semibold">
                    {formData.isUrgent ? (
                      <span className="inline-flex items-center gap-1 text-orange-600">
                        <AlertTriangle className="w-4 h-4" />
                        紧急
                      </span>
                    ) : (
                      <span>普通</span>
                    )}
                  </dd>
                </div>
                {formData.description && (
                  <div className="pt-2">
                    <dt className="text-sm text-gray-600 mb-1">申请说明</dt>
                    <dd className="text-sm text-gray-700 italic">{formData.description}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                <p className="text-xs text-orange-700 leading-relaxed">
                  ⚠️ 提交后系统将自动通过 NIPR 提交 Appointment 申请，处理周期通常为 2–6 周，具体视州监管机构而定。请确保渠道牌照在申请州有效且未过期。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={currentStep === 1 ? () => navigateTo('appointment') : handleBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            {currentStep === 1 ? '取消' : '上一步'}
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={!nextStepValidated()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              下一步 →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-10 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              ✓ 确认提交
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
