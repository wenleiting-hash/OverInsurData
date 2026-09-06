import type { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'secondary' | 'outline';

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-slate-900 text-white',
  secondary: 'bg-slate-100 text-slate-800',
  outline: 'border border-slate-300 text-slate-700',
};

/** 轻量徽标（shadcn 兼容最小实现） */
export function Badge({
  variant = 'default',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]} ${className ?? ''}`}
      {...props}
    />
  );
}
