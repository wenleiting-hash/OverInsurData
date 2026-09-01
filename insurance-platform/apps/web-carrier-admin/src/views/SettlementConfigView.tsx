import React, { useState } from 'react'
import { Settings, Save, Plus, Calendar, DollarSign, CreditCard, CheckCircle, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'

/**
 * Settlement Configuration View (功能点 5.5)
 * Configure settlement cycles and payment parameters for each carrier
 */
interface Props {
  navigateTo: (view: ViewId) => void
}

export default function SettlementConfigView({ navigateTo }: Props) {
  const { t } = useTranslation('finance')
  
  const [carrierId, setCarrierId] = useState<string>('CAR001')
  const [isEditing, setIsEditing] = useState(false)

  const configData = {
    carrier: { id: 'CAR001', name: 'Blue Cross Blue Shield' },
    settlementCycle: 'MONTHLY',
    billCutOffDay: 5,
    reconciliationDeadline: 10,
    paymentDeadline: 15,
    currency: 'USD',
    paymentMethod: 'ACH' as 'ACH' | 'CHECK' | 'WIRE' | 'PLATFORM',
    autoReconciliation: true,
    autoPayment: true,
    notificationDaysBefore: 3,
    gracePeriodDays: 5
  }

  const cycleOptions = [
    { value: 'MONTHLY', label: 'Monthly', description: 'Settle bills every month' },
    { value: 'QUARTERLY', label: 'Quarterly', description: 'Settle bills every quarter' },
    { value: 'SEMIANNUAL', label: 'Semi-Annual', description: 'Settle twice per year' },
    { value: 'ANNUAL', label: 'Annual', description: 'Settle once per year' },
  ]

  const paymentMethods = [
    { value: 'ACH', label: 'ACH Transfer', icon: '💳', processingTime: '1-2 business days' },
    { value: 'CHECK', label: 'Paper Check', icon: '📧', processingTime: '3-5 business days' },
    { value: 'WIRE', label: 'Wire Transfer', icon: '🌐', processingTime: 'Same day' },
    { value: 'PLATFORM', label: 'Platform Payment', icon: '🏦', processingTime: 'Instant' },
  ]

  const handleSave = () => {
    alert('Configuration saved successfully!')
    setIsEditing(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title.settlementConfig')}
          </h1>
          <p className="text-gray-600">{t('description.configDesc')}</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary flex items-center"
          >
            <Settings size={16} className="mr-2" />
            Edit Configuration
          </button>
        ) : (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex items-center"
            >
              <Save size={16} className="mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Carrier Selection Card */}
      <div className="card p-6 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Insurance Carrier
        </label>
        <select
          value={carrierId}
          onChange={(e) => setCarrierId(e.target.value)}
          className="input-block w-full"
          disabled={!isEditing}
        >
          <option value="CAR001">Blue Cross Blue Shield</option>
          <option value="CAR002">Aetna</option>
          <option value="CAR003">UnitedHealth Group</option>
          <option value="CAR004">Cigna</option>
          <option value="CAR005">Humana</option>
        </select>
      </div>

      {/* Configuration Form */}
      <div className="space-y-6">
        {/* Settlement Cycle */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Settlement Cycle</h2>
            <Calendar className="text-teal-600" size={24} />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-3">
            Settlement Frequency
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cycleOptions.map((option) => (
              <label
                key={option.value}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  configData.settlementCycle === option.value
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="settlementCycle"
                  checked={configData.settlementCycle === option.value}
                  readOnly
                  className="sr-only"
                />
                <div className="font-semibold text-gray-900 mb-1">{option.label}</div>
                <div className="text-xs text-gray-600">{option.description}</div>
                {configData.settlementCycle === option.value && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="text-teal-600" size={18} />
                  </div>
                )}
              </label>
            ))}
          </div>

          {configData.settlementCycle === 'MONTHLY' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill Cut-off Day (of each month)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={configData.billCutOffDay}
                disabled={!isEditing}
                className="input-block w-32"
              />
            </div>
          )}
        </div>

        {/* Deadlines */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Timeline Deadlines</h2>
            <Clock className="text-orange-600" size={24} />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reconciliation Deadline
                </label>
                <div className="text-2xl font-bold text-gray-900">{configData.reconciliationDeadline} days</div>
                <div className="text-xs text-gray-500">After bill received</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Deadline
                </label>
                <div className="text-2xl font-bold text-gray-900">{configData.paymentDeadline} days</div>
                <div className="text-xs text-gray-500">After reconciliation</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Lead Time
                </label>
                <div className="text-2xl font-bold text-gray-900">{configData.notificationDaysBefore} days</div>
                <div className="text-xs text-gray-500">Before due date</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start">
                <Clock className="text-blue-600 flex-shrink-0 mt-1" size={18} />
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-blue-900">Timeline Example</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    If bill is received on July 5th:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
                    <li>Reconciliation complete by: <strong>{configData.billCutOffDay + configData.reconciliationDeadline}th</strong></li>
                    <li>Payment due by: <strong>{configData.billCutOffDay + configData.reconciliationDeadline + configData.paymentDeadline}th</strong></li>
                    <li>Notification sent: <strong>{configData.billCutOffDay + configData.reconciliationDeadline - configData.notificationDaysBefore}th</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Currency & Payment */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Currency & Payment Method</h2>
            <DollarSign className="text-green-600" size={24} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Settlement Currency
              </label>
              <select
                value={configData.currency}
                disabled={!isEditing}
                className="input-block w-full"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method
              </label>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      configData.paymentMethod === method.value
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={configData.paymentMethod === method.value}
                      readOnly
                      className="sr-only"
                    />
                    <span className="text-xl">{method.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{method.label}</div>
                      <div className="text-xs text-gray-500">{method.processingTime}</div>
                    </div>
                    {configData.paymentMethod === method.value && (
                      <CheckCircle className="text-teal-600" size={20} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Auto Options */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Automation Settings</h2>
            <CheckCircle className="text-purple-600" size={24} />
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
              <div className="flex items-center space-x-3">
                <CheckCircle className="text-green-600" size={20} />
                <div>
                  <div className="font-medium text-gray-900">Auto-Reconciliation</div>
                  <div className="text-sm text-gray-500">Automatically start reconciliation when new bill is imported</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={configData.autoReconciliation}
                disabled={!isEditing}
                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
              <div className="flex items-center space-x-3">
                <CheckCircle className="text-green-600" size={20} />
                <div>
                  <div className="font-medium text-gray-900">Auto-Payment Processing</div>
                  <div className="text-sm text-gray-500">Automatically process payment after successful reconciliation</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={configData.autoPayment}
                disabled={!isEditing}
                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
              />
            </label>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Settings</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grace Period (after deadline)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={configData.gracePeriodDays}
                disabled={!isEditing}
                className="input-block w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                Days allowed before payment is considered late
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Summary */}
      <div className="mt-6 card p-6 bg-gradient-to-r from-gray-50 to-blue-50">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Settings className="mr-2 text-blue-600" size={20} />
          Current Configuration Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Carrier</div>
            <div className="font-medium text-gray-900">{configData.carrier.name}</div>
          </div>
          <div>
            <div className="text-gray-500">Cycle</div>
            <div className="font-medium text-gray-900">{configData.settlementCycle}</div>
          </div>
          <div>
            <div className="text-gray-500">Currency</div>
            <div className="font-medium text-gray-900">{configData.currency}</div>
          </div>
          <div>
            <div className="text-gray-500">Payment</div>
            <div className="font-medium text-gray-900">{configData.paymentMethod}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
