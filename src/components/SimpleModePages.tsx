import React, { useEffect, useMemo, useState } from 'react';
import { globalStore } from '../engine/dataset';
import {
  getUiStrings,
  INDIAN_LANGUAGES,
  translateQueryToEnglishForPipeline,
  translateTextsToIndianLanguage,
  UiTranslationStrings,
} from '../engine/indianLanguages';
import { runPipeline, runTenderAudit } from '../engine/pipeline';
import { DataMode, ReferenceRole, RetrievalMode, UserRole } from '../engine/types';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Upload,
  Bookmark,
  Copy,
  FileDown,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  Languages,
} from 'lucide-react';

export interface SimpleModeProps {
  role: UserRole;
  dataMode: DataMode;
  retrievalMode: RetrievalMode;
  presetQuery?: string;
  presetDebugFake?: boolean;
  refreshTrigger: number;
  triggerRefresh: () => void;
  onNavigateSimple: (tab: 'ask' | 'tender' | 'saved' | 'help', query?: string) => void;
  targetLang?: string;
  uiStrings?: UiTranslationStrings;
  onChangeTargetLang?: (code: string) => void;
  translateTriggerCount?: number;
}

function getOneWordReasonChip(role: ReferenceRole, ui?: UiTranslationStrings): string {
  switch (role) {
    case 'test_method':
      return ui?.chipTest || 'Test';
    case 'terminology':
      return ui?.chipTerms || 'Terms';
    case 'safety':
      return ui?.chipSafety || 'Safety';
    case 'installation':
      return ui?.chipInstall || 'Install';
    default:
      return 'Related';
  }
}

function highlightMatchedSentence(sentence: string, matchedTerms: string[]): React.ReactNode {
  if (!matchedTerms || matchedTerms.length === 0) return sentence;
  const cleanTerms = Array.from(
    new Set(
      matchedTerms
        .map((t) => t.trim())
        .filter((t) => t.length >= 3)
        .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    )
  );
  if (cleanTerms.length === 0) return sentence;
  const regex = new RegExp(`(${cleanTerms.join('|')})`, 'gi');
  const parts = sentence.split(regex);
  return parts.map((part, idx) =>
    regex.test(part) ? (
      <mark key={idx} className="bg-amber-200/80 text-slate-900 px-1 rounded font-medium">
        {part}
      </mark>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

/**
 * SIMPLE MODE PAGE 1: ASK (One large search box, example chips, spinner, plain-language cards, "Show details" trace expander)
 */
export function SimpleAskPage({
  role,
  dataMode,
  retrievalMode,
  presetQuery,
  presetDebugFake,
  triggerRefresh,
  targetLang = 'en',
  uiStrings: propUiStrings,
  onChangeTargetLang,
  translateTriggerCount = 0,
}: SimpleModeProps) {
  const [queryText, setQueryText] = useState(
    presetQuery ||
      'Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes for municipal potable water supply'
  );
  const [englishQueryOverlay, setEnglishQueryOverlay] = useState<string>('');
  const [clarificationChoice, setClarificationChoice] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Translation state for all 22 Indian languages
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedMap, setTranslatedMap] = useState<Record<string, string>>({});
  const [translationError, setTranslationError] = useState<string | null>(null);

  const uiStrings = propUiStrings || getUiStrings(targetLang);
  const activeLangObj =
    INDIAN_LANGUAGES.find((l) => l.code === targetLang) || INDIAN_LANGUAGES[0];

  // Officer feedback state
  const [fbAction, setFbAction] = useState<'ACCEPT' | 'REJECT' | 'OVERRIDE'>('ACCEPT');
  const [fbOverrideIs, setFbOverrideIs] = useState<string>('SYN IS 90104');
  const [fbReason, setFbReason] = useState<string>('');
  const [fbStatus, setFbStatus] = useState<string | null>(null);

  useEffect(() => {
    if (presetQuery) {
      setQueryText(presetQuery);
      setClarificationChoice('');
    }
  }, [presetQuery]);

  // Automatically bridge any non-English Indian language query to English for retrieval
  useEffect(() => {
    let cancelled = false;
    translateQueryToEnglishForPipeline(queryText).then((res) => {
      if (!cancelled) {
        setEnglishQueryOverlay(res.wasTranslated ? res.englishQuery : '');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [queryText]);

  const exampleChips = [
    {
      lang: 'English',
      label: '50 mm GI water pipes (English)',
      q: 'Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes for municipal potable water supply',
    },
    {
      lang: 'Hindi',
      label: 'पेयजल के लिए 80 मिमी जीआई पाइप (Hindi)',
      q: 'पेयजल आपूर्ति के लिए 80 मिमी मध्यम ग्रेड गैल्वनाइज्ड आयरन (GI) माइल्ड स्टील पाइप',
    },
    {
      lang: 'Hinglish',
      label: 'Jal aapurti ke liye lohe ka pipe (Hinglish)',
      q: 'Jal aapurti ke liye 100 mm medium grade GI lohe ka pipe aur fitting chahiye',
    },
    {
      lang: 'Vague',
      label: '"Pipes for water" (Asks a question)',
      q: 'Pipes for water',
    },
    {
      lang: 'Outdated',
      label: 'Old 1990 Standard SYN IS 90151',
      q: 'MS tubes for water line conforming to old standard SYN IS 90151:1990',
    },
    {
      lang: 'No Rule',
      label: 'Concrete blocks (No cert rule case)',
      q: 'Precast load-bearing hollow concrete masonry blocks 400x200x200 mm grade C(5.0) for building walls',
    },
  ];

  const triggerSearchSpinner = (nextQuery?: string) => {
    if (nextQuery !== undefined) {
      setQueryText(nextQuery);
      setClarificationChoice('');
    }
    setIsSearching(true);
    setSavedNotice(null);
    setCopiedNotice(false);
    setTimeout(() => setIsSearching(false), 180);
  };

  const effectivePipelineQuery = englishQueryOverlay
    ? `${queryText} ${englishQueryOverlay}`
    : queryText;

  const { bundle, trace } = useMemo(
    () =>
      runPipeline(effectivePipelineQuery, {
        retrievalMode,
        dataMode,
        clarificationAnswer: clarificationChoice || undefined,
        injectFakeIdDebug: Boolean(presetDebugFake),
        topK: 3,
      }),
    [
      effectivePipelineQuery,
      retrievalMode,
      dataMode,
      clarificationChoice,
      presetDebugFake,
      globalStore.registryVersion,
      globalStore.modelBTrained,
    ]
  );

  const cq = bundle.parsed_query.clarifying_question;
  const firstGap = bundle.completeness.gaps[0] || null;

  const handleTranslateBundle = async (langCodeOverride?: string) => {
    const code = langCodeOverride || targetLang;
    if (code === 'en') {
      setTranslatedMap({});
      setTranslationError(null);
      return;
    }
    const langObj = INDIAN_LANGUAGES.find((l) => l.code === code) || INDIAN_LANGUAGES[1];
    const sourceStrings: string[] = [];
    const keys: string[] = [];

    keys.push('query');
    sourceStrings.push(queryText);

    if (firstGap) {
      keys.push('gap');
      sourceStrings.push(`Missing: ${firstGap}`);
    }

    bundle.primary_standards.forEach((prim, idx) => {
      keys.push(`prim_title_${idx}`);
      sourceStrings.push(prim.title);
      keys.push(`prim_why_${idx}`);
      sourceStrings.push(prim.evidence.best_en_sentence);
    });

    bundle.allied_standards.forEach((al, idx) => {
      keys.push(`allied_title_${idx}`);
      sourceStrings.push(al.title);
    });

    setIsTranslating(true);
    setTranslationError(null);
    const res = await translateTextsToIndianLanguage(
      sourceStrings,
      langObj.code,
      `${langObj.nameEn} (${langObj.nameNative})`
    );
    setIsTranslating(false);

    if (res.error) {
      setTranslationError(res.error);
      return;
    }

    const nextMap: Record<string, string> = {};
    keys.forEach((k, idx) => {
      nextMap[k] = res.translations[idx] || sourceStrings[idx];
    });
    setTranslatedMap(nextMap);
  };

  const handleTranslateInputQueryOnly = async () => {
    const code = targetLang === 'en' ? 'hi' : targetLang;
    if (targetLang === 'en' && onChangeTargetLang) {
      onChangeTargetLang('hi');
    }
    const langObj = INDIAN_LANGUAGES.find((l) => l.code === code) || INDIAN_LANGUAGES[1];
    setIsTranslating(true);
    setTranslationError(null);
    const res = await translateTextsToIndianLanguage(
      [queryText],
      langObj.code,
      `${langObj.nameEn} (${langObj.nameNative})`
    );
    setIsTranslating(false);
    if (!res.error && res.translations[0]) {
      setQueryText(res.translations[0]);
    }
  };

  useEffect(() => {
    if (targetLang === 'en') {
      setTranslatedMap({});
      setTranslationError(null);
    } else {
      handleTranslateBundle(targetLang);
    }
  }, [targetLang, translateTriggerCount, bundle.trace_id]);

  // Overall status badge (Looks right / Check this / Not sure) with icon + text
  const getStatusBadge = (isTop1: boolean, hasWarning: boolean) => {
    if (bundle.confidence.abstained || bundle.confidence.tier === 'LOW') {
      return {
        label: uiStrings.notSure,
        icon: HelpCircle,
        cls: 'bg-rose-100 text-rose-900 border-rose-300',
      };
    }
    if (!isTop1 || hasWarning || cq) {
      return {
        label: uiStrings.checkThis,
        icon: AlertTriangle,
        cls: 'bg-amber-100 text-amber-900 border-amber-300',
      };
    }
    return {
      label: uiStrings.looksRight,
      icon: CheckCircle2,
      cls: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    };
  };

  const handleSaveSpec = () => {
    const title = queryText.slice(0, 55) + (queryText.length > 55 ? '...' : '');
    globalStore.watchList.unshift({
      spec_id: `SPEC-${100 + globalStore.watchList.length + 1}`,
      title,
      owner_role: role,
      query_text: queryText,
      primary_is_ids: bundle.primary_standards.map((p) => p.is_id),
      allied_is_ids: bundle.allied_standards.map((a) => a.is_id),
      saved_registry_version: globalStore.registryVersion,
      created_at: new Date().toISOString(),
      affected_by_changelog_ids: [],
    });
    setSavedNotice('Saved to "My saved specs". You will be alerted if any standard changes.');
    triggerRefresh();
  };

  const handleCopyList = () => {
    const lines: string[] = [
      `Requirement: ${queryText}`,
      '',
      'Primary Standards:',
      ...bundle.primary_standards.map(
        (p) =>
          `- ${p.is_id}:${p.year} — ${p.title} (${
            p.version_guard.hop_count > 0
              ? `Replaced ${p.version_guard.input_is_id}`
              : 'Current version'
          })`
      ),
      '',
      'Also Needed:',
      ...bundle.allied_standards.map(
        (a) => `- [${getOneWordReasonChip(a.role)}] ${a.is_id}:${a.year} — ${a.title}`
      ),
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const handleDownloadPdfReport = () => {
    const lines: string[] = [
      'IS-SAHAYAK — VERIFIED STANDARDS BUNDLE REPORT',
      '=============================================',
      `Date: ${new Date().toISOString().slice(0, 10)}`,
      `Query: ${queryText}`,
      `Completeness: ${bundle.completeness.score_pct}/100${
        firstGap ? ` (Missing: ${firstGap})` : ' (All parts present)'
      }`,
      '',
      'PRIMARY INDIAN STANDARDS:',
      ...bundle.primary_standards.map(
        (p) =>
          `* ${p.is_id} (${p.year}) — ${p.title}\n  Version: ${
            p.version_guard.hop_count > 0
              ? `Replaced ${p.version_guard.input_is_id} -> ${p.is_id}`
              : `Current version (${p.year}), Amendment ${p.version_guard.latest_amendment_no}`
          }\n  Certification: ${
            p.certification.matched
              ? `${p.certification.scheme} (${p.certification.legal_basis}, source: ${p.certification.source_url}, verified ${p.certification.verified_on})`
              : "We couldn't find a rule in our table"
          }\n  Why this?: "${p.evidence.best_en_sentence}"`
      ),
      '',
      'ALSO NEEDED (COMPANION STANDARDS):',
      ...bundle.allied_standards.map(
        (a) => `* [${getOneWordReasonChip(a.role)}] ${a.is_id} (${a.year}) — ${a.title}`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IS_Sahayak_Bundle_${bundle.trace_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (fbReason.trim().length < 5) {
      setFbStatus('Please enter a short reason (at least 5 characters) so we can improve.');
      return;
    }
    try {
      globalStore.appendAuditLog({
        actor_role: role,
        action_type: fbAction,
        query_or_context: queryText,
        recommended_is: bundle.primary_standards[0]?.is_id || 'NONE',
        override_is: fbAction === 'OVERRIDE' ? fbOverrideIs : null,
        mandatory_reason: fbReason.trim(),
        flagged_hard_negative: fbAction !== 'ACCEPT',
        flagged_gold_candidate: fbAction !== 'REJECT',
      });
      setFbReason('');
      setFbStatus('Thank you! Your feedback has been saved and added as a test case.');
      triggerRefresh();
    } catch (err) {
      setFbStatus(err instanceof Error ? err.message : 'Could not save feedback.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Large Search Box + Bilingual Primary Button + Indian Language Translate Control */}
      <div className="p-5 bg-white border border-slate-300 rounded-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="ask-search-input" className="block text-lg font-bold text-slate-900">
            {uiStrings.askPrompt}
          </label>

          {/* Inline Translate Bar for all 22 Indian Languages */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <Languages className="w-4 h-4 text-blue-900 shrink-0" />
            <select
              value={targetLang}
              onChange={(e) => {
                if (onChangeTargetLang) onChangeTargetLang(e.target.value);
              }}
              aria-label="Select Indian Language"
              className="text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 cursor-pointer"
            >
              {INDIAN_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nameEn} — {l.nameNative}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const nextLang = targetLang === 'en' ? 'hi' : targetLang;
                if (targetLang === 'en' && onChangeTargetLang) {
                  onChangeTargetLang('hi');
                } else {
                  handleTranslateBundle(nextLang);
                }
              }}
              className="px-2.5 py-1 text-xs font-bold bg-blue-900 text-white rounded hover:bg-blue-950 cursor-pointer"
            >
              Translate Results
            </button>
            <button
              type="button"
              onClick={handleTranslateInputQueryOnly}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
            >
              Translate Box
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="ask-search-input"
            type="text"
            value={queryText}
            onChange={(e) => {
              setQueryText(e.target.value);
              setClarificationChoice('');
            }}
            placeholder={uiStrings.searchPlaceholder}
            className="flex-1 px-4 py-3.5 text-base bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-900"
          />
          <button
            onClick={() => triggerSearchSpinner()}
            className="px-6 py-3.5 text-base font-bold text-white bg-blue-900 rounded-lg hover:bg-blue-950 transition-colors whitespace-nowrap cursor-pointer"
          >
            {uiStrings.findButton}
          </button>
        </div>

        {/* Translated Query Preview Banner when a language is active */}
        {targetLang !== 'en' && translatedMap['query'] && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-sm text-slate-900 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-blue-950">
                {activeLangObj.nameEn} ({activeLangObj.nameNative}):{' '}
              </span>
              <span>{translatedMap['query']}</span>
            </div>
            <button
              type="button"
              onClick={() => onChangeTargetLang && onChangeTargetLang('en')}
              className="text-xs font-semibold text-blue-900 underline cursor-pointer"
            >
              English
            </button>
          </div>
        )}

        {englishQueryOverlay && (
          <div className="text-xs text-slate-600">
            <strong>Multilingual Query Understood As:</strong> {englishQueryOverlay}
          </div>
        )}

        {isTranslating && (
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              Translating into {activeLangObj.nameEn} ({activeLangObj.nameNative})...
            </span>
          </div>
        )}

        {translationError && (
          <div className="text-xs text-rose-800 font-medium">{translationError}</div>
        )}

        {/* Example Chips (English / Hindi / Hinglish + Selected Indian Language Sample) */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-600">
            {uiStrings.exampleChipsLabel}
          </div>
          <div className="flex flex-wrap gap-2">
            {targetLang !== 'en' && (
              <button
                type="button"
                onClick={() => triggerSearchSpinner(activeLangObj.sampleQuery)}
                className="px-3 py-2 text-sm rounded-lg border-2 border-blue-900 bg-blue-50 text-blue-950 font-bold text-left hover:bg-blue-100 cursor-pointer"
              >
                ★ {activeLangObj.nameNative}: {activeLangObj.sampleQuery.slice(0, 42)}...
              </button>
            )}
            {exampleChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => triggerSearchSpinner(chip.q)}
                className={`px-3 py-2 text-sm rounded-lg border text-left transition-colors cursor-pointer ${
                  queryText === chip.q
                    ? 'bg-blue-900 text-white border-blue-900 font-semibold'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Spinner when searching */}
      {isSearching && (
        <div className="p-6 bg-white border border-slate-300 rounded-lg flex items-center justify-center gap-3 text-base font-medium text-slate-800">
          <Loader2 className="w-5 h-5 animate-spin text-blue-900" />
          <span>{uiStrings.findingSpinner}</span>
        </div>
      )}

      {/* 2. Clarifying Question (2-4 Tap Buttons) */}
      {!isSearching && cq && (
        <div className="p-5 bg-amber-50 border-2 border-amber-400 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-amber-950 font-bold text-base">
            <HelpCircle className="w-5 h-5 shrink-0 text-amber-800" />
            <span>{cq.question_text}</span>
          </div>
          <div className="text-sm text-slate-800">{cq.question_text_hi}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {cq.options.slice(0, 4).map((opt) => (
              <button
                key={opt.attribute_value}
                onClick={() => setClarificationChoice(opt.attribute_value)}
                className="p-3.5 text-left bg-white border-2 border-amber-300 rounded-lg hover:border-blue-900 hover:bg-blue-50/40 font-semibold text-sm text-slate-900 transition-colors cursor-pointer"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isSearching && clarificationChoice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-sm text-emerald-950">
          <span>
            Selected: <strong>{clarificationChoice}</strong>
          </span>
          <button
            onClick={() => setClarificationChoice('')}
            className="px-3 py-1 text-xs font-semibold bg-white border border-emerald-300 rounded hover:bg-emerald-100"
          >
            Change choice
          </button>
        </div>
      )}

      {/* 3. Abstention / Low Confidence Friendly Message */}
      {!isSearching && bundle.confidence.abstained && (
        <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-lg space-y-2 text-slate-900">
          <div className="flex items-center gap-2 font-bold text-base text-rose-950">
            <HelpCircle className="w-5 h-5 text-rose-800 shrink-0" />
            <span>No confident match — Not sure</span>
          </div>
          <p className="text-sm text-slate-800">
            We couldn&apos;t find a confident Indian Standard match for this request in our registry.
          </p>
          <p className="text-sm font-semibold text-rose-950">
            Suggested next action: Try describing the product material, size, or intended engineering use (for example, &quot;50 mm GI pipe for drinking water&quot;), or check the closest candidates below.
          </p>
        </div>
      )}

      {/* 4. Completeness Bar (0–100) naming the one missing item */}
      {!isSearching && (
        <div className="p-4 bg-white border border-slate-300 rounded-lg space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-bold text-slate-900">
              {uiStrings.completenessLabel}: {bundle.completeness.score_pct}/100
            </span>
            <span className="text-slate-700 font-medium">
              {firstGap
                ? translatedMap['gap'] || `Missing: ${firstGap}`
                : 'All required standard types included'}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-900 transition-all"
              style={{ width: `${bundle.completeness.score_pct}%` }}
            />
          </div>
        </div>
      )}

      {/* 5. Primary Standards Result Cards */}
      {!isSearching && (
        <div className="space-y-4">
          {bundle.primary_standards.map((prim, idx) => {
            const hasWarning =
              prim.version_guard.withdrawn_without_successor ||
              prim.version_guard.cycle_detected ||
              prim.evidence.score_breakdown.scope_fit_delta < 0;
            const badge = getStatusBadge(idx === 0, hasWarning);
            const BadgeIcon = badge.icon;
            const translatedTitle = translatedMap[`prim_title_${idx}`];
            const translatedWhy = translatedMap[`prim_why_${idx}`];

            return (
              <div
                key={prim.is_id}
                className="p-5 bg-white border border-slate-300 rounded-lg space-y-4"
              >
                {/* Plain-language title + Icon+Text Status Badge */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <div className="text-xs font-mono text-slate-600">{prim.is_id}</div>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">{prim.title}</h2>
                    {targetLang !== 'en' && translatedTitle && (
                      <div className="text-base font-semibold text-blue-950 mt-1">
                        [{activeLangObj.nameNative}] {translatedTitle}
                      </div>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-bold ${badge.cls}`}
                  >
                    <BadgeIcon className="w-4 h-4 shrink-0" />
                    <span>{badge.label}</span>
                  </span>
                </div>

                {/* One-line "Why this?" with matched scope sentence highlighted */}
                <div className="text-sm text-slate-800 leading-relaxed space-y-1.5">
                  <div>
                    <strong className="text-slate-900">{uiStrings.whyThis}: </strong>
                    &ldquo;
                    {highlightMatchedSentence(
                      prim.evidence.best_en_sentence,
                      prim.evidence.highlighted_terms
                    )}
                    &rdquo;
                  </div>
                  {targetLang !== 'en' && translatedWhy ? (
                    <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded text-slate-900">
                      <strong>{activeLangObj.nameNative}: </strong>&ldquo;{translatedWhy}&rdquo;
                    </div>
                  ) : (
                    bundle.parsed_query.language !== 'en' && (
                      <div className="text-slate-700">
                        <strong>हिंदी: </strong>&ldquo;{prim.evidence.best_hi_sentence}&rdquo;
                      </div>
                    )
                  )}
                </div>

                {/* Version Line + Certification Line */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-1">
                  {/* Version Status */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    {prim.version_guard.withdrawn_without_successor ? (
                      <div className="flex items-start gap-2 text-rose-900 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
                        <span>
                          Withdrawn standard ({prim.is_id}) — no direct replacement in registry
                        </span>
                      </div>
                    ) : prim.version_guard.hop_count > 0 ? (
                      <div className="flex items-start gap-2 text-amber-950 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-800" />
                        <span>
                          {uiStrings.replacedPrefix}{' '}
                          <span className="font-mono">{prim.version_guard.input_is_id}</span>{' '}
                          {uiStrings.withWord} <span className="font-mono">{prim.is_id}</span> (
                          {prim.year}
                          {prim.version_guard.latest_amendment_no > 0
                            ? `, ${uiStrings.amendmentWord} ${prim.version_guard.latest_amendment_no}`
                            : ''}
                          )
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-emerald-950 font-semibold">
                        <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                        <span>
                          {uiStrings.currentVersion} ({prim.year})
                          {prim.version_guard.latest_amendment_no > 0
                            ? `, ${uiStrings.amendmentWord} ${prim.version_guard.latest_amendment_no} (${prim.version_guard.amendment_year})`
                            : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Certification Line */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-semibold text-slate-900">
                      {uiStrings.certificationLabel}:{' '}
                      {prim.certification.matched ? (
                        <span>
                          {prim.certification.scheme === 'None'
                            ? 'Voluntary / No mandatory QCO'
                            : (prim.certification.scheme || '').replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span>{uiStrings.noRuleFound}</span>
                      )}
                    </div>
                    {prim.certification.matched && (
                      <div className="text-xs text-slate-600 mt-1">
                        {prim.certification.legal_basis} ·{' '}
                        {prim.certification.source_url && (
                          <a
                            href={prim.certification.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-blue-900"
                          >
                            source
                          </a>
                        )}{' '}
                        · verified {prim.certification.verified_on}
                        {prim.certification.is_stale && (
                          <span className="text-amber-800 font-semibold">
                            {' '}
                            (Note: verification date is {prim.certification.stale_days} days old)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. "Also needed" List with One-Word Reason Chips (Test / Terms / Safety / Install) */}
      {!isSearching && (
        <div className="p-5 bg-white border border-slate-300 rounded-lg space-y-3">
          <h3 className="text-base font-bold text-slate-900">
            {uiStrings.alsoNeededTitle} ({bundle.allied_standards.length})
          </h3>
          {bundle.allied_standards.length === 0 ? (
            <p className="text-sm text-slate-600">No extra companion standards needed for this item.</p>
          ) : (
            <div className="space-y-2">
              {bundle.allied_standards.map((al, idx) => (
                <div
                  key={al.is_id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-900">
                      {al.is_id} ({al.year})
                    </span>{' '}
                    — <span className="text-slate-800">{al.title}</span>
                    {targetLang !== 'en' && translatedMap[`allied_title_${idx}`] && (
                      <div className="text-xs font-semibold text-blue-950 mt-0.5">
                        [{activeLangObj.nameNative}] {translatedMap[`allied_title_${idx}`]}
                      </div>
                    )}
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold uppercase bg-white border border-slate-300 rounded text-blue-900">
                    {getOneWordReasonChip(al.role, uiStrings)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Action Buttons: Save, Download PDF, Copy list, Officer Feedback, Show details */}
      {!isSearching && (
        <div className="p-4 bg-white border border-slate-300 rounded-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleSaveSpec}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
                <span>{uiStrings.saveBtn}</span>
              </button>
              <button
                onClick={handleDownloadPdfReport}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>{uiStrings.downloadPdfBtn}</span>
              </button>
              <button
                onClick={handleCopyList}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedNotice ? uiStrings.copiedBtn : uiStrings.copyListBtn}</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer"
              >
                {showFeedback ? 'Hide feedback' : uiStrings.suggestCorrectionBtn}
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 font-semibold text-blue-900 hover:text-blue-950 cursor-pointer"
              >
                {showDetails ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span>{uiStrings.showDetailsBtn}</span>
              </button>
            </div>
          </div>

          {savedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-sm text-emerald-950 font-medium">
              {savedNotice}
            </div>
          )}

          {/* Officer Feedback Loop Expander */}
          {showFeedback && (
            <form
              onSubmit={handleSubmitFeedback}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-sm"
            >
              <div className="font-bold text-slate-900">
                Officer Feedback — Accept, Reject, or Override with a Reason
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Decision
                  </label>
                  <select
                    value={fbAction}
                    onChange={(e) =>
                      setFbAction(e.target.value as 'ACCEPT' | 'REJECT' | 'OVERRIDE')
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded"
                  >
                    <option value="ACCEPT">Accept — Looks right</option>
                    <option value="REJECT">Reject — Wrong standard</option>
                    <option value="OVERRIDE">Override — Replace with another IS</option>
                  </select>
                </div>
                {fbAction === 'OVERRIDE' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correct Standard from Registry
                    </label>
                    <select
                      value={fbOverrideIs}
                      onChange={(e) => setFbOverrideIs(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono"
                    >
                      {Array.from(globalStore.getBaseIdSet()).map((id) => (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason (Required)
                </label>
                <input
                  type="text"
                  value={fbReason}
                  onChange={(e) => setFbReason(e.target.value)}
                  placeholder="Why are you accepting, rejecting, or overriding this standard?"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded hover:bg-slate-800"
              >
                Save Feedback
              </button>
              {fbStatus && <div className="text-xs font-medium text-slate-800">{fbStatus}</div>}
            </form>
          )}

          {/* "Show details" Expander — Full Step-by-Step Pipeline Trace */}
          {showDetails && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900">
                  Full Step-by-Step Verification Trace ({trace.total_duration_ms} ms)
                </span>
                <span className="font-mono text-slate-600">
                  Trace ID: {trace.trace_id} · Blocked fake IDs: {bundle.blocked_ids.length}
                </span>
              </div>
              <div className="space-y-2">
                {trace.steps.map((st) => (
                  <div
                    key={st.module_id}
                    className="p-2.5 bg-white border border-slate-200 rounded space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>
                        {st.module_id} — {st.module_name}
                      </span>
                      <span className="font-mono text-slate-500">{st.duration_ms} ms</span>
                    </div>
                    <div className="text-slate-700">{st.output_summary}</div>
                    {st.warnings.map((w, i) => (
                      <div key={i} className="text-amber-800">
                        Note: {w}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SIMPLE MODE PAGE 2: CHECK MY TENDER (Drag-and-drop upload, grouped Fix / Missing / Looks good cards, one-click report download)
 */
export function SimpleTenderPage({
  dataMode,
  retrievalMode,
  targetLang = 'en',
  uiStrings: propUiStrings,
  onChangeTargetLang,
  translateTriggerCount = 0,
}: SimpleModeProps) {
  const [selectedFile, setSelectedFile] = useState<string>('sample_tender_01.txt');
  const [tenderText, setTenderText] = useState<string>(
    globalStore.tenders['sample_tender_01.txt'] || ''
  );
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedLines, setTranslatedLines] = useState<Record<number, string>>({});

  const uiStrings = propUiStrings || getUiStrings(targetLang);
  const activeLangObj =
    INDIAN_LANGUAGES.find((l) => l.code === targetLang) || INDIAN_LANGUAGES[0];

  const handleFileUpload = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedFile(cleanName);
      setTenderText(String(ev.target?.result || ''));
    };
    reader.readAsText(file);
  };

  const report = useMemo(
    () => runTenderAudit(selectedFile, tenderText, { retrievalMode, dataMode }),
    [selectedFile, tenderText, retrievalMode, dataMode]
  );

  const fixLines = report.lines.filter(
    (l) =>
      l.audit_status === 'OUTDATED' ||
      l.audit_status === 'MISMATCH' ||
      l.audit_status === 'UNKNOWN_ID'
  );
  const missingLines = report.lines.filter((l) => l.audit_status === 'MISSING');
  const goodLines = report.lines.filter((l) => l.audit_status === 'OK');

  const handleTranslateTenderReport = async (langCodeOverride?: string) => {
    const code = langCodeOverride || targetLang;
    if (code === 'en') {
      setTranslatedLines({});
      return;
    }
    const langObj = INDIAN_LANGUAGES.find((l) => l.code === code) || INDIAN_LANGUAGES[1];
    const texts = report.lines.map(
      (ln) =>
        `${ln.raw_text} -> ${
          ln.recommended_primary
            ? `${ln.recommended_primary.is_id} (${ln.recommended_primary.year}) — ${ln.recommended_primary.title}`
            : ln.finding_summary
        }`
    );
    setIsTranslating(true);
    const res = await translateTextsToIndianLanguage(
      texts,
      langObj.code,
      `${langObj.nameEn} (${langObj.nameNative})`
    );
    setIsTranslating(false);
    if (!res.error) {
      const map: Record<number, string> = {};
      report.lines.forEach((ln, idx) => {
        map[ln.line_no] = res.translations[idx] || '';
      });
      setTranslatedLines(map);
    }
  };

  useEffect(() => {
    if (targetLang === 'en') {
      setTranslatedLines({});
    } else {
      handleTranslateTenderReport(targetLang);
    }
  }, [targetLang, translateTriggerCount, report.audit_id]);

  const handleDownloadReport = () => {
    const lines: string[] = [
      `TENDER AUDIT REPORT — ${report.filename}`,
      '==========================================',
      `Fix needed: ${fixLines.length} | Missing standard: ${missingLines.length} | Looks good: ${goodLines.length}`,
      '',
      '1. FIX NEEDED:',
      ...fixLines.map(
        (l) =>
          `Line ${l.line_no}: ${l.raw_text}\n   -> Action: Replace ${
            l.cited_is_raw || 'invalid standard'
          } with ${
            l.recommended_primary
              ? `${l.recommended_primary.is_id} (${l.recommended_primary.year})`
              : 'a valid registry standard'
          } (${l.finding_summary})`
      ),
      '',
      '2. MISSING STANDARD:',
      ...missingLines.map(
        (l) =>
          `Line ${l.line_no}: ${l.raw_text}\n   -> Action: Add ${
            l.recommended_primary
              ? `${l.recommended_primary.is_id} (${l.recommended_primary.year}) — ${l.recommended_primary.title}`
              : 'a primary standard'
          }`
      ),
      '',
      '3. LOOKS GOOD:',
      ...goodLines.map(
        (l) => `Line ${l.line_no}: ${l.raw_text} [Verified ${l.cited_is_canonical}]`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tender_Check_Report_${report.audit_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Drag-and-Drop Upload Card */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files?.[0]);
        }}
        className="p-6 bg-white border-2 border-dashed border-slate-300 rounded-lg text-center space-y-3"
      >
        <Upload className="w-8 h-8 text-blue-900 mx-auto" />
        <div>
          <div className="text-base font-bold text-slate-900">
            {uiStrings.tenderUploadTitle}
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            {uiStrings.tenderUploadSub}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <label className="px-5 py-2.5 text-sm font-bold text-white bg-blue-900 rounded-lg hover:bg-blue-950 cursor-pointer">
            {uiStrings.uploadTenderBtn}
            <input
              type="file"
              accept=".txt"
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              className="hidden"
            />
          </label>
          {Object.keys(globalStore.tenders).map((fname, idx) => (
            <button
              key={fname}
              onClick={() => {
                setSelectedFile(fname);
                setTenderText(globalStore.tenders[fname] || '');
              }}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg border cursor-pointer ${
                selectedFile === fname
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Sample Draft #{idx + 1} ({fname})
            </button>
          ))}
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="px-3 py-2 text-sm text-blue-900 underline cursor-pointer"
          >
            {showEditor ? 'Hide text box' : 'Paste or edit lines'}
          </button>
        </div>

        {showEditor && (
          <textarea
            rows={5}
            value={tenderText}
            onChange={(e) => setTenderText(e.target.value)}
            className="w-full mt-3 p-3 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg text-left"
          />
        )}
      </div>

      {/* Header + Translate + One-Click Report Download */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-base font-bold text-slate-900">
          Results for <span className="font-mono">{selectedFile}</span> ({report.total_lines} items checked)
          {isTranslating && (
            <span className="ml-2 text-xs font-semibold text-blue-900">
              (Translating into {activeLangObj.nameEn}...)
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={targetLang}
            onChange={(e) => onChangeTargetLang && onChangeTargetLang(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 cursor-pointer"
          >
            {INDIAN_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nameEn} ({l.nameNative})
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const next = targetLang === 'en' ? 'hi' : targetLang;
              if (targetLang === 'en' && onChangeTargetLang) {
                onChangeTargetLang('hi');
              } else {
                handleTranslateTenderReport(next);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-900 rounded-lg hover:bg-blue-950 cursor-pointer"
          >
            <Languages className="w-4 h-4" />
            <span>Translate Report</span>
          </button>
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>{uiStrings.downloadReportBtn}</span>
          </button>
        </div>
      </div>

      {/* Group 1: FIX (Outdated / Wrong / Fake ID) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-base font-bold text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
          <span>
            {uiStrings.fixGroupTitle} ({fixLines.length})
          </span>
        </div>
        {fixLines.length === 0 ? (
          <div className="p-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
            No outdated or mismatched standards found.
          </div>
        ) : (
          fixLines.map((ln) => (
            <div
              key={ln.line_no}
              className="p-4 bg-white border-l-4 border-l-rose-600 border border-slate-300 rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Item #{ln.line_no}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Fix: {ln.audit_status}
                </span>
              </div>
              <div className="text-sm text-slate-800">{ln.raw_text}</div>
              {targetLang !== 'en' && translatedLines[ln.line_no] && (
                <div className="p-2 bg-blue-50/70 border border-blue-200 rounded text-xs font-semibold text-blue-950">
                  [{activeLangObj.nameNative}] {translatedLines[ln.line_no]}
                </div>
              )}
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded text-sm font-bold text-rose-950">
                {ln.recommended_primary ? (
                  <span>
                    {uiStrings.replacedPrefix}{' '}
                    <span className="font-mono">{ln.cited_is_raw || 'cited code'}</span>{' '}
                    {uiStrings.withWord}{' '}
                    <span className="font-mono">
                      {ln.recommended_primary.is_id} ({ln.recommended_primary.year})
                    </span>{' '}
                    — {ln.recommended_primary.title}
                  </span>
                ) : (
                  <span>{ln.remediation_advice}</span>
                )}
              </div>
              <div className="text-xs text-slate-600">{ln.finding_summary}</div>
            </div>
          ))
        )}
      </div>

      {/* Group 2: MISSING */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-base font-bold text-amber-900">
          <HelpCircle className="w-5 h-5 text-amber-700 shrink-0" />
          <span>
            {uiStrings.missingGroupTitle} ({missingLines.length})
          </span>
        </div>
        {missingLines.length === 0 ? (
          <div className="p-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
            Every tender item cites a standard.
          </div>
        ) : (
          missingLines.map((ln) => (
            <div
              key={ln.line_no}
              className="p-4 bg-white border-l-4 border-l-amber-500 border border-slate-300 rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Item #{ln.line_no}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Missing Standard
                </span>
              </div>
              <div className="text-sm text-slate-800">{ln.raw_text}</div>
              {targetLang !== 'en' && translatedLines[ln.line_no] && (
                <div className="p-2 bg-blue-50/70 border border-blue-200 rounded text-xs font-semibold text-blue-950">
                  [{activeLangObj.nameNative}] {translatedLines[ln.line_no]}
                </div>
              )}
              {ln.recommended_primary && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-sm font-bold text-amber-950">
                  Add{' '}
                  <span className="font-mono">
                    {ln.recommended_primary.is_id} ({ln.recommended_primary.year})
                  </span>{' '}
                  — {ln.recommended_primary.title}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Group 3: LOOKS GOOD */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-base font-bold text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>
            {uiStrings.goodGroupTitle} ({goodLines.length})
          </span>
        </div>
        {goodLines.map((ln) => (
          <div
            key={ln.line_no}
            className="p-4 bg-white border-l-4 border-l-emerald-600 border border-slate-300 rounded-lg space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Item #{ln.line_no}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {uiStrings.looksRight}
              </span>
            </div>
            <div className="text-sm text-slate-800">{ln.raw_text}</div>
            {targetLang !== 'en' && translatedLines[ln.line_no] && (
              <div className="p-2 bg-blue-50/70 border border-blue-200 rounded text-xs font-semibold text-blue-950">
                [{activeLangObj.nameNative}] {translatedLines[ln.line_no]}
              </div>
            )}
            <div className="text-xs text-emerald-900 font-medium">{ln.finding_summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SIMPLE MODE PAGE 3: MY SAVED SPECS (List + Banner "N saved specs need attention" when a cited standard changes)
 */
export function SimpleSavedSpecsPage({
  role,
  triggerRefresh,
  onNavigateSimple,
  targetLang = 'en',
  uiStrings: propUiStrings,
}: SimpleModeProps) {
  const [simNotice, setSimNotice] = useState<string | null>(null);
  const [translatedSpecs, setTranslatedSpecs] = useState<Record<string, string>>({});
  const uiStrings = propUiStrings || getUiStrings(targetLang);
  const activeLangObj =
    INDIAN_LANGUAGES.find((l) => l.code === targetLang) || INDIAN_LANGUAGES[0];

  const specsNeedingAttention = globalStore.watchList.filter(
    (sp) =>
      sp.saved_registry_version !== globalStore.registryVersion ||
      sp.affected_by_changelog_ids.length > 0
  );

  useEffect(() => {
    if (targetLang === 'en') {
      setTranslatedSpecs({});
      return;
    }
    const texts = globalStore.watchList.map((sp) => `${sp.title} — ${sp.query_text}`);
    translateTextsToIndianLanguage(
      texts,
      activeLangObj.code,
      `${activeLangObj.nameEn} (${activeLangObj.nameNative})`
    ).then((res) => {
      if (!res.error) {
        const map: Record<string, string> = {};
        globalStore.watchList.forEach((sp, idx) => {
          map[sp.spec_id] = res.translations[idx] || '';
        });
        setTranslatedSpecs(map);
      }
    });
  }, [targetLang, globalStore.watchList.length]);

  const handleSimulateChange = () => {
    const res = globalStore.simulateRevision({
      actorRole: role,
      is_id: 'SYN IS 90101',
      field_changed: 'latest_amendment_no',
      new_value: '3',
      reason: 'Amendment 3 issued for mild steel GI water tubes.',
    });
    setSimNotice(
      `Simulated new Amendment 3 on SYN IS 90101 (${res.affectedSpecs.length} saved spec affected).`
    );
    triggerRefresh();
  };

  const handleReset = () => {
    globalStore.reloadFromRaw();
    setSimNotice(null);
    triggerRefresh();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">{uiStrings.savedSpecsTitle}</h2>
      {/* Banner when N saved specs need attention */}
      {specsNeedingAttention.length > 0 ? (
        <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-base font-bold text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0" />
            <span>
              {specsNeedingAttention.length} {uiStrings.savedSpecsAttentionBanner}
            </span>
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded hover:bg-amber-100 cursor-pointer"
          >
            Mark as reviewed / Reset
          </button>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-950">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>All {globalStore.watchList.length} saved specs are up to date with the current registry.</span>
          </div>
          <button
            onClick={handleSimulateChange}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"
          >
            Test: Simulate a standard update
          </button>
        </div>
      )}

      {simNotice && <div className="text-xs text-slate-600">{simNotice}</div>}

      {/* Saved Specs Cards */}
      <div className="space-y-3">
        {globalStore.watchList.map((sp) => {
          const needsAttention =
            sp.saved_registry_version !== globalStore.registryVersion ||
            sp.affected_by_changelog_ids.length > 0;

          return (
            <div
              key={sp.spec_id}
              className={`p-5 bg-white border rounded-lg space-y-2.5 ${
                needsAttention ? 'border-2 border-amber-400' : 'border-slate-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900">{sp.title}</h3>
                {needsAttention ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-100 text-amber-900 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {uiStrings.checkThis}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {uiStrings.looksRight}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-700">{sp.query_text}</p>
              {targetLang !== 'en' && translatedSpecs[sp.spec_id] && (
                <div className="p-2 bg-blue-50/70 border border-blue-200 rounded text-xs font-semibold text-blue-950">
                  [{activeLangObj.nameNative}] {translatedSpecs[sp.spec_id]}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-600">
                <div>
                  <strong>Cited Standards:</strong>{' '}
                  <span className="font-mono">
                    {[...sp.primary_is_ids, ...sp.allied_is_ids].join(', ')}
                  </span>
                </div>
                <button
                  onClick={() => onNavigateSimple('ask', sp.query_text)}
                  className="font-semibold text-blue-900 underline hover:text-blue-950 cursor-pointer"
                >
                  Open in Ask →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SIMPLE MODE PAGE 4: HELP (5-step walkthrough and plain-language FAQ)
 */
export function SimpleHelpPage({
  onNavigateSimple,
  targetLang = 'en',
  uiStrings: propUiStrings,
}: SimpleModeProps) {
  const uiStrings = propUiStrings || getUiStrings(targetLang);
  const activeLangObj =
    INDIAN_LANGUAGES.find((l) => l.code === targetLang) || INDIAN_LANGUAGES[0];

  const steps = [
    {
      step: 'Step 1',
      title: 'Type what you are buying (in any Indian language, English, or Hinglish)',
      desc: 'Go to "Ask" and enter your item description—such as "50 mm GI pipe for drinking water", "पेयजल जीआई पाइप", or "lohe ka pipe"—or tap one of the example chips.',
    },
    {
      step: 'Step 2',
      title: 'Tap an option if your request is broad',
      desc: 'If you type something general like "Pipes for water", IS-Sahayak asks one quick question (such as pipe material) instead of guessing.',
    },
    {
      step: 'Step 3',
      title: 'Check the primary standard, version, and certification',
      desc: 'Each result card tells you if the standard is the current version or replaced an older one, highlights the exact matching scope sentence, and shows whether BIS certification is required.',
    },
    {
      step: 'Step 4',
      title: 'Include the "Also needed" companion standards',
      desc: 'A complete tender needs more than just the main product code. Include the companion standards tagged Test, Terms, Safety, or Install so your tender has no gaps.',
    },
    {
      step: 'Step 5',
      title: 'Check a full draft tender or save to your watch-list',
      desc: 'Use "Check my tender" to upload a draft document and see lines grouped under Fix, Missing, and Looks good, or click "Save" to get alerted when a standard changes.',
    },
  ];

  const faqs = [
    {
      q: 'Can IS-Sahayak invent or hallucinate a fake Indian Standard number?',
      a: 'No. Every IS number is checked against our closed-world registry table before it is shown. Any code not in the registry is automatically blocked.',
    },
    {
      q: 'Why does Certification sometimes say "We couldn\'t find a rule in our table"?',
      a: 'We never claim certification is "not required" unless an official source says so. If our table has no matching Quality Control Order rule for that item, we state that honestly and show the verification date for every matched rule.',
    },
    {
      q: 'What do the status badges "Looks right", "Check this", and "Not sure" mean?',
      a: '"Looks right" means a strong match with current standards. "Check this" means a moderate match or an item where an old standard was upgraded. "Not sure" means no confident match was found and a human officer should review.',
    },
    {
      q: 'What is the difference between Simple mode and Expert mode?',
      a: 'Simple mode gives procurement officers a clean 4-page workflow. Expert mode (toggle in the top header) unlocks all 16 technical pages, retrieval benchmarks, model calibration curves, and the full 14-USP showcase.',
    },
  ];

  const [translatedHelp, setTranslatedHelp] = useState<string[]>([]);

  useEffect(() => {
    if (targetLang === 'en') {
      setTranslatedHelp([]);
      return;
    }
    const source = [
      ...steps.map((s) => `${s.title}: ${s.desc}`),
      ...faqs.map((f) => `${f.q} — ${f.a}`),
    ];
    translateTextsToIndianLanguage(
      source,
      activeLangObj.code,
      `${activeLangObj.nameEn} (${activeLangObj.nameNative})`
    ).then((res) => {
      if (!res.error) {
        setTranslatedHelp(res.translations);
      }
    });
  }, [targetLang]);

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white border border-slate-300 rounded-lg space-y-4">
        <h2 className="text-lg font-bold text-slate-900">{uiStrings.helpTitle}</h2>
        <div className="space-y-3">
          {steps.map((s, idx) => (
            <div key={s.step} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="text-xs font-bold uppercase text-blue-900">{s.step}</div>
              <div className="text-base font-bold text-slate-900">{s.title}</div>
              <p className="text-sm text-slate-700">{s.desc}</p>
              {targetLang !== 'en' && translatedHelp[idx] && (
                <div className="p-2 bg-blue-50/70 border border-blue-200 rounded text-xs font-semibold text-blue-950 mt-1">
                  [{activeLangObj.nameNative}] {translatedHelp[idx]}
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => onNavigateSimple('ask')}
          className="px-5 py-2.5 text-sm font-bold text-white bg-blue-900 rounded-lg hover:bg-blue-950 cursor-pointer"
        >
          {uiStrings.findButton} →
        </button>
      </div>

      <div className="p-5 bg-white border border-slate-300 rounded-lg space-y-4">
        <h2 className="text-lg font-bold text-slate-900">{uiStrings.faqTitle}</h2>
        <div className="space-y-3">
          {faqs.map((f, idx) => (
            <div key={f.q} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="text-sm font-bold text-slate-900">{f.q}</div>
              <p className="text-sm text-slate-700">{f.a}</p>
              {targetLang !== 'en' && translatedHelp[steps.length + idx] && (
                <div className="p-2 bg-blue-50/70 border border-blue-200 rounded text-xs font-semibold text-blue-950 mt-1">
                  [{activeLangObj.nameNative}] {translatedHelp[steps.length + idx]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
