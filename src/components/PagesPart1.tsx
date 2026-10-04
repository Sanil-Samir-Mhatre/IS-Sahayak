import React, { useMemo, useState } from 'react';
import { globalStore } from '../engine/dataset';
import { normalizeIsId } from '../engine/normalizer';
import { resolveCertification, resolveVersionChain, runPipeline, runTenderAudit } from '../engine/pipeline';
import { DataMode, ReferenceRole, RetrievalMode, UserRole } from '../engine/types';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Download, Play, Search, GitBranch } from 'lucide-react';

export interface SharedPageProps {
  role: UserRole;
  dataMode: DataMode;
  retrievalMode: RetrievalMode;
  onNavigate: (pageIndex: number, presetQuery?: string, debugFakeId?: boolean) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export function PageFrame({
  title,
  whatThisShows,
  children,
}: {
  pageNumber?: number;
  title: string;
  whatThisShows: string;
  nextStepLabel?: string;
  nextStepPage?: number;
  onNavigate?: (pageIdx: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600 mt-1">{whatThisShows}</p>
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}

/**
 * PAGE 0: HOME DASHBOARD (Zero search logic; purely status, architecture flow, and navigation)
 */
export function Page00Home({ dataMode, onNavigate }: SharedPageProps) {
  const activeStds = globalStore.getActiveStandards(dataMode);
  const validation = useMemo(() => globalStore.validateDataset(), [activeStds.length, globalStore.registryVersion]);

  const modules = [
    { id: 'M1', name: 'Ingestion & Pydantic Schema Validator', status: 'Active', detail: `${activeStds.length} standards, ${validation.issues.length} planted issues surfaced` },
    { id: 'M2', name: 'Typed Reference Graph (NetworkX)', status: 'Active', detail: `${globalStore.references.length} edges (2 planted orphans isolated)` },
    { id: 'M3', name: 'Bilingual Query Understanding (EN/HI/Hinglish)', status: 'Active', detail: `${globalStore.glossary.length} glossary rules + attribute & citation spans` },
    { id: 'M4', name: 'Ask-Before-Guess Clarification Engine', status: 'Active', detail: 'Max Shannon Info-Gain attribute selector (2–4 options)' },
    { id: 'M5', name: 'Multi-Field Retrieval (BM25 / Dense / RRF / Rerank)', status: 'Active', detail: 'Field-weighted BM25 + Multilingual Dense + RRF (k=60)' },
    { id: 'M6', name: 'Closed-World Citation Gate & Scope-Fit', status: 'Active', detail: `Blocks non-registry IDs (${globalStore.blockedCitationsLog.length} blocked so far)` },
    { id: 'M7', name: 'Allied Standards Expansion', status: 'Active', detail: 'Top-3 primary BFS (score * 0.7^depth, typed roles)' },
    { id: 'M8', name: 'Version Guard & Supersession Resolver', status: 'Active', detail: 'Cycle detection (90991<->90992) + 2-hop resolution (90151->90101)' },
    { id: 'M9', name: 'Certification Engine (BIS / CRS / Hallmarking)', status: 'Active', detail: `${globalStore.certificationRules.length} rules (future-dated filtered, stale flagged)` },
    { id: 'M10', name: 'Weighted Completeness Checklist Scorer', status: 'Active', detail: '6 weighted criteria + itemized missing gaps' },
    { id: 'M11', name: 'Confidence Calibrator & Abstention Gate', status: 'Active', detail: globalStore.modelBTrained ? 'Calibrated (HIGH/MEDIUM/LOW)' : 'UNCALIBRATED (Capped at MEDIUM)' },
    { id: 'M12', name: 'Bilingual Clause-Level Evidence Extractor', status: 'Active', detail: 'EN + Devanagari HI scope sentences & term highlights' },
    { id: 'M13', name: 'Tender Document Line-Item Auditor', status: 'Active', detail: 'Classifies OK / OUTDATED / MISSING / MISMATCH / UNKNOWN_ID' },
    { id: 'M14', name: 'Review Queue & Append-Only Audit Log', status: 'Active', detail: `${globalStore.auditLog.length} immutable audit rows (UPDATE/DELETE blocked)` },
    { id: 'M15', name: 'Revision Watch-List & Impact Simulator', status: 'Active', detail: `${globalStore.watchList.length} watched specs · ${globalStore.changelog.length} simulated revisions` },
    { id: 'M16', name: 'JSON Export & FastAPI /v1/* Wrapper', status: 'Active', detail: '/v1/recommend, /v1/audit, /v1/standards/{id}, /healthz' },
  ];

  return (
    <PageFrame
      pageNumber={0}
      title="Home — System Architecture & Dataset Telemetry"
      whatThisShows="System overview, live dataset counts computed from data/raw/*, Graphviz pipeline architecture (M1–M16), module health status, and quick-start navigation. Home intentionally contains zero search logic and routes all queries through run_pipeline()."
      nextStepLabel="01 USP Showcase"
      nextStepPage={1}
      onNavigate={onNavigate}
    >
      {/* Top KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500">Active Standards (M1)</div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">{activeStds.length}</div>
          <div className="text-xs text-slate-500 mt-1">Mode: {dataMode}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500">Reference Graph Edges (M2)</div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">{globalStore.references.length}</div>
          <div className="text-xs text-slate-500 mt-1">20 valid · 2 planted orphans</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500">Certification Rules (M9)</div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">{globalStore.certificationRules.length}</div>
          <div className="text-xs text-slate-500 mt-1">1 future-dated · 1 stale</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500">Gold Queries & Glossary</div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
            {globalStore.goldQueries.length} / {globalStore.glossary.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">EN, HI, Hinglish + Adversarial</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500">Data Quality Score</div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">{validation.dataQualityScore}%</div>
          <div className="text-xs text-slate-500 mt-1">{validation.issues.length} planted edge cases</div>
        </div>
      </div>

      {/* Graphviz Architecture Diagram */}
      <div className="p-5 bg-white border border-slate-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            01. Single-Entry Pipeline Architecture (`run_pipeline(query_or_ParsedQuery) -&gt; Bundle + PipelineTrace`)
          </h2>
          <span className="text-xs font-mono text-slate-500">st.graphviz_chart equivalent</span>
        </div>
        <div className="overflow-x-auto py-2">
          <svg viewBox="0 0 1060 210" className="w-full min-w-[820px] h-auto">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
              </marker>
            </defs>
            {/* Row 1: M1 -> M2 -> M3 -> M4 -> M5 -> M6 */}
            {[
              { x: 15, y: 20, id: 'M1', title: 'Ingest & Schema', sub: 'Pydantic + Hash' },
              { x: 190, y: 20, id: 'M2', title: 'Reference Graph', sub: 'NetworkX Typed' },
              { x: 365, y: 20, id: 'M3', title: 'Query NLU', sub: 'EN/HI/Hinglish' },
              { x: 540, y: 20, id: 'M4', title: 'Ask-Before-Guess', sub: 'Max Info-Gain' },
              { x: 715, y: 20, id: 'M5', title: 'Hybrid Retrieval', sub: 'BM25+Dense+RRF' },
              { x: 890, y: 20, id: 'M6', title: 'Closed-World Gate', sub: 'Citation Verifier' },
            ].map((node, idx) => (
              <g key={node.id}>
                <rect x={node.x} y={node.y} width="145" height="62" rx="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
                <text x={node.x + 12} y={node.y + 22} className="text-[11px] font-mono font-semibold" fill="#0F172A">
                  {node.id}: {node.title}
                </text>
                <text x={node.x + 12} y={node.y + 42} className="text-[10px]" fill="#475569">
                  {node.sub}
                </text>
                {idx < 5 && (
                  <line x1={node.x + 145} y1={node.y + 31} x2={node.x + 175} y2={node.y + 31} stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrow)" />
                )}
              </g>
            ))}
            {/* Connector from M6 down to M7 */}
            <path d="M 962 82 L 962 105 L 88 105 L 88 125" fill="none" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrow)" />
            {/* Row 2: M7 -> M8 -> M9 -> M10/M11 -> M12 -> M13-M16 */}
            {[
              { x: 15, y: 128, id: 'M7', title: 'Allied Expansion', sub: '0.7^depth BFS' },
              { x: 190, y: 128, id: 'M8', title: 'Version Guard', sub: 'Cycle & Chain Safe' },
              { x: 365, y: 128, id: 'M9', title: 'Cert Engine', sub: 'BIS / CRS / QCO' },
              { x: 540, y: 128, id: 'M10-11', title: 'Score & Calib', sub: 'Abstention Gate' },
              { x: 715, y: 128, id: 'M12', title: 'Clause Evidence', sub: 'EN + Devanagari' },
              { x: 890, y: 128, id: 'M13-16', title: 'Audit & FastAPI', sub: 'Bundle + Trace' },
            ].map((node, idx) => (
              <g key={node.id}>
                <rect x={node.x} y={node.y} width="145" height="62" rx="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
                <text x={node.x + 12} y={node.y + 22} className="text-[11px] font-mono font-semibold" fill="#0F172A">
                  {node.id}: {node.title}
                </text>
                <text x={node.x + 12} y={node.y + 42} className="text-[10px]" fill="#475569">
                  {node.sub}
                </text>
                {idx < 5 && (
                  <line x1={node.x + 145} y1={node.y + 31} x2={node.x + 175} y2={node.y + 31} stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrow)" />
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Quick-Start Navigation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate(8, 'Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes for municipal potable water supply')}
          className="p-4 text-left bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-colors"
        >
          <div className="text-xs font-mono text-slate-500">Page 08 · Bundle Builder</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">Build Verified Bundle</div>
          <div className="text-xs text-slate-600 mt-1">Run M1–M12 stepper with live trace</div>
        </button>
        <button
          onClick={() => onNavigate(2)}
          className="p-4 text-left bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-colors"
        >
          <div className="text-xs font-mono text-slate-500">Page 02 · Demo Mode</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">5 Guided SIH Scenarios</div>
          <div className="text-xs text-slate-600 mt-1">English, Hinglish, Superseded, Abstain, Audit</div>
        </button>
        <button
          onClick={() => onNavigate(9)}
          className="p-4 text-left bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-colors"
        >
          <div className="text-xs font-mono text-slate-500">Page 09 · Tender Audit</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">Audit Planted Tenders</div>
          <div className="text-xs text-slate-600 mt-1">Detect OUTDATED, MISMATCH &amp; UNKNOWN_ID</div>
        </button>
        <button
          onClick={() => onNavigate(12)}
          className="p-4 text-left bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-colors"
        >
          <div className="text-xs font-mono text-slate-500">Page 12 · Model Lab</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">Models A–G &amp; Calibration</div>
          <div className="text-xs text-slate-600 mt-1">Train Calibrator B &amp; Learned Fusion C</div>
        </button>
      </div>

      {/* Module Status Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">02. Module Registry &amp; Determinism Status (M1–M16)</h2>
          <span className="text-xs font-mono text-slate-500">n = 16 modules</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2.5 px-4 font-semibold">Module</th>
                <th className="py-2.5 px-4 font-semibold">Component Name</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Live Telemetry / Planted Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {modules.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{m.id}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{m.name}</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {m.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 font-mono">{m.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageFrame>
  );
}

/**
 * PAGE 1: USP SHOWCASE (14 USPs, each demonstrable in 1–2 clicks)
 */
export function Page01UspShowcase({ onNavigate }: SharedPageProps) {
  const [activeTryIndex, setActiveTryIndex] = useState<number>(0);

  const usps = [
    {
      num: 1,
      roleTag: 'Lead on Slides (PS Failure #1)',
      title: 'Verified standards bundle',
      whatUserSees: 'A primary standard plus allied standards labelled Test, Terms, Safety or Install',
      whyItMatters: 'Targets the "incomplete specification" failure in the PS',
      query: 'Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes for municipal potable water supply',
      targetPage: 8,
    },
    {
      num: 2,
      roleTag: 'Lead on Slides (PS Failure #2)',
      title: 'Latest-version guard',
      whatUserSees: 'Old citations replaced with the current standard and its latest amendment',
      whyItMatters: 'Targets the "outdated standard" failure',
      query: 'MS tubes for water line conforming to old standard SYN IS 90151:1990',
      targetPage: 8,
    },
    {
      num: 3,
      roleTag: 'Lead on Slides (PS Failure #3)',
      title: 'Tender audit',
      whatUserSees: 'An uploaded draft returns Missing, Outdated, Mismatch or OK per line',
      whyItMatters: "Works on the officer's real document, not just a search box",
      query: 'Supply of 32A C-curve 240V AC miniature circuit breakers (MCB) conforming to SYN IS 90402',
      targetPage: 9,
    },
    {
      num: 4,
      roleTag: 'Core Trust Story',
      title: 'No fake standards',
      whatUserSees: 'Every ID is checked against the registry, and invented ones are blocked and counted',
      whyItMatters: 'Removes the main risk of using AI here',
      query: '5G satellite crypto blockchain neural implant catheter with SYN IS 99999 certification',
      targetPage: 8,
      debugFake: true,
    },
    {
      num: 5,
      roleTag: 'Core Trust Story',
      title: 'Clause-level evidence',
      whatUserSees: 'The matching scope sentence is highlighted for each result',
      whyItMatters: 'Lets the officer verify in seconds',
      query: 'पेयजल आपूर्ति के लिए 80 मिमी मध्यम ग्रेड गैल्वनाइज्ड आयरन (GI) माइल्ड स्टील पाइप',
      targetPage: 8,
    },
    {
      num: 6,
      roleTag: 'Regulatory Safety',
      title: 'Dated certification engine',
      whatUserSees: 'Scheme, legal basis, source link and "verified on" date, or "no rule found in our table"',
      whyItMatters: 'Never claims "not required" without a source',
      query: 'Precast load-bearing hollow concrete masonry blocks 400x200x200 mm grade C(5.0) for building walls',
      targetPage: 8,
    },
    {
      num: 7,
      roleTag: 'Quality Gate',
      title: 'Completeness score',
      whatUserSees: 'A 0–100 bar naming the missing part, such as "no test method"',
      whyItMatters: 'Makes gaps visible before the tender goes out',
      query: 'Supply of 12W self-ballasted LED bulbs 240V 50Hz CRI >= 80 with power factor 0.90 for office lighting',
      targetPage: 8,
    },
    {
      num: 8,
      roleTag: 'Disambiguation',
      title: 'Ask before guessing',
      whatUserSees: 'One tap-to-answer question when the need is vague',
      whyItMatters: 'Prevents confident wrong answers on "pipes for water"',
      query: 'Pipes for water',
      targetPage: 6,
    },
    {
      num: 9,
      roleTag: 'Required PS Feature',
      title: 'Hindi and Hinglish input',
      whatUserSees: 'The same results from English, Devanagari or romanized queries',
      whyItMatters: 'Required by the PS and widens who can use it',
      query: 'Jal aapurti ke liye 100 mm medium grade GI lohe ka pipe aur fitting chahiye',
      targetPage: 6,
    },
    {
      num: 10,
      roleTag: 'Lifecycle Monitoring',
      title: 'Revision watch-list',
      whatUserSees: 'A banner when a saved spec cites a standard that changed',
      whyItMatters: 'Keeps tenders current after they are drafted',
      query: 'Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes',
      targetPage: 11,
    },
    {
      num: 11,
      roleTag: 'Continuous Learning',
      title: 'Officer feedback loop',
      whatUserSees: 'Accept, reject or override with a reason; overrides become test cases',
      whyItMatters: 'The system improves from real corrections',
      query: 'Pipes for high-pressure municipal water transmission mains DN 300',
      targetPage: 10,
    },
    {
      num: 12,
      roleTag: 'Core Trust Story',
      title: 'Confidence and abstention',
      whatUserSees: 'Looks right / Check this / Not sure, with "no confident match" when appropriate',
      whyItMatters: 'Shows when a human should step in',
      query: 'Quantum photonic teleportation hyperdrive flux capacitor module for interstellar spacecraft',
      targetPage: 12,
    },
    {
      num: 13,
      roleTag: 'ML Evidence',
      title: 'Learned ranking vs fixed fusion',
      whatUserSees: 'A trained ranker compared with simple rank fusion on the same queries',
      whyItMatters: 'Evidence-backed, not assumed',
      query: 'Supply and stacking of DN 300 Class K9 centrifugally cast ductile iron (DI) pressure pipes',
      targetPage: 7,
    },
    {
      num: 14,
      roleTag: 'GeM / Portal Integration',
      title: 'Portal-ready export',
      whatUserSees: 'JSON and a REST API that another portal can embed',
      whyItMatters: 'Supports the "integrates with procurement portals" requirement',
      query: 'Providing and laying 110 mm outer diameter PN 10 uPVC pipes for cold potable water distribution',
      targetPage: 8,
    },
  ];

  const activeUsp = usps[activeTryIndex];
  const livePreview = useMemo(
    () => runPipeline(activeUsp.query, { injectFakeIdDebug: Boolean(activeUsp.debugFake) }),
    [activeUsp]
  );

  return (
    <PageFrame
      pageNumber={1}
      title="USP Showcase — 14 Live Demonstrable Capabilities"
      whatThisShows="Lead with USPs 1, 2 and 3 (map 1-to-1 to the PS failures: incomplete, outdated, and omitted standards). Use 4, 5 and 12 as the trust story. Treat 9 (Hindi & Hinglish) as a required feature. Click 'Try Inline' on any row to test live."
      nextStepLabel="02 Demo Mode (5 Guided Scenarios)"
      nextStepPage={2}
      onNavigate={onNavigate}
    >
      {/* Narrative Strategy Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg">
          <div className="font-bold text-blue-950">Lead on Slides: USPs #1, #2, #3</div>
          <div className="text-slate-700 mt-1">
            Map 1-to-1 to the PS failures: <strong>Incomplete</strong> specifications (#1), <strong>Outdated</strong> standards (#2), and <strong>Omitted/Wrong</strong> tender citations (#3).
          </div>
        </div>
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
          <div className="font-bold text-emerald-950">Trust Story: USPs #4, #5, #12</div>
          <div className="text-slate-700 mt-1">
            Zero hallucinated standards (#4), highlighted clause-level evidence (#5), and calibrated abstention when unsure (#12).
          </div>
        </div>
        <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-lg">
          <div className="font-bold text-slate-900">Required Baseline: USP #9</div>
          <div className="text-slate-700 mt-1">
            English, Devanagari Hindi, and Romanized Hinglish queries return identical verified bundles.
          </div>
        </div>
      </div>

      {/* Inline Live Preview Banner */}
      <div className="p-4 bg-white border border-slate-300 rounded-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono font-semibold text-blue-900">
              LIVE INLINE EXECUTION · USP #{activeUsp.num}: {activeUsp.title}
            </span>
            <p className="text-xs font-mono text-slate-600 mt-0.5">Query: &quot;{activeUsp.query}&quot;</p>
          </div>
          <button
            onClick={() => onNavigate(activeUsp.targetPage, activeUsp.query, activeUsp.debugFake)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <span>Open in Page {String(activeUsp.targetPage).padStart(2, '0')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-200">
          <div>
            <span className="text-slate-500">Top-1 Primary Standard:</span>
            <div className="font-mono font-semibold text-slate-900 mt-0.5">
              {livePreview.bundle.confidence.abstained
                ? 'ABSTAINED (No Confident Match)'
                : `${livePreview.bundle.primary_standards[0]?.is_id} (${livePreview.bundle.primary_standards[0]?.year})`}
            </div>
            <div className="text-slate-600 truncate">{livePreview.bundle.primary_standards[0]?.title}</div>
          </div>
          <div>
            <span className="text-slate-500">Version Guard &amp; Allied:</span>
            <div className="font-mono font-semibold text-slate-900 mt-0.5">
              Chain: {livePreview.bundle.primary_standards[0]?.version_guard.chain.join(' → ')}
            </div>
            <div className="text-slate-600">{livePreview.bundle.allied_standards.length} typed allied standards</div>
          </div>
          <div>
            <span className="text-slate-500">Certification:</span>
            <div className="font-mono font-semibold text-slate-900 mt-0.5">
              {livePreview.bundle.primary_standards[0]?.certification.status_label}
            </div>
            <div className="text-slate-600">
              Verified: {livePreview.bundle.primary_standards[0]?.certification.verified_on || 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Completeness &amp; Closed-World:</span>
            <div className="font-mono font-semibold text-slate-900 mt-0.5">
              Score: {livePreview.bundle.completeness.score_pct}% · Tier: {livePreview.bundle.confidence.tier}
            </div>
            <div className="text-rose-700 font-mono">
              Blocked IDs: {livePreview.bundle.blocked_ids.map((b) => b.blocked_id).join(', ') || '0 (All Verified)'}
            </div>
          </div>
        </div>
      </div>

      {/* Complete 14-USP Specification Table */}
      <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-slate-800">
                <th className="py-2.5 px-3 font-bold">#</th>
                <th className="py-2.5 px-3 font-bold">USP</th>
                <th className="py-2.5 px-3 font-bold">What the user sees</th>
                <th className="py-2.5 px-3 font-bold">Why it matters</th>
                <th className="py-2.5 px-3 font-bold">Live Demo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {usps.map((u, idx) => {
                const isSelected = idx === activeTryIndex;
                return (
                  <tr
                    key={u.num}
                    className={isSelected ? 'bg-blue-50/50 align-top' : 'hover:bg-slate-50 align-top'}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{u.num}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{u.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{u.roleTag}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-800">{u.whatUserSees}</td>
                    <td className="py-3 px-3 text-slate-700">{u.whyItMatters}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setActiveTryIndex(idx)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded hover:bg-slate-200"
                        >
                          Try Inline
                        </button>
                        <button
                          onClick={() => onNavigate(u.targetPage, u.query, u.debugFake)}
                          className="px-2.5 py-1 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800"
                        >
                          Open Lab
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageFrame>
  );
}

/**
 * PAGE 2: DEMO MODE (5 Guided Scenarios)
 */
export function Page02DemoMode({ retrievalMode, dataMode, onNavigate }: SharedPageProps) {
  const [selectedScenario, setSelectedScenario] = useState<number>(0);

  const scenarios = [
    {
      id: 1,
      title: 'Scenario 1: Clean English Specification (GI Mild Steel Water Tubes)',
      subtitle: 'Demonstrates Primary + 4 Typed Allied Standards + Stale Verification Warning',
      mode: 'single' as const,
      query: 'Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes for municipal potable water supply',
    },
    {
      id: 2,
      title: 'Scenario 2: Romanized Hinglish Input (Glossary Expansion)',
      subtitle: 'Demonstrates Hinglish detection + glossary expansion ("lohe ka pipe", "jal aapurti") -> SYN IS 90101',
      mode: 'single' as const,
      query: 'Jal aapurti ke liye 100 mm medium grade GI lohe ka pipe aur fitting chahiye',
    },
    {
      id: 3,
      title: 'Scenario 3: Specification Citing a Two-Hop Superseded Standard',
      subtitle: 'Demonstrates Version Guard resolving SYN IS 90151 (1990) -> SYN IS 90152 (2004) -> SYN IS 90101 (2018, Amnd 2)',
      mode: 'single' as const,
      query: 'MS tubes for water line conforming to old standard SYN IS 90151:1990',
    },
    {
      id: 4,
      title: 'Scenario 4: Adversarial Out-of-Domain Query + Fake ID (SYN IS 99999)',
      subtitle: 'Demonstrates M6 Closed-World blocking SYN IS 99999 + M11 LOW Confidence Abstention',
      mode: 'single' as const,
      query: '5G satellite crypto blockchain neural implant catheter with SYN IS 99999 certification',
    },
    {
      id: 5,
      title: 'Scenario 5: Multi-Line Draft Tender Upload -> Automated Compliance Audit',
      subtitle: 'Audits sample_tender_01.txt (5 lines) catching OUTDATED, OK, MISSING, MISMATCH, and UNKNOWN_ID',
      mode: 'tender' as const,
      tenderFile: 'sample_tender_01.txt',
    },
  ];

  const active = scenarios[selectedScenario];
  const singleResult = useMemo(() => {
    if (active.mode !== 'single') return null;
    return runPipeline(active.query, { retrievalMode, dataMode });
  }, [active, retrievalMode, dataMode]);

  const tenderResult = useMemo(() => {
    if (active.mode !== 'tender') return null;
    return runTenderAudit(active.tenderFile, globalStore.tenders[active.tenderFile], { retrievalMode, dataMode });
  }, [active, retrievalMode, dataMode]);

  return (
    <PageFrame
      pageNumber={2}
      title="Demo Mode — 5 Guided SIH Evaluation Scenarios"
      whatThisShows="Step-by-step guided walkthrough of the 5 core scenarios required by the jury: (1) Clean English, (2) Hinglish with glossary expansion, (3) Two-hop superseded standard resolution, (4) Adversarial query + fake ID abstention, and (5) Full tender line-item audit."
      nextStepLabel="03 Data & EDA"
      nextStepPage={3}
      onNavigate={onNavigate}
    >
      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {scenarios.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setSelectedScenario(idx)}
            className={`p-3 text-left rounded-lg border transition-colors ${
              selectedScenario === idx
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-mono opacity-75">Scenario 0{s.id}</div>
            <div className="text-xs font-semibold mt-0.5 line-clamp-2">{s.title.replace(/^Scenario \d:\s*/, '')}</div>
          </button>
        ))}
      </div>

      {/* Active Scenario Output */}
      {active.mode === 'single' && singleResult && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{active.title}</h2>
              <p className="text-xs text-slate-600 mt-0.5">{active.subtitle}</p>
              <div className="mt-2 font-mono text-xs bg-slate-100 px-3 py-1.5 rounded text-slate-800">
                Input Query: &quot;{active.query}&quot;
              </div>
            </div>
            <button
              onClick={() => onNavigate(8, active.query)}
              className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Inspect in Bundle Builder (Page 08)
            </button>
          </div>

          {/* NLU + Confidence Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Language ID (M3 / Model F)</div>
              <div className="font-mono font-semibold text-slate-900 mt-1">
                {singleResult.bundle.parsed_query.language.toUpperCase()} ({Math.round(singleResult.bundle.parsed_query.language_confidence * 100)}%)
              </div>
              {singleResult.bundle.parsed_query.glossary_matches.length > 0 && (
                <div className="text-emerald-700 mt-1">
                  Glossary: {singleResult.bundle.parsed_query.glossary_matches.map((g) => `${g.source_term} -> ${g.expanded_term}`).join('; ')}
                </div>
              )}
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Confidence &amp; Abstention (M11)</div>
              <div className="font-mono font-semibold text-slate-900 mt-1">
                Tier: {singleResult.bundle.confidence.tier} (p={singleResult.bundle.confidence.probability})
              </div>
              <div className={singleResult.bundle.confidence.abstained ? 'text-rose-700 font-semibold mt-1' : 'text-emerald-700 mt-1'}>
                {singleResult.bundle.confidence.abstained ? 'ABSTAINED: No confident match' : 'Verified Match Accepted'}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Closed-World Gate (M6)</div>
              <div className="font-mono font-semibold text-slate-900 mt-1">
                Blocked IDs: {singleResult.bundle.blocked_ids.length}
              </div>
              {singleResult.bundle.blocked_ids.map((b, i) => (
                <div key={i} className="text-rose-700 font-mono mt-0.5">
                  Blocked {b.blocked_id} ({b.source_stage})
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Completeness Score (M10)</div>
              <div className="font-mono font-semibold text-slate-900 mt-1">{singleResult.bundle.completeness.score_pct}%</div>
              <div className="text-slate-600 mt-1">{singleResult.bundle.allied_standards.length} allied standards linked</div>
            </div>
          </div>

          {/* Primary Card */}
          {singleResult.bundle.primary_standards[0] && (
            <div className="p-4 border border-slate-200 rounded-lg space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">
                  {singleResult.bundle.confidence.abstained ? '[Unverified Reference Candidate] ' : '[Verified Primary Standard] '}
                  <span className="font-mono">{singleResult.bundle.primary_standards[0].is_id}</span> ({singleResult.bundle.primary_standards[0].year}) — {singleResult.bundle.primary_standards[0].title}
                </div>
                <span className="text-xs font-mono text-slate-600">
                  Score: {singleResult.bundle.primary_standards[0].final_score}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-mono">
                Version GuardChain: {singleResult.bundle.primary_standards[0].version_guard.chain.join(' → ')} · Amendment {singleResult.bundle.primary_standards[0].version_guard.latest_amendment_no} ({singleResult.bundle.primary_standards[0].version_guard.amendment_year || 'N/A'}) · Certification: {singleResult.bundle.primary_standards[0].certification.status_label}
              </div>
              <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div><strong>EN Evidence:</strong> {singleResult.bundle.primary_standards[0].evidence.best_en_sentence}</div>
                <div className="mt-1"><strong>HI Evidence:</strong> {singleResult.bundle.primary_standards[0].evidence.best_hi_sentence}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {active.mode === 'tender' && tenderResult && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{active.title}</h2>
              <p className="text-xs text-slate-600">{active.subtitle}</p>
            </div>
            <button
              onClick={() => onNavigate(9)}
              className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Open Full Tender Audit (Page 09)
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2 px-3">Line</th>
                  <th className="py-2 px-3">Tender Item Text</th>
                  <th className="py-2 px-3">Cited IS</th>
                  <th className="py-2 px-3">Audit Status</th>
                  <th className="py-2 px-3">Recommended Primary</th>
                  <th className="py-2 px-3">Finding &amp; Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tenderResult.lines.map((ln) => (
                  <tr key={ln.line_no} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono">{ln.line_no}</td>
                    <td className="py-2.5 px-3 max-w-xs">{ln.raw_text}</td>
                    <td className="py-2.5 px-3 font-mono">{ln.cited_is_raw || '—'}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      <span
                        className={
                          ln.audit_status === 'OK'
                            ? 'text-emerald-700'
                            : ln.audit_status === 'UNKNOWN_ID' || ln.audit_status === 'MISMATCH'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }
                      >
                        {ln.audit_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {ln.recommended_primary ? `${ln.recommended_primary.is_id}:${ln.recommended_primary.year}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div>{ln.finding_summary}</div>
                      <div className="text-slate-900 font-medium mt-0.5">{ln.remediation_advice}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageFrame>
  );
}

/**
 * PAGE 3: DATA & EDA (Counts, Histograms, Missing-Field Matrix, Orphans/Cycles, Quality Score, UMAP, Report Download)
 */
export function Page03DataAndEda({ dataMode, onNavigate }: SharedPageProps) {
  const stds = globalStore.getActiveStandards(dataMode);
  const validation = useMemo(() => globalStore.validateDataset(), [stds.length, globalStore.registryVersion]);

  // Sector breakdown
  const sectorCounts = useMemo(() => {
    const map = new Map<string, number>();
    stds.forEach((s) => map.set(s.sector, (map.get(s.sector) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [stds]);

  // Status breakdown
  const statusCounts = useMemo(() => {
    const map = { current: 0, superseded: 0, withdrawn: 0 };
    stds.forEach((s) => {
      map[s.status] = (map[s.status] || 0) + 1;
    });
    return map;
  }, [stds]);

  // Missing-field audit matrix
  const missingMatrix = useMemo(() => {
    const fields: (keyof (typeof stds)[0])[] = ['part', 'superseded_by', 'amendment_year', 'scope_text', 'source_url'];
    return fields.map((f) => {
      const missingCount = stds.filter((s) => s[f] === null || s[f] === '').length;
      return {
        field: f,
        missing: missingCount,
        present: stds.length - missingCount,
        pct_present: stds.length > 0 ? Math.round(((stds.length - missingCount) / stds.length) * 100) : 0,
      };
    });
  }, [stds]);

  // Gold query split composition
  const goldSplits = useMemo(() => {
    const counts = { train: 0, val: 0, test: 0 };
    const langs = { en: 0, hi: 0, hinglish: 0 };
    globalStore.goldQueries.forEach((q) => {
      counts[q.split]++;
      langs[q.language]++;
    });
    return { counts, langs };
  }, []);

  const downloadEdaReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      registry_version: globalStore.registryVersion,
      provenance_banner: 'SYNTHETIC DATA - NOT A VALIDATION RESULT',
      counts: {
        standards: stds.length,
        references: globalStore.references.length,
        certification_rules: globalStore.certificationRules.length,
        gold_queries: globalStore.goldQueries.length,
        glossary_terms: globalStore.glossary.length,
      },
      data_quality_score: validation.dataQualityScore,
      formula: validation.formulaExplanation,
      issues: validation.issues,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `is_sahayak_eda_report_${globalStore.registryVersion}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageFrame
      pageNumber={3}
      title="Data & Exploratory Data Analysis (M1 Validation & Quality Score)"
      whatThisShows="Distribution of standards by sector, ICS, status, and year; scope-length distribution; missing-field completeness heatmap; detected schema/orphan/cycle anomalies; gold query splits grouped by family; transparent Data Quality Score formula; and 2D embedding projection."
      nextStepLabel="04 Registry Explorer"
      nextStepPage={4}
      onNavigate={onNavigate}
    >
      {/* Data Quality Score Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-slate-500">Transparent Data Quality Formula (M1)</div>
          <div className="text-lg font-semibold text-slate-900 mt-0.5">
            Data Quality Score: <span className="font-mono tabular-nums">{validation.dataQualityScore}%</span>
          </div>
          <div className="text-xs font-mono text-slate-600 mt-1">{validation.formulaExplanation}</div>
        </div>
        <button
          onClick={downloadEdaReport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download EDA &amp; Validation Report (.json)
        </button>
      </div>

      {/* Sector & Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">01. Standards Count by Sector</h2>
            <span className="text-xs font-mono text-slate-500">n = {stds.length}</span>
          </div>
          <div className="space-y-2">
            {sectorCounts.map(([sector, cnt]) => (
              <div key={sector} className="text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-700 font-medium">{sector}</span>
                  <span className="font-mono tabular-nums text-slate-900">{cnt}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-slate-800"
                    style={{ width: `${Math.round((cnt / Math.max(1, stds.length)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-900">02. Status &amp; Gold Split Composition</h2>
              <span className="text-xs font-mono text-slate-500">n_gold = {globalStore.goldQueries.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <div className="text-slate-500">Current Standards</div>
                <div className="text-lg font-mono font-semibold text-emerald-700">{statusCounts.current}</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <div className="text-slate-500">Superseded (Chains/Cycles)</div>
                <div className="text-lg font-mono font-semibold text-amber-700">{statusCounts.superseded}</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <div className="text-slate-500">Withdrawn (No Successor)</div>
                <div className="text-lg font-mono font-semibold text-rose-700">{statusCounts.withdrawn}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-800 mb-1.5">Field Completeness Heatmap (`standards.csv`)</div>
            <div className="space-y-1.5">
              {missingMatrix.map((row) => (
                <div key={row.field} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600">{row.field}</span>
                  <span className="text-slate-900">
                    {row.present}/{stds.length} populated ({row.pct_present}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-600 font-mono pt-2 border-t border-slate-200">
            Gold Splits: Train={goldSplits.counts.train} · Val={goldSplits.counts.val} · Test={goldSplits.counts.test} | Lang: EN={goldSplits.langs.en} · HI={goldSplits.langs.hi} · Hinglish={goldSplits.langs.hinglish}
          </div>
        </div>
      </div>

      {/* Planted Anomalies Surfaced by M1 */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            03. Surfaced Schema, Cycle, Orphan &amp; Certification Anomalies (Non-Crashing M1 Validator)
          </h2>
          <span className="text-xs font-mono text-slate-500">n = {validation.issues.length} anomalies</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2 px-4">Severity</th>
                <th className="py-2 px-4">Category</th>
                <th className="py-2 px-4">Entity ID</th>
                <th className="py-2 px-4">Diagnostic Message &amp; Engine Guardrail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {validation.issues.map((iss, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-semibold">
                    <span className={iss.severity === 'ERROR' ? 'text-rose-700' : 'text-amber-700'}>{iss.severity}</span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-800">{iss.category}</td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{iss.entity_id}</td>
                  <td className="py-2.5 px-4 text-slate-600">
                    <div className="font-medium text-slate-900">{iss.message}</div>
                    <div>{iss.details}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageFrame>
  );
}

/**
 * PAGE 4: REGISTRY EXPLORER (Search/Filter Standards + IS-ID Normalizer Testbench)
 */
export function Page04RegistryExplorer({ dataMode, onNavigate }: SharedPageProps) {
  const stds = globalStore.getActiveStandards(dataMode);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showNormalizer, setShowNormalizer] = useState<boolean>(false);
  const [normInput, setNormInput] = useState('IS 1239 (Part 1) : 2004');

  const normPresets = [
    'IS 1239 (Part 1) : 2004',
    'IS:1239',
    'IS1239',
    'IS 1239-1',
    'IS 1239 Pt 1',
    'SYN IS 90101',
    'SYN IS 90101:2015',
    'SYN IS 90101 (Part 2)',
  ];

  const normResult = useMemo(() => normalizeIsId(normInput), [normInput]);

  const filteredStds = useMemo(() => {
    return stds.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (!filterText.trim()) return true;
      const q = filterText.toLowerCase();
      return (
        s.is_id.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.scope_text.toLowerCase().includes(q) ||
        s.ics_code.toLowerCase().includes(q) ||
        s.family.toLowerCase().includes(q)
      );
    });
  }, [stds, filterText, statusFilter]);

  return (
    <PageFrame
      pageNumber={4}
      title="Step 3: Browse Indian Standards (IS) Directory"
      whatThisShows="Search and browse all Indian Standards in our verified registry. Check which standards are current, which older standards have been replaced, and whether BIS certification is required."
      nextStepLabel="Step 4: Saved Watch-List"
      nextStepPage={11}
      onNavigate={onNavigate}
    >
      {/* Simple Search & Filter Bar */}
      <div className="p-5 bg-white border border-slate-300 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search by IS number, product name (e.g. pipe, cable, cement, LED), or Hindi keywords..."
              className="w-full pl-11 pr-4 py-3 text-base bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-900"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
            {[
              { id: 'ALL', label: 'All Standards' },
              { id: 'current', label: 'Current Only' },
              { id: 'superseded', label: 'Replaced / Old' },
              { id: 'withdrawn', label: 'Withdrawn' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  statusFilter === st.id
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional IS Code Format Converter Toggle */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-600">
            Showing <strong>{filteredStds.length}</strong> of {stds.length} Indian Standards
          </span>
          <button
            onClick={() => setShowNormalizer(!showNormalizer)}
            className="text-sm font-semibold text-blue-900 underline hover:text-blue-700"
          >
            {showNormalizer ? 'Hide IS Code Format Converter' : 'Open IS Code Format Converter (e.g. IS:1239 → IS 1239)'}
          </button>
        </div>

        {showNormalizer && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-sm font-bold text-slate-900">
              Standardize Any Messy IS Code Format
            </div>
            <div className="flex flex-wrap gap-1.5">
              {normPresets.map((p) => (
                <button
                  key={p}
                  onClick={() => setNormInput(p)}
                  className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                    normInput === p
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <input
                type="text"
                value={normInput}
                onChange={(e) => setNormInput(e.target.value)}
                className="px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg"
                placeholder="Enter any IS code format..."
              />
              <div className="md:col-span-2 text-sm font-mono bg-white p-2.5 rounded-lg border border-slate-200">
                {normResult ? (
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span><strong>Standard ID:</strong> {normResult.base_id}</span>
                    <span>·</span>
                    <span><strong>Part:</strong> {normResult.part || 'None'}</span>
                    <span>·</span>
                    <span><strong>Year:</strong> {normResult.year || 'None'}</span>
                  </div>
                ) : (
                  <span className="text-rose-700">Unrecognized IS format</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clean, Readable Standards Table */}
      <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-slate-800">
                <th className="py-3.5 px-4 font-bold">IS Number</th>
                <th className="py-3.5 px-4 font-bold">Year &amp; Amendment</th>
                <th className="py-3.5 px-4 font-bold">Title &amp; Scope Summary</th>
                <th className="py-3.5 px-4 font-bold">Current Status</th>
                <th className="py-3.5 px-4 font-bold">BIS Certification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStds.map((s, i) => {
                const vg = resolveVersionChain(s.is_id, globalStore);
                const cert = resolveCertification(s, globalStore);
                return (
                  <tr key={`${s.is_id}-${s.part}-${i}`} className="hover:bg-slate-50 align-top">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div className="text-base text-blue-950">{s.is_id}</div>
                      {s.part && <div className="text-slate-600 text-xs mt-0.5">{s.part}</div>}
                    </td>
                    <td className="py-4 px-4 font-mono tabular-nums whitespace-nowrap">
                      <div className="font-bold text-slate-900">{s.year}</div>
                      {s.latest_amendment_no > 0 ? (
                        <div className="text-slate-600 text-xs mt-0.5">
                          Amendment {s.latest_amendment_no} ({s.amendment_year})
                        </div>
                      ) : (
                        <div className="text-slate-500 text-xs mt-0.5">No amendments</div>
                      )}
                    </td>
                    <td className="py-4 px-4 max-w-md">
                      <div className="font-bold text-slate-900 text-base">{s.title}</div>
                      <div className="text-slate-700 mt-1 line-clamp-2 leading-relaxed">{s.scope_text}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Sector: {s.sector} · ICS {s.ics_code}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                          vg.cycle_detected || vg.withdrawn_without_successor
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : vg.hop_count > 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {s.status === 'current'
                          ? 'Current & Active'
                          : s.status === 'superseded'
                          ? 'Replaced by Newer'
                          : 'Withdrawn'}
                      </span>
                      {vg.hop_count > 0 && (
                        <div className="text-xs font-mono text-slate-700 mt-1.5">
                          Use instead: <strong>{vg.resolved_is_id}</strong>
                        </div>
                      )}
                      {vg.cycle_detected && (
                        <div className="text-xs text-rose-800 font-semibold mt-1">
                          Circular reference warning
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <div className="font-semibold text-slate-900">{cert.status_label}</div>
                      {cert.verified_on && (
                        <div className="text-xs text-slate-600 mt-0.5">
                          Verified on: {cert.verified_on}
                        </div>
                      )}
                      {cert.is_stale && (
                        <div className="text-xs text-amber-800 font-medium mt-1">
                          Verification older than 180 days
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageFrame>
  );
}

/**
 * PAGE 5: REFERENCE GRAPH (NetworkX Typed Multigraph + Cycle-Safe Traversal + Orphans)
 */
export function Page05ReferenceGraph({ onNavigate }: SharedPageProps) {
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [rootNode, setRootNode] = useState<string>('SYN IS 90101');
  const [maxDepth, setMaxDepth] = useState<number>(2);

  const registryIds = useMemo(() => globalStore.getBaseIdSet(), []);

  const filteredEdges = useMemo(() => {
    return globalStore.references.filter((r) => selectedRole === 'ALL' || r.role === selectedRole);
  }, [selectedRole]);

  // Depth-limited cycle-safe BFS traversal from rootNode
  const traversalPaths = useMemo(() => {
    const results: { target: string; depth: number; role: ReferenceRole; isOrphan: boolean; path: string; clause: string }[] = [];
    const queue: { id: string; depth: number; path: string[] }[] = [{ id: rootNode, depth: 0, path: [rootNode] }];
    const visited = new Set<string>([rootNode]);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.depth >= maxDepth) continue;
      const out = globalStore.references.filter((r) => r.from_is === curr.id);
      for (const edge of out) {
        const isOrphan = !registryIds.has(edge.to_is);
        const nextPath = [...curr.path, `${edge.to_is} (${edge.role})`];
        results.push({
          target: edge.to_is,
          depth: curr.depth + 1,
          role: edge.role,
          isOrphan,
          path: nextPath.join(' → '),
          clause: edge.context_text,
        });
        if (!visited.has(edge.to_is) && !isOrphan) {
          visited.add(edge.to_is);
          queue.push({ id: edge.to_is, depth: curr.depth + 1, path: nextPath });
        }
      }
    }
    return results;
  }, [rootNode, maxDepth, registryIds]);

  return (
    <PageFrame
      pageNumber={5}
      title="Reference Graph — Typed Cross-Standard Network (M2)"
      whatThisShows="Directed multigraph of normative references (test_method, terminology, safety, installation, related_product), depth-limited cycle-safe traversal paths with score decay (0.7^depth), and closed-world isolation of planted orphan references (SYN IS 99001, SYN IS 99002)."
      nextStepLabel="06 Query Understanding"
      nextStepPage={6}
      onNavigate={onNavigate}
    >
      {/* Traversal Controls */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-slate-700">
            Root Primary Standard:
            <select
              value={rootNode}
              onChange={(e) => setRootNode(e.target.value)}
              className="ml-2 px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded"
            >
              {['SYN IS 90101', 'SYN IS 90102', 'SYN IS 90103', 'SYN IS 90104', 'SYN IS 90201', 'SYN IS 90301', 'SYN IS 90401', 'SYN IS 90501', 'SYN IS 90601'].map(
                (id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                )
              )}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-700">
            Max BFS Depth:
            <select
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="ml-2 px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded"
            >
              <option value={1}>Depth 1 (Direct Allied)</option>
              <option value={2}>Depth 2 (2-Hop Allied)</option>
              <option value={3}>Depth 3</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {['ALL', 'test_method', 'terminology', 'safety', 'installation', 'related_product'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                selectedRole === r ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Traversal Output from Selected Root */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <GitBranch className="w-4 h-4" />
            <span>01. Cycle-Safe Traversal from {rootNode} (max_depth={maxDepth})</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">n = {traversalPaths.length} paths</span>
        </div>
        <div className="space-y-2">
          {traversalPaths.map((p, idx) => (
            <div
              key={idx}
              className={`p-3 rounded border text-xs ${
                p.isOrphan ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                <span className="font-semibold text-slate-900">{p.path}</span>
                <span className={p.isOrphan ? 'text-rose-700 font-semibold' : 'text-slate-600'}>
                  {p.isOrphan
                    ? 'BLOCKED ORPHAN (Not in standards.csv)'
                    : `Depth=${p.depth} · Decay Multiplier=${Math.pow(0.7, p.depth).toFixed(2)}`}
                </span>
              </div>
              <div className="text-slate-600 mt-1">{p.clause}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Edge Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">02. Normative Reference Edges (`references.csv`)</h2>
          <span className="text-xs font-mono text-slate-500">n = {filteredEdges.length} edges</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2 px-3">From Primary IS</th>
                <th className="py-2 px-3">To Allied IS</th>
                <th className="py-2 px-3">Typed Role</th>
                <th className="py-2 px-3">Role Source</th>
                <th className="py-2 px-3">Registry Verification</th>
                <th className="py-2 px-3">Normative Clause Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEdges.map((e, i) => {
                const isOrphan = !registryIds.has(e.to_is) || !registryIds.has(e.from_is);
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{e.from_is}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{e.to_is}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">{e.role}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{e.role_source}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {isOrphan ? (
                        <span className="text-rose-700 font-semibold">ORPHAN (Blocked by M6)</span>
                      ) : (
                        <span className="text-emerald-700">Verified in Registry</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{e.context_text}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageFrame>
  );
}
