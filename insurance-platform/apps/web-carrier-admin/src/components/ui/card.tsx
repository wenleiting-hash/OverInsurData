import type { HTMLAttributes } from 'react';

/** 轻量卡片容器（shadcn 兼容最小实现，仅 Card 本体，满足存量视图导入） */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-slate-200 bg-white ${className ?? ''}`} {...props} />;
}
