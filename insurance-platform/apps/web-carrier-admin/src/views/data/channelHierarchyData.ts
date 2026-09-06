// ── Channel Node Types ────────────────────────────────────────────────────────

export type NodeType = 'platform' | 'region' | 'agency' | 'branch' | 'agent' | 'sub-agent'
export type NodeStatus = 'active' | 'inactive' | 'suspended' | 'pending'
export type RelationStatus = 'active' | 'pending' | 'terminated' | 'adjusting'

export interface ChannelNode {
  id: string
  name: string
  shortName: string
  type: NodeType
  status: NodeStatus
  parentIds: string[]           // supports multi-parent
  primaryParentId: string | null
  depth: number                 // 0 = platform, 1 = region, 2 = agency, 3 = branch, 4 = agent
  npn?: string
  licenseStates?: string[]
  primaryState: string
  joinDate: string
  contractId?: string
  managerId?: string
  managerName?: string
  teamSize: number
  ytdPremium: number
  ytdCommission: number
  lossRatio: number
  renewalRate: number
  whiteLabelId?: string
  overrideRate?: number         // commission override vs parent contract
  email?: string
  phone?: string
}

export const channelNodes: ChannelNode[] = [
  // Depth 0 — Platform root
  { id: 'root', name: 'InsureOS Platform', shortName: 'Platform', type: 'platform', status: 'active', parentIds: [], primaryParentId: null, depth: 0, primaryState: 'US', joinDate: '2020-01-01', teamSize: 0, ytdPremium: 242145000, ytdCommission: 29057400, lossRatio: 0.608, renewalRate: 0.879 },

  // Depth 1 — Regions
  { id: 'r-west', name: 'West Region', shortName: 'West', type: 'region', status: 'active', parentIds: ['root'], primaryParentId: 'root', depth: 1, primaryState: 'CA', joinDate: '2020-06-01', teamSize: 142, ytdPremium: 78200000, ytdCommission: 9384000, lossRatio: 0.591, renewalRate: 0.884 },
  { id: 'r-south', name: 'South & Southeast Region', shortName: 'South', type: 'region', status: 'active', parentIds: ['root'], primaryParentId: 'root', depth: 1, primaryState: 'TX', joinDate: '2020-06-01', teamSize: 198, ytdPremium: 62400000, ytdCommission: 7488000, lossRatio: 0.619, renewalRate: 0.868 },
  { id: 'r-northeast', name: 'Northeast Region', shortName: 'Northeast', type: 'region', status: 'active', parentIds: ['root'], primaryParentId: 'root', depth: 1, primaryState: 'NY', joinDate: '2020-06-01', teamSize: 124, ytdPremium: 52800000, ytdCommission: 6336000, lossRatio: 0.624, renewalRate: 0.871 },
  { id: 'r-midwest', name: 'Midwest Region', shortName: 'Midwest', type: 'region', status: 'active', parentIds: ['root'], primaryParentId: 'root', depth: 1, primaryState: 'IL', joinDate: '2020-06-01', teamSize: 86, ytdPremium: 28800000, ytdCommission: 3456000, lossRatio: 0.569, renewalRate: 0.906 },

  // Depth 2 — Agencies (West)
  { id: 'c1', name: 'Pacific Coast Insurance Group', shortName: 'Pacific Coast', type: 'agency', status: 'active', parentIds: ['r-west'], primaryParentId: 'r-west', depth: 2, npn: 'NPN12348901', licenseStates: ['CA','WA','OR','NV'], primaryState: 'CA', joinDate: '2021-03-15', contractId: 'CTR-2021-0021', managerId: 'mgr-001', managerName: 'Sarah Chen', teamSize: 42, ytdPremium: 28600000, ytdCommission: 3432000, lossRatio: 0.591, renewalRate: 0.888, whiteLabelId: 'wl-01', email: 'contact@pacificcoast.com', phone: '+1-415-555-0101' },
  { id: 'c7', name: 'Rocky Mountain Insurance Advisors', shortName: 'Rocky Mountain', type: 'agency', status: 'active', parentIds: ['r-west'], primaryParentId: 'r-west', depth: 2, npn: 'NPN78904567', licenseStates: ['CO','WY','MT','UT'], primaryState: 'CO', joinDate: '2022-01-10', contractId: 'CTR-2022-0004', managerId: 'mgr-007', managerName: 'Jennifer Park', teamSize: 18, ytdPremium: 8400000, ytdCommission: 1008000, lossRatio: 0.582, renewalRate: 0.894, email: 'info@rockymtnins.com', phone: '+1-303-555-0202' },
  { id: 'c11', name: 'Bay Area Commercial Specialists', shortName: 'Bay Area Comm', type: 'agency', status: 'pending', parentIds: ['r-west'], primaryParentId: 'r-west', depth: 2, npn: 'NPN11223344', licenseStates: ['CA'], primaryState: 'CA', joinDate: '2026-08-01', contractId: 'CTR-2026-0041', managerId: 'mgr-011', managerName: 'Kevin Zhang', teamSize: 6, ytdPremium: 0, ytdCommission: 0, lossRatio: 0, renewalRate: 0, email: 'kevin@bayareacomm.com', phone: '+1-415-555-0303' },

  // Depth 2 — Agencies (South)
  { id: 'c2', name: 'Lone Star Brokerage', shortName: 'Lone Star', type: 'agency', status: 'active', parentIds: ['r-south'], primaryParentId: 'r-south', depth: 2, npn: 'NPN23459012', licenseStates: ['TX','OK','NM','LA'], primaryState: 'TX', joinDate: '2021-05-20', contractId: 'CTR-2021-0035', managerId: 'mgr-002', managerName: 'James Rodriguez', teamSize: 38, ytdPremium: 22100000, ytdCommission: 2652000, lossRatio: 0.584, renewalRate: 0.876, whiteLabelId: 'wl-02', email: 'contact@lonestar.com', phone: '+1-512-555-0401' },
  { id: 'c5', name: 'Sunshine State Brokers', shortName: 'Sunshine State', type: 'agency', status: 'active', parentIds: ['r-south'], primaryParentId: 'r-south', depth: 2, npn: 'NPN56782345', licenseStates: ['FL','GA','SC','AL'], primaryState: 'FL', joinDate: '2021-07-08', contractId: 'CTR-2021-0052', managerId: 'mgr-005', managerName: 'Carlos Martinez', teamSize: 31, ytdPremium: 18400000, ytdCommission: 2208000, lossRatio: 0.658, renewalRate: 0.852, email: 'info@sunshinebrokers.com', phone: '+1-954-555-0501' },
  { id: 'c12', name: 'Gulf South Insurance Partners', shortName: 'Gulf South', type: 'agency', status: 'suspended', parentIds: ['r-south'], primaryParentId: 'r-south', depth: 2, npn: 'NPN55667788', licenseStates: ['TX','LA','MS'], primaryState: 'TX', joinDate: '2022-08-15', contractId: 'CTR-2022-0089', managerId: 'mgr-012', managerName: 'Bobby Tran', teamSize: 8, ytdPremium: 2400000, ytdCommission: 288000, lossRatio: 0.712, renewalRate: 0.801, email: 'contact@gulfsouth.com', phone: '+1-713-555-0601' },

  // Depth 2 — Agencies (Northeast)
  { id: 'c4', name: 'Empire State Insurance Services', shortName: 'Empire State', type: 'agency', status: 'active', parentIds: ['r-northeast'], primaryParentId: 'r-northeast', depth: 2, npn: 'NPN45671234', licenseStates: ['NY','NJ','CT','PA'], primaryState: 'NY', joinDate: '2021-04-01', contractId: 'CTR-2021-0028', managerId: 'mgr-004', managerName: 'Emily Johnson', teamSize: 27, ytdPremium: 16800000, ytdCommission: 2016000, lossRatio: 0.621, renewalRate: 0.869, whiteLabelId: 'wl-03', email: 'info@empirestate.com', phone: '+1-212-555-0701' },
  { id: 'c10', name: 'Northeast Professional Services', shortName: 'NE Professional', type: 'agency', status: 'suspended', parentIds: ['r-northeast'], primaryParentId: 'r-northeast', depth: 2, npn: 'NPN01237890', licenseStates: ['CT','MA','RI'], primaryState: 'CT', joinDate: '2021-09-20', contractId: 'CTR-2021-0081', managerId: 'mgr-010', managerName: 'Tom Anderson', teamSize: 12, ytdPremium: 4200000, ytdCommission: 504000, lossRatio: 0.701, renewalRate: 0.821, email: 'contact@neps.com', phone: '+1-860-555-0801' },

  // Depth 2 — Agencies (Midwest)
  { id: 'c3', name: 'Great Lakes Insurance Partners', shortName: 'Great Lakes', type: 'agency', status: 'active', parentIds: ['r-midwest'], primaryParentId: 'r-midwest', depth: 2, npn: 'NPN34560123', licenseStates: ['IL','WI','MI','MN'], primaryState: 'IL', joinDate: '2021-06-14', contractId: 'CTR-2021-0044', managerId: 'mgr-003', managerName: 'Michael Wu', teamSize: 22, ytdPremium: 10200000, ytdCommission: 1224000, lossRatio: 0.568, renewalRate: 0.912, email: 'info@greatlakes.com', phone: '+1-312-555-0901' },
  { id: 'c6', name: 'Midwest Specialty Risk', shortName: 'MW Specialty', type: 'agency', status: 'active', parentIds: ['r-midwest'], primaryParentId: 'r-midwest', depth: 2, npn: 'NPN67893456', licenseStates: ['OH','IN','KY','MO'], primaryState: 'OH', joinDate: '2022-03-22', contractId: 'CTR-2022-0019', managerId: 'mgr-006', managerName: 'David Kim', teamSize: 16, ytdPremium: 7800000, ytdCommission: 936000, lossRatio: 0.572, renewalRate: 0.908, email: 'david@mwspecialty.com', phone: '+1-614-555-1001' },

  // Depth 3 — Branches (under Pacific Coast)
  { id: 'b-pc-la', name: 'Pacific Coast — Los Angeles Branch', shortName: 'PC Los Angeles', type: 'branch', status: 'active', parentIds: ['c1'], primaryParentId: 'c1', depth: 3, primaryState: 'CA', joinDate: '2022-01-15', managerId: 'mgr-021', managerName: 'Linda Zhao', teamSize: 14, ytdPremium: 11200000, ytdCommission: 1344000, lossRatio: 0.584, renewalRate: 0.892, overrideRate: -0.005 },
  { id: 'b-pc-sf', name: 'Pacific Coast — San Francisco Branch', shortName: 'PC San Francisco', type: 'branch', status: 'active', parentIds: ['c1'], primaryParentId: 'c1', depth: 3, primaryState: 'CA', joinDate: '2022-01-15', managerId: 'mgr-022', managerName: 'Marcus Lee', teamSize: 12, ytdPremium: 9800000, ytdCommission: 1176000, lossRatio: 0.598, renewalRate: 0.882 },
  { id: 'b-pc-sea', name: 'Pacific Coast — Seattle Branch', shortName: 'PC Seattle', type: 'branch', status: 'active', parentIds: ['c1'], primaryParentId: 'c1', depth: 3, primaryState: 'WA', joinDate: '2023-05-01', managerId: 'mgr-023', managerName: 'Amy Foster', teamSize: 8, ytdPremium: 5800000, ytdCommission: 696000, lossRatio: 0.601, renewalRate: 0.878 },

  // Depth 3 — Branches (under Lone Star)
  { id: 'b-ls-hou', name: 'Lone Star — Houston Branch', shortName: 'LS Houston', type: 'branch', status: 'active', parentIds: ['c2'], primaryParentId: 'c2', depth: 3, primaryState: 'TX', joinDate: '2022-06-01', managerId: 'mgr-031', managerName: 'Maria Garza', teamSize: 16, ytdPremium: 12400000, ytdCommission: 1488000, lossRatio: 0.578, renewalRate: 0.881 },
  { id: 'b-ls-dal', name: 'Lone Star — Dallas Branch', shortName: 'LS Dallas', type: 'branch', status: 'active', parentIds: ['c2'], primaryParentId: 'c2', depth: 3, primaryState: 'TX', joinDate: '2022-06-01', managerId: 'mgr-032', managerName: 'Steve Nguyen', teamSize: 14, ytdPremium: 8200000, ytdCommission: 984000, lossRatio: 0.592, renewalRate: 0.868 },

  // Depth 4 — Individual agents (sample, under PC LA branch)
  { id: 'ag-001', name: 'Alex Kim', shortName: 'Alex Kim', type: 'agent', status: 'active', parentIds: ['b-pc-la'], primaryParentId: 'b-pc-la', depth: 4, npn: 'NPN88112233', licenseStates: ['CA'], primaryState: 'CA', joinDate: '2023-01-10', teamSize: 0, ytdPremium: 2240000, ytdCommission: 268800, lossRatio: 0.571, renewalRate: 0.902, overrideRate: 0.002, email: 'alex@pacificcoast.com', phone: '+1-213-555-2001' },
  { id: 'ag-002', name: 'Jessica Park', shortName: 'Jessica Park', type: 'agent', status: 'active', parentIds: ['b-pc-la'], primaryParentId: 'b-pc-la', depth: 4, npn: 'NPN88334455', licenseStates: ['CA','NV'], primaryState: 'CA', joinDate: '2023-03-22', teamSize: 0, ytdPremium: 1980000, ytdCommission: 237600, lossRatio: 0.588, renewalRate: 0.891, email: 'jessica@pacificcoast.com', phone: '+1-213-555-2002' },
  // Multi-parent agent (reports to both PC LA and PC SF)
  { id: 'ag-003', name: 'Ryan Chen', shortName: 'Ryan Chen', type: 'agent', status: 'active', parentIds: ['b-pc-la', 'b-pc-sf'], primaryParentId: 'b-pc-la', depth: 4, npn: 'NPN88556677', licenseStates: ['CA'], primaryState: 'CA', joinDate: '2022-11-15', teamSize: 2, ytdPremium: 3100000, ytdCommission: 372000, lossRatio: 0.562, renewalRate: 0.918, email: 'ryan@pacificcoast.com', phone: '+1-415-555-2003' },
]

// ── Hierarchy Relations ───────────────────────────────────────────────────────

export interface HierarchyRelation {
  id: string
  childId: string
  childName: string
  parentId: string
  parentName: string
  isPrimary: boolean
  revenueShare: number      // % of child's revenue credited to parent
  status: RelationStatus
  startDate: string
  endDate?: string
  terminationReason?: string
  approvedBy?: string
  changeHistory?: RelationChange[]
}

export interface RelationChange {
  date: string
  type: 'created' | 'adjusted' | 'terminated' | 'restored'
  fromParentId?: string
  toParentId?: string
  changedBy: string
  note: string
  noteEn?: string
}

export const hierarchyRelations: HierarchyRelation[] = [
  { id: 'hr1', childId: 'c1', childName: 'Pacific Coast Insurance Group', parentId: 'r-west', parentName: 'West Region', isPrimary: true, revenueShare: 1.0, status: 'active', startDate: '2021-03-15', approvedBy: 'Admin' },
  { id: 'hr2', childId: 'c2', childName: 'Lone Star Brokerage', parentId: 'r-south', parentName: 'South & Southeast Region', isPrimary: true, revenueShare: 1.0, status: 'active', startDate: '2021-05-20', approvedBy: 'Admin' },
  { id: 'hr3', childId: 'c4', childName: 'Empire State Insurance Services', parentId: 'r-northeast', parentName: 'Northeast Region', isPrimary: true, revenueShare: 1.0, status: 'active', startDate: '2021-04-01', approvedBy: 'Admin' },
  { id: 'hr4', childId: 'c3', childName: 'Great Lakes Insurance Partners', parentId: 'r-midwest', parentName: 'Midwest Region', isPrimary: true, revenueShare: 1.0, status: 'active', startDate: '2021-06-14', approvedBy: 'Admin' },
  { id: 'hr5', childId: 'b-pc-la', childName: 'PC — Los Angeles Branch', parentId: 'c1', parentName: 'Pacific Coast Insurance Group', isPrimary: true, revenueShare: 1.0, status: 'active', startDate: '2022-01-15', approvedBy: 'Sarah Chen' },
  { id: 'hr6', childId: 'b-pc-sf', childName: 'PC — San Francisco Branch', parentId: 'c1', parentName: 'Pacific Coast Insurance Group', isPrimary: true, revenueShare: 1.0, status: 'active', startDate: '2022-01-15', approvedBy: 'Sarah Chen' },
  { id: 'hr7', childId: 'ag-003', childName: 'Ryan Chen', parentId: 'b-pc-la', parentName: 'PC Los Angeles Branch', isPrimary: true, revenueShare: 0.6, status: 'active', startDate: '2022-11-15', approvedBy: 'Linda Zhao' },
  { id: 'hr8', childId: 'ag-003', childName: 'Ryan Chen', parentId: 'b-pc-sf', parentName: 'PC San Francisco Branch', isPrimary: false, revenueShare: 0.4, status: 'active', startDate: '2023-03-01', approvedBy: 'Marcus Lee' },
  { id: 'hr9', childId: 'c12', childName: 'Gulf South Insurance Partners', parentId: 'r-south', parentName: 'South & Southeast Region', isPrimary: true, revenueShare: 1.0, status: 'active', startDate: '2022-08-15', approvedBy: 'Admin' },
  { id: 'hr10', childId: 'c11', childName: 'Bay Area Commercial Specialists', parentId: 'r-west', parentName: 'West Region', isPrimary: true, revenueShare: 1.0, status: 'pending', startDate: '2026-08-01', approvedBy: undefined },
  {
    id: 'hr11', childId: 'c10', childName: 'NE Professional Services', parentId: 'r-northeast', parentName: 'Northeast Region', isPrimary: true, revenueShare: 1.0, status: 'active', startDate: '2021-09-20', approvedBy: 'Admin',
    changeHistory: [
      { date: '2026-06-10', type: 'adjusted', fromParentId: 'r-northeast', toParentId: 'r-northeast', changedBy: 'Zhang Wei', note: '因合规违规暂停出单权限，层级保留但暂停业务', noteEn: 'Writing authority suspended for compliance violation; hierarchy retained but business paused' },
    ]
  },
]

// ── Pending Changes ───────────────────────────────────────────────────────────

export type ChangeType = 'add-relation' | 'move-parent' | 'add-parent' | 'remove-parent' | 'terminate' | 'adjust-share'

export interface PendingChange {
  id: string
  changeType: ChangeType
  nodeId: string
  nodeName: string
  fromParentId?: string
  fromParentName?: string
  toParentId?: string
  toParentName?: string
  newRevenueShare?: number
  requestedBy: string
  requestDate: string
  status: 'pending-approval' | 'approved' | 'rejected'
  approver?: string
  effectiveDate: string
  reason: string
  reasonEn?: string
}

export const pendingChanges: PendingChange[] = [
  { id: 'pc1', changeType: 'move-parent', nodeId: 'c5', nodeName: 'Sunshine State Brokers', fromParentId: 'r-south', fromParentName: 'South & Southeast Region', toParentId: 'r-northeast', toParentName: 'Northeast Region', requestedBy: 'Carlos Martinez', requestDate: '2026-08-15', status: 'pending-approval', effectiveDate: '2026-09-01', reason: '业务重心东移，主要合作保险公司在东北区', reasonEn: 'Business focus shifting east; primary carrier partners are in the Northeast region' },
  { id: 'pc2', changeType: 'add-parent', nodeId: 'ag-001', nodeName: 'Alex Kim', toParentId: 'b-pc-sf', toParentName: 'PC San Francisco Branch', newRevenueShare: 0.3, requestedBy: 'Linda Zhao', requestDate: '2026-08-18', status: 'pending-approval', effectiveDate: '2026-09-01', reason: '跨区域协作，Alex Kim 承接 SF 分支部分业务', reasonEn: 'Cross-region collaboration; Alex Kim takes on part of the SF Branch book of business' },
  { id: 'pc3', changeType: 'terminate', nodeId: 'hr12', nodeName: 'Gulf South Insurance Partners', requestedBy: 'Zhang Wei', requestDate: '2026-08-20', status: 'pending-approval', effectiveDate: '2026-09-30', reason: '持续赔付率超标，合规委员会决议终止合作', reasonEn: 'Persistent loss-ratio exceedance; the compliance committee resolved to terminate the partnership' },
  { id: 'pc4', changeType: 'add-relation', nodeId: 'c11', nodeName: 'Bay Area Commercial Specialists', toParentId: 'r-west', toParentName: 'West Region', requestedBy: 'Kevin Zhang', requestDate: '2026-08-01', status: 'approved', approver: 'Sarah Chen', effectiveDate: '2026-08-15', reason: '新渠道加入申请', reasonEn: 'New channel onboarding application' },
]

// ── White-label Configurations ────────────────────────────────────────────────

export interface WhiteLabelConfig {
  id: string
  channelId: string
  channelName: string
  brandName: string
  brandLogoUrl?: string
  primaryColor: string
  secondaryColor: string
  domain?: string
  emailDomain?: string
  portalEnabled: boolean
  mobileAppEnabled: boolean
  customDocTemplates: boolean
  reportingBranded: boolean
  apiEnabled: boolean
  status: 'active' | 'draft' | 'disabled'
  createdDate: string
  lastModified: string
  features: string[]
}

export const whiteLabelConfigs: WhiteLabelConfig[] = [
  {
    id: 'wl-01', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', brandName: 'Pacific Coast Pro', primaryColor: '#1E4FA8', secondaryColor: '#0A8FD6', domain: 'portal.pacificcoastins.com', emailDomain: 'pacificcoastins.com', portalEnabled: true, mobileAppEnabled: true, customDocTemplates: true, reportingBranded: true, apiEnabled: true, status: 'active', createdDate: '2022-06-01', lastModified: '2026-07-15',
    features: ['customQuotePage', 'whiteLabelApp', 'brandedPolicyDocs', 'customReportCovers', 'apiIntegration', 'customerPortal'],
  },
  {
    id: 'wl-02', channelId: 'c2', channelName: 'Lone Star Brokerage', brandName: 'Lone Star Pro', primaryColor: '#B8390E', secondaryColor: '#F5A623', domain: 'portal.lonestarins.com', emailDomain: 'lonestarins.com', portalEnabled: true, mobileAppEnabled: false, customDocTemplates: true, reportingBranded: false, apiEnabled: false, status: 'active', createdDate: '2022-09-01', lastModified: '2026-06-20',
    features: ['customQuotePage', 'brandedPolicyDocs', 'customerPortal'],
  },
  {
    id: 'wl-03', channelId: 'c4', channelName: 'Empire State Insurance Services', brandName: 'Empire Coverage', primaryColor: '#2D3A7C', secondaryColor: '#5B89CC', domain: '', emailDomain: 'empirecoverage.com', portalEnabled: false, mobileAppEnabled: false, customDocTemplates: true, reportingBranded: true, apiEnabled: false, status: 'draft', createdDate: '2026-07-01', lastModified: '2026-08-10',
    features: ['brandedPolicyDocs', 'customReportCovers'],
  },
]

// ── Team Performance Summary ──────────────────────────────────────────────────

export interface TeamPerf {
  nodeId: string
  nodeName: string
  nodeType: NodeType
  depth: number
  parentName?: string
  memberCount: number
  ytdPremium: number
  ytdTarget: number
  achievementRate: number
  ytdCommission: number
  newPolicies: number
  renewedPolicies: number
  renewalRate: number
  lossRatio: number
  activePolicies: number
  avgPremiumPerMember: number
  topAgent?: string
  topAgentPremium?: number
  rank?: number
}

export const teamPerfSummary: TeamPerf[] = [
  { nodeId: 'r-west',     nodeName: 'West Region',          nodeType: 'region',  depth: 1, memberCount: 142, ytdPremium: 78200000, ytdTarget: 72000000, achievementRate: 1.086, ytdCommission: 9384000, newPolicies: 4820, renewedPolicies: 12400, renewalRate: 0.884, lossRatio: 0.591, activePolicies: 17220, avgPremiumPerMember: 550704, topAgent: 'Ryan Chen', topAgentPremium: 3100000, rank: 1 },
  { nodeId: 'r-south',    nodeName: 'South & Southeast',    nodeType: 'region',  depth: 1, memberCount: 198, ytdPremium: 62400000, ytdTarget: 68000000, achievementRate: 0.918, ytdCommission: 7488000, newPolicies: 3840, renewedPolicies: 9800, renewalRate: 0.868, lossRatio: 0.619, activePolicies: 13640, avgPremiumPerMember: 315152, topAgent: 'Maria Garza', topAgentPremium: 2100000, rank: 3 },
  { nodeId: 'r-northeast', nodeName: 'Northeast Region',    nodeType: 'region',  depth: 1, memberCount: 124, ytdPremium: 52800000, ytdTarget: 50000000, achievementRate: 1.056, ytdCommission: 6336000, newPolicies: 2940, renewedPolicies: 8820, renewalRate: 0.871, lossRatio: 0.624, activePolicies: 11760, avgPremiumPerMember: 425806, topAgent: 'Emily Johnson', topAgentPremium: 2800000, rank: 2 },
  { nodeId: 'r-midwest',   nodeName: 'Midwest Region',      nodeType: 'region',  depth: 1, memberCount: 86,  ytdPremium: 28800000, ytdTarget: 28000000, achievementRate: 1.029, ytdCommission: 3456000, newPolicies: 1820, renewedPolicies: 5400, renewalRate: 0.906, lossRatio: 0.569, activePolicies: 7220, avgPremiumPerMember: 334884, topAgent: 'Michael Wu', topAgentPremium: 1900000, rank: 4 },
  { nodeId: 'c1',  nodeName: 'Pacific Coast Insurance Group', nodeType: 'agency', depth: 2, parentName: 'West Region',      memberCount: 42, ytdPremium: 28600000, ytdTarget: 26000000, achievementRate: 1.100, ytdCommission: 3432000, newPolicies: 1820, renewedPolicies: 5100, renewalRate: 0.888, lossRatio: 0.591, activePolicies: 6920, avgPremiumPerMember: 680952, topAgent: 'Ryan Chen', topAgentPremium: 3100000, rank: 1 },
  { nodeId: 'c2',  nodeName: 'Lone Star Brokerage',           nodeType: 'agency', depth: 2, parentName: 'South Region',      memberCount: 38, ytdPremium: 22100000, ytdTarget: 20000000, achievementRate: 1.105, ytdCommission: 2652000, newPolicies: 1240, renewedPolicies: 4020, renewalRate: 0.876, lossRatio: 0.584, activePolicies: 5260, avgPremiumPerMember: 581579, topAgent: 'Maria Garza', topAgentPremium: 2100000, rank: 2 },
  { nodeId: 'c5',  nodeName: 'Sunshine State Brokers',        nodeType: 'agency', depth: 2, parentName: 'South Region',      memberCount: 31, ytdPremium: 18400000, ytdTarget: 20000000, achievementRate: 0.920, ytdCommission: 2208000, newPolicies: 980, renewedPolicies: 3200, renewalRate: 0.852, lossRatio: 0.658, activePolicies: 4180, avgPremiumPerMember: 593548, topAgent: 'Carlos Martinez', topAgentPremium: 1800000, rank: 5 },
  { nodeId: 'c4',  nodeName: 'Empire State Insurance Services', nodeType: 'agency', depth: 2, parentName: 'Northeast Region', memberCount: 27, ytdPremium: 16800000, ytdTarget: 15000000, achievementRate: 1.120, ytdCommission: 2016000, newPolicies: 1020, renewedPolicies: 3100, renewalRate: 0.869, lossRatio: 0.621, activePolicies: 4120, avgPremiumPerMember: 622222, topAgent: 'Emily Johnson', topAgentPremium: 2800000, rank: 3 },
  { nodeId: 'c3',  nodeName: 'Great Lakes Insurance Partners',  nodeType: 'agency', depth: 2, parentName: 'Midwest Region',   memberCount: 22, ytdPremium: 10200000, ytdTarget: 9800000,  achievementRate: 1.041, ytdCommission: 1224000, newPolicies: 620, renewedPolicies: 2180, renewalRate: 0.912, lossRatio: 0.568, activePolicies: 2800, avgPremiumPerMember: 463636, topAgent: 'Michael Wu', topAgentPremium: 1900000, rank: 4 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

// Label values are i18n keys (channel namespace), translated via t() at render time
export const NODE_TYPE_LABEL: Record<NodeType, string> = {
  platform: 'hierarchy.nodeType.platform', region: 'hierarchy.nodeType.region', agency: 'hierarchy.nodeType.agency', branch: 'hierarchy.nodeType.branch', agent: 'hierarchy.nodeType.agent', 'sub-agent': 'hierarchy.nodeType.sub-agent',
}
export const NODE_TYPE_COLOR: Record<NodeType, string> = {
  platform: '#0058BC', region: '#7B3FCA', agency: '#34C759', branch: '#FF9F0A', agent: '#60CDFF', 'sub-agent': '#A0A5B1',
}
export const STATUS_STYLE: Record<NodeStatus, { bg: string; color: string; label: string }> = {
  active:    { bg: 'rgba(52,199,89,0.12)',   color: '#1E8033', label: 'hierarchy.status.active' },
  inactive:  { bg: 'rgba(180,180,180,0.15)', color: '#717786', label: 'hierarchy.status.inactive' },
  suspended: { bg: 'rgba(255,59,48,0.12)',   color: '#C0392B', label: 'hierarchy.status.suspended' },
  pending:   { bg: 'rgba(255,159,10,0.12)',  color: '#B06000', label: 'hierarchy.status.pending' },
}
export const CHANGE_TYPE_LABEL: Record<ChangeType, string> = {
  'add-relation': 'hierarchy.changeType.add-relation', 'move-parent': 'hierarchy.changeType.move-parent', 'add-parent': 'hierarchy.changeType.add-parent',
  'remove-parent': 'hierarchy.changeType.remove-parent', terminate: 'hierarchy.changeType.terminate', 'adjust-share': 'hierarchy.changeType.adjust-share',
}

// Build children map for tree rendering
export function buildChildrenMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  channelNodes.forEach(n => {
    ;(n.parentIds[0] ? [n.parentIds[0]] : []).forEach(pid => {
      if (!map[pid]) map[pid] = []
      map[pid].push(n.id)
    })
  })
  return map
}

export function getNodeById(id: string): ChannelNode | undefined {
  return channelNodes.find(n => n.id === id)
}
