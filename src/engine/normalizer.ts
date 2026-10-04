import { ExtractedCitation, NormalizedIsId } from './types';

/**
 * Canonical IS-ID Normalizer (M1 / Model G)
 * Handles variants such as:
 * - "IS 1239 (Part 1) : 2004" -> base_id: "IS 1239", part: "Part 1", year: 2004
 * - "IS:1239"                 -> base_id: "IS 1239", part: null, year: null
 * - "IS1239"                  -> base_id: "IS 1239", part: null, year: null
 * - "IS 1239-1"               -> base_id: "IS 1239", part: "Part 1", year: null
 * - "IS 1239 Pt 1"            -> base_id: "IS 1239", part: "Part 1", year: null
 * - "SYN IS 90101"            -> base_id: "SYN IS 90101", part: null, year: null
 * - "SYN IS 90101:2015"       -> base_id: "SYN IS 90101", part: null, year: 2015
 * - "SYN IS 90101 (Part 2)"   -> base_id: "SYN IS 90101", part: "Part 2", year: null
 */
export function normalizeIsId(rawInput: string): NormalizedIsId | null {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const cleaned = rawInput.trim().replace(/\s+/g, ' ');

  const pattern = /^(?:(SYN)\s*[-:]?\s*)?IS\s*[:\-]?\s*(\d{3,6})(?:\s*(?:\(\s*(?:Part|Pt\.?)\s*(\d+)\s*\)|(?:Part|Pt\.?)\s*(\d+)|-\s*(\d+)(?!\d)))?(?:\s*[:\-]\s*((?:19|20)\d{2}))?$/i;
  const match = cleaned.match(pattern);
  if (!match) return null;

  const isSynthetic = Boolean(match[1]);
  const numberDigits = match[2];
  const partNum = match[3] || match[4] || match[5] || null;
  const yearNum = match[6] ? parseInt(match[6], 10) : null;

  const prefix = isSynthetic ? 'SYN IS' : 'IS';
  const base_id = `${prefix} ${numberDigits}`;
  const part = partNum ? `Part ${partNum}` : null;
  const canonical_with_part = part ? `${base_id} (${part})` : base_id;
  const canonical_id = yearNum ? `${canonical_with_part} : ${yearNum}` : canonical_with_part;

  return {
    raw: rawInput.trim(),
    is_synthetic: isSynthetic,
    number_digits: numberDigits,
    base_id,
    part,
    year: yearNum,
    canonical_id,
    canonical_with_part,
  };
}

/**
 * Extracts all IS / SYN IS citations from free text with span character offsets.
 */
export function extractCitationsFromText(
  text: string,
  registryBaseIds: Set<string>
): ExtractedCitation[] {
  if (!text) return [];
  const regex = /\b(?:SYN\s*[-:]?\s*)?IS\s*[:\-]?\s*\d{3,6}(?:\s*(?:\(\s*(?:Part|Pt\.?)\s*\d+\s*\)|(?:Part|Pt\.?)\s*\d+|-\s*\d+(?!\d)))?(?:\s*[:\-]\s*(?:19|20)\d{2})?\b/gi;
  const results: ExtractedCitation[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const rawSpan = match[0];
    const normalized = normalizeIsId(rawSpan);
    if (normalized) {
      results.push({
        raw_span: rawSpan,
        start: match.index,
        end: match.index + rawSpan.length,
        normalized,
        exists_in_registry: registryBaseIds.has(normalized.base_id),
      });
    }
  }
  return results;
}
