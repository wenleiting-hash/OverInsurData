import React from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

interface ToastProps {
  type: 'success' | 'error'
  message: string
  onClose: () => void
}

export default function Toast({ type, message, onClose }: ToastProps) {
  const bgColor = type === 'success' ? '#34C759' : '#BA1A1A'
  const Icon = type === 'success' ? CheckCircle : AlertCircle
  
  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 18px',
      borderRadius: 12,
      background: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: `1px solid ${bgColor}22`,
      minWidth: 320,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <Icon size={20} style={{ color: bgColor, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 13.5, color: '#181C23' }}>{message}</div>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
      >
        <X size={14} style={{ color: '#717786' }} />
      </button>
    </div>
  )
}
