import React, { useState, useRef } from 'react'
import { Upload, Download, FileText, Database, Settings, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'

/**
 * Commission Bill Import View (功能点 5.1)
 * Import commission bills from insurance carriers in various formats
 */
interface Props {
  navigateTo: (view: ViewId) => void
}

export default function CommissionBillImportView({ navigateTo }: Props) {
  const { t } = useTranslation('finance')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [carrierId, setCarrierId] = useState<string>('')
  const [billFormat, setBillFormat] = useState<'CSV' | 'Excel' | 'EDI_835' | 'API'>('CSV')
  const [billMonth, setBillMonth] = useState<string>(new Date().toISOString().slice(0, 7))
  const [uploadMode, setUploadMode] = useState<'file' | 'api'>('file')
  const [mappingTemplate, setMappingTemplate] = useState<string>('default')
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: number
    failed: number
    skipped: number
    total: number
    errors: Array<{ line: number; message: string }>
  } | null>(null)

  const CARRIERS = [
    { id: 'CAR001', name: 'Blue Cross Blue Shield' },
    { id: 'CAR002', name: 'Aetna' },
    { id: 'CAR003', name: 'UnitedHealth Group' },
    { id: 'CAR004', name: 'Cigna' },
    { id: 'CAR005', name: 'Humana' },
  ]

  const TEMPLATE_OPTIONS = [
    { id: 'default', name: 'Standard Format' },
    { id: 'custom_1', name: 'BCBS Custom Template' },
    { id: 'custom_2', name: 'Aetna Legacy Format' },
  ]

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Simulate upload and parsing
    setIsUploading(true)
    
    setTimeout(() => {
      setImportResult({
        success: 1247,
        failed: 3,
        skipped: 12,
        total: 1262,
        errors: [
          { line: 45, message: 'Invalid policy number format' },
          { line: 128, message: 'Missing producer NPN' },
          { line: 892, message: 'Invalid rate plan code' },
        ]
      })
      setIsUploading(false)
    }, 1500)
  }

  const handleDownloadErrorReport = () => {
    alert('Downloading error report...')
  }

  const handleImport = () => {
    if (!carrierId || !billMonth) {
      alert('Please select carrier and bill month')
      return
    }
    // Import logic handled by simulated state above
  }

  const getFormatIcon = (format: string) => {
    const icons = {
      'CSV': <FileText size={18} className="text-blue-600" />,
      'Excel': <Database size={18} className="text-green-600" />,
      'EDI_835': <Database size={18} className="text-purple-600" />,
      'API': <CheckCircle size={18} className="text-teal-600" />
    }
    return icons[format as keyof typeof icons] || <FileText size={18} />
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('title.billImport')}
        </h1>
        <p className="text-gray-600">{t('description.billImportDesc')}</p>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-teal-100 px-4 py-2 rounded-lg">
            <span className="text-teal-800 font-semibold">1</span>
            <span className="text-teal-800">{t('steps.selectConfig')}</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg text-gray-500">
            <span className="font-semibold">2</span>
            <span>{t('steps.mapping')}</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg text-gray-500">
            <span className="font-semibold">3</span>
            <span>{t('steps.confirm')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Carrier Selection */}
          <div className="card p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('labels.carrier')}
            </label>
            <select
              value={carrierId}
              onChange={(e) => setCarrierId(e.target.value)}
              className="input-block w-full"
            >
              <option value="">Select Insurance Carrier</option>
              {CARRIERS.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bill Format */}
          <div className="card p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {t('labels.billFormat')}
            </label>
            <div className="space-y-2">
              {(['CSV', 'Excel', 'EDI_835'] as const).map((format) => (
                <label
                  key={format}
                  className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    billFormat === format 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="billFormat"
                    checked={billFormat === format}
                    onChange={() => setBillFormat(format)}
                    className="sr-only"
                  />
                  <span>{getFormatIcon(format)}</span>
                  <span className="text-gray-700 font-medium">{format}</span>
                  {format === 'EDI_835' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 ml-auto">
                      EDI Standard
                    </span>
                  )}
                </label>
              ))}
              
              <label className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  uploadMode === 'api' 
                    ? 'border-teal-500 bg-teal-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="uploadMode"
                    checked={uploadMode === 'api'}
                    onChange={() => setUploadMode('api')}
                    className="sr-only"
                  />
                  <CheckCircle size={18} className="text-teal-600" />
                  <span className="text-gray-700 font-medium">Auto-Pull via API</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 ml-auto">
                    Auto
                  </span>
                </label>
            </div>
          </div>

          {/* Bill Month */}
          <div className="card p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('dates.billingMonth')}
            </label>
            <input
              type="month"
              value={billMonth}
              onChange={(e) => setBillMonth(e.target.value)}
              className="input-block w-full"
            />
          </div>

          {/* Mapping Template */}
          <div className="card p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('labels.mappingTemplate')}
            </label>
            <select
              value={mappingTemplate}
              onChange={(e) => setMappingTemplate(e.target.value)}
              className="input-block w-full"
            >
              {TEMPLATE_OPTIONS.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleImport}
              disabled={!carrierId || isUploading}
              className="btn-primary w-full py-3"
            >
              {isUploading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Processing...</span>
                </span>
              ) : (
                t('actions.importNow')
              )}
            </button>
            <button
              onClick={() => navigateTo('finance-bill-parsing')}
              className="btn-secondary w-full py-3"
            >
              {t('actions.goToParsing')}
            </button>
          </div>
        </div>

        {/* Right Panel - Preview & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Area */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('sections.fileUpload')}
            </h3>
            
            {uploadMode === 'file' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all"
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop your bill file here, or click to browse
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Supported: CSV, Excel, EDI 835
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 mb-2">
                      API Auto-Pull Mode
                    </h4>
                    <p className="text-green-800 text-sm">
                      Bills will be automatically pulled from the carrier's API endpoint on a scheduled basis.
                    </p>
                    <button className="mt-3 text-sm text-green-700 font-medium hover:text-green-900">
                      Configure API Connection →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Import Results */}
          {importResult && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Import Results
              </h3>

              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{importResult.success}</div>
                  <div className="text-sm text-green-700">Success</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-900">{importResult.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-900">{importResult.skipped}</div>
                  <div className="text-sm text-yellow-700">Skipped</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{importResult.total}</div>
                  <div className="text-sm text-gray-700">Total Records</div>
                </div>
              </div>

              {/* Error Details */}
              {importResult.errors.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                      <XCircle className="mr-2 text-red-600" size={16} />
                      Errors ({importResult.errors.length})
                    </h4>
                    <button
                      onClick={handleDownloadErrorReport}
                      className="text-sm text-teal-600 hover:text-teal-800 flex items-center"
                    >
                      <Download className="mr-1" size={14} />
                      Download Report
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className="bg-red-50 p-3 rounded-lg text-sm">
                        <span className="font-semibold text-red-900">Line {error.line}:</span>
                        <span className="text-red-700 ml-2">{error.message}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Import History Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="ml-3">
                <h4 className="text-sm font-semibold text-blue-900">Tip</h4>
                <p className="text-sm text-blue-800 mt-1">
                  You can view all historical imports in the {''}
                  <button className="text-blue-700 font-medium hover:underline">
                    Import History
                  </button>{' '}
                  section.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
