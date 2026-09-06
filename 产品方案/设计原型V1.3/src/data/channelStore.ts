import { channels as mockChannels } from './mockData'
import type { Channel } from './mockData'

/**
 * 渠道数据会话内共享存储（原型无后端）
 * 渠道列表、新增/编辑表单统一从此处读写，保证编辑保存后列表即时反映。
 */

let store: Channel[] = mockChannels.map(c => ({ ...c }))
const listeners = new Set<() => void>()

function emit() {
  for (const fn of listeners) fn()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** 获取当前全部渠道（返回内部引用，调用方只读） */
function getChannels(): Channel[] {
  return store
}

/** 更新单个渠道；返回是否命中 */
function updateChannel(id: string, patch: Partial<Channel>): boolean {
  let hit = false
  store = store.map(c => {
    if (c.id !== id) return c
    hit = true
    return { ...c, ...patch, id: c.id }
  })
  if (hit) emit()
  return hit
}

/** 新增渠道 */
function addChannel(channel: Channel) {
  store = [...store, { ...channel }]
  emit()
}

/** 删除渠道；一级渠道级联删除其子渠道，返回被删除的 id 集合 */
function removeChannel(id: string): Set<string> {
  const removed = new Set<string>([id])
  const target = store.find(c => c.id === id)
  if (target && !target.parentId) {
    for (const c of store) if (c.parentId === id) removed.add(c.id)
  }
  store = store.filter(c => !removed.has(c.id))
  emit()
  return removed
}

export const channelStore = {
  subscribe,
  getChannels,
  updateChannel,
  addChannel,
  removeChannel,
}
