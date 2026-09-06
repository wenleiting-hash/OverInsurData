// ── Channel Master Data Types ─────────────────────────────────────────────────

export type OrgStatus   = 'active' | 'inactive' | 'suspended' | 'pending'
export type OrgType     = 'agency' | 'ga' | 'branch' | 'sub-agency'
export type AgentStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'terminated'
export type DocStatus   = 'valid' | 'expired' | 'expiring-soon' | 'missing' | 'pending-review'
export type ChangeType  = 'create' | 'edit' | 'status-change' | 'doc-upload' | 'import' | 'relationship'

// ── Organization ─────────────────────────────────────────────────────────────

export interface ChannelOrg {
  id: string
  name: string
  shortName: string
  type: OrgType
  status: OrgStatus
  npn: string
  taxId: string
  licenseStates: string[]
  primaryState: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  website?: string
  managerId?: string
  managerName?: string
  parentOrgId?: string
  parentOrgName?: string
  contractId?: string
  joinDate: string
  lastReviewDate: string
  ytdPremium: number
  ytdCommission: number
  lossRatio: number
  renewalRate: number
  agentCount: number
  tags: string[]
  notes?: string
}

export const ORG_TYPE_LABEL: Record<OrgType, string>   = { agency: '代理机构', ga: 'GA', branch: '分支机构', 'sub-agency': '子代理' }
export const ORG_TYPE_COLOR: Record<OrgType, string>   = { agency: '#0058BC', ga: '#7B3FCA', branch: '#1E8033', 'sub-agency': '#B06000' }
export const ORG_STATUS_STYLE: Record<OrgStatus, { label: string; bg: string; color: string }> = {
  active:    { label: '正常',   bg: 'rgba(52,199,89,0.12)',  color: '#1E8033' },
  inactive:  { label: '未激活', bg: 'rgba(180,180,180,0.15)', color: '#717786' },
  suspended: { label: '已暂停', bg: 'rgba(255,59,48,0.12)',  color: '#C0392B' },
  pending:   { label: '待审批', bg: 'rgba(255,159,10,0.12)', color: '#B06000' },
}

export const channelOrgs: ChannelOrg[] = [
  {
    id: 'org-001', name: 'Pacific Coast Insurance Group', shortName: 'Pacific Coast',
    type: 'agency', status: 'active',
    npn: 'NPN12348901', taxId: '47-1234567',
    licenseStates: ['CA','WA','OR','NV','AZ'],
    primaryState: 'CA', address: '500 Market St, Suite 1200',
    city: 'San Francisco', state: 'CA', zip: '94105',
    phone: '+1-415-555-0101', email: 'contact@pacificcoastins.com', website: 'www.pacificcoastins.com',
    managerId: 'mgr-001', managerName: 'Sarah Chen',
    parentOrgId: undefined, parentOrgName: undefined,
    contractId: 'CTR-2021-0021', joinDate: '2021-03-15', lastReviewDate: '2026-01-10',
    ytdPremium: 28600000, ytdCommission: 3432000, lossRatio: 0.591, renewalRate: 0.888,
    agentCount: 42, tags: ['白标合作', 'API接入', '高绩效'],
  },
  {
    id: 'org-002', name: 'Lone Star Brokerage', shortName: 'Lone Star',
    type: 'agency', status: 'active',
    npn: 'NPN23459012', taxId: '52-2345678',
    licenseStates: ['TX','OK','NM','LA','AR'],
    primaryState: 'TX', address: '1 Congress Ave, Suite 800',
    city: 'Austin', state: 'TX', zip: '78701',
    phone: '+1-512-555-0401', email: 'contact@lonestar.com', website: 'www.lonestarins.com',
    managerId: 'mgr-002', managerName: 'James Rodriguez',
    contractId: 'CTR-2021-0035', joinDate: '2021-05-20', lastReviewDate: '2025-12-15',
    ytdPremium: 22100000, ytdCommission: 2652000, lossRatio: 0.584, renewalRate: 0.876,
    agentCount: 38, tags: ['白标合作', '高出单量'],
  },
  {
    id: 'org-003', name: 'Empire State Insurance Services', shortName: 'Empire State',
    type: 'agency', status: 'active',
    npn: 'NPN45671234', taxId: '61-3456789',
    licenseStates: ['NY','NJ','CT','PA','MA'],
    primaryState: 'NY', address: '30 Rockefeller Plaza, Suite 4200',
    city: 'New York', state: 'NY', zip: '10112',
    phone: '+1-212-555-0701', email: 'info@empirestate.com',
    managerId: 'mgr-004', managerName: 'Emily Johnson',
    contractId: 'CTR-2021-0028', joinDate: '2021-04-01', lastReviewDate: '2026-02-20',
    ytdPremium: 16800000, ytdCommission: 2016000, lossRatio: 0.621, renewalRate: 0.869,
    agentCount: 27, tags: ['白标Draft'],
  },
  {
    id: 'org-004', name: 'Great Lakes Insurance Partners', shortName: 'Great Lakes',
    type: 'agency', status: 'active',
    npn: 'NPN34560123', taxId: '57-4567890',
    licenseStates: ['IL','WI','MI','MN','IA'],
    primaryState: 'IL', address: '233 S Wacker Dr, Suite 5600',
    city: 'Chicago', state: 'IL', zip: '60606',
    phone: '+1-312-555-0901', email: 'info@greatlakes.com',
    managerId: 'mgr-003', managerName: 'Michael Wu',
    contractId: 'CTR-2021-0044', joinDate: '2021-06-14', lastReviewDate: '2026-03-05',
    ytdPremium: 10200000, ytdCommission: 1224000, lossRatio: 0.568, renewalRate: 0.912,
    agentCount: 22, tags: ['稳健增长'],
  },
  {
    id: 'org-005', name: 'Sunshine State Brokers', shortName: 'Sunshine State',
    type: 'agency', status: 'active',
    npn: 'NPN56782345', taxId: '49-5678901',
    licenseStates: ['FL','GA','SC','AL','TN'],
    primaryState: 'FL', address: '200 S Biscayne Blvd, Suite 3100',
    city: 'Miami', state: 'FL', zip: '33131',
    phone: '+1-954-555-0501', email: 'info@sunshinebrokers.com',
    managerId: 'mgr-005', managerName: 'Carlos Martinez',
    contractId: 'CTR-2021-0052', joinDate: '2021-07-08', lastReviewDate: '2026-04-12',
    ytdPremium: 18400000, ytdCommission: 2208000, lossRatio: 0.658, renewalRate: 0.852,
    agentCount: 31, tags: ['赔付率偏高'],
  },
  {
    id: 'org-006', name: 'Gulf South Insurance Partners', shortName: 'Gulf South',
    type: 'agency', status: 'suspended',
    npn: 'NPN55667788', taxId: '63-6789012',
    licenseStates: ['TX','LA','MS'],
    primaryState: 'TX', address: '1000 Main St, Suite 2300',
    city: 'Houston', state: 'TX', zip: '77002',
    phone: '+1-713-555-0601', email: 'contact@gulfsouth.com',
    managerId: 'mgr-012', managerName: 'Bobby Tran',
    contractId: 'CTR-2022-0089', joinDate: '2022-08-15', lastReviewDate: '2026-06-10',
    ytdPremium: 2400000, ytdCommission: 288000, lossRatio: 0.712, renewalRate: 0.801,
    agentCount: 8, tags: ['合规问题', '暂停出单'],
    notes: '因赔付率持续超标（71.2%），合规委员会决议暂停出单权限至整改完成。',
  },
  {
    id: 'org-007', name: 'Rocky Mountain Insurance Advisors', shortName: 'Rocky Mountain',
    type: 'agency', status: 'active',
    npn: 'NPN78904567', taxId: '84-7890123',
    licenseStates: ['CO','WY','MT','UT','ID'],
    primaryState: 'CO', address: '1125 17th St, Suite 900',
    city: 'Denver', state: 'CO', zip: '80202',
    phone: '+1-303-555-0202', email: 'info@rockymtnins.com',
    managerId: 'mgr-007', managerName: 'Jennifer Park',
    contractId: 'CTR-2022-0004', joinDate: '2022-01-10', lastReviewDate: '2026-05-18',
    ytdPremium: 8400000, ytdCommission: 1008000, lossRatio: 0.582, renewalRate: 0.894,
    agentCount: 18, tags: ['快速增长'],
  },
  {
    id: 'org-008', name: 'North Star Benefits LLC', shortName: 'North Star',
    type: 'ga', status: 'active',
    npn: 'NPN33221100', taxId: '36-8901234',
    licenseStates: ['IL','WI','MI','MN'],
    primaryState: 'IL', address: '155 N Wacker Dr, Suite 2000',
    city: 'Chicago', state: 'IL', zip: '60606',
    phone: '+1-312-555-0606', email: 'admin@northstarbenefits.com',
    managerId: 'mgr-008', managerName: 'David Kim',
    parentOrgId: 'org-004', parentOrgName: 'Great Lakes Insurance Partners',
    contractId: 'CTR-2023-0015', joinDate: '2023-02-28', lastReviewDate: '2026-08-20',
    ytdPremium: 4800000, ytdCommission: 576000, lossRatio: 0.554, renewalRate: 0.921,
    agentCount: 12, tags: ['GA合作', '新晋高绩效'],
  },
]

// ── Agent ─────────────────────────────────────────────────────────────────────

export interface ChannelAgent {
  id: string
  firstName: string
  lastName: string
  displayName: string
  email: string
  phone: string
  npn: string
  licenseStates: string[]
  primaryState: string
  orgId: string
  orgName: string
  status: AgentStatus
  role: 'agent' | 'senior-agent' | 'manager' | 'principal'
  joinDate: string
  lastActiveDate: string
  ytdPremium: number
  ytdCommission: number
  lossRatio: number
  renewalRate: number
  policyCount: number
  clientCount: number
  notes?: string
  address?: string
  city?: string
  state?: string
  zip?: string
}

export const AGENT_STATUS_STYLE: Record<AgentStatus, { label: string; bg: string; color: string }> = {
  active:     { label: '在职',   bg: 'rgba(52,199,89,0.12)',   color: '#1E8033' },
  inactive:   { label: '未激活', bg: 'rgba(180,180,180,0.15)', color: '#717786' },
  suspended:  { label: '已暂停', bg: 'rgba(255,59,48,0.12)',   color: '#C0392B' },
  pending:    { label: '待审批', bg: 'rgba(255,159,10,0.12)',  color: '#B06000' },
  terminated: { label: '已离职', bg: 'rgba(120,120,120,0.12)', color: '#555' },
}

export const ROLE_LABEL: Record<string, string> = {
  agent: '代理人', 'senior-agent': '高级代理人', manager: '业务经理', principal: '负责人',
}

export const channelAgents: ChannelAgent[] = [
  {
    id: 'agt-001', firstName: 'Alex', lastName: 'Kim', displayName: 'Alex Kim',
    email: 'alex@pacificcoast.com', phone: '+1-213-555-2001',
    npn: 'NPN88112233', licenseStates: ['CA'], primaryState: 'CA',
    orgId: 'org-001', orgName: 'Pacific Coast Insurance Group',
    status: 'active', role: 'senior-agent',
    joinDate: '2023-01-10', lastActiveDate: '2026-08-21',
    ytdPremium: 2240000, ytdCommission: 268800, lossRatio: 0.571, renewalRate: 0.902,
    policyCount: 187, clientCount: 142,
    address: '3100 Wilshire Blvd', city: 'Los Angeles', state: 'CA', zip: '90010',
  },
  {
    id: 'agt-002', firstName: 'Jessica', lastName: 'Park', displayName: 'Jessica Park',
    email: 'jessica@pacificcoast.com', phone: '+1-213-555-2002',
    npn: 'NPN88334455', licenseStates: ['CA','NV'], primaryState: 'CA',
    orgId: 'org-001', orgName: 'Pacific Coast Insurance Group',
    status: 'active', role: 'agent',
    joinDate: '2023-03-22', lastActiveDate: '2026-08-20',
    ytdPremium: 1980000, ytdCommission: 237600, lossRatio: 0.588, renewalRate: 0.891,
    policyCount: 156, clientCount: 121,
  },
  {
    id: 'agt-003', firstName: 'Ryan', lastName: 'Chen', displayName: 'Ryan Chen',
    email: 'ryan@pacificcoast.com', phone: '+1-415-555-2003',
    npn: 'NPN88556677', licenseStates: ['CA'], primaryState: 'CA',
    orgId: 'org-001', orgName: 'Pacific Coast Insurance Group',
    status: 'active', role: 'manager',
    joinDate: '2022-11-15', lastActiveDate: '2026-08-22',
    ytdPremium: 3100000, ytdCommission: 372000, lossRatio: 0.562, renewalRate: 0.918,
    policyCount: 248, clientCount: 198, notes: '多上级配置，兼任 LA 和 SF 分支',
  },
  {
    id: 'agt-004', firstName: 'Maria', lastName: 'Garza', displayName: 'Maria Garza',
    email: 'maria@lonestar.com', phone: '+1-512-555-3001',
    npn: 'NPN77223344', licenseStates: ['TX','OK','LA'], primaryState: 'TX',
    orgId: 'org-002', orgName: 'Lone Star Brokerage',
    status: 'active', role: 'senior-agent',
    joinDate: '2022-06-01', lastActiveDate: '2026-08-21',
    ytdPremium: 2850000, ytdCommission: 342000, lossRatio: 0.548, renewalRate: 0.911,
    policyCount: 221, clientCount: 176,
  },
  {
    id: 'agt-005', firstName: 'Steve', lastName: 'Nguyen', displayName: 'Steve Nguyen',
    email: 'steve@lonestar.com', phone: '+1-214-555-3002',
    npn: 'NPN77445566', licenseStates: ['TX','NM'], primaryState: 'TX',
    orgId: 'org-002', orgName: 'Lone Star Brokerage',
    status: 'active', role: 'agent',
    joinDate: '2022-09-14', lastActiveDate: '2026-08-19',
    ytdPremium: 1620000, ytdCommission: 194400, lossRatio: 0.601, renewalRate: 0.874,
    policyCount: 134, clientCount: 108,
  },
  {
    id: 'agt-006', firstName: 'Emily', lastName: 'Johnson', displayName: 'Emily Johnson',
    email: 'emily@empirestate.com', phone: '+1-212-555-4001',
    npn: 'NPN66334455', licenseStates: ['NY','NJ','CT'], primaryState: 'NY',
    orgId: 'org-003', orgName: 'Empire State Insurance Services',
    status: 'active', role: 'principal',
    joinDate: '2021-04-01', lastActiveDate: '2026-08-22',
    ytdPremium: 3450000, ytdCommission: 414000, lossRatio: 0.598, renewalRate: 0.887,
    policyCount: 290, clientCount: 234,
  },
  {
    id: 'agt-007', firstName: 'Linda', lastName: 'Zhao', displayName: 'Linda Zhao',
    email: 'linda@pacificcoast.com', phone: '+1-213-555-2004',
    npn: 'NPN88778899', licenseStates: ['CA','WA'], primaryState: 'CA',
    orgId: 'org-001', orgName: 'Pacific Coast Insurance Group',
    status: 'active', role: 'manager',
    joinDate: '2022-01-15', lastActiveDate: '2026-08-22',
    ytdPremium: 2680000, ytdCommission: 321600, lossRatio: 0.579, renewalRate: 0.899,
    policyCount: 212, clientCount: 169,
  },
  {
    id: 'agt-008', firstName: 'Bobby', lastName: 'Tran', displayName: 'Bobby Tran',
    email: 'bobby@gulfsouth.com', phone: '+1-713-555-5001',
    npn: 'NPN55223344', licenseStates: ['TX','LA'], primaryState: 'TX',
    orgId: 'org-006', orgName: 'Gulf South Insurance Partners',
    status: 'suspended', role: 'agent',
    joinDate: '2022-08-15', lastActiveDate: '2026-06-10',
    ytdPremium: 480000, ytdCommission: 57600, lossRatio: 0.721, renewalRate: 0.798,
    policyCount: 42, clientCount: 38, notes: '随机构暂停，出单权限冻结。',
  },
  {
    id: 'agt-009', firstName: 'Jennifer', lastName: 'Walsh', displayName: 'Jennifer Walsh',
    email: 'jwalsh@email.com', phone: '+1-310-555-0101',
    npn: 'NPN99001122', licenseStates: ['CA'], primaryState: 'CA',
    orgId: 'org-001', orgName: 'Pacific Coast Insurance Group',
    status: 'pending', role: 'agent',
    joinDate: '2026-08-10', lastActiveDate: '2026-08-20',
    ytdPremium: 0, ytdCommission: 0, lossRatio: 0, renewalRate: 0,
    policyCount: 0, clientCount: 0,
  },
  {
    id: 'agt-010', firstName: 'Marcus', lastName: 'Thompson', displayName: 'Marcus Thompson',
    email: 'm.thompson@email.com', phone: '+1-212-555-0303',
    npn: 'NPN77334455', licenseStates: ['NY'], primaryState: 'NY',
    orgId: 'org-003', orgName: 'Empire State Insurance Services',
    status: 'inactive', role: 'agent',
    joinDate: '2026-08-18', lastActiveDate: '2026-08-18',
    ytdPremium: 0, ytdCommission: 0, lossRatio: 0, renewalRate: 0,
    policyCount: 0, clientCount: 0, notes: '入驻材料审核中（补充中）',
  },
  {
    id: 'agt-011', firstName: 'Carlos', lastName: 'Martinez', displayName: 'Carlos Martinez',
    email: 'carlos@sunshine.com', phone: '+1-305-555-6001',
    npn: 'NPN44556677', licenseStates: ['FL','GA','SC'], primaryState: 'FL',
    orgId: 'org-005', orgName: 'Sunshine State Brokers',
    status: 'active', role: 'principal',
    joinDate: '2021-07-08', lastActiveDate: '2026-08-21',
    ytdPremium: 3120000, ytdCommission: 374400, lossRatio: 0.641, renewalRate: 0.865,
    policyCount: 256, clientCount: 209,
  },
  {
    id: 'agt-012', firstName: 'Derek', lastName: 'Coleman', displayName: 'Derek Coleman',
    email: 'd.coleman@email.com', phone: '+1-305-555-0707',
    npn: 'NPN22110099', licenseStates: ['FL'], primaryState: 'FL',
    orgId: 'org-005', orgName: 'Sunshine State Brokers',
    status: 'terminated', role: 'agent',
    joinDate: '2026-08-12', lastActiveDate: '2026-08-16',
    ytdPremium: 0, ytdCommission: 0, lossRatio: 0, renewalRate: 0,
    policyCount: 0, clientCount: 0, notes: '入驻申请被拒（背景调查存在重大合规问题）。',
  },
]

// ── Qualification Documents ───────────────────────────────────────────────────

export type DocCategory = 'license' | 'eo' | 'w9' | 'contract' | 'bg' | 'training' | 'corp' | 'other'

export interface QualDoc {
  id: string
  ownerId: string
  ownerType: 'org' | 'agent'
  ownerName: string
  category: DocCategory
  name: string
  fileSize: string
  uploadedDate: string
  uploadedBy: string
  expiryDate?: string
  status: DocStatus
  reviewNote?: string
  version: number
}

export const DOC_STATUS_STYLE: Record<DocStatus, { label: string; bg: string; color: string }> = {
  valid:           { label: '有效',     bg: 'rgba(52,199,89,0.12)',   color: '#1E8033' },
  expired:         { label: '已过期',   bg: 'rgba(255,59,48,0.12)',   color: '#C0392B' },
  'expiring-soon': { label: '即将到期', bg: 'rgba(255,159,10,0.12)',  color: '#B06000' },
  missing:         { label: '缺失',     bg: 'rgba(255,59,48,0.08)',   color: '#C0392B' },
  'pending-review':{ label: '待审核',   bg: 'rgba(0,88,188,0.10)',    color: '#0058BC' },
}

export const DOC_CATEGORY_LABEL: Record<DocCategory, string> = {
  license: '保险执照', eo: 'E&O证书', w9: 'W-9税务', contract: '合同协议',
  bg: '背景调查', training: '培训证书', corp: '公司注册', other: '其他',
}

export const qualDocs: QualDoc[] = [
  { id: 'doc-001', ownerId: 'org-001', ownerType: 'org', ownerName: 'Pacific Coast Insurance Group', category: 'license', name: 'CA Agency License', fileSize: '312 KB', uploadedDate: '2021-03-15', uploadedBy: 'Sarah Chen', expiryDate: '2027-06-30', status: 'valid', version: 2 },
  { id: 'doc-002', ownerId: 'org-001', ownerType: 'org', ownerName: 'Pacific Coast Insurance Group', category: 'eo', name: 'E&O Policy Certificate 2026', fileSize: '245 KB', uploadedDate: '2026-04-01', uploadedBy: 'Sarah Chen', expiryDate: '2027-03-31', status: 'valid', version: 3 },
  { id: 'doc-003', ownerId: 'org-001', ownerType: 'org', ownerName: 'Pacific Coast Insurance Group', category: 'contract', name: 'Agency Agreement CTR-2021-0021', fileSize: '1.2 MB', uploadedDate: '2021-03-15', uploadedBy: 'Admin', expiryDate: '2027-03-15', status: 'valid', version: 1 },
  { id: 'doc-004', ownerId: 'org-001', ownerType: 'org', ownerName: 'Pacific Coast Insurance Group', category: 'w9', name: 'W-9 Form 2025', fileSize: '78 KB', uploadedDate: '2025-01-05', uploadedBy: 'Sarah Chen', status: 'valid', version: 2 },
  { id: 'doc-005', ownerId: 'org-005', ownerType: 'org', ownerName: 'Sunshine State Brokers', category: 'eo', name: 'E&O Certificate 2025', fileSize: '220 KB', uploadedDate: '2025-03-01', uploadedBy: 'Carlos Martinez', expiryDate: '2026-09-30', status: 'expiring-soon', reviewNote: '证书将于2026-09-30到期，请在60天内续期上传。', version: 2 },
  { id: 'doc-006', ownerId: 'org-006', ownerType: 'org', ownerName: 'Gulf South Insurance Partners', category: 'eo', name: 'E&O Certificate (EXPIRED)', fileSize: '198 KB', uploadedDate: '2025-04-01', uploadedBy: 'Bobby Tran', expiryDate: '2026-07-31', status: 'expired', reviewNote: '证书已过期，请立即补充上传。', version: 1 },
  { id: 'doc-007', ownerId: 'agt-001', ownerType: 'agent', ownerName: 'Alex Kim', category: 'license', name: 'CA Producer License', fileSize: '188 KB', uploadedDate: '2023-01-10', uploadedBy: 'Alex Kim', expiryDate: '2027-06-30', status: 'valid', version: 1 },
  { id: 'doc-008', ownerId: 'agt-001', ownerType: 'agent', ownerName: 'Alex Kim', category: 'eo', name: 'E&O Certificate', fileSize: '156 KB', uploadedDate: '2026-04-01', uploadedBy: 'Alex Kim', expiryDate: '2027-03-31', status: 'valid', version: 2 },
  { id: 'doc-009', ownerId: 'agt-002', ownerType: 'agent', ownerName: 'Jessica Park', category: 'license', name: 'CA/NV Producer License', fileSize: '210 KB', uploadedDate: '2023-03-22', uploadedBy: 'Jessica Park', expiryDate: '2027-09-30', status: 'valid', version: 1 },
  { id: 'doc-010', ownerId: 'agt-008', ownerType: 'agent', ownerName: 'Bobby Tran', category: 'eo', name: 'E&O Certificate (EXPIRED)', fileSize: '175 KB', uploadedDate: '2024-07-01', uploadedBy: 'Bobby Tran', expiryDate: '2026-06-30', status: 'expired', reviewNote: '随机构暂停，证书已过期。', version: 1 },
  { id: 'doc-011', ownerId: 'agt-003', ownerType: 'agent', ownerName: 'Ryan Chen', category: 'training', name: 'InsureOS Platform Certification 2026', fileSize: '95 KB', uploadedDate: '2026-02-15', uploadedBy: 'Ryan Chen', expiryDate: '2027-02-15', status: 'valid', version: 3 },
  { id: 'doc-012', ownerId: 'org-003', ownerType: 'org', ownerName: 'Empire State Insurance Services', category: 'corp', name: 'NY Articles of Incorporation', fileSize: '450 KB', uploadedDate: '2021-04-01', uploadedBy: 'Emily Johnson', status: 'valid', version: 1 },
  { id: 'doc-013', ownerId: 'agt-009', ownerType: 'agent', ownerName: 'Jennifer Walsh', category: 'eo', name: 'E&O Certificate (Pending Review)', fileSize: '188 KB', uploadedDate: '2026-08-10', uploadedBy: 'Jennifer Walsh', expiryDate: '2027-03-31', status: 'pending-review', version: 1 },
]

// ── Change History ────────────────────────────────────────────────────────────

export interface ChangeRecord {
  id: string
  entityId: string
  entityType: 'org' | 'agent'
  entityName: string
  changeType: ChangeType
  field?: string
  oldValue?: string
  newValue?: string
  operator: string
  operatorRole: string
  timestamp: string
  ipAddress?: string
  note?: string
}

export const CHANGE_TYPE_STYLE: Record<ChangeType, { label: string; color: string; bg: string }> = {
  create:         { label: '新增',     color: '#1E8033', bg: 'rgba(52,199,89,0.1)' },
  edit:           { label: '编辑',     color: '#0058BC', bg: 'rgba(0,88,188,0.1)' },
  'status-change':{ label: '状态变更', color: '#B06000', bg: 'rgba(255,159,10,0.1)' },
  'doc-upload':   { label: '文件上传', color: '#7B3FCA', bg: 'rgba(123,63,202,0.1)' },
  import:         { label: '批量导入', color: '#1E8033', bg: 'rgba(52,199,89,0.1)' },
  relationship:   { label: '关系变更', color: '#0058BC', bg: 'rgba(0,88,188,0.1)' },
}

export const changeHistory: ChangeRecord[] = [
  { id: 'ch-001', entityId: 'org-006', entityType: 'org', entityName: 'Gulf South Insurance Partners', changeType: 'status-change', field: '机构状态', oldValue: 'active', newValue: 'suspended', operator: 'Zhang Wei', operatorRole: '合规管理员', timestamp: '2026-06-10 14:32:15', ipAddress: '192.168.1.42', note: '赔付率持续超标（71.2%），合规委员会决议暂停出单权限。' },
  { id: 'ch-002', entityId: 'agt-003', entityType: 'agent', entityName: 'Ryan Chen', changeType: 'relationship', field: '上级机构', oldValue: 'PC LA Branch（单上级）', newValue: 'PC LA（主，60%）+ PC SF（次，40%）', operator: 'Marcus Lee', operatorRole: '区域管理员', timestamp: '2026-05-20 09:15:44', note: '跨区域业务拓展，新增 SF 分支为次上级。' },
  { id: 'ch-003', entityId: 'doc-005', entityType: 'org', entityName: 'Sunshine State Brokers', changeType: 'doc-upload', field: 'E&O证书', oldValue: '2025版（过期）', newValue: '2026版（即将到期）', operator: 'Carlos Martinez', operatorRole: '渠道负责人', timestamp: '2026-04-02 16:48:20', note: 'E&O证书更新，到期日2026-09-30，请及时续期。' },
  { id: 'ch-004', entityId: 'agt-008', entityType: 'agent', entityName: 'Bobby Tran', changeType: 'status-change', field: '代理人状态', oldValue: 'active', newValue: 'suspended', operator: 'Zhang Wei', operatorRole: '合规管理员', timestamp: '2026-06-10 14:35:02', note: '随 Gulf South Insurance Partners 机构暂停。' },
  { id: 'ch-005', entityId: 'org-008', entityType: 'org', entityName: 'North Star Benefits LLC', changeType: 'create', operator: 'Sarah Chen', operatorRole: '运营管理员', timestamp: '2023-02-28 10:22:00', note: '新机构入驻，GA合作模式，上级：Great Lakes Insurance Partners。' },
  { id: 'ch-006', entityId: 'agt-001', entityType: 'agent', entityName: 'Alex Kim', changeType: 'edit', field: '执照州', oldValue: 'CA', newValue: 'CA, NV, AZ', operator: 'Sarah Chen', operatorRole: '运营管理员', timestamp: '2026-03-15 11:05:33', note: '新增 NV、AZ 州执照经NIPR验证通过。' },
  { id: 'ch-007', entityId: 'agt-012', entityType: 'agent', entityName: 'Derek Coleman', changeType: 'status-change', field: '代理人状态', oldValue: 'pending', newValue: 'terminated', operator: 'Marcus Lee', operatorRole: '合规管理员', timestamp: '2026-08-16 16:00:00', note: '入驻申请被拒，背景调查发现重大合规违规记录（FL DOI 2024年吊销执照）。' },
  { id: 'ch-008', entityId: 'org-001', entityType: 'org', entityName: 'Pacific Coast Insurance Group', changeType: 'edit', field: '管理员联系方式', oldValue: 'info@pacificcoast.com', newValue: 'contact@pacificcoastins.com', operator: 'Sarah Chen', operatorRole: '渠道负责人', timestamp: '2026-07-01 09:30:11' },
  { id: 'ch-009', entityId: 'agt-009', entityType: 'agent', entityName: 'Jennifer Walsh', changeType: 'create', operator: 'Zhang Wei', operatorRole: '运营管理员', timestamp: '2026-08-10 14:00:00', note: '代理人入驻流程启动，状态：待审批。' },
  { id: 'ch-010', entityId: 'org-001', entityType: 'org', entityName: 'Pacific Coast Insurance Group', changeType: 'import', field: '批量代理人导入', oldValue: undefined, newValue: '3名代理人（Alex Kim、Jessica Park、Ryan Chen）', operator: 'Admin', operatorRole: '系统管理员', timestamp: '2023-01-10 08:00:00' },
]

// ── Import Template ───────────────────────────────────────────────────────────

export interface ImportResult {
  total: number
  success: number
  failed: number
  skipped: number
  errors: { row: number; field: string; message: string }[]
}

export const sampleImportResult: ImportResult = {
  total: 15, success: 12, failed: 2, skipped: 1,
  errors: [
    { row: 7,  field: 'npn',   message: 'NPN格式无效（应为8-10位数字）' },
    { row: 11, field: 'state', message: '主营州代码无法识别："Cali"（应使用标准两字母代码 CA）' },
  ],
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export const masterStats = {
  totalOrgs:      channelOrgs.length,
  activeOrgs:     channelOrgs.filter(o => o.status === 'active').length,
  suspendedOrgs:  channelOrgs.filter(o => o.status === 'suspended').length,
  totalAgents:    channelAgents.length,
  activeAgents:   channelAgents.filter(a => a.status === 'active').length,
  pendingAgents:  channelAgents.filter(a => a.status === 'pending').length,
  expiringDocs:   qualDocs.filter(d => d.status === 'expiring-soon' || d.status === 'expired').length,
  missingDocs:    3,
}
