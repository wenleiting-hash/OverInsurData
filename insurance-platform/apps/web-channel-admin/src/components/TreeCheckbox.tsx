/**
 * TreeCheckbox - Hierarchical tree selection component
 *
 * Supports parent-child checkbox relationships with indeterminate states.
 * Used for permission tree selection in role management.
 */

import { useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface TreeNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
}

export interface TreeCheckboxProps {
  /** Tree data structure */
  nodes: TreeNode[];
  /** Set of checked node IDs */
  checked: Set<string>;
  /** Callback when checked state changes */
  onChange: (checked: Set<string>) => void;
  /** Optional render label override */
  renderLabel?: (node: TreeNode) => React.ReactNode;
  /** Whether all nodes start expanded */
  defaultExpanded?: boolean;
  /** Custom class name */
  className?: string;
}

type CheckState = 'checked' | 'unchecked' | 'indeterminate';

export default function TreeCheckbox({
  nodes,
  checked,
  onChange,
  renderLabel,
  defaultExpanded = true,
  className = '',
}: TreeCheckboxProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (defaultExpanded) {
      return new Set(nodes.map(n => n.id));
    }
    return new Set();
  });

  /** Get all leaf node IDs under a given node */
  const getLeafIds = useCallback((node: TreeNode): string[] => {
    if (!node.children || node.children.length === 0) return [node.id];
    return node.children.flatMap(c => getLeafIds(c));
  }, []);

  /** Get all node IDs (including parents) under a given node */
  const getAllIds = useCallback((node: TreeNode): string[] => {
    return [node.id, ...(node.children?.flatMap(c => getAllIds(c)) ?? [])];
  }, []);

  /** Determine check state of a node */
  const getNodeState = useCallback((node: TreeNode): CheckState => {
    const leafIds = getLeafIds(node);
    const checkedCount = leafIds.filter(id => checked.has(id)).length;
    if (checkedCount === 0) return 'unchecked';
    if (checkedCount === leafIds.length) return 'checked';
    return 'indeterminate';
  }, [checked, getLeafIds]);

  /** Toggle a node and propagate to children */
  const toggleNode = useCallback((node: TreeNode) => {
    const state = getNodeState(node);
    const allIds = getAllIds(node);
    const newChecked = new Set(checked);

    if (state === 'checked') {
      // Uncheck all descendants
      allIds.forEach(id => newChecked.delete(id));
    } else {
      // Check all descendants
      allIds.forEach(id => newChecked.add(id));
    }

    onChange(newChecked);
  }, [checked, getNodeState, getAllIds, onChange]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <div className={className}>
      {nodes.map(node => (
        <TreeNodeItem
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          checked={checked}
          getNodeState={getNodeState}
          toggleNode={toggleNode}
          toggleExpand={toggleExpand}
          renderLabel={renderLabel}
        />
      ))}
    </div>
  );
}

function TreeNodeItem({
  node,
  depth,
  expanded,
  checked,
  getNodeState,
  toggleNode,
  toggleExpand,
  renderLabel,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  checked: Set<string>;
  getNodeState: (node: TreeNode) => CheckState;
  toggleNode: (node: TreeNode) => void;
  toggleExpand: (id: string) => void;
  renderLabel?: (node: TreeNode) => React.ReactNode;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const state = getNodeState(node);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
        style={{ paddingLeft: depth * 24 + 8 }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            className="p-0.5 text-gray-400 hover:text-gray-600"
            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span style={{ width: 18 }} />
        )}

        {/* Checkbox */}
        <button
          className="flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); toggleNode(node); }}
        >
          <span
            className="inline-flex items-center justify-center rounded border transition-colors"
            style={{
              width: 16,
              height: 16,
              borderColor: state === 'unchecked' ? '#D1D5DB' : '#3B82F6',
              background: state === 'checked' ? '#3B82F6' : state === 'indeterminate' ? '#93C5FD' : '#fff',
            }}
          >
            {state === 'checked' && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {state === 'indeterminate' && (
              <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
                <rect width="8" height="2" rx="1" fill="#fff" />
              </svg>
            )}
          </span>
        </button>

        {/* Icon + Label */}
        {node.icon && <span className="text-blue-600 flex-shrink-0">{node.icon}</span>}
        <span
          className="text-sm text-gray-800 select-none flex-1"
          onClick={() => hasChildren && toggleExpand(node.id)}
          style={{ fontWeight: hasChildren ? 600 : 400 }}
        >
          {renderLabel ? renderLabel(node) : node.label}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && node.children!.map(child => (
        <TreeNodeItem
          key={child.id}
          node={child}
          depth={depth + 1}
          expanded={expanded}
          checked={checked}
          getNodeState={getNodeState}
          toggleNode={toggleNode}
          toggleExpand={toggleExpand}
          renderLabel={renderLabel}
        />
      ))}
    </div>
  );
}
