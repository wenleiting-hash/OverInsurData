/**
 * EntryRow Component with Auto-Save Functionality
 * 
 * Features:
 * - React Hook Form integration for form management
 * - Debounced auto-save (500ms after typing stops)
 * - Modified status tracking with visual indicators
 * - Optimistic UI updates
 */

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Edit2, Save, Loader2 } from 'lucide-react';
import debounce from 'lodash.debounce';

interface EntryRowProps {
  id: string;
  module: string;
  section: string;
  key?: string; // Aliased as both 'key' and 'keyName' for compatibility
  keyName?: string;
  en: string;
  zh: string;
  type: string;
  toastVariant?: string;
  onSave: (id: string, en: string, zh: string) => Promise<void>;
  onChangeModified: (id: string, isModified: boolean) => void;
}

// Type configuration
const TYPE_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  label:       { bg: 'rgba(79,70,229,0.08)',   color: '#4F46E5',  label: 'Label' },
  button:      { bg: 'rgba(0,88,188,0.08)',    color: '#0058BC',  label: 'Button' },
  placeholder: { bg: 'rgba(113,119,134,0.12)', color: '#717786',  label: 'Placeholder' },
  toast:       { bg: 'rgba(217,119,6,0.10)',   color: '#d97706',  label: 'Toast' },
  confirm:     { bg: 'rgba(186,26,26,0.08)',   color: '#BA1A1A',  label: 'Confirm' },
  validate:    { bg: 'rgba(147,51,234,0.09)',  color: '#9333ea',  label: 'Validate' },
  'error-page':{ bg: 'rgba(194,65,12,0.08)',   color: '#c2410c',  label: 'Error Page' },
};

export default function EntryRow({
  id, module, section, key: _key, keyName, en: initialEn, zh: initialZh, type, toastVariant,
  onSave, onChangeModified,
}: EntryRowProps) {
  const key = keyName || _key; // Use either prop
  const [isEditing, setIsEditing] = useState(false);
  const [enValue, setEnValue] = useState(initialEn);
  const [zhValue, setZhValue] = useState(initialZh);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { t } = useTranslation('common');
  
  const typeCfg = TYPE_CONFIG[type] || TYPE_CONFIG.label;

  // Sync with props when changed externally
  useEffect(() => {
    setEnValue(initialEn);
    setZhValue(initialZh);
  }, [initialEn, initialZh]);

  // Detect changes
  useEffect(() => {
    const hasChanged = enValue !== initialEn || zhValue !== initialZh;
    setHasChanges(hasChanged);
    onChangeModified(id, hasChanged);
  }, [enValue, zhValue, initialEn, initialZh, id, onChangeModified]);

  // Debounced save function
  const handleSave = useCallback(async (en: string, zh: string) => {
    setIsSaving(true);
    try {
      await onSave(id, en, zh);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [id, onSave]);

  // Create debounced version (500ms delay)
  const debouncedSave = useCallback(
    debounce(handleSave, 500),
    [handleSave]
  );

  // Auto-save when typing stops
  const handleEnChange = (value: string) => {
    setEnValue(value);
    debouncedSave(value, zhValue);
  };

  const handleZhChange = (value: string) => {
    setZhValue(value);
    debouncedSave(enValue, value);
  };

  const cancelEdit = () => {
    setEnValue(initialEn);
    setZhValue(initialZh);
    setIsEditing(false);
    onChangeModified(id, false);
  };

  const startEdit = () => {
    setEnValue(initialEn);
    setZhValue(initialZh);
    setIsEditing(true);
  };

  return (
    <tr
      style={{
        background: isEditing
          ? 'rgba(79,70,229,0.03)'
          : hasChanges
            ? 'rgba(5,150,105,0.03)'
            : undefined,
        transition: 'background-color 0.2s ease',
      }}
    >
      {/* Type Column */}
      <td style={{ width: 72, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: 5,
            fontFamily: "'JetBrains Mono', monospace",
            background: typeCfg.bg,
            color: typeCfg.color,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {toastVariant && (
            <>
              {toastVariant === 'success' && <Check size={10} />}
              {toastVariant === 'error' && <X size={10} />}
              {toastVariant === 'warning' && <Loader2 size={10} className="animate-spin" />}
              {toastVariant === 'info' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0058BC' }} />}
            </>
          )}
          {t(`i18nMgmt.types.${type}`) || typeCfg.label}
        </span>
      </td>

      {/* Key Column */}
      <td style={{ fontSize: 11.5, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>
        {key}
        {hasChanges && (
          <span style={{ marginLeft: 6, fontSize: 10, color: '#059669', fontWeight: 600 }}>
            {t('i18nMgmt.modified')}
          </span>
        )}
      </td>

      {/* English Translation Column */}
      <td style={{ verticalAlign: 'middle', padding: '4px 0' }}>
        {isEditing ? (
          <textarea
            autoFocus
            className="input-glass w-full"
            style={{
              fontSize: 12.5,
              padding: '4px 8px',
              resize: 'none',
              minHeight: 36,
              lineHeight: 1.5,
              outline: 'none',
              border: '1px solid rgba(79,70,229,0.3)',
              borderRadius: 6,
            }}
            value={enValue}
            onChange={(e) => handleEnChange(e.target.value)}
            rows={enValue.length > 60 ? 2 : 1}
          />
        ) : (
          <span style={{ fontSize: 13, color: '#414755' }}>{enValue || '-'}</span>
        )}
      </td>

      {/* Chinese Translation Column */}
      <td style={{ verticalAlign: 'middle', padding: '4px 0' }}>
        {isEditing ? (
          <textarea
            className="input-glass w-full"
            style={{
              fontSize: 12.5,
              padding: '4px 8px',
              resize: 'none',
              minHeight: 36,
              lineHeight: 1.5,
              outline: 'none',
              border: '1px solid rgba(79,70,229,0.3)',
              borderRadius: 6,
            }}
            value={zhValue}
            onChange={(e) => handleZhChange(e.target.value)}
            rows={zhValue.length > 40 ? 2 : 1}
          />
        ) : (
          <span
            style={{
              fontSize: 13,
              color: '#181C23',
              fontWeight: zhValue ? 400 : 300,
            }}
          >
            {zhValue || <span style={{ color: '#C1C6D7', fontStyle: 'italic' }}>{t('i18nMgmt.notFilled')}</span>}
          </span>
        )}
      </td>

      {/* Actions Column */}
      <td style={{ verticalAlign: 'middle', padding: '4px 0' }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="btn-ghost"
              disabled={isSaving || !hasChanges}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                color: isSaving ? '#A0A5B4' : '#059669',
                fontWeight: 600,
                border: '0.5px solid rgba(5,150,105,0.3)',
                borderRadius: 6,
                cursor: isSaving || !hasChanges ? 'not-allowed' : 'pointer',
                opacity: isSaving || !hasChanges ? 0.6 : 1,
              }}
              onClick={() => handleSave(enValue, zhValue)}
            >
              {isSaving ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> {t('i18nMgmt.saving')}
                </>
              ) : (
                <>
                  <Save size={12} /> {t('i18nMgmt.save')}
                </>
              )}
            </button>
            <button
              className="btn-ghost"
              style={{ padding: 5 }}
              onClick={cancelEdit}
              disabled={isSaving}
            >
              <X size={13} style={{ color: '#BA1A1A' }} />
            </button>
          </div>
        ) : (
          <button
            className="btn-ghost"
            style={{ padding: 5 }}
            onClick={startEdit}
            title={t('i18nMgmt.edit')}
          >
            <Edit2 size={13} />
          </button>
        )}
      </td>
    </tr>
  );
}
