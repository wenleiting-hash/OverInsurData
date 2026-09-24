import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface MenuPos { x: number; y: number }

interface RowMenuProps {
  pos: MenuPos
  onClose: () => void
  children: ReactNode
  minWidth?: number
}

/**
 * 合作模块统一的行「更多」下拉（portal 到 body）。
 * 点击外部 / 滚动 / resize / Esc 自动关闭。
 */
export default function RowMenu({ pos, onClose, children, minWidth = 150 }: RowMenuProps) {
  useEffect(() => {
    const close = () => onClose()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    setTimeout(() => {
      window.addEventListener('click', close)
      window.addEventListener('scroll', close, true)
      window.addEventListener('resize', close)
      window.addEventListener('keydown', onKey)
    }, 0)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed z-[200] rounded-lg border border-[rgba(193,198,215,0.6)] bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
      style={{ left: pos.x, top: pos.y, minWidth }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  )
}

export function MenuItem({
  icon, children, danger, onClick, disabled,
}: {
  icon?: ReactNode
  children: ReactNode
  danger?: boolean
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-[7px] text-left text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
      style={{ color: danger ? '#BA1A1A' : '#414755', background: 'none', border: 'none' }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = danger ? 'rgba(186,26,26,0.06)' : 'rgba(0,88,188,0.06)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
    >
      {icon}
      {children}
    </button>
  )
}

export function MenuDivider() {
  return <div style={{ height: 1, background: 'rgba(193,198,215,0.4)', margin: '4px 2px' }} />
}
