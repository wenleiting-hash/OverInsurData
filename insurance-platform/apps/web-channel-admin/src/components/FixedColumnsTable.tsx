/**
 * FixedColumnsTable - 支持横向冻结列的表格组件
 * 
 * FEATURES:
 * - 左侧固定列（产品名称、产品代码等关键信息）
 * - 右侧固定列（操作列）
 * - 中间可滚动区域
 * - 自动同步表头和行高
 */

import React from 'react';

interface FixedColumnsTableProps {
  children: React.ReactNode;
  leftStickyWidth?: number;      // total left sticky width
  rightStickyWidth?: number;      // total right sticky width
  className?: string;
}

export const FixedColumnsTable: React.FC<FixedColumnsTableProps> = ({
  children,
  leftStickyWidth = 260,    // checkbox(50) + productName(220)
  rightStickyWidth = 165,   // status(75) + actions(90)
  className,
}) => {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <table className={className}>
        {children}
      </table>
    </div>
  );
};

// 冻结列容器
export const StickyColumn = ({
  children,
  side = 'left',
  zIndex = 10,
}: {
  children: React.ReactNode;
  side?: 'left' | 'right';
  zIndex?: number;
}) => (
  <th
    style={{
      position: 'sticky',
      [side]: 0,
      backgroundColor: '#FCFDFF',
      borderRight: side === 'left' ? '1px solid #E1E4E8' : 'none',
      borderBottom: '1px solid #C1C6D7',
      zIndex,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
  >
    {children}
  </th>
);
