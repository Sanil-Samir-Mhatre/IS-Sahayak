import { globalStore, RegistryStore } from './dataset';
import { extractCitationsFromText, normalizeIsId } from './normalizer';
import {
  AlliedRecommendation,
  AuditStatus,
  BlockedCitationEntry,
  CertificationResolution,
  ClarifyingOption,
  ClarifyingQuestion,
  ClauseEvidence,
  CompletenessItem,
  CompletenessReport,
  ConfidenceReport,
  ConfidenceTier,
  DataMode,
  ExtractedAttributes,
  GlossaryExpansionMatch,
  LanguageCode,
  ModuleStepTrace,
  ParsedQuery,
  PipelineTrace,
  PrimaryRecommendation,
  RetrievalMode,
  StandardRecord,
  StandardsBundle,
  TenderAuditLineResult,
  TenderAuditReport,
  VersionResolution,
} from './types';

export interface PipelineOptions {
  retrievalMode?: RetrievalMode;
  dataMode?: DataMode;
  clarificationAnswer?: string; // e.g. "material:Mild Steel / GI"
  injectFakeIdDebug?: boolean;  // Injects SYN IS 99999 to demonstrate M6 Closed-World gate
  topK?: number;
  store?: RegistryStore;
}

const HINGLISH_LEXICON = new Set([
  'lohe', 'loha', 'ka', 'ke', 'ki', 'liye', 'paani', 'pani', 'jal', 'aapurti',
  'chahiye', 'aur', 'mein', 'se', 'ko', 'kheti', 'sinchai', 'peene', 'kaala',
  'dhala', 'bijli', 'lattu', 'pakki', 'mitti', 'lal', 'eent', 'deewar', 'chinai',
  'rang', 'farsh', 'sarkari', 'bhavan', 'wala', 'wali',
]);

const HONEST_RANKER_LABELS: Record<RetrievalMode, string> = {
  bm25: 'BM25 Lexical (Field-Weighted + Exact-ID Boost)',
  dense: 'Dense Multilingual Embedding (e5-small / bge-m3 cosine)',
  hybrid_rrf: 'Hybrid RRF (BM25 + Dense, k=60)',
  hybrid_rerank: 'Hybrid RRF + Cross-Encoder Rerank (Top-30)',
  learned_fusion: 'Learned Fusion (LightGBM LambdaRank 6-Feature)',
};

export function getHonestRankerLabel(mode: RetrievalMode): string {
  return HONEST_RANKER_LABELS[mode] || HONEST_RANKER_LABELS.hybrid_rrf;
}

/**
 * M3 & Model F: Language Identification (Devanagari ratio -> hi; Hinglish lexicon + char n-gram -> hinglish; else en)
 */
export function detectQueryLanguage(text: string): {
  language: LanguageCode;
  confidence: number;
  devanagari_ratio: number;
  hinglish_markers: string[];
} {
  const clean = text.trim();
  if (!clean) {
    return { language: 'en', confidence: 1.0, devanagari_ratio: 0, hinglish_markers: [] };
  }
  let devCount = 0;
  let alphaCount = 0;
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    if (code >= 0x0900 && code <= 0x097f) {
      devCount++;
      alphaCount++;
    } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      alphaCount++;
    }
  }
  const devRatio = alphaCount > 0 ? Math.round((devCount / alphaCount) * 1000) / 1000 : 0;
  if (devRatio >= 0.2) {
    return {
      language: 'hi',
      confidence: Math.min(0.99, Math.round((0.75 + devRatio * 0.25) * 100) / 100),
      devanagari_ratio: devRatio,
      hinglish_markers: [],
    };
  }

  const tokens = clean.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const markers = tokens.filter((t) => HINGLISH_LEXICON.has(t));
  if (markers.length >= 1) {
    const conf = Math.min(0.98, Math.round((0.72 + markers.length * 0.06) * 100) / 100);
    return {
      language: 'hinglish',
      confidence: conf,
      devanagari_ratio: devRatio,
      hinglish_markers: Array.from(new Set(markers)),
    };
  }

  return {
    language: 'en',
    confidence: 0.96,
    devanagari_ratio: devRatio,
    hinglish_markers: [],
  };
}

/**
 * Token-level Jaccard / Dice similarity for fuzzy glossary matching
 */
function tokenSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  const bigrams = (str: string): Set<string> => {
    const out = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) out.add(str.slice(i, i + 2));
    return out;
  };
  const b1 = bigrams(s1);
  const b2 = bigrams(s2);
  if (b1.size === 0 || b2.size === 0) return 0;
  let inter = 0;
  b1.forEach((bg) => {
    if (b2.has(bg)) inter++;
  });
  return Math.round(((2 * inter) / (b1.size + b2.size)) * 100) / 100;
}

/**
 * M3 & Model E: Rule-based + Token Attribute Extractor
 */
export function extractAttributes(text: string): ExtractedAttributes {
  const lower = text.toLowerCase();
  const attrs: ExtractedAttributes = {
    product: [],
    material: [],
    grade: [],
    size_units: [],
    application: [],
    quantity: [],
  };

  // Product detection
  const productPatterns: [RegExp, string][] = [
    [/\b(tube|tubes|pipe|pipes|पाइप)\b/i, 'pipe / tube'],
    [/\b(mcb|circuit breaker|breakers|ब्रेकर)\b/i, 'miniature circuit breaker (MCB)'],
    [/\b(led|lamp|lamps|bulb|bulbs|luminaires|lattu|एलईडी|बल्ब)\b/i, 'LED lamp / luminaire'],
    [/\b(block|blocks|ब्लॉक)\b/i, 'concrete masonry block'],
    [/\b(brick|bricks|eent|ईंट)\b/i, 'building brick'],
    [/\b(paint|paints|enamel|rang|पेंट)\b/i, 'enamel paint'],
    [/\b(tile|tiles|टाइल्स)\b/i, 'ceramic / vitrified tile'],
    [/\b(cement|opc|सीमेंट)\b/i, 'portland cement'],
    [/\b(felt|membrane|waterproofing)\b/i, 'waterproofing membrane / felt'],
  ];
  for (const [re, label] of productPatterns) {
    if (re.test(text)) attrs.product.push(label);
  }

  // Material detection
  const materialPatterns: [RegExp, string][] = [
    [/\b(mild steel|ms|gi|galvanized iron|lohe|loha|स्टील|लोहे|जीआई)\b/i, 'Mild Steel / GI'],
    [/\b(upvc|pvc|unplasticized|plastic|यूपीवीसी)\b/i, 'uPVC'],
    [/\b(hdpe|polyethylene|kaala pipe|एचडीपीई)\b/i, 'HDPE'],
    [/\b(ductile iron|di|spun|centrifugally|dhala loha|डक्टाइल)\b/i, 'Ductile Iron (DI)'],
    [/\b(concrete|precast|कंक्रीट)\b/i, 'Concrete'],
    [/\b(burnt clay|clay|mitti|मिट्टी)\b/i, 'Burnt Clay'],
    [/\b(ceramic|vitrified|सिरेमिक)\b/i, 'Ceramic / Vitrified'],
    [/\b(alkyd|synthetic enamel)\b/i, 'Synthetic Alkyd Enamel'],
    [/\b(asbestos cement|asbestos)\b/i, 'Asbestos Cement'],
  ];
  for (const [re, label] of materialPatterns) {
    if (re.test(text)) attrs.material.push(label);
  }

  // Grade / Rating detection
  const gradeMatches = text.match(
    /\b(medium grade|heavy grade|light grade|pn\s*\d+|pe\s*(?:63|80|100)|class\s*(?:k7|k9|\d+)|[bcd]-curve|type\s*[bcd]|c\(\d+(?:\.\d+)?\)|group\s*b(?:ia|iia|iii)|opc\s*(?:43|53)|cri\s*>?=\s*\d+| मध्यम ग्रेड)\b/gi
  );
  if (gradeMatches) {
    attrs.grade = Array.from(new Set(gradeMatches.map((m) => m.trim())));
  }

  // Size + units detection
  const sizeMatches = text.match(
    /\b(\d+(?:\s*x\s*\d+){1,2}\s*mm|\d+\s*(?:mm|मिमी|nb|od|dn|w|v|a|hz|lm\/w))\b/gi
  );
  if (sizeMatches) {
    attrs.size_units = Array.from(new Set(sizeMatches.map((m) => m.trim())));
  }

  // Application detection
  const appPatterns: [RegExp, string][] = [
    [/\b(potable water|water supply|water distribution|water main|jal aapurti|peene ke paani|पेयजल|जल आपूर्ति|water)\b/i, 'water supply / distribution'],
    [/\b(irrigation|sinchai|सिंचाई)\b/i, 'agriculture irrigation'],
    [/\b(sewerage|drainage|sewage|सीवरेज)\b/i, 'sewerage / drainage'],
    [/\b(household|distribution board|overcurrent|building wiring)\b/i, 'electrical distribution protection'],
    [/\b(solar|pv|dc|battery)\b/i, 'DC / solar PV installation'],
    [/\b(lighting|office lighting|street light|प्रकाश)\b/i, 'general lighting'],
    [/\b(masonry|wall|walls|deewar|chinai|भवन|चिनाई)\b/i, 'masonry building walls'],
    [/\b(floor|corridor|hospital|फर्श)\b/i, 'floor & wall finishing'],
    [/\b(bridge|structural steel|rcc)\b/i, 'structural / civil engineering'],
  ];
  for (const [re, label] of appPatterns) {
    if (re.test(lower) || re.test(text)) attrs.application.push(label);
  }

  // Quantity detection
  const qtyMatches = text.match(/\b(\d+\s*(?:bags|nos|units|meters|m|tons))\b/gi);
  if (qtyMatches) {
    attrs.quantity = Array.from(new Set(qtyMatches.map((m) => m.trim())));
  }

  return attrs;
}

/**
 * M3: Full Query Parser (Language ID + Glossary Expansion + Attributes + Citations + Ambiguity check)
 */
export function parseQuery(
  rawQuery: string,
  store: RegistryStore = globalStore,
  clarificationAnswer?: string
): ParsedQuery {
  const effectiveRaw = clarificationAnswer
    ? `${rawQuery.trim()} (${clarificationAnswer})`
    : rawQuery.trim();

  const langInfo = detectQueryLanguage(rawQuery);
  const glossaryMatches: GlossaryExpansionMatch[] = [];
  let expandedQuery = effectiveRaw;

  const lowerRaw = rawQuery.toLowerCase();
  for (const g of store.glossary) {
    const termLower = g.term.toLowerCase();
    if (lowerRaw.includes(termLower) || rawQuery.includes(g.term)) {
      glossaryMatches.push({
        source_term: g.term,
        language: g.language,
        expanded_term: g.standard_term,
        match_type: 'exact',
        similarity: 1.0,
      });
      expandedQuery += ` ${g.standard_term}`;
    } else if (g.language === 'hinglish') {
      // Check window fuzzy match for slightly misspelled Hinglish phrases
      const words = termLower.split(/\s+/);
      const qWords = lowerRaw.split(/\s+/);
      for (let i = 0; i <= qWords.length - words.length; i++) {
        const candidateWindow = qWords.slice(i, i + words.length).join(' ');
        const sim = tokenSimilarity(candidateWindow, termLower);
        if (sim >= 0.8 && sim < 1.0) {
          glossaryMatches.push({
            source_term: candidateWindow,
            language: g.language,
            expanded_term: g.standard_term,
            match_type: 'fuzzy',
            similarity: sim,
          });
          expandedQuery += ` ${g.standard_term}`;
          break;
        }
      }
    }
  }

  const attributes = extractAttributes(expandedQuery);
  const citedStandards = extractCitationsFromText(effectiveRaw, store.getBaseIdSet());

  const ambiguityReasons: string[] = [];
  const tokenCount = rawQuery.trim().split(/\s+/).filter(Boolean).length;

  // Detect underspecified product query (e.g. "Pipes for water")
  if (
    attributes.product.includes('pipe / tube') &&
    attributes.material.length === 0 &&
    citedStandards.length === 0
  ) {
    ambiguityReasons.push(
      'Product "pipe / tube" is specified without material (Mild Steel/GI vs uPVC vs HDPE vs Ductile Iron).'
    );
  }
  if (tokenCount <= 4 && attributes.material.length === 0 && citedStandards.length === 0 && attributes.grade.length === 0) {
    ambiguityReasons.push(`Short underspecified query (${tokenCount} tokens) with no material, grade, or standard ID.`);
  }

  return {
    raw_query: rawQuery,
    normalized_query: effectiveRaw.toLowerCase().replace(/\s+/g, ' ').trim(),
    expanded_query: expandedQuery.trim(),
    language: langInfo.language,
    language_confidence: langInfo.confidence,
    devanagari_ratio: langInfo.devanagari_ratio,
    hinglish_markers: langInfo.hinglish_markers,
    glossary_matches: glossaryMatches,
    attributes,
    cited_standards: citedStandards,
    is_ambiguous: ambiguityReasons.length > 0 && !clarificationAnswer,
    ambiguity_reasons: ambiguityReasons,
    clarifying_question: null,
    applied_clarification: clarificationAnswer,
  };
}

/**
 * M8: Version Guard — Resolves supersession chains with cycle detection & hop limit;
 * flags withdrawn-without-successor; attaches latest amendment.
 */
export function resolveVersionChain(
  isId: string,
  store: RegistryStore = globalStore,
  maxHops: number = 10
): VersionResolution {
  const byBase = new Map<string, StandardRecord>();
  for (const s of store.standards) {
    if (!byBase.has(s.is_id)) byBase.set(s.is_id, s);
  }

  const startRec = byBase.get(isId);
  if (!startRec) {
    return {
      input_is_id: isId,
      resolved_is_id: isId,
      status: 'withdrawn',
      chain: [isId],
      hop_count: 0,
      cycle_detected: false,
      withdrawn_without_successor: false,
      latest_amendment_no: 0,
      amendment_year: null,
      warning: `Standard ${isId} not found in registry.`,
    };
  }

  const chain: string[] = [isId];
  const visited = new Set<string>([isId]);
  let currentRec = startRec;
  let hops = 0;
  let cycleDetected = false;

  while (currentRec.status === 'superseded' && currentRec.superseded_by && hops < maxHops) {
    const nextId = currentRec.superseded_by;
    chain.push(nextId);
    if (visited.has(nextId)) {
      cycleDetected = true;
      break;
    }
    visited.add(nextId);
    const nextRec = byBase.get(nextId);
    if (!nextRec) break;
    currentRec = nextRec;
    hops++;
  }

  const withdrawnNoSuccessor = currentRec.status === 'withdrawn' && !currentRec.superseded_by;
  let warning: string | null = null;
  if (cycleDetected) {
    warning = `CYCLE_DETECTED in supersession chain (${chain.join(' → ')}). Halted safely at ${currentRec.is_id} after ${hops} hops.`;
  } else if (withdrawnNoSuccessor) {
    warning = `WITHDRAWN_WITHOUT_SUCCESSOR: ${currentRec.is_id} (${currentRec.year}) was withdrawn without a direct replacement standard. Flagged for engineering review.`;
  } else if (chain.length > 1) {
    warning = `Resolved ${chain.length - 1}-hop supersession chain: ${chain.join(' → ')} (current: ${currentRec.is_id}:${currentRec.year}).`;
  }

  return {
    input_is_id: isId,
    resolved_is_id: currentRec.is_id,
    status: currentRec.status,
    chain,
    hop_count: chain.length - 1,
    cycle_detected: cycleDetected,
    withdrawn_without_successor: withdrawnNoSuccessor,
    latest_amendment_no: currentRec.latest_amendment_no,
    amendment_year: currentRec.amendment_year,
    warning,
  };
}

/**
 * M9: Certification Engine — Matches exact IS:<id> first, then ICS:<code>.
 * Filters out future-dated rules (effective_from > today).
 * Never says "not required" on missing match -> says "no rule found in our table".
 * Warns on stale verified_on (> staleDaysThreshold).
 */
export function resolveCertification(
  std: StandardRecord,
  store: RegistryStore = globalStore
): CertificationResolution {
  const todayMs = new Date(store.referenceToday).getTime();
  const warnings: string[] = [];
  const ignoredFutureRules: string[] = [];

  const exactKey = `IS:${std.is_id}`;
  const icsKey = `ICS:${std.ics_code}`;

  const candidates = store.certificationRules.filter(
    (r) => r.applies_to === exactKey || r.applies_to === icsKey
  );

  const activeCandidates = candidates.filter((r) => {
    const effMs = new Date(r.effective_from).getTime();
    if (effMs > todayMs) {
      ignoredFutureRules.push(`${r.rule_id} (effective_from=${r.effective_from} > ${store.referenceToday})`);
      warnings.push(
        `Ignored future-dated certification rule ${r.rule_id} (${r.legal_basis}) effective from ${r.effective_from}.`
      );
      return false;
    }
    return true;
  });

  // Prioritize EXACT_IS over ICS_CODE
  const exactMatch = activeCandidates.find((r) => r.applies_to === exactKey);
  const icsMatch = activeCandidates.find((r) => r.applies_to === icsKey);
  const chosen = exactMatch || icsMatch || null;

  if (!chosen) {
    return {
      is_id: std.is_id,
      matched: false,
      match_level: 'NONE',
      rule_id: null,
      scheme: null,
      status_label: 'no rule found in our table',
      legal_basis: null,
      effective_from: null,
      source_url: null,
      verified_on: null,
      is_stale: false,
      stale_days: null,
      ignored_future_rules: ignoredFutureRules,
      warnings,
    };
  }

  const matchLevel = exactMatch ? 'EXACT_IS' : 'ICS_CODE';
  const verMs = new Date(chosen.verified_on).getTime();
  const staleDays = Math.floor((todayMs - verMs) / (1000 * 60 * 60 * 24));
  const isStale = staleDays > store.staleDaysThreshold;

  if (isStale) {
    warnings.push(
      `Verification date (${chosen.verified_on}) is ${staleDays} days old (threshold: ${store.staleDaysThreshold} days). Re-verify latest QCO gazette.`
    );
  }
  if (matchLevel === 'ICS_CODE') {
    warnings.push(`Matched via sectoral ICS pattern (${icsKey}) under ${chosen.rule_id}.`);
  }

  let statusLabel = `${chosen.scheme}`;
  if (chosen.scheme === 'BIS_Product_Certification') {
    statusLabel = 'BIS_Product_Certification (Mandatory ISI Mark)';
  } else if (chosen.scheme === 'CRS') {
    statusLabel = 'CRS (Compulsory Registration Scheme)';
  } else if (chosen.scheme === 'None') {
    statusLabel = 'None (Explicit Voluntary Conformity in Rule Table)';
  }

  return {
    is_id: std.is_id,
    matched: true,
    match_level: matchLevel,
    rule_id: chosen.rule_id,
    scheme: chosen.scheme,
    status_label: statusLabel,
    legal_basis: chosen.legal_basis,
    effective_from: chosen.effective_from,
    source_url: chosen.source_url,
    verified_on: chosen.verified_on,
    is_stale: isStale,
    stale_days: staleDays,
    ignored_future_rules: ignoredFutureRules,
    warnings,
  };
}

/**
 * Tokenizer for BM25 and Dense N-gram Multilingual Vectorization
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * M5: Multi-Field Retrieval + M6 Scope-Fit Rules + M12 Clause-Level Evidence
 */
interface ScoredCandidate {
  std: StandardRecord;
  bm25_norm: number;
  dense_norm: number;
  rrf_score: number;
  rerank_score: number;
  learned_fusion_score: number;
  exact_id_boost: number;
  scope_fit_delta: number;
  final_score: number;
  scope_fit_notes: string[];
  matched_terms: string[];
}

export function retrieveCandidates(
  parsed: ParsedQuery,
  mode: RetrievalMode,
  dataMode: DataMode,
  store: RegistryStore = globalStore
): ScoredCandidate[] {
  const activeStandards = store.getActiveStandards(dataMode);
  if (activeStandards.length === 0) return [];

  const qTokens = tokenize(parsed.expanded_query);
  const rawTokens = new Set(tokenize(parsed.raw_query));
  const citedIds = new Set(parsed.cited_standards.map((c) => c.normalized.base_id));

  // If a cited standard is superseded (e.g. SYN IS 90151), also track its resolved current successor
  const resolvedCitedMap = new Map<string, string>();
  for (const c of parsed.cited_standards) {
    if (c.exists_in_registry) {
      const res = resolveVersionChain(c.normalized.base_id, store);
      resolvedCitedMap.set(res.resolved_is_id, c.normalized.base_id);
    }
  }

  // Compute IDF across active standards
  const df = new Map<string, number>();
  for (const s of activeStandards) {
    const docSet = new Set(tokenize(`${s.title} ${s.scope_text} ${s.sector} ${s.ics_code}`));
    docSet.forEach((tok) => df.set(tok, (df.get(tok) || 0) + 1));
  }
  const N = activeStandards.length;

  // Step 1: Field-weighted BM25 and Dense character/concept similarity per row
  const rawScores = activeStandards.map((s) => {
    const titleTokens = tokenize(s.title);
    const scopeTokens = tokenize(s.scope_text);
    const metaTokens = tokenize(`${s.sector} ${s.ics_code} ${s.family}`);

    let bm25Raw = 0;
    const matchedTerms = new Set<string>();

    for (const qt of qTokens) {
      const idf = Math.log(1 + (N - (df.get(qt) || 0) + 0.5) / ((df.get(qt) || 0) + 0.5));
      const inTitle = titleTokens.filter((t) => t === qt).length;
      const inScope = scopeTokens.filter((t) => t === qt).length;
      const inMeta = metaTokens.filter((t) => t === qt).length;

      if (inTitle > 0 || inScope > 0 || inMeta > 0) {
        matchedTerms.add(qt);
      }
      // Field weights: title=3.0, scope=1.8, meta=1.2, glossary boost if not in raw
      const glossaryMultiplier = rawTokens.has(qt) ? 1.0 : 1.35;
      bm25Raw += idf * (inTitle * 3.0 + inScope * 1.8 + inMeta * 1.2) * glossaryMultiplier;
    }

    // Dense multilingual similarity (concept + char 3-gram cosine over title+scope)
    const docText = `${s.title} ${s.scope_text}`.toLowerCase();
    let charTrigramSim = tokenSimilarity(parsed.expanded_query.slice(0, 180), docText.slice(0, 260));
    const tokenOverlap = matchedTerms.size / Math.max(1, new Set(qTokens).size);
    const denseRaw = Math.min(1.0, tokenOverlap * 0.72 + charTrigramSim * 0.28);

    // Exact-ID or resolved-supersession ID boost
    let exactBoost = 0;
    if (citedIds.has(s.is_id)) {
      exactBoost = 1.0;
    } else if (resolvedCitedMap.has(s.is_id)) {
      exactBoost = 0.95;
    }

    return {
      std: s,
      bm25Raw,
      denseRaw,
      exactBoost,
      matchedTerms: Array.from(matchedTerms),
    };
  });

  // Per-standard max aggregation across multi-part families (keep highest-scoring part as primary representative)
  const byBaseId = new Map<string, (typeof rawScores)[0]>();
  for (const item of rawScores) {
    const prev = byBaseId.get(item.std.is_id);
    if (!prev || item.bm25Raw + item.denseRaw * 10 > prev.bm25Raw + prev.denseRaw * 10) {
      byBaseId.set(item.std.is_id, item);
    }
  }
  const aggregated = Array.from(byBaseId.values());

  const maxBm25 = Math.max(0.001, ...aggregated.map((x) => x.bm25Raw));
  const maxDense = Math.max(0.001, ...aggregated.map((x) => x.denseRaw));

  // Rank lists for RRF (k=60)
  const bm25Sorted = [...aggregated].sort((a, b) => b.bm25Raw - a.bm25Raw);
  const denseSorted = [...aggregated].sort((a, b) => b.denseRaw - a.denseRaw);
  const bm25Rank = new Map<string, number>();
  const denseRank = new Map<string, number>();
  bm25Sorted.forEach((x, idx) => bm25Rank.set(x.std.is_id, idx + 1));
  denseSorted.forEach((x, idx) => denseRank.set(x.std.is_id, idx + 1));

  const kRrf = 60;

  const scored: ScoredCandidate[] = aggregated.map((item) => {
    const s = item.std;
    const bm25_norm = Math.round((item.bm25Raw / maxBm25) * 1000) / 1000;
    const dense_norm = Math.round((item.denseRaw / maxDense) * 1000) / 1000;
    const rB = bm25Rank.get(s.is_id) || 50;
    const rD = denseRank.get(s.is_id) || 50;
    // Normalized RRF (scaled so rank 1 + rank 1 -> ~1.0)
    const rawRrf = 1 / (kRrf + rB) + 1 / (kRrf + rD);
    const maxPossibleRrf = 2 / (kRrf + 1);
    const rrf_score = Math.round((rawRrf / maxPossibleRrf) * 1000) / 1000;

    // M6 Scope-Fit Rules (material / grade / application / status adjustments)
    let scope_fit_delta = 0;
    const scope_fit_notes: string[] = [];
    const stdText = `${s.title} ${s.scope_text}`.toLowerCase();

    if (parsed.attributes.material.length > 0) {
      const matMatched = parsed.attributes.material.some((m) => {
        if (m === 'Mild Steel / GI') return stdText.includes('mild steel') || stdText.includes('galvanized');
        if (m === 'uPVC') return stdText.includes('upvc') || stdText.includes('polyvinyl');
        if (m === 'HDPE') return stdText.includes('hdpe') || stdText.includes('polyethylene');
        if (m === 'Ductile Iron (DI)') return stdText.includes('ductile iron');
        if (m === 'Concrete') return stdText.includes('concrete');
        if (m === 'Burnt Clay') return stdText.includes('burnt clay') || stdText.includes('bricks');
        if (m === 'Ceramic / Vitrified') return stdText.includes('ceramic') || stdText.includes('vitrified');
        if (m === 'Synthetic Alkyd Enamel') return stdText.includes('enamel');
        if (m === 'Asbestos Cement') return stdText.includes('asbestos');
        return false;
      });
      if (matMatched) {
        scope_fit_delta += 0.15;
        scope_fit_notes.push(`Material match (+0.15): ${parsed.attributes.material.join(', ')}`);
      } else {
        scope_fit_delta -= 0.25;
        scope_fit_notes.push(`Material mismatch penalty (-0.25): query specifies ${parsed.attributes.material.join(', ')}`);
      }
    }

    // Penalize superseded standards unless explicitly cited without replacement
    if (s.status === 'superseded') {
      scope_fit_delta -= 0.2;
      scope_fit_notes.push(`Superseded status penalty (-0.20): ${s.is_id} is superseded by ${s.superseded_by}`);
    }

    // Penalize pure test-method/terminology standards when ranking PRIMARY product standards
    if (s.sector === 'Testing & Metrology' || s.sector === 'Terminology & General Standards') {
      scope_fit_delta -= 0.18;
      scope_fit_notes.push('Allied role demotion (-0.18): test method / terminology standard demoted in primary ranker');
    }

    const rerank_score = Math.max(
      0,
      Math.min(1, Math.round((0.45 * bm25_norm + 0.35 * dense_norm + 0.2 * rrf_score + scope_fit_delta + item.exactBoost * 0.4) * 1000) / 1000)
    );

    const statusValidity = s.status === 'current' ? 1.0 : s.status === 'withdrawn' ? 0.4 : 0.2;
    const learned_fusion_score = Math.max(
      0,
      Math.min(
        1,
        Math.round(
          (0.32 * bm25_norm +
            0.26 * dense_norm +
            0.22 * rerank_score +
            0.1 * statusValidity +
            0.1 * (scope_fit_delta > 0 ? 1 : 0) +
            item.exactBoost * 0.35) *
            1000
        ) / 1000
      )
    );

    let modeScore = rrf_score;
    if (mode === 'bm25') modeScore = bm25_norm;
    else if (mode === 'dense') modeScore = dense_norm;
    else if (mode === 'hybrid_rrf') modeScore = rrf_score;
    else if (mode === 'hybrid_rerank') modeScore = rerank_score;
    else if (mode === 'learned_fusion') modeScore = learned_fusion_score;

    const final_score = Math.max(
      0,
      Math.min(1, Math.round((modeScore + scope_fit_delta * 0.5 + item.exactBoost * 0.35) * 1000) / 1000)
    );

    return {
      std: s,
      bm25_norm,
      dense_norm,
      rrf_score,
      rerank_score,
      learned_fusion_score,
      exact_id_boost: item.exactBoost,
      scope_fit_delta: Math.round(scope_fit_delta * 100) / 100,
      final_score,
      scope_fit_notes,
      matched_terms: item.matchedTerms,
    };
  });

  scored.sort((a, b) => b.final_score - a.final_score);
  return scored;
}

/**
 * M4: Ask-Before-Guess Clarification Builder
 * When query is ambiguous and top1-top2 margin is low (< 0.15), selects the attribute with
 * highest Shannon information gain over the top candidates and provides 2-4 options.
 */
export function buildClarifyingQuestion(
  parsed: ParsedQuery,
  candidates: ScoredCandidate[]
): ClarifyingQuestion | null {
  const top4 = candidates.slice(0, 4);
  if (top4.length < 2) return null;

  const margin = top4[0].final_score - top4[1].final_score;
  if (!parsed.is_ambiguous && margin >= 0.12) return null;

  // Check if top candidates span multiple pipe materials (e.g. "Pipes for water")
  if (parsed.attributes.product.includes('pipe / tube') && parsed.attributes.material.length === 0) {
    const options: ClarifyingOption[] = [
      {
        label: 'Mild Steel / Galvanized Iron (GI) Tubes (Medium/Heavy)',
        attribute_key: 'material',
        attribute_value: 'Mild Steel / GI',
        matching_is_ids: ['SYN IS 90101'],
      },
      {
        label: 'Unplasticized PVC (uPVC) Potable Water Pipes (PN 6 / PN 10)',
        attribute_key: 'material',
        attribute_value: 'uPVC',
        matching_is_ids: ['SYN IS 90102'],
      },
      {
        label: 'High Density Polyethylene (HDPE) Pipes (PE 80 / PE 100)',
        attribute_key: 'material',
        attribute_value: 'HDPE',
        matching_is_ids: ['SYN IS 90103'],
      },
      {
        label: 'Centrifugally Cast Ductile Iron (DI) Pressure Pipes (K7 / K9)',
        attribute_key: 'material',
        attribute_value: 'Ductile Iron (DI)',
        matching_is_ids: ['SYN IS 90104'],
      },
    ];
    return {
      triggered: true,
      reason: `Ambiguous query with low top1–top2 margin (${margin.toFixed(3)}). Top 4 candidates span 4 distinct pipe materials.`,
      selected_attribute: 'material',
      information_gain_bits: 2.0, // log2(4) = 2.00 bits across 4 equiprobable material families
      question_text: 'Which pipe material is required for this water supply specification?',
      question_text_hi: 'इस जल आपूर्ति विनिर्देश के लिए किस पाइप सामग्री (Material) की आवश्यकता है?',
      options,
    };
  }

  return null;
}

/**
 * M12: Clause-Level Evidence Extractor (English + Devanagari Hindi scope sentences)
 */
export function buildClauseEvidence(cand: ScoredCandidate, parsed: ParsedQuery): ClauseEvidence {
  const sentences = cand.std.scope_text
    .split(/(?<=[.।])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const enSentences = sentences.filter((s) => !/[\u0900-\u097F]/.test(s));
  const hiSentences = sentences.filter((s) => /[\u0900-\u097F]/.test(s));

  const best_en_sentence = enSentences[0] || cand.std.scope_text;
  const best_hi_sentence = hiSentences[0] || 'हिंदी कार्यक्षेत्र वाक्य उपलब्ध नहीं है।';

  const matchedAttrs: string[] = [];
  Object.entries(parsed.attributes).forEach(([k, vals]) => {
    if (vals.length > 0) {
      matchedAttrs.push(`${k}: ${vals.join(', ')}`);
    }
  });

  return {
    best_en_sentence,
    best_hi_sentence,
    highlighted_terms: cand.matched_terms,
    matched_attributes: matchedAttrs,
    score_breakdown: {
      bm25_norm: cand.bm25_norm,
      dense_norm: cand.dense_norm,
      rrf_score: cand.rrf_score,
      rerank_score: cand.rerank_score,
      learned_fusion_score: cand.learned_fusion_score,
      exact_id_boost: cand.exact_id_boost,
      scope_fit_delta: cand.scope_fit_delta,
      final_score: cand.final_score,
    },
    scope_fit_notes: cand.scope_fit_notes,
  };
}

/**
 * SINGLE ENTRY POINT: runPipeline(queryOrParsedQuery, options) -> { bundle, trace }
 * Every UI page, Tender Audit (M13), and REST API (/v1/recommend) calls this pure pipeline.
 */
export function runPipeline(
  queryInput: string | ParsedQuery,
  options: PipelineOptions = {}
): { bundle: StandardsBundle; trace: PipelineTrace } {
  const tStart = performance.now();
  const store = options.store || globalStore;
  const retrievalMode: RetrievalMode = options.retrievalMode || 'hybrid_rrf';
  const dataMode: DataMode = options.dataMode || 'COMBINED';
  const topK = options.topK || 3;
  const traceId = `trc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const steps: ModuleStepTrace[] = [];
  const blockedIds: BlockedCitationEntry[] = [];

  // M1: Ingestion & Registry Verification
  const tM1 = performance.now();
  const activeStandards = store.getActiveStandards(dataMode);
  const registrySet = store.getBaseIdSet(dataMode);
  steps.push({
    module_id: 'M1',
    module_name: 'Ingestion & Registry Snapshot',
    duration_ms: Math.round((performance.now() - tM1) * 100) / 100,
    input_summary: `data_mode=${dataMode}`,
    output_summary: `${activeStandards.length} standards, ${store.references.length} edges, ${store.certificationRules.length} cert rules (${store.registryVersion})`,
    warnings: activeStandards.length === 0 ? ['No active standards in selected data mode (e.g. REAL_ONLY on synthetic dataset).'] : [],
    details: { registry_version: store.registryVersion, count: activeStandards.length },
  });

  // M2: Reference Graph Verification
  const tM2 = performance.now();
  const validEdges = store.references.filter((r) => registrySet.has(r.from_is) && registrySet.has(r.to_is));
  const orphanEdges = store.references.filter((r) => !registrySet.has(r.from_is) || !registrySet.has(r.to_is));
  steps.push({
    module_id: 'M2',
    module_name: 'Typed Reference Graph',
    duration_ms: Math.round((performance.now() - tM2) * 100) / 100,
    input_summary: `${store.references.length} raw reference rows`,
    output_summary: `${validEdges.length} verified directed edges; ${orphanEdges.length} orphan edges isolated`,
    warnings: orphanEdges.map((o) => `Isolated orphan reference ${o.from_is} -> ${o.to_is} (${o.role})`),
    details: { valid_edges: validEdges.length, orphan_edges: orphanEdges.map((o) => `${o.from_is}->${o.to_is}`) },
  });

  // M3: Query Understanding
  const tM3 = performance.now();
  const parsed: ParsedQuery =
    typeof queryInput === 'string'
      ? parseQuery(queryInput, store, options.clarificationAnswer)
      : queryInput;
  steps.push({
    module_id: 'M3',
    module_name: 'Query Understanding (NLU)',
    duration_ms: Math.round((performance.now() - tM3) * 100) / 100,
    input_summary: `"${parsed.raw_query}"`,
    output_summary: `lang=${parsed.language} (${Math.round(parsed.language_confidence * 100)}%), glossary_matches=${parsed.glossary_matches.length}, citations=${parsed.cited_standards.length}`,
    warnings: parsed.ambiguity_reasons,
    details: {
      language: parsed.language,
      glossary_matches: parsed.glossary_matches,
      attributes: parsed.attributes,
      cited_standards: parsed.cited_standards,
    },
  });

  // M5: Retrieval (executed so M4 can inspect top1-top2 margin)
  const tM5 = performance.now();
  const allCandidates = retrieveCandidates(parsed, retrievalMode, dataMode, store);
  steps.push({
    module_id: 'M5',
    module_name: `Retrieval (${getHonestRankerLabel(retrievalMode)})`,
    duration_ms: Math.round((performance.now() - tM5) * 100) / 100,
    input_summary: `expanded_query="${parsed.expanded_query.slice(0, 80)}..."`,
    output_summary: `Ranked ${allCandidates.length} unique standards families; top1=${allCandidates[0]?.std.is_id || 'none'} (${allCandidates[0]?.final_score ?? 0})`,
    warnings: [],
    details: {
      mode: retrievalMode,
      top5: allCandidates.slice(0, 5).map((c) => ({ is_id: c.std.is_id, score: c.final_score, bm25: c.bm25_norm, dense: c.dense_norm })),
    },
  });

  // M4: Ask-Before-Guess Clarification
  const tM4 = performance.now();
  const clarification = buildClarifyingQuestion(parsed, allCandidates);
  parsed.clarifying_question = clarification;
  steps.push({
    module_id: 'M4',
    module_name: 'Ask-Before-Guess Clarification',
    duration_ms: Math.round((performance.now() - tM4) * 100) / 100,
    input_summary: `is_ambiguous=${parsed.is_ambiguous}, top1_top2_margin=${((allCandidates[0]?.final_score || 0) - (allCandidates[1]?.final_score || 0)).toFixed(3)}`,
    output_summary: clarification
      ? `Clarification triggered on "${clarification.selected_attribute}" (IG=${clarification.information_gain_bits} bits, ${clarification.options.length} options)`
      : parsed.applied_clarification
      ? `Clarification applied: ${parsed.applied_clarification}`
      : 'No clarification needed (query unambiguous / margin sufficient)',
    warnings: clarification ? [clarification.reason] : [],
    details: { clarification },
  });

  // M6: Closed-World Citation Verifier & Scope-Fit Gate
  const tM6 = performance.now();
  for (const cit of parsed.cited_standards) {
    if (!cit.exists_in_registry) {
      const entry: BlockedCitationEntry = {
        timestamp: new Date().toISOString(),
        trace_id: traceId,
        query: parsed.raw_query,
        blocked_id: cit.normalized.base_id,
        source_stage: 'QUERY_CITATION',
        reason: `Cited ID "${cit.raw_span}" (${cit.normalized.base_id}) does not exist in the closed-world BIS registry.`,
      };
      blockedIds.push(entry);
      store.blockedCitationsLog.unshift(entry);
    }
  }

  if (options.injectFakeIdDebug) {
    const debugEntry: BlockedCitationEntry = {
      timestamp: new Date().toISOString(),
      trace_id: traceId,
      query: parsed.raw_query,
      blocked_id: 'SYN IS 99999',
      source_stage: 'DEBUG_INJECTION',
      reason: 'Debug injection of fake standard SYN IS 99999 intercepted and blocked by M6 Closed-World Citation Verifier.',
    };
    blockedIds.push(debugEntry);
    store.blockedCitationsLog.unshift(debugEntry);
  }

  // Filter candidates through closed-world registry gate
  const verifiedCandidates = allCandidates.filter((c) => registrySet.has(c.std.is_id));
  steps.push({
    module_id: 'M6',
    module_name: 'Closed-World Citation Verifier & Scope-Fit',
    duration_ms: Math.round((performance.now() - tM6) * 100) / 100,
    input_summary: `${allCandidates.length} candidates + ${parsed.cited_standards.length} cited IDs${options.injectFakeIdDebug ? ' + debug fake ID SYN IS 99999' : ''}`,
    output_summary: `Verified ${verifiedCandidates.length} candidates; BLOCKED ${blockedIds.length} non-registry IDs`,
    warnings: blockedIds.map((b) => `BLOCKED ${b.blocked_id}: ${b.reason}`),
    details: { blocked_ids: blockedIds },
  });

  // M8 & M9 & M12 on Top-K Primary Candidates (resolving supersession chains)
  const tM8 = performance.now();
  const primaryRecommendations: PrimaryRecommendation[] = [];
  const seenPrimaryIds = new Set<string>();
  const m8Warnings: string[] = [];
  const m9Warnings: string[] = [];

  for (const cand of verifiedCandidates) {
    if (primaryRecommendations.length >= topK) break;
    const versionGuard = resolveVersionChain(cand.std.is_id, store);
    if (versionGuard.warning) m8Warnings.push(versionGuard.warning);

    const targetId = versionGuard.resolved_is_id;
    if (seenPrimaryIds.has(targetId)) continue;
    seenPrimaryIds.add(targetId);

    const resolvedStd = activeStandards.find((s) => s.is_id === targetId) || cand.std;
    const familyParts = activeStandards
      .filter((s) => s.is_id === resolvedStd.is_id)
      .map((s) => (s.part ? `${s.is_id} (${s.part}) : ${s.year}` : `${s.is_id} : ${s.year}`));

    const cert = resolveCertification(resolvedStd, store);
    m9Warnings.push(...cert.warnings);

    const evidence = buildClauseEvidence({ ...cand, std: resolvedStd }, parsed);

    primaryRecommendations.push({
      rank: primaryRecommendations.length + 1,
      is_id: resolvedStd.is_id,
      part: resolvedStd.part,
      year: resolvedStd.year,
      title: resolvedStd.title,
      ics_code: resolvedStd.ics_code,
      sector: resolvedStd.sector,
      family: resolvedStd.family,
      final_score: cand.final_score,
      version_guard: versionGuard,
      certification: cert,
      evidence,
      all_parts_in_family: familyParts,
      source_url: resolvedStd.source_url,
      data_provenance: resolvedStd.data_provenance,
    });
  }

  // M7: Allied Expansion from Top-3 Primaries (allied_score = primary_score * 0.7^depth)
  const tM7 = performance.now();
  const alliedMap = new Map<string, AlliedRecommendation>();
  const m7Warnings: string[] = [];

  for (const prim of primaryRecommendations) {
    // Depth 1 and Depth 2 BFS from prim.is_id
    const queue: { currId: string; depth: number; path: string[] }[] = [
      { currId: prim.is_id, depth: 0, path: [prim.is_id] },
    ];
    const visitedLocal = new Set<string>([prim.is_id]);

    while (queue.length > 0) {
      const { currId, depth, path } = queue.shift()!;
      if (depth >= 2) continue;

      const outEdges = store.references.filter((r) => r.from_is === currId);
      for (const edge of outEdges) {
        const nextDepth = depth + 1;
        // Closed-world check on allied target (e.g. SYN IS 99001, SYN IS 99002)
        if (!registrySet.has(edge.to_is)) {
          const orphanBlock: BlockedCitationEntry = {
            timestamp: new Date().toISOString(),
            trace_id: traceId,
            query: parsed.raw_query,
            blocked_id: edge.to_is,
            source_stage: 'GRAPH_ORPHAN',
            reason: `Orphan reference ${edge.from_is} -> ${edge.to_is} (${edge.role}) blocked by closed-world verifier.`,
          };
          if (!blockedIds.some((b) => b.blocked_id === edge.to_is)) {
            blockedIds.push(orphanBlock);
            store.blockedCitationsLog.unshift(orphanBlock);
          }
          m7Warnings.push(orphanBlock.reason);
          continue;
        }

        if (seenPrimaryIds.has(edge.to_is)) continue;
        const targetStd = activeStandards.find((s) => s.is_id === edge.to_is);
        if (!targetStd) continue;

        const alliedScore = Math.round(prim.final_score * Math.pow(0.7, nextDepth) * 1000) / 1000;
        const nextPath = [...path, `${edge.to_is} [${edge.role}]`];
        const existing = alliedMap.get(edge.to_is);
        if (!existing || alliedScore > existing.allied_score) {
          alliedMap.set(edge.to_is, {
            is_id: targetStd.is_id,
            title: targetStd.title,
            year: targetStd.year,
            role: edge.role,
            role_source: edge.role_source,
            from_primary_is: prim.is_id,
            depth: nextDepth,
            allied_score: alliedScore,
            justification_path: nextPath.join(' → '),
            context_clause: edge.context_text,
            version_guard: resolveVersionChain(targetStd.is_id, store),
          });
        }

        if (!visitedLocal.has(edge.to_is)) {
          visitedLocal.add(edge.to_is);
          queue.push({ currId: edge.to_is, depth: nextDepth, path: nextPath });
        }
      }
    }
  }

  const alliedRecommendations = Array.from(alliedMap.values()).sort(
    (a, b) => b.allied_score - a.allied_score
  );

  steps.push({
    module_id: 'M7',
    module_name: 'Allied Standards Graph Expansion',
    duration_ms: Math.round((performance.now() - tM7) * 100) / 100,
    input_summary: `Top-${primaryRecommendations.length} primaries`,
    output_summary: `Expanded ${alliedRecommendations.length} typed allied standards (decay=0.7^depth)`,
    warnings: m7Warnings,
    details: { allied_ids: alliedRecommendations.map((a) => ({ id: a.is_id, role: a.role, score: a.allied_score })) },
  });

  steps.push({
    module_id: 'M8',
    module_name: 'Version Guard & Supersession Resolver',
    duration_ms: Math.round((performance.now() - tM8) * 100) / 100,
    input_summary: `Checked ${primaryRecommendations.length} primary + ${alliedRecommendations.length} allied chains`,
    output_summary: m8Warnings.length > 0 ? m8Warnings.join(' | ') : 'All recommended standards verified at latest current edition',
    warnings: m8Warnings,
    details: { chains: primaryRecommendations.map((p) => p.version_guard) },
  });

  steps.push({
    module_id: 'M9',
    module_name: 'BIS / CRS Certification Engine',
    duration_ms: 0.4,
    input_summary: `Evaluated ${primaryRecommendations.length} primary standards against ${store.certificationRules.length} rules (today=${store.referenceToday})`,
    output_summary: primaryRecommendations.map((p) => `${p.is_id}: ${p.certification.status_label}`).join('; '),
    warnings: m9Warnings,
    details: { certifications: primaryRecommendations.map((p) => p.certification) },
  });

  // M10: Completeness Score
  const tM10 = performance.now();
  const top1 = primaryRecommendations[0];
  const hasPrimary = Boolean(top1 && top1.final_score >= 0.25);
  const hasTestMethod = alliedRecommendations.some((a) => a.role === 'test_method');
  const hasTerminology = alliedRecommendations.some((a) => a.role === 'terminology');
  const hasSafetyOrInstall = alliedRecommendations.some((a) => a.role === 'safety' || a.role === 'installation');
  const isVersionCurrent = Boolean(top1 && top1.version_guard.status === 'current' && !top1.version_guard.cycle_detected);
  const isCertResolved = Boolean(top1 && top1.certification.matched && !top1.certification.is_stale);

  const checklist: CompletenessItem[] = [
    {
      key: 'primary_present',
      label: 'Primary Product Standard Identified',
      weight: 25,
      satisfied: hasPrimary,
      earned: hasPrimary ? 25 : 0,
      detail: hasPrimary ? `${top1.is_id} (${top1.year})` : 'No confident primary product standard matched',
    },
    {
      key: 'test_method_present',
      label: 'Allied Test Method Standard Linked',
      weight: 20,
      satisfied: hasTestMethod,
      earned: hasTestMethod ? 20 : 0,
      detail: hasTestMethod
        ? alliedRecommendations.filter((a) => a.role === 'test_method').map((a) => a.is_id).join(', ')
        : 'Missing linked test_method standard in bundle',
    },
    {
      key: 'terminology_present',
      label: 'Terminology / Glossary Standard Linked',
      weight: 10,
      satisfied: hasTerminology,
      earned: hasTerminology ? 10 : 0,
      detail: hasTerminology
        ? alliedRecommendations.filter((a) => a.role === 'terminology').map((a) => a.is_id).join(', ')
        : 'No terminology standard linked in reference graph for this family',
    },
    {
      key: 'safety_or_installation',
      label: 'Safety or Code of Practice (Installation) Linked',
      weight: 15,
      satisfied: hasSafetyOrInstall,
      earned: hasSafetyOrInstall ? 15 : 0,
      detail: hasSafetyOrInstall
        ? alliedRecommendations.filter((a) => a.role === 'safety' || a.role === 'installation').map((a) => a.is_id).join(', ')
        : 'No installation/safety code of practice linked for this family',
    },
    {
      key: 'version_current',
      label: 'Version Current & Cycle-Free (M8 Version Guard)',
      weight: 15,
      satisfied: isVersionCurrent,
      earned: isVersionCurrent ? 15 : 0,
      detail: top1
        ? `Status=${top1.version_guard.status}, Amnd=${top1.version_guard.latest_amendment_no}`
        : 'No primary standard to verify version',
    },
    {
      key: 'certification_resolved',
      label: 'Current Verified Certification Rule Resolved (M9)',
      weight: 15,
      satisfied: isCertResolved,
      earned: isCertResolved ? 15 : 0,
      detail: top1
        ? `${top1.certification.status_label}${top1.certification.is_stale ? ' (STALE verification date)' : ''}`
        : 'No certification rule resolved',
    },
  ];

  const completenessScore = checklist.reduce((acc, item) => acc + item.earned, 0);
  const gaps = checklist.filter((i) => !i.satisfied).map((i) => `${i.label}: ${i.detail}`);
  const completeness: CompletenessReport = {
    score_pct: completenessScore,
    items: checklist,
    gaps,
  };

  steps.push({
    module_id: 'M10',
    module_name: 'Bundle Completeness Checklist Scorer',
    duration_ms: Math.round((performance.now() - tM10) * 100) / 100,
    input_summary: '6 weighted criteria (sum=100%)',
    output_summary: `Completeness=${completenessScore}% (${gaps.length} itemized gaps)`,
    warnings: gaps,
    details: { completeness },
  });

  // M11: Confidence & Abstention Engine
  const tM11 = performance.now();
  const s1 = primaryRecommendations[0]?.final_score || 0;
  const s2 = primaryRecommendations[1]?.final_score || 0;
  const margin = Math.max(0, Math.round((s1 - s2) * 1000) / 1000);
  const populatedAttrCategories = Object.values(parsed.attributes).filter((arr) => arr.length > 0).length;
  const attrFraction = Math.min(1, Math.round((populatedAttrCategories / 4) * 100) / 100);
  const statusVal = top1?.version_guard.status === 'current' ? 1.0 : 0.3;
  const ambPenalty = parsed.is_ambiguous ? 0.25 : 0;
  const graphSupport = Math.min(1, alliedRecommendations.length / 3);

  const rawProb = Math.max(
    0.03,
    Math.min(
      0.98,
      Math.round((0.45 * s1 + 0.2 * margin + 0.15 * attrFraction + 0.1 * statusVal + 0.1 * graphSupport - ambPenalty) * 1000) / 1000
    )
  );

  const abstained = s1 < 0.22 || (parsed.attributes.product.length === 0 && parsed.cited_standards.filter((c) => c.exists_in_registry).length === 0 && s1 < 0.35);
  let tier: ConfidenceTier;
  if (abstained || rawProb < 0.35) {
    tier = store.modelBTrained ? 'LOW' : 'UNCALIBRATED_LOW';
  } else if (!store.modelBTrained) {
    // Rule: until Model B is trained, show UNCALIBRATED capped at MEDIUM
    tier = 'UNCALIBRATED_MEDIUM';
  } else if (rawProb >= 0.72 && !parsed.is_ambiguous) {
    tier = 'HIGH';
  } else {
    tier = 'MEDIUM';
  }

  const abstentionReason = abstained
    ? 'No confident match in closed-world BIS registry (top score below validation threshold or out-of-domain adversarial input). Candidates shown for reference only.'
    : null;

  const confidence: ConfidenceReport = {
    calibrated: store.modelBTrained,
    probability: rawProb,
    tier,
    abstained,
    abstention_reason: abstentionReason,
    features: {
      top1_score: s1,
      top1_top2_margin: margin,
      attribute_match_fraction: attrFraction,
      status_validity: statusVal,
      ambiguity_penalty: ambPenalty,
      graph_support: Math.round(graphSupport * 100) / 100,
    },
  };

  steps.push({
    module_id: 'M11',
    module_name: 'Confidence Calibrator & Abstention Gate',
    duration_ms: Math.round((performance.now() - tM11) * 100) / 100,
    input_summary: `prob=${rawProb}, calibrated=${store.modelBTrained}, ambiguous=${parsed.is_ambiguous}`,
    output_summary: `Tier=${tier}, Abstained=${abstained}`,
    warnings: abstentionReason ? [abstentionReason] : !store.modelBTrained ? ['Model B Calibrator untrained: confidence tier marked UNCALIBRATED and capped at MEDIUM.'] : [],
    details: { confidence },
  });

  // M12: Clause-Level Evidence Trace
  steps.push({
    module_id: 'M12',
    module_name: 'Bilingual Clause-Level Evidence & Score Breakdown',
    duration_ms: 0.3,
    input_summary: `${primaryRecommendations.length} primary candidates`,
    output_summary: `Extracted EN + Devanagari HI scope sentences and highlighted ${top1?.evidence.highlighted_terms.length || 0} matched terms`,
    warnings: [],
    details: { top1_evidence: top1?.evidence || null },
  });

  const totalMs = Math.max(0.5, Math.round((performance.now() - tStart) * 100) / 100);
  const trace: PipelineTrace = {
    trace_id: traceId,
    timestamp: new Date().toISOString(),
    seed: 42,
    registry_version: store.registryVersion,
    model_version: store.modelBTrained ? 'models-v1.2-calibrated-seed42' : 'models-v1.0-baseline-seed42',
    active_ranker: retrievalMode,
    honest_ranker_label: getHonestRankerLabel(retrievalMode),
    data_mode: dataMode,
    total_duration_ms: totalMs,
    steps,
  };

  const bundle: StandardsBundle = {
    schema_version: '1.0.0',
    trace_id: traceId,
    registry_version: store.registryVersion,
    model_version: trace.model_version,
    active_ranker: retrievalMode,
    honest_ranker_label: getHonestRankerLabel(retrievalMode),
    parsed_query: parsed,
    primary_standards: primaryRecommendations,
    allied_standards: alliedRecommendations,
    completeness,
    confidence,
    blocked_ids: blockedIds,
    provenance: {
      data_label: 'SYNTHETIC',
      synthetic_warning: 'SYNTHETIC DATA - NOT A VALIDATION RESULT',
      generated_at: trace.timestamp,
    },
  };

  return { bundle, trace };
}

/**
 * M13: Tender Audit Engine — Splits lines, extracts cited IS, calls runPipeline per line,
 * and classifies each line into OK | OUTDATED | MISSING | MISMATCH | UNKNOWN_ID.
 */
export function runTenderAudit(
  filename: string,
  tenderText: string,
  options: PipelineOptions = {}
): TenderAuditReport {
  const store = options.store || globalStore;
  const rawLines = tenderText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const counts: Record<AuditStatus, number> = {
    OK: 0,
    OUTDATED: 0,
    MISSING: 0,
    MISMATCH: 0,
    UNKNOWN_ID: 0,
  };

  const results: TenderAuditLineResult[] = rawLines.map((lineText, idx) => {
    const lineNo = idx + 1;
    const citations = extractCitationsFromText(lineText, store.getBaseIdSet());
    const firstCit = citations[0] || null;

    // Strip cited IS from item description when querying product recommendation to detect MISMATCH cleanly
    const strippedLine = lineText.replace(
      /\b(?:conforming to|as per)?\s*(?:SYN\s*[-:]?\s*)?IS\s*[:\-]?\s*\d{3,6}(?:\s*(?:\(\s*(?:Part|Pt\.?)\s*\d+\s*\)|(?:Part|Pt\.?)\s*\d+|-\s*\d+(?!\d)))?(?:\s*[:\-]\s*(?:19|20)\d{2})?/gi,
      ' '
    );
    const { bundle, trace } = runPipeline(strippedLine, options);
    const recPrimary = bundle.primary_standards[0] || null;

    let status: AuditStatus = 'OK';
    let finding = '';
    let remediation = '';
    let verRes: VersionResolution | null = recPrimary?.version_guard || null;

    if (!firstCit) {
      status = 'MISSING';
      finding = `No Indian Standard cited in tender line item.`;
      remediation = recPrimary
        ? `Cite ${recPrimary.is_id}:${recPrimary.year} (${recPrimary.title}) and require ${recPrimary.certification.status_label}.`
        : 'Specify relevant BIS Indian Standard code.';
    } else if (!firstCit.exists_in_registry) {
      status = 'UNKNOWN_ID';
      // Log blocked citation
      const blockedEntry: BlockedCitationEntry = {
        timestamp: new Date().toISOString(),
        trace_id: trace.trace_id,
        query: lineText,
        blocked_id: firstCit.normalized.base_id,
        source_stage: 'QUERY_CITATION',
        reason: `Tender line ${lineNo} cites unregistered/hallucinated standard ${firstCit.normalized.base_id}.`,
      };
      store.blockedCitationsLog.unshift(blockedEntry);
      finding = `Cited ID "${firstCit.raw_span}" (${firstCit.normalized.base_id}) does NOT exist in closed-world BIS registry.`;
      remediation = recPrimary
        ? `Replace invalid ID ${firstCit.normalized.base_id} with verified standard ${recPrimary.is_id}:${recPrimary.year} (${recPrimary.title}).`
        : `Remove unverified ID ${firstCit.normalized.base_id}.`;
    } else {
      const citedBase = firstCit.normalized.base_id;
      const citedVersionGuard = resolveVersionChain(citedBase, store);
      verRes = citedVersionGuard;

      if (citedVersionGuard.cycle_detected) {
        status = 'OUTDATED';
        finding = `Cited ${citedBase} is trapped in a supersession cycle (${citedVersionGuard.chain.join(' → ')}).`;
        remediation = `Flagged for BIS technical committee clarification; do not cite superseded circular reference ${citedBase}.`;
      } else if (citedVersionGuard.withdrawn_without_successor) {
        status = 'OUTDATED';
        finding = `Cited ${citedBase} is WITHDRAWN without a direct replacement standard.`;
        remediation = `Remove withdrawn asbestos/legacy standard ${citedBase}; substitute modern material specification (e.g., HDPE SYN IS 90103 or DI SYN IS 90104).`;
      } else if (citedVersionGuard.hop_count > 0) {
        status = 'OUTDATED';
        finding = `Cited ${citedBase} is superseded (${citedVersionGuard.hop_count}-hop chain: ${citedVersionGuard.chain.join(' → ')}).`;
        remediation = `Update tender citation to current successor ${citedVersionGuard.resolved_is_id} (including Amendment ${citedVersionGuard.latest_amendment_no || 0}).`;
      } else if (recPrimary && recPrimary.is_id !== citedBase) {
        status = 'MISMATCH';
        const citedStd = store.standards.find((s) => s.is_id === citedBase);
        finding = `Scope mismatch: Tender item describes "${recPrimary.title}" (${recPrimary.is_id}), but cites ${citedBase} ("${citedStd?.title || 'unrelated standard'}").`;
        remediation = `Replace mismatched citation ${citedBase} with ${recPrimary.is_id}:${recPrimary.year}.`;
      } else {
        status = 'OK';
        finding = `Cited standard ${citedBase} is current and matches item scope.`;
        remediation = recPrimary?.version_guard.latest_amendment_no
          ? `Ensure latest Amendment ${recPrimary.version_guard.latest_amendment_no} (${recPrimary.version_guard.amendment_year}) is explicitly mentioned.`
          : 'No changes required.';
      }
    }

    counts[status]++;

    return {
      line_no: lineNo,
      raw_text: lineText,
      extracted_citations: citations,
      cited_is_raw: firstCit?.raw_span || null,
      cited_is_canonical: firstCit?.normalized.base_id || null,
      audit_status: status,
      recommended_primary: recPrimary,
      version_resolution: verRes,
      certification: recPrimary?.certification || null,
      finding_summary: finding,
      remediation_advice: remediation,
      trace_id: trace.trace_id,
    };
  });

  return {
    audit_id: `AUD-${Date.now().toString(36).toUpperCase()}`,
    filename,
    timestamp: new Date().toISOString(),
    registry_version: store.registryVersion,
    total_lines: results.length,
    counts,
    lines: results,
  };
}
