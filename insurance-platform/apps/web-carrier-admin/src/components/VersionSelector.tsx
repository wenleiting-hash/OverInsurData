/**
 * Version Selector Component
 * 
 * Features:
 * - Dropdown to select version
 * - Highlight current published version
 * - Display version metadata (created date, translation count)
 */

import { useState } from 'react'
import { ChevronDown, CheckCircle2, FileText, Calendar } from 'lucide-react'
import { useVersions } from '@/hooks/useI18nQueries'
import type { I18nVersion } from '@/lib/api-client'

interface VersionSelectorProps {
  selectedVersionId: string | null
  onSelectVersion: (versionId: string) => void
  isPublished?: boolean
}

export default function VersionSelector({
  selectedVersionId,
  onSelectVersion,
  isPublished = false,
}: VersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data, isLoading } = useVersions({ page: 1, pageSize: 50 })

  const versions = data?.data || []
  const latestPublished = versions.find(v => v.ovwrIsPublished)

  const handleSelect = (versionId: string) => {
    onSelectVersion(versionId)
    setIsOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ fontSize: 13, color: '#A0A5B4', padding: '8px 12px' }}>
        Loading...
      </div>
    )
  }

  const selectedVersion = versions.find(v => v.ovwrVersionId === selectedVersionId)
  const displayVersion = selectedVersion || latestPublished

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn-secondary"
        style={{ fontSize: 12.5, minWidth: 200 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ marginRight: 8 }}>{displayVersion?.ovwrVersionNumber || 'No Version'}</span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '0.5px solid rgba(193,198,215,0.4)',
              maxHeight: 400,
              overflowY: 'auto',
              zIndex: 1000,
              minWidth: 280,
            }}
          >
            {versions.length === 0 ? (
              <div style={{ padding: 16, color: '#A0A5B4', fontSize: 13 }}>
                No versions available
              </div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {versions.map(version => {
                  const isSelected = version.ovwrVersionId === selectedVersionId
                  const isCurrentPublished = version.ovwrIsPublished
                  
                  return (
                    <li key={version.ovwrVersionId}>
                      <button
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 12px',
                          border: 'none',
                          background: isSelected ? '#4F46E512' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                        onClick={() => handleSelect(version.ovwrVersionId)}
                      >
                        {isCurrentPublished && (
                          <CheckCircle2 size={14} style={{ color: '#059669' }} />
                        )}
                        {!isCurrentPublished && (
                          <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #C1C6D7' }} />
                        )}
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: '#181C23' }}>
                            {version.ovwrVersionNumber}
                            {isCurrentPublished && (
                              <span style={{ marginLeft: 6, fontSize: 11, color: '#059669' }}>(Published)</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#717786', marginTop: 2 }}>
                            {new Date(version.ovwrCreatedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0A5B4' }}>
                          <FileText size={12} />
                          <span>{version.ovwrTranslationCount}</span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
