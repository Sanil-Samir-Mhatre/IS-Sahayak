export type DataProvenance = 'SYNTHETIC' | 'CURATED' | 'REAL';
export type DataMode = 'SEED_ONLY' | 'REAL_ONLY' | 'COMBINED';
export type UserRole = 'officer' | 'reviewer' | 'admin';
export type StandardStatus = 'current' | 'superseded' | 'withdrawn';
export type ReferenceRole = 'test_method' | 'terminology' | 'safety' | 'installation' | 'related_product' | 'other';
export type RoleSource = 'curated' | 'rule' | 'model';
export type CertScheme = 'BIS_Product_Certification' | 'CRS' | 'Hallmarking' | 'None';
export type LanguageCode = 'en' | 'hi' | 'hinglish';
export type QueryType = 'clean' | 'messy' | 'tender_line' | 'adversarial';
export type RetrievalMode = 'bm25' | 'dense' | 'hybrid_rrf' | 'hybrid_rerank' | 'learned_fusion';
export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCALIBRATED_MEDIUM' | 'UNCALIBRATED_LOW';
export type AuditStatus = 'OK' | 'OUTDATED' | 'MISSING' | 'MISMATCH' | 'UNKNOWN_ID';

export interface StandardRecord {
  is_id: string;
  part: string;
  year: number;
  title: string;
  scope_text: string;
  ics_code: string;
  sector: string;
  status: StandardStatus;
  superseded_by: string;
  latest_amendment_no: number;
  amendment_year: number | null;
  source_url: string;
  data_provenance: DataProvenance;
  family: string;
  extra_columns?: Record<string, string>;
}

export interface ReferenceRecord {
  from_is: string;
  to_is: string;
  role: ReferenceRole;
  role_source: RoleSource;
  context_text: string;
  data_provenance: DataProvenance;
}

export interface CertificationRuleRecord {
  rule_id: string;
  applies_to: string; // "IS:<id>" or "ICS:<code>"
  scheme: CertScheme;
  legal_basis: string;
  effective_from: string;
  source_url: string;
  verified_on: string;
  notes: string;
  data_provenance: DataProvenance;
}

export interface GoldQueryRecord {
  qid: string;
  query_text: string;
  language: LanguageCode;
  query_type: QueryType;
  gold_primary_is: string[];
  gold_allied_is: string[];
  expect_abstain: boolean;
  annotator_a: string;
  annotator_b: string;
  split: 'train' | 'val' | 'test';
  data_provenance: DataProvenance;
  family: string;
  notes: string;
}

export interface GlossaryRecord {
  term: string;
  language: LanguageCode;
  standard_term: string;
}

export interface PlantedDefectRecord {
  tender_file: string;
  line_no: number;
  item_text_prefix: string;
  cited_is: string;
  expected_status: AuditStatus;
  expected_primary_is: string;
  defect_detail: string;
}

export interface ValidationIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  category: 'SCHEMA' | 'DUPLICATE' | 'ORPHAN_REFERENCE' | 'SUPERSESSION_CYCLE' | 'WITHDRAWN_NO_SUCCESSOR' | 'CERT_FUTURE_DATE' | 'CERT_STALE_DATE';
  entity_id: string;
  message: string;
  details: string;
}

export interface NormalizedIsId {
  raw: string;
  is_synthetic: boolean;
  number_digits: string;
  base_id: string;           // e.g. "SYN IS 90101" or "IS 1239"
  part: string | null;       // e.g. "Part 1"
  year: number | null;       // e.g. 2018
  canonical_id: string;      // e.g. "SYN IS 90101 (Part 1) : 2018" or "SYN IS 90101"
  canonical_with_part: string; // e.g. "SYN IS 90101 (Part 1)" or "SYN IS 90101"
}

export interface ExtractedCitation {
  raw_span: string;
  start: number;
  end: number;
  normalized: NormalizedIsId;
  exists_in_registry: boolean;
}

export interface ExtractedAttributes {
  product: string[];
  material: string[];
  grade: string[];
  size_units: string[];
  application: string[];
  quantity: string[];
}

export interface GlossaryExpansionMatch {
  source_term: string;
  language: LanguageCode;
  expanded_term: string;
  match_type: 'exact' | 'fuzzy';
  similarity: number;
}

export interface ClarifyingOption {
  label: string;
  attribute_key: keyof ExtractedAttributes;
  attribute_value: string;
  matching_is_ids: string[];
}

export interface ClarifyingQuestion {
  triggered: boolean;
  reason: string;
  selected_attribute: keyof ExtractedAttributes;
  information_gain_bits: number;
  question_text: string;
  question_text_hi: string;
  options: ClarifyingOption[];
}

export interface ParsedQuery {
  raw_query: string;
  normalized_query: string;
  expanded_query: string;
  language: LanguageCode;
  language_confidence: number;
  devanagari_ratio: number;
  hinglish_markers: string[];
  glossary_matches: GlossaryExpansionMatch[];
  attributes: ExtractedAttributes;
  cited_standards: ExtractedCitation[];
  is_ambiguous: boolean;
  ambiguity_reasons: string[];
  clarifying_question: ClarifyingQuestion | null;
  applied_clarification?: string;
}

export interface VersionResolution {
  input_is_id: string;
  resolved_is_id: string;
  status: StandardStatus;
  chain: string[];
  hop_count: number;
  cycle_detected: boolean;
  withdrawn_without_successor: boolean;
  latest_amendment_no: number;
  amendment_year: number | null;
  warning: string | null;
}

export interface CertificationResolution {
  is_id: string;
  matched: boolean;
  match_level: 'EXACT_IS' | 'ICS_CODE' | 'NONE';
  rule_id: string | null;
  scheme: CertScheme | null;
  status_label: string; // e.g. "no rule found in our table" or "BIS_Product_Certification (Mandatory ISI Mark)"
  legal_basis: string | null;
  effective_from: string | null;
  source_url: string | null;
  verified_on: string | null;
  is_stale: boolean;
  stale_days: number | null;
  ignored_future_rules: string[];
  warnings: string[];
}

export interface ClauseEvidence {
  best_en_sentence: string;
  best_hi_sentence: string;
  highlighted_terms: string[];
  matched_attributes: string[];
  score_breakdown: {
    bm25_norm: number;
    dense_norm: number;
    rrf_score: number;
    rerank_score: number;
    learned_fusion_score: number;
    exact_id_boost: number;
    scope_fit_delta: number;
    final_score: number;
  };
  scope_fit_notes: string[];
}

export interface PrimaryRecommendation {
  rank: number;
  is_id: string;
  part: string;
  year: number;
  title: string;
  ics_code: string;
  sector: string;
  family: string;
  final_score: number;
  version_guard: VersionResolution;
  certification: CertificationResolution;
  evidence: ClauseEvidence;
  all_parts_in_family: string[];
  source_url: string;
  data_provenance: DataProvenance;
}

export interface AlliedRecommendation {
  is_id: string;
  title: string;
  year: number;
  role: ReferenceRole;
  role_source: RoleSource;
  from_primary_is: string;
  depth: number;
  allied_score: number;
  justification_path: string;
  context_clause: string;
  version_guard: VersionResolution;
}

export interface CompletenessItem {
  key: string;
  label: string;
  weight: number;
  satisfied: boolean;
  earned: number;
  detail: string;
}

export interface CompletenessReport {
  score_pct: number;
  items: CompletenessItem[];
  gaps: string[];
}

export interface ConfidenceReport {
  calibrated: boolean;
  probability: number;
  tier: ConfidenceTier;
  abstained: boolean;
  abstention_reason: string | null;
  features: {
    top1_score: number;
    top1_top2_margin: number;
    attribute_match_fraction: number;
    status_validity: number;
    ambiguity_penalty: number;
    graph_support: number;
  };
}

export interface BlockedCitationEntry {
  timestamp: string;
  trace_id: string;
  query: string;
  blocked_id: string;
  source_stage: 'QUERY_CITATION' | 'GRAPH_ORPHAN' | 'DEBUG_INJECTION' | 'CANDIDATE_GATE';
  reason: string;
}

export interface ModuleStepTrace {
  module_id: string;
  module_name: string;
  duration_ms: number;
  input_summary: string;
  output_summary: string;
  warnings: string[];
  details: Record<string, unknown>;
}

export interface PipelineTrace {
  trace_id: string;
  timestamp: string;
  seed: number;
  registry_version: string;
  model_version: string;
  active_ranker: RetrievalMode;
  honest_ranker_label: string;
  data_mode: DataMode;
  total_duration_ms: number;
  steps: ModuleStepTrace[];
}

export interface StandardsBundle {
  schema_version: string;
  trace_id: string;
  registry_version: string;
  model_version: string;
  active_ranker: RetrievalMode;
  honest_ranker_label: string;
  parsed_query: ParsedQuery;
  primary_standards: PrimaryRecommendation[];
  allied_standards: AlliedRecommendation[];
  completeness: CompletenessReport;
  confidence: ConfidenceReport;
  blocked_ids: BlockedCitationEntry[];
  provenance: {
    data_label: DataProvenance;
    synthetic_warning: string | null;
    generated_at: string;
  };
}

export interface TenderAuditLineResult {
  line_no: number;
  raw_text: string;
  extracted_citations: ExtractedCitation[];
  cited_is_raw: string | null;
  cited_is_canonical: string | null;
  audit_status: AuditStatus;
  recommended_primary: PrimaryRecommendation | null;
  version_resolution: VersionResolution | null;
  certification: CertificationResolution | null;
  finding_summary: string;
  remediation_advice: string;
  trace_id: string;
}

export interface TenderAuditReport {
  audit_id: string;
  filename: string;
  timestamp: string;
  registry_version: string;
  total_lines: number;
  counts: Record<AuditStatus, number>;
  lines: TenderAuditLineResult[];
}

export interface AuditLogRow {
  id: number;
  timestamp: string;
  actor_role: UserRole;
  action_type: 'ACCEPT' | 'REJECT' | 'OVERRIDE' | 'BLOCK_FAKE_ID' | 'SIMULATE_REVISION' | 'TENDER_AUDIT' | 'IMMUTABILITY_TEST_BLOCKED';
  query_or_context: string;
  recommended_is: string;
  override_is: string | null;
  mandatory_reason: string;
  registry_version: string;
  flagged_hard_negative: boolean;
  flagged_gold_candidate: boolean;
}

export interface SavedWatchSpec {
  spec_id: string;
  title: string;
  owner_role: UserRole;
  query_text: string;
  primary_is_ids: string[];
  allied_is_ids: string[];
  saved_registry_version: string;
  created_at: string;
  affected_by_changelog_ids: string[];
}

export interface RegistryChangelogEntry {
  changelog_id: string;
  timestamp: string;
  actor_role: UserRole;
  is_id: string;
  field_changed: 'status' | 'superseded_by' | 'latest_amendment_no';
  old_value: string;
  new_value: string;
  old_registry_version: string;
  new_registry_version: string;
  reason: string;
}
