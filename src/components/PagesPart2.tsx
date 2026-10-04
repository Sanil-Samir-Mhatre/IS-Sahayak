import React, { useMemo, useState } from 'react';
import { globalStore } from '../engine/dataset';
import { getHonestRankerLabel, runPipeline, runTenderAudit } from '../engine/pipeline';
import { AuditStatus, RetrievalMode } from '../engine/types';
import { PageFrame, SharedPageProps } from './PagesPart1';
import { Download, ShieldAlert, CheckCircle2, AlertTriangle, BookmarkPlus, Bug, Lock } from 'lucide-react';

/**
 * PAGE 6: QUERY UNDERSTANDING & ASK-BEFORE-GUESS (M3 + M4)
 */
export function Page06QueryUnderstanding({
  retrievalMode,
  dataMode,
  onNavigate,
  presetQuery,
}: SharedPageProps & { presetQuery?: string }) {
  const [queryText, setQueryText] = useState(
    presetQuery || 'Pipes for water'
  );
  const [selectedClarification, setSelectedClarification] = useState<string>('');

  const presets = [
    { label: 'Ambiguous (M4 Trigger): "Pipes for water"', q: 'Pipes for water' },
    { label: 'Hinglish Glossary: "Jal aapurti ke liye 100 mm GI lohe ka pipe"', q: 'Jal aapurti ke liye 100 mm medium grade GI lohe ka pipe aur fitting chahiye' },
    { label: 'Devanagari Hindi: "पेयजल आपूर्ति के लिए 80 मिमी मध्यम ग्रेड जीआई पाइप"', q: 'पेयजल आपूर्ति के लिए 80 मिमी मध्यम ग्रेड गैल्वनाइज्ड आयरन (GI) माइल्ड स्टील पाइप' },
    { label: 'Clay Bricks Hinglish: "Deewar chinai ke liye pakki mitti ki lal eent"', q: 'Deewar chinai ke liye class 10 modular pakki mitti ki lal eent (burnt clay building bricks)' },
    { label: 'Superseded Citation: "MS tubes conforming to SYN IS 90151:1990"', q: 'MS tubes for water line conforming to old standard SYN IS 90151:1990' },
  ];

  // Before clarification
  const beforeRun = useMemo(
    () => runPipeline(queryText, { retrievalMode, dataMode }),
    [queryText, retrievalMode, dataMode]
  );

  // After clarification (if user clicked an option)
  const afterRun = useMemo(() => {
    if (!selectedClarification) return null;
    return runPipeline(queryText, {
      retrievalMode,
      dataMode,
      clarificationAnswer: selectedClarification,
    });
  }, [queryText, retrievalMode, dataMode, selectedClarification]);

  const pq = beforeRun.bundle.parsed_query;
  const cq = pq.clarifying_question;

  return (
    <PageFrame
      pageNumber={6}
      title="Query Understanding & Ask-Before-Guess Clarification (M3 + M4)"
      whatThisShows="Language identification (Devanagari ratio -> hi; romanized Hindi lexicon/n-gram -> hinglish; else en), fuzzy glossary expansion, structured attribute extraction, citation span detection, and M4 Ask-Before-Guess clarification with Before vs. After re-ranking."
      nextStepLabel="07 Retrieval Lab"
      nextStepPage={7}
      onNavigate={onNavigate}
    >
      {/* Query Input & Presets */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setQueryText(p.q);
                setSelectedClarification('');
              }}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                queryText === p.q
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={queryText}
            onChange={(e) => {
              setQueryText(e.target.value);
              setSelectedClarification('');
            }}
            className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            placeholder="Enter English, Hindi, or Hinglish product specification..."
          />
          <button
            onClick={() => onNavigate(8, queryText)}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Send to Bundle Builder
          </button>
        </div>
      </div>

      {/* M3 NLU Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2 text-xs">
          <h2 className="text-sm font-semibold text-slate-900">01. Language ID (Model F)</h2>
          <div className="font-mono">
            <div><strong>Detected Language:</strong> {pq.language.toUpperCase()}</div>
            <div><strong>Confidence:</strong> {Math.round(pq.language_confidence * 100)}%</div>
            <div><strong>Devanagari Ratio:</strong> {pq.devanagari_ratio}</div>
            <div><strong>Hinglish Tokens:</strong> {pq.hinglish_markers.join(', ') || 'None'}</div>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="font-semibold text-slate-800">Expanded Query (M3):</div>
            <div className="font-mono text-slate-600 mt-0.5 bg-slate-50 p-2 rounded border border-slate-200">
              {pq.expanded_query}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2 text-xs">
          <h2 className="text-sm font-semibold text-slate-900">02. Glossary &amp; Citations (Model G)</h2>
          <div>
            <div className="font-semibold text-slate-700">Glossary Matches ({pq.glossary_matches.length}):</div>
            {pq.glossary_matches.length === 0 ? (
              <div className="text-slate-500 mt-1">No Hindi/Hinglish glossary terms triggered.</div>
            ) : (
              <ul className="mt-1 space-y-1 font-mono">
                {pq.glossary_matches.map((g, idx) => (
                  <li key={idx} className="text-emerald-800 bg-emerald-50/70 px-2 py-1 rounded border border-emerald-200">
                    &quot;{g.source_term}&quot; ({g.match_type}, sim={g.similarity}) → &quot;{g.expanded_term}&quot;
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="font-semibold text-slate-700">Extracted IS Citations ({pq.cited_standards.length}):</div>
            {pq.cited_standards.length === 0 ? (
              <div className="text-slate-500 mt-1">No explicit IS code cited in query.</div>
            ) : (
              <ul className="mt-1 space-y-1 font-mono">
                {pq.cited_standards.map((c, idx) => (
                  <li key={idx} className={c.exists_in_registry ? 'text-slate-900' : 'text-rose-700 font-semibold'}>
                    Span [{c.start}:{c.end}] &quot;{c.raw_span}&quot; → {c.normalized.canonical_id} (
                    {c.exists_in_registry ? 'In Registry' : 'BLOCKED — Not in Registry'})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2 text-xs">
          <h2 className="text-sm font-semibold text-slate-900">03. Structured Attributes (Model E)</h2>
          <div className="space-y-1.5 font-mono">
            <div><strong>product:</strong> {pq.attributes.product.join(', ') || '—'}</div>
            <div><strong>material:</strong> {pq.attributes.material.join(', ') || '—'}</div>
            <div><strong>grade:</strong> {pq.attributes.grade.join(', ') || '—'}</div>
            <div><strong>size_units:</strong> {pq.attributes.size_units.join(', ') || '—'}</div>
            <div><strong>application:</strong> {pq.attributes.application.join(', ') || '—'}</div>
            <div><strong>quantity:</strong> {pq.attributes.quantity.join(', ') || '—'}</div>
          </div>
        </div>
      </div>

      {/* M4 Ask-Before-Guess Clarification Panel */}
      <div className="p-5 bg-white border border-slate-200 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              04. M4 Ask-Before-Guess Clarification Engine (Max Information Gain Selector)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              When a query is underspecified (e.g., &quot;Pipes for water&quot;) and the top1–top2 margin is small, M4 selects the attribute with highest information gain over top candidates.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-700">
            Ambiguous: {pq.is_ambiguous ? 'TRUE (Question Triggered)' : 'FALSE'}
          </span>
        </div>

        {cq ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-lg text-xs space-y-2">
              <div className="font-mono text-amber-900 font-semibold">
                CLARIFYING QUESTION TRIGGERED · Attribute: &quot;{cq.selected_attribute}&quot; · Information Gain: {cq.information_gain_bits.toFixed(2)} bits
              </div>
              <div className="text-sm font-semibold text-slate-900">{cq.question_text}</div>
              <div className="text-xs text-slate-700">{cq.question_text_hi}</div>
              <div className="flex flex-wrap gap-2 pt-2">
                {cq.options.map((opt) => (
                  <button
                    key={opt.attribute_value}
                    onClick={() => setSelectedClarification(opt.attribute_value)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      selectedClarification === opt.attribute_value
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label} → [{opt.matching_is_ids.join(', ')}]
                  </button>
                ))}
              </div>
            </div>

            {/* Before vs After Re-Ranking Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-900 mb-2">
                  BEFORE Clarification (Ambiguous · Margin={(
                    (beforeRun.bundle.primary_standards[0]?.final_score || 0) -
                    (beforeRun.bundle.primary_standards[1]?.final_score || 0)
                  ).toFixed(3)})
                </div>
                <div className="space-y-1.5 font-mono">
                  {beforeRun.bundle.primary_standards.map((p) => (
                    <div key={p.is_id} className="flex justify-between p-2 bg-white rounded border border-slate-200">
                      <span>
                        #{p.rank} {p.is_id} — {p.title.slice(0, 42)}...
                      </span>
                      <span className="font-semibold">{p.final_score}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-lg">
                <div className="font-semibold text-slate-900 mb-2">
                  AFTER Clarification ({selectedClarification || 'Select an option above to re-rank'})
                </div>
                {afterRun ? (
                  <div className="space-y-1.5 font-mono">
                    {afterRun.bundle.primary_standards.map((p) => (
                      <div key={p.is_id} className="flex justify-between p-2 bg-white rounded border border-emerald-200">
                        <span>
                          #{p.rank} {p.is_id} — {p.title.slice(0, 42)}...
                        </span>
                        <span className="font-semibold text-emerald-800">{p.final_score}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 py-6 text-center">
                    Click one of the 4 material options above to see deterministic re-ranking and margin expansion.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
            Query contains sufficient material/product specificity. Click preset <strong>&quot;Pipes for water&quot;</strong> above to test M4 Ask-Before-Guess.
          </div>
        )}
      </div>
    </PageFrame>
  );
}

/**
 * PAGE 7: RETRIEVAL LAB (Side-by-Side Modes, Rank Movement, Latency, Honest Labels)
 */
export function Page07RetrievalLab({ dataMode, onNavigate }: SharedPageProps) {
  const [queryText, setQueryText] = useState(
    'Jal aapurti ke liye 100 mm medium grade GI lohe ka pipe aur fitting chahiye'
  );

  const modes: RetrievalMode[] = ['bm25', 'dense', 'hybrid_rrf', 'hybrid_rerank', 'learned_fusion'];

  const comparison = useMemo(() => {
    return modes.map((m) => {
      const { bundle, trace } = runPipeline(queryText, { retrievalMode: m, dataMode, topK: 5 });
      return {
        mode: m,
        honestLabel: getHonestRankerLabel(m),
        durationMs: trace.total_duration_ms,
        topStandards: bundle.primary_standards,
      };
    });
  }, [queryText, dataMode]);

  const bm25Ranks = useMemo(() => {
    const map = new Map<string, number>();
    comparison[0].topStandards.forEach((p) => map.set(p.is_id, p.rank));
    return map;
  }, [comparison]);

  return (
    <PageFrame
      pageNumber={7}
      title="Retrieval Lab — Side-by-Side Ranker Comparison (M5)"
      whatThisShows="Side-by-side comparison of all 5 retrieval modes (BM25 Lexical, Dense Multilingual, Hybrid RRF k=60, Hybrid + Cross-Encoder Rerank, and Learned Fusion LambdaRank) with rank movement vs. BM25 baseline, per-mode latency, and strict Honest Ranker Badges."
      nextStepLabel="08 Bundle Builder"
      nextStepPage={8}
      onNavigate={onNavigate}
    >
      {/* Query Selector */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {globalStore.goldQueries.slice(0, 8).map((gq) => (
            <button
              key={gq.qid}
              onClick={() => setQueryText(gq.query_text)}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                queryText === gq.query_text
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {gq.qid} ({gq.language}): {gq.query_text.slice(0, 34)}...
            </button>
          ))}
        </div>
        <input
          type="text"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
        />
      </div>

      {/* 5-Column Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {comparison.map((col) => (
          <div key={col.mode} className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono font-semibold text-slate-900 uppercase">{col.mode}</div>
              <div className="text-xs text-slate-600 mt-0.5 leading-snug">{col.honestLabel}</div>
              <div className="text-[11px] font-mono text-slate-500 mt-1 pb-2 border-b border-slate-200">
                Latency: {col.durationMs} ms
              </div>

              <div className="mt-3 space-y-2">
                {col.topStandards.map((item) => {
                  const baseRank = bm25Ranks.get(item.is_id);
                  const delta = baseRank ? baseRank - item.rank : 0;
                  return (
                    <div key={item.is_id} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-semibold text-slate-900">
                          #{item.rank} {item.is_id}
                        </span>
                        <span className="text-slate-700">{item.final_score}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{item.title}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1 flex justify-between">
                        <span>BM25:{item.evidence.score_breakdown.bm25_norm}</span>
                        <span>Dense:{item.evidence.score_breakdown.dense_norm}</span>
                        <span
                          className={
                            delta > 0 ? 'text-emerald-700 font-semibold' : delta < 0 ? 'text-rose-700' : 'text-slate-400'
                          }
                        >
                          {delta > 0 ? `↑+${delta}` : delta < 0 ? `↓${delta}` : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageFrame>
  );
}

/**
 * PAGE 8: BUNDLE BUILDER (Main Step 1 User Flow — Clean, Accessible, Senior & Millennial Friendly)
 */
export function Page08BundleBuilder({
  role,
  retrievalMode,
  dataMode,
  onNavigate,
  presetQuery,
  presetDebugFake,
  triggerRefresh,
}: SharedPageProps & { presetQuery?: string; presetDebugFake?: boolean }) {
  const [queryText, setQueryText] = useState(
    presetQuery ||
      'Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes for municipal potable water supply'
  );
  const [clarificationChoice, setClarificationChoice] = useState<string>('');
  const [injectFakeIdDebug, setInjectFakeIdDebug] = useState(Boolean(presetDebugFake));
  const [showTechnicalTrace, setShowTechnicalTrace] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const quickExamples = [
    {
      label: 'GI Water Pipes (English)',
      q: 'Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes for municipal potable water supply',
    },
    {
      label: 'Lohe ka Pipe (Hinglish)',
      q: 'Jal aapurti ke liye 100 mm medium grade GI lohe ka pipe aur fitting chahiye',
    },
    {
      label: 'पेयजल जीआई पाइप (Hindi)',
      q: 'पेयजल आपूर्ति के लिए 80 मिमी मध्यम ग्रेड गैल्वनाइज्ड आयरन (GI) माइल्ड स्टील पाइप',
    },
    {
      label: 'Ambiguous: "Pipes for water" (Asks Question)',
      q: 'Pipes for water',
    },
    {
      label: 'Superseded 1990 Standard (SYN IS 90151:1990)',
      q: 'MS tubes for water line conforming to old standard SYN IS 90151:1990',
    },
    {
      label: 'LED Bulbs for Office (CRS Scheme)',
      q: 'Supply of 12W self-ballasted LED bulbs 240V 50Hz CRI >= 80 with power factor 0.90 for office lighting',
    },
    {
      label: 'Concrete Blocks (No Cert Rule Case)',
      q: 'Precast load-bearing hollow concrete masonry blocks 400x200x200 mm grade C(5.0) for building walls',
    },
    {
      label: 'Withdrawn Asbestos Pipe (SYN IS 90998)',
      q: 'Asbestos cement pressure pipes as per SYN IS 90998 for rural water supply',
    },
  ];

  const { bundle, trace } = useMemo(
    () =>
      runPipeline(queryText, {
        retrievalMode,
        dataMode,
        clarificationAnswer: clarificationChoice || undefined,
        injectFakeIdDebug,
        topK: 3,
      }),
    [
      queryText,
      retrievalMode,
      dataMode,
      clarificationChoice,
      injectFakeIdDebug,
      globalStore.registryVersion,
      globalStore.modelBTrained,
    ]
  );

  const handleDownloadJson = () => {
    const payload = { bundle, trace };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verified_standards_bundle_${bundle.trace_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToWatchlist = () => {
    const title = saveTitle.trim() || `Spec: ${queryText.slice(0, 48)}...`;
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
    setSaveTitle('');
    setSaveMessage(`Saved "${title}" to Watch-List.`);
    triggerRefresh();
  };

  const cq = bundle.parsed_query.clarifying_question;

  return (
    <PageFrame
      pageNumber={8}
      title="Find Indian Standards"
      whatThisShows="Enter a product description or tender line in English, Hindi, or Hinglish to get the verified Indian Standard, latest edition, mandatory certification rule, and companion standards."
      nextStepLabel="Check Draft Tender"
      nextStepPage={9}
      onNavigate={onNavigate}
    >
      {/* Query Input Section */}
      <div className="space-y-4 pb-6 border-b border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Product Description or Tender Item
            </label>
            <input
              type="text"
              value={queryText}
              onChange={(e) => {
                setQueryText(e.target.value);
                setClarificationChoice('');
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-800"
              placeholder="e.g., 50 mm GI pipe for drinking water, or lohe ka pipe..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Load Example Query
            </label>
            <select
              value={quickExamples.some((ex) => ex.q === queryText) ? queryText : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setQueryText(e.target.value);
                  setClarificationChoice('');
                }
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded"
            >
              <option value="">-- Choose a sample query --</option>
              {quickExamples.map((ex) => (
                <option key={ex.label} value={ex.q}>
                  {ex.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div>
            Detected Language: <strong>{bundle.parsed_query.language.toUpperCase()}</strong>
            {bundle.parsed_query.glossary_matches.length > 0 && (
              <span>
                {' '}
                · Glossary: {bundle.parsed_query.glossary_matches.map((g) => `${g.source_term} → ${g.expanded_term}`).join(', ')}
              </span>
            )}
          </div>
          <button
            onClick={handleDownloadJson}
            className="px-3 py-1 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded hover:bg-slate-200"
          >
            Download JSON Report
          </button>
        </div>
      </div>

      {/* Clarification Prompt (Only when ambiguous) */}
      {cq && (
        <div className="p-4 bg-slate-50 border border-slate-300 rounded space-y-2">
          <div className="text-sm font-bold text-slate-900">
            Clarification Needed: {cq.question_text}
          </div>
          <div className="text-xs text-slate-600">{cq.question_text_hi}</div>
          <div className="flex flex-wrap gap-2 pt-1">
            {cq.options.map((opt) => (
              <button
                key={opt.attribute_value}
                onClick={() => setClarificationChoice(opt.attribute_value)}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded hover:bg-slate-100"
              >
                {opt.label} ({opt.matching_is_ids.join(', ')})
              </button>
            ))}
          </div>
        </div>
      )}

      {clarificationChoice && (
        <div className="p-3 bg-slate-50 border border-slate-300 rounded flex items-center justify-between text-xs">
          <span>
            Filter applied: <strong>{clarificationChoice}</strong>
          </span>
          <button
            onClick={() => setClarificationChoice('')}
            className="underline text-slate-700 hover:text-slate-900"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-3 gap-4 py-2 border-b border-slate-200 text-sm">
        <div>
          <div className="text-xs text-slate-500">Confidence</div>
          <div className="font-semibold text-slate-900 mt-0.5">
            {bundle.confidence.tier} ({Math.round(bundle.confidence.probability * 100)}%)
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Bundle Completeness</div>
          <div className="font-semibold text-slate-900 mt-0.5">
            {bundle.completeness.score_pct}% ({bundle.primary_standards.length} primary, {bundle.allied_standards.length} allied)
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Registry Verification</div>
          <div className="font-semibold text-slate-900 mt-0.5">
            {bundle.blocked_ids.length > 0
              ? `Blocked: ${bundle.blocked_ids.map((b) => b.blocked_id).join(', ')}`
              : 'All IDs Verified'}
          </div>
        </div>
      </div>

      {bundle.confidence.abstained && (
        <div className="p-4 bg-slate-100 border border-slate-400 rounded text-sm text-slate-900">
          <strong>Low Confidence / No Match:</strong> {bundle.confidence.abstention_reason}
        </div>
      )}

      {/* Primary Standards Table/List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          1. Primary Indian Standards ({bundle.primary_standards.length})
        </h2>

        <div className="space-y-3">
          {bundle.primary_standards.map((prim) => (
            <div key={prim.is_id} className="p-4 border border-slate-300 rounded space-y-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {prim.is_id} ({prim.year})
                  </span>{' '}
                  — <span className="font-semibold text-slate-900">{prim.title}</span>
                </div>
                <span className="text-xs font-mono text-slate-600">
                  Sector: {prim.sector} · Score: {Math.round(prim.final_score * 100)}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-semibold text-slate-700">Version &amp; Amendments:</div>
                  <div className="text-slate-900 mt-0.5">
                    Status: <strong className="uppercase">{prim.version_guard.status}</strong>
                    {prim.version_guard.latest_amendment_no > 0 &&
                      ` · Amendment ${prim.version_guard.latest_amendment_no} (${prim.version_guard.amendment_year})`}
                  </div>
                  {prim.version_guard.hop_count > 0 && (
                    <div className="text-slate-700 mt-0.5 font-mono">
                      Supersession chain: {prim.version_guard.chain.join(' -> ')}
                    </div>
                  )}
                  {prim.version_guard.withdrawn_without_successor && (
                    <div className="text-rose-800 font-semibold mt-0.5">
                      Withdrawn without a direct replacement standard.
                    </div>
                  )}
                </div>

                <div>
                  <div className="font-semibold text-slate-700">Mandatory Certification:</div>
                  <div className="text-slate-900 mt-0.5">
                    <strong>{prim.certification.status_label}</strong>
                  </div>
                  {prim.certification.matched && (
                    <div className="text-slate-600 mt-0.5">
                      {prim.certification.legal_basis} (Verified: {prim.certification.verified_on})
                    </div>
                  )}
                  {prim.certification.warnings.map((w, idx) => (
                    <div key={idx} className="text-slate-700 mt-0.5">
                      Note: {w}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs text-slate-700 space-y-1">
                <div>
                  <strong>Scope (EN):</strong> {prim.evidence.best_en_sentence}
                </div>
                <div>
                  <strong>Scope (HI):</strong> {prim.evidence.best_hi_sentence}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Allied Standards Table */}
      <div className="space-y-2">
        <h2 className="text-base font-bold text-slate-900">
          2. Linked Companion &amp; Testing Standards ({bundle.allied_standards.length})
        </h2>
        {bundle.allied_standards.length === 0 ? (
          <div className="text-sm text-slate-500">No linked companion standards found.</div>
        ) : (
          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100 text-slate-800">
                  <th className="py-2 px-3">IS Number</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Clause Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bundle.allied_standards.map((al) => (
                  <tr key={al.is_id}>
                    <td className="py-2 px-3 font-mono font-semibold whitespace-nowrap">
                      {al.is_id} ({al.year})
                    </td>
                    <td className="py-2 px-3 font-mono whitespace-nowrap">{al.role}</td>
                    <td className="py-2 px-3 font-medium text-slate-900">{al.title}</td>
                    <td className="py-2 px-3 text-slate-600">{al.context_clause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Specification Row */}
      <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            placeholder="Specification name to save..."
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded"
          />
          <button
            onClick={handleSaveToWatchlist}
            className="px-3 py-1.5 font-medium text-white bg-slate-800 rounded hover:bg-slate-900"
          >
            Save to Watch-List
          </button>
          {saveMessage && <span className="text-slate-700 font-medium">{saveMessage}</span>}
        </div>
      </div>
    </PageFrame>
  );
}

/**
 * PAGE 9: TENDER AUDIT (M13 Line-Item Splitter + Defect Classifier + CSV/JSON Export)
 */
export function Page09TenderAudit({ retrievalMode, dataMode, onNavigate }: SharedPageProps) {
  const [selectedFile, setSelectedFile] = useState<string>('sample_tender_01.txt');
  const [customText, setCustomText] = useState<string>(globalStore.tenders['sample_tender_01.txt']);

  const handleSelectSample = (fname: string) => {
    setSelectedFile(fname);
    setCustomText(globalStore.tenders[fname] || '');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      return;
    }
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      setSelectedFile(cleanName);
      setCustomText(content);
    };
    reader.readAsText(file);
  };

  const report = useMemo(
    () => runTenderAudit(selectedFile, customText, { retrievalMode, dataMode }),
    [selectedFile, customText, retrievalMode, dataMode]
  );

  const exportAuditJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tender_audit_${report.audit_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAuditCsv = () => {
    const headers = ['line_no', 'audit_status', 'cited_is', 'recommended_is', 'finding_summary', 'remediation_advice'];
    const rows = report.lines.map((l) => [
      l.line_no,
      l.audit_status,
      l.cited_is_canonical || '',
      l.recommended_primary?.is_id || '',
      `"${l.finding_summary.replace(/"/g, '""')}"`,
      `"${l.remediation_advice.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tender_audit_${report.audit_id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageFrame
      pageNumber={9}
      title="Check Draft Tender"
      whatThisShows="Paste your draft tender lines below or load a sample tender. Each line is checked for outdated standards, missing IS numbers, mismatched standards, or invalid codes."
      nextStepLabel="IS Directory"
      nextStepPage={4}
      onNavigate={onNavigate}
    >
      {/* Tender Input Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Sample Tenders:</span>
            {Object.keys(globalStore.tenders).map((fname) => (
              <button
                key={fname}
                onClick={() => handleSelectSample(fname)}
                className={`px-2.5 py-1 font-mono rounded border ${
                  selectedFile === fname
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {fname}
              </button>
            ))}
            <label className="px-2.5 py-1 bg-white border border-slate-300 rounded cursor-pointer hover:bg-slate-100">
              Upload .txt
              <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportAuditCsv}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100"
            >
              Download CSV
            </button>
            <button
              onClick={exportAuditJson}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100"
            >
              Download JSON
            </button>
          </div>
        </div>

        <textarea
          rows={5}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          className="w-full p-3 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-800"
        />
      </div>

      {/* Simple Summary Counts */}
      <div className="grid grid-cols-5 gap-3 py-2 border-y border-slate-200 text-xs">
        {(['OK', 'OUTDATED', 'MISSING', 'MISMATCH', 'UNKNOWN_ID'] as AuditStatus[]).map((st) => (
          <div key={st}>
            <div className="font-mono text-slate-500">{st}</div>
            <div className="text-lg font-mono font-bold text-slate-900">{report.counts[st]}</div>
          </div>
        ))}
      </div>

      {/* Audit Findings Table */}
      <div className="border border-slate-300 rounded overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-slate-800">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Tender Line</th>
              <th className="py-2.5 px-3">Cited IS</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Recommended IS</th>
              <th className="py-2.5 px-3">Finding &amp; Fix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {report.lines.map((ln) => (
              <tr key={ln.line_no} className="align-top">
                <td className="py-2.5 px-3 font-mono">{ln.line_no}</td>
                <td className="py-2.5 px-3 max-w-xs text-slate-800">{ln.raw_text}</td>
                <td className="py-2.5 px-3 font-mono whitespace-nowrap">{ln.cited_is_raw || 'None'}</td>
                <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                  {ln.audit_status}
                </td>
                <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                  {ln.recommended_primary
                    ? `${ln.recommended_primary.is_id} (${ln.recommended_primary.year})`
                    : '—'}
                </td>
                <td className="py-2.5 px-3 text-slate-700">
                  <div>{ln.finding_summary}</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{ln.remediation_advice}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageFrame>
  );
}

/**
 * PAGE 10: REVIEW QUEUE & APPEND-ONLY AUDIT LOG (M14)
 */
export function Page10ReviewQueue({ role, onNavigate, triggerRefresh }: SharedPageProps) {
  const [queryOrContext, setQueryOrContext] = useState(
    'Supply of 200 mm PE 100 HDPE black pipes for underground municipal water mains'
  );
  const [recommendedIs, setRecommendedIs] = useState('SYN IS 90103');
  const [actionType, setActionType] = useState<'ACCEPT' | 'REJECT' | 'OVERRIDE'>('ACCEPT');
  const [overrideIs, setOverrideIs] = useState('SYN IS 90104');
  const [reason, setReason] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const canReview = role === 'reviewer' || role === 'admin';

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReview) {
      setFeedbackMsg({ type: 'err', text: 'Role restriction: Switch role in sidebar to "reviewer" or "admin" to submit review decisions.' });
      return;
    }
    try {
      globalStore.appendAuditLog({
        actor_role: role,
        action_type: actionType,
        query_or_context: queryOrContext,
        recommended_is: recommendedIs,
        override_is: actionType === 'OVERRIDE' ? overrideIs : null,
        mandatory_reason: reason,
        flagged_hard_negative: actionType === 'REJECT' || actionType === 'OVERRIDE',
        flagged_gold_candidate: actionType === 'ACCEPT' || actionType === 'OVERRIDE',
      });
      setReason('');
      setFeedbackMsg({
        type: 'ok',
        text: `Appended ${actionType} decision to immutable audit_log (id=${globalStore.auditLog.length}).`,
      });
      triggerRefresh();
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Error appending to audit log',
      });
    }
  };

  const handleTestImmutabilityTrigger = (op: 'UPDATE' | 'DELETE') => {
    const res = globalStore.attemptMutateAuditLog(role, 1, op);
    setFeedbackMsg({ type: 'err', text: res.error });
    triggerRefresh();
  };

  const exportHardNegatives = () => {
    const hardNegs = globalStore.auditLog.filter((r) => r.flagged_hard_negative);
    const blob = new Blob([JSON.stringify(hardNegs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hard_negatives_and_gold_candidates.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageFrame
      pageNumber={10}
      title="Review Queue & Append-Only Audit Log (M14)"
      whatThisShows="Human-in-the-loop reviewer workflow (Accept / Reject / Override with mandatory reason), append-only SQLite audit_log protected by BEFORE UPDATE and BEFORE DELETE triggers, and export of hard negatives and candidate gold rows for annotator confirmation."
      nextStepLabel="11 Watch-List"
      nextStepPage={11}
      onNavigate={onNavigate}
    >
      {!canReview && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            Current Role is <strong>{role.toUpperCase()}</strong> (Read-Only on Review Queue). Use the Sidebar Role Switcher to select <strong>reviewer</strong> or <strong>admin</strong> to submit decisions.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Submit Decision Form */}
        <form onSubmit={handleSubmitReview} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 text-xs">
          <h2 className="text-sm font-semibold text-slate-900">01. Record Reviewer Decision (Mandatory Reason)</h2>
          <div>
            <label className="block text-slate-600 mb-1">Query / Tender Line Context</label>
            <input
              type="text"
              value={queryOrContext}
              onChange={(e) => setQueryOrContext(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Recommended Standard</label>
              <input
                type="text"
                value={recommendedIs}
                onChange={(e) => setRecommendedIs(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Decision Action</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as 'ACCEPT' | 'REJECT' | 'OVERRIDE')}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono"
              >
                <option value="ACCEPT">ACCEPT (Confirm Gold)</option>
                <option value="REJECT">REJECT (Flag Hard Negative)</option>
                <option value="OVERRIDE">OVERRIDE (Hard Neg + New Target)</option>
              </select>
            </div>
          </div>

          {actionType === 'OVERRIDE' && (
            <div>
              <label className="block text-slate-600 mb-1">Override Target IS (Must exist in Registry)</label>
              <select
                value={overrideIs}
                onChange={(e) => setOverrideIs(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono"
              >
                {Array.from(globalStore.getBaseIdSet()).map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-600 mb-1">Mandatory Engineering Reason (&gt;= 5 chars)</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this recommendation was accepted, rejected, or overridden..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded"
            />
          </div>

          <button
            type="submit"
            disabled={!canReview}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            Append Decision to Immutable Audit Log
          </button>
        </form>

        {/* Immutability Trigger Verification & Hard-Negative Export */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 text-xs flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">02. SQLite Append-Only Trigger Verification &amp; Export</h2>
            <p className="text-slate-600">
              Rule #9: <code>audit_log</code> is protected by SQLite <code>BEFORE UPDATE</code> and <code>BEFORE DELETE</code> triggers that call <code>RAISE(ABORT, &apos;audit_log is append-only&apos;)</code>. Test the trigger below:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleTestImmutabilityTrigger('UPDATE')}
                className="px-3 py-1.5 font-mono text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded hover:bg-rose-100"
              >
                Simulate UPDATE on Row #1 (Expect ABORT)
              </button>
              <button
                onClick={() => handleTestImmutabilityTrigger('DELETE')}
                className="px-3 py-1.5 font-mono text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded hover:bg-rose-100"
              >
                Simulate DELETE on Row #1 (Expect ABORT)
              </button>
            </div>
            {feedbackMsg && (
              <div
                className={`p-2.5 rounded border font-mono mt-2 ${
                  feedbackMsg.type === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-600 font-mono">
              Hard Negatives: {globalStore.auditLog.filter((a) => a.flagged_hard_negative).length} · Gold Candidates:{' '}
              {globalStore.auditLog.filter((a) => a.flagged_gold_candidate).length}
            </span>
            <button
              onClick={exportHardNegatives}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800"
            >
              <Download className="w-3.5 h-3.5" />
              Export Hard Negatives (.json)
            </button>
          </div>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">03. Append-Only Audit Log (`audit_log`)</h2>
          <span className="text-xs font-mono text-slate-500">n = {globalStore.auditLog.length} rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Query / Context</th>
                <th className="py-2 px-3">Rec / Override IS</th>
                <th className="py-2 px-3">Mandatory Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {globalStore.auditLog.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono">{row.id}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{row.timestamp.slice(0, 19)}</td>
                  <td className="py-2.5 px-3 font-mono">{row.actor_role}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold">{row.action_type}</td>
                  <td className="py-2.5 px-3 max-w-xs truncate">{row.query_or_context}</td>
                  <td className="py-2.5 px-3 font-mono">
                    {row.recommended_is}
                    {row.override_is ? ` → ${row.override_is}` : ''}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{row.mandatory_reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageFrame>
  );
}
