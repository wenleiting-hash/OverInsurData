import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { Upload, FileText, CheckCircle, XCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  icon: any;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

export default function ChannelOnboardingView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    licenseNumber: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  // 步骤定义
  const steps: Step[] = [
    {
      id: 1,
      title: t('step1Submit'),
      description: t('step1Description') || '提交资料：营业执照、牌照复印件、法人身份证',
      status: currentStep === 1 ? 'in-progress' : currentStep > 1 ? 'completed' : 'pending',
      icon: Upload,
    },
    {
      id: 2,
      title: t('step2KYC'),
      description: t('step2Description') || 'KYC 审核：人工/自动验证',
      status: currentStep === 2 ? 'in-progress' : currentStep > 2 ? 'completed' : 'pending',
      icon: FileText,
    },
    {
      id: 3,
      title: t('step3Contract'),
      description: t('step3Description') || '合同签署：电子签章集成',
      status: currentStep === 3 ? 'in-progress' : currentStep > 3 ? 'completed' : 'pending',
      icon: ShieldCheck,
    },
    {
      id: 4,
      title: t('step4Account'),
      description: t('step4Description') || '开通账号：MFA 绑定设置',
      status: currentStep === 4 ? 'in-progress' : currentStep > 4 ? 'completed' : 'pending',
      icon: CheckCircle,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      alert(t('stepProgressSuccess') || `步骤${currentStep}完成，进入步骤${currentStep + 1}`);
    } else {
      alert(t('onboardingComplete') || '渠道入驻流程全部完成！');
      navigateTo('channel-list');
    }
  };

  const handleUploadFile = (fileType: string) => {
    // 🔴 todo: 实现文件上传功能
    console.log('上传文件:', fileType);
    alert(t('uploadPlaceholder') || `请上传${fileType}文件`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="glass rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('channelOnboarding')}</h2>
            
            <button 
              className="btn-secondary"
              onClick={() => navigateTo('channel-list')}
            >
              {t('backToChannelList')}
            </button>
          </div>

          {/* Progress Steps */}
          <div className="relative">
            {/* Progress Bar */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
            
            <div className="grid grid-cols-4 gap-4 relative z-10">
              {steps.map(step => {
                const Icon = step.icon;
                const statusColors = {
                  'pending': 'bg-gray-100 text-gray-400 border-gray-300',
                  'in-progress': 'bg-blue-500 text-white border-blue-500',
                  'completed': 'bg-green-500 text-white border-green-500',
                  'failed': 'bg-red-500 text-white border-red-500',
                };
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all ${statusColors[step.status]}`}>
                      <Icon size={20} />
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                      <p className="text-xs text-gray-500 mt-1 hidden sm:block max-w-[120px]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="glass rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {t(`step${currentStep}Title`) || `${t('step${currentStep}')}: ${steps[currentStep - 1].title}`}
          </h3>

          {/* Step 1: 资料提交 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h4 className="font-semibold text-gray-800 mb-4">{t('requiredDocuments')}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 营业执照 */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => handleUploadFile(t('businessLicense'))}>
                  <Upload size={32} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-center font-medium text-gray-700">{t('businessLicense')}</p>
                  <p className="text-center text-xs text-gray-500 mt-2">{t('clickToUpload')}</p>
                </div>

                {/* 牌照复印件 */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => handleUploadFile(t('licenseCopy'))}>
                  <FileText size={32} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-center font-medium text-gray-700">{t('licenseCopy')}</p>
                  <p className="text-center text-xs text-gray-500 mt-2">{t('clickToUpload')}</p>
                </div>

                {/* 法人身份证 */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => handleUploadFile(t('legalRepID'))}>
                  <ShieldCheck size={32} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-center font-medium text-gray-700">{t('legalRepID')}</p>
                  <p className="text-center text-xs text-gray-500 mt-2">{t('clickToUpload')}</p>
                </div>

                {/* 其他资质文件 */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => handleUploadFile(t('otherDocuments'))}>
                  <FileText size={32} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-center font-medium text-gray-700">{t('otherDocuments')}</p>
                  <p className="text-center text-xs text-gray-500 mt-2">{t('clickToUpload')}</p>
                </div>
              </div>

              {/* 基本信息表单 */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <h4 className="font-semibold text-gray-800">{t('basicInfo')}</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('companyName')} *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder={t('enterCompanyName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('licenseNumber')} *</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder={t('enterLicenseNumber')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('contactPerson')} *</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder={t('enterContactPerson')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')} *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      placeholder="example@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('phone')}</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      placeholder="+86 **** **** ****"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('address')}</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                    placeholder={t('enterAddress')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: KYC 审核进度展示 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-center">
                  <Clock size={20} className="text-yellow-600 mr-3" />
                  <div>
                    <p className="font-semibold text-yellow-800">{t('kycReviewInProgress')}</p>
                    <p className="text-sm text-yellow-700 mt-1">{t('kycReviewDescription')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-800">{t('businessLicenseVerified')}</p>
                      <p className="text-sm text-green-600 mt-1">2026-08-31 10:30</p>
                    </div>
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-700">{t('licenseVerification')}</p>
                      <p className="text-sm text-gray-500 mt-1">{t('processing')}</p>
                    </div>
                    <RefreshCw size={24} className="text-gray-400 animate-spin" />
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-700">{t('backgroundCheck')}</p>
                      <p className="text-sm text-gray-500 mt-1">{t('pending')}</p>
                    </div>
                    <XCircle size={24} className="text-gray-300" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 & 4: 占位符 */}
          {(currentStep === 3 || currentStep === 4) && (
            <div className="text-center py-12">
              <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">{t('comingSoonStep') || `步骤${currentStep}开发中...`}</p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            className="btn-secondary flex-1"
            disabled={currentStep === 1}
            onClick={() => currentStep > 1 && setCurrentStep(prev => prev - 1)}
          >
            {t('previousStep')}
          </button>

          <button
            className="btn-primary flex-1"
            onClick={handleSubmit}
          >
            {currentStep === 4 ? t('completeOnboarding') : t('nextStep')}
          </button>
        </div>
      </div>
    </div>
  );
}
