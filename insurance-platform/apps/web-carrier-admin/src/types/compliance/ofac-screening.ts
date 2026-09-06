/**
 * OFAC Screening Type Definitions
 * Based on UI-V1.2 design specification for compliance module
 * OFAC (Office of Foreign Assets Control) - US Treasury Department Sanctions
 */

// OFAC screening result status
export type OFACResult = 'clear' | 'watchlist' | 'blocked' | 'pending';

// Entity types for OFAC screening
export type OFACEntityType = 'Individual' | 'Company' | 'Vessel' | 'Aircraft';

// Sanction list sources
export type SanctionListSource = 
  | 'SDN'           // Specially Designated Nationals List
  | 'CONSOLIDATED'  // Consolidated Sanctions List
  | 'SDGT'          // Global Terrorism Sanctions
  | 'IRAN'          // Iran Sanctions
  | 'CYBER2'        // Cyber-related Sanctions
  | 'FOREIGN SANCTIONS MAGNITSKY ACT' // Magnitsky Sanctions
  | 'SSI'           // Sectoral Sanctions Identification List
  | 'NONSDN'        // Non-SDN List
  | 'PLC';          // Palestinian Legislative Council

// Match score categories
export type MatchScoreLevel = 'low' | 'medium' | 'high' | 'exact';

// OFAC Screening record
export interface OFACScreening {
  id: string;                          // Screening ID (e.g., 'of1', 'of2')
  timestamp: string;                   // ISO datetime when screening performed
  entityName: string;                  // Name of the entity being screened
  entityType: OFACEntityType;          // Individual, Company, Vessel, Aircraft
  country?: string[];                    // Country/Nationality (can be multiple)
  dateOfBirth?: string;                // DOB for individuals
  dateRegistered?: string;             // Registration date for companies
  identificationNumber?: string;       // Passport number, Tax ID, etc.
  address?: string;                    // Physical address
  screenedBy: string;                  // "System Auto" or human reviewer name
  result: OFACResult;                  // clear/watchlist/blocked/pending
  matchScore?: number;                 // Similarity score (0-100)
  matchScoreLevel?: MatchScoreLevel;   // Categorized match level
  matchedEntry?: string;               // Matched entry name from sanction list
  matchedList?: SanctionListSource;    // Which sanctions list it matched
  program?: string[];                  // Sanctions program names
  policyId?: string;                   // Related policy ID if any
  reviewedBy?: string;                 // Human reviewer name if manually reviewed
  reviewNote?: string;                 // Review notes/reasoning
  overrideApproved?: boolean;          // If override was approved
  reviewDate?: string;                 // Date of manual review
}

// Sanction match details
export interface SanctionMatch {
  id: string;                          // Match ID (e.g., 'match1', 'match2')
  screeningId: string;                 // Parent screening ID
  sourceList: SanctionListSource;      // Source sanctions list
  matchedName: string;                 // Name on sanctions list
  alias?: string[];                    // Alternative names
  program: string[];                   // Sanctions program
  score: number;                       // Similarity score (0-100)
  scoreLevel: MatchScoreLevel;         // Categorized level
  attributes: {
    name: string;
    dob?: string;                     // Date of birth
    idNumber?: string;                 // ID number (passport, SSN, Tax ID)
    nationality?: string[];            // Nationality/citizenship
    address?: string;                  // Address
    companyType?: string;              // LLC, Corp, etc. for companies
    registrationPlace?: string;        // Place of incorporation
    dateRegistered?: string;           // Registration date for companies
    vesselFlag?: string;               // Ship flag for vessels
    imoNumber?: string;                // IMO number for ships
  };
  additionalInfo?: string;             // Additional description
  effectiveDate?: string;              // When sanctions were imposed
  expirationDate?: string;             // When sanctions expire
}

// Match review decision
export type MatchReviewDecision = 'false-positive' | 'true-positive' | 'needs-investigation';

export interface MatchReview {
  id: string;                          // Review ID
  screeningId: string;                 // Screening ID being reviewed
  matchId: string;                     // Specific match being reviewed
  decision: MatchReviewDecision;       // false-positive / true-positive / needs-investigation
  reviewerName: string;                // Name of person conducting review
  reviewDate: string;                  // ISO datetime of review
  reasoning: string;                   // Detailed reasoning for decision
  supportingEvidence?: string[];       // Supporting documents/notes
  approvalChain?: string[];            // Approvers in chain (for true-positive)
  createdAt: string;                   // Creation timestamp
  updatedAt?: string;                  // Last update timestamp
}

// Filter parameters for OFAC screenings
export interface OFACFilter {
  search?: string;              // Search keyword (entity name)
  country?: string[];           // Filter by country/nationality
  result?: OFACResult;          // Filter by result status
  entityType?: OFACEntityType;  // Filter by entity type
  dateFrom?: string;            // Start date (YYYY-MM-DD)
  dateTo?: string;              // End date (YYYY-MM-DD)
  listSource?: SanctionListSource[]; // Filter by sanctions list source
  matchScoreMin?: number;       // Minimum match score
  matchScoreMax?: number;       // Maximum match score
}

// Sort options
export interface OFACSort {
  field: 'timestamp' | 'entityName' | 'result' | 'matchScore' | 'country';
  order: 'asc' | 'desc';
}

// Pagination params
export interface OFACPagination {
  page: number;
  pageSize: number;
  total?: number;
}

// Combined query params
export interface OFACQueryParams extends OFACFilter, OFACSort, OFACPagination {}

// Statistics for OFAC dashboard
export interface OFACStats {
  totalScreenings: number;
  clearCount: number;
  watchlistCount: number;
  blockedCount: number;
  pendingCount: number;
  reviewRequiredCount: number;
  avgMatchScore: number;
  topMatchedLists: Array<{
    listName: SanctionListSource;
    count: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    screenings: number;
    blocks: number;
    reviews: number;
  }>;
}

// Helper function to calculate match score level
export function getMatchScoreLevel(score: number): MatchScoreLevel {
  if (score >= 95) return 'exact';
  if (score >= 85) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

// Helper function to format OFAC result label
export function formatOFACResult(result: OFACResult): { label: string; badgeClass: string } {
  const labels: Record<OFACResult, { label: string; badgeClass: string }> = {
    clear: { label: '通过 (Clear)', badgeClass: 'badge-green' },
    watchlist: { label: '预警 (Watchlist)', badgeClass: 'badge-orange' },
    blocked: { label: '阻断 (Blocked)', badgeClass: 'badge-red' },
    pending: { label: '待筛查 (Pending)', badgeClass: 'badge-gray' },
  };
  return labels[result];
}

// Helper function to determine action needed based on result
export function getRequiredAction(result: OFACResult): string | null {
  switch (result) {
    case 'clear':
      return null; // No action needed
    case 'watchlist':
      return 'manual-review'; // Requires manual review
    case 'blocked':
      return 'block-and-report'; // Must block and file report
    case 'pending':
      return 'screening-required'; // Initial screening required
    default:
      return null;
  }
}
