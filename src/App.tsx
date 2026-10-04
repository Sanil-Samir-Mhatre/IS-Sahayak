import React, { useEffect, useState } from 'react';
import { globalStore } from './engine/dataset';
import {
  DEFAULT_EN_STRINGS,
  fetchLocalizedUiStrings,
  getUiStrings,
  INDIAN_LANGUAGES,
  UiTranslationStrings,
} from './engine/indianLanguages';
import { getHonestRankerLabel } from './engine/pipeline';
import { DataMode, RetrievalMode, UserRole } from './engine/types';
import { Languages } from 'lucide-react';
import {
  SimpleAskPage,
  SimpleHelpPage,
  SimpleSavedSpecsPage,
  SimpleTenderPage,
} from './components/SimpleModePages';
import {
  Page00Home,
  Page01UspShowcase,
  Page02DemoMode,
  Page03DataAndEda,
  Page04RegistryExplorer,
  Page05ReferenceGraph,
} from './components/PagesPart1';
import {
  Page06QueryUnderstanding,
  Page07RetrievalLab,
  Page08BundleBuilder,
  Page09TenderAudit,
  Page10ReviewQueue,
} from './components/PagesPart2';
import {
  Page11WatchList,
  Page12ModelLab,
  Page13Evaluation,
  Page14ResponsibleAi,
  Page15HelpAndGuide,
} from './components/PagesPart3';

export type UiMode = 'Simple' | 'Expert';
export type SimpleTab = 'ask' | 'tender' | 'saved' | 'help';

const SIMPLE_PAGES: { id: SimpleTab; label: string; subHi: string }[] = [
  { id: 'ask', label: 'Ask', subHi: 'मानक खोजें' },
  { id: 'tender', label: 'Check my tender', subHi: 'निविदा जांचें' },
  { id: 'saved', label: 'My saved specs', subHi: 'सहेजे गए मानक' },
  { id: 'help', label: 'Help', subHi: 'सहायता' },
];

const EXPERT_PAGES = [
  { idx: 0, code: '00', label: 'Home' },
  { idx: 1, code: '01', label: 'USP Showcase (14)' },
  { idx: 2, code: '02', label: 'Demo Mode (5 Scenarios)' },
  { idx: 3, code: '03', label: 'Data & EDA' },
  { idx: 4, code: '04', label: 'Registry Explorer' },
  { idx: 5, code: '05', label: 'Reference Graph' },
  { idx: 6, code: '06', label: 'Query Understanding' },
  { idx: 7, code: '07', label: 'Retrieval Lab' },
  { idx: 8, code: '08', label: 'Bundle Builder' },
  { idx: 9, code: '09', label: 'Tender Audit' },
  { idx: 10, code: '10', label: 'Review Queue' },
  { idx: 11, code: '11', label: 'Revision Watch-List' },
  { idx: 12, code: '12', label: 'Model Lab (A–G)' },
  { idx: 13, code: '13', label: 'Evaluation & KPIs (A–H)' },
  { idx: 14, code: '14', label: 'Responsible AI' },
  { idx: 15, code: '15', label: 'Help & Python Source' },
];

export default function App() {
  const [uiMode, setUiMode] = useState<UiMode>('Simple');
  const [simpleTab, setSimpleTab] = useState<SimpleTab>('ask');
  const [expertPage, setExpertPage] = useState<number>(1);
  const [role, setRole] = useState<UserRole>('officer');
  const [dataMode, setDataMode] = useState<DataMode>('COMBINED');
  const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>('hybrid_rrf');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [uiStrings, setUiStrings] = useState<UiTranslationStrings>(DEFAULT_EN_STRINGS);
  const [translateTriggerCount, setTranslateTriggerCount] = useState<number>(0);
  const [presetQuery, setPresetQuery] = useState<string | undefined>(undefined);
  const [presetDebugFake, setPresetDebugFake] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const triggerRefresh = () => setRefreshTrigger((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    setUiStrings(getUiStrings(targetLang));
    if (targetLang !== 'en') {
      fetchLocalizedUiStrings(targetLang).then((localized) => {
        if (!cancelled) {
          setUiStrings(localized);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [targetLang]);

  const handleNavigateExpert = (pageIdx: number, query?: string, debugFake?: boolean) => {
    if (query !== undefined) setPresetQuery(query);
    setPresetDebugFake(Boolean(debugFake));
    setExpertPage(pageIdx);
    window.scrollTo({ top: 0 });
  };

  const handleNavigateSimple = (tab: SimpleTab, query?: string) => {
    if (query !== undefined) setPresetQuery(query);
    setSimpleTab(tab);
    window.scrollTo({ top: 0 });
  };

  const activeStdsCount = globalStore.getActiveStandards(dataMode).length;
  const specsNeedingAttentionCount = globalStore.watchList.filter(
    (sp) =>
      sp.saved_registry_version !== globalStore.registryVersion ||
      sp.affected_by_changelog_ids.length > 0
  ).length;

  const sharedProps = {
    role,
    dataMode,
    retrievalMode,
    onNavigate: handleNavigateExpert,
    refreshTrigger,
    triggerRefresh,
    targetLang,
    uiStrings,
    onChangeTargetLang: (code: string) => {
      setTargetLang(code);
      setTranslateTriggerCount((c) => c + 1);
    },
    translateTriggerCount,
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] text-slate-900">
      {/* Left Navigation Sidebar */}
      <aside className="w-full md:w-[255px] shrink-0 bg-[#F0F2F6] border-b md:border-b-0 md:border-r border-slate-300 flex flex-col justify-between md:sticky md:top-0 md:h-screen overflow-y-auto">
        <div className="p-4 md:p-5 space-y-5">
          {/* Brand Title */}
          <div className="flex items-center justify-between md:block">
            <div>
              <div className="text-lg font-bold text-slate-900 tracking-tight">IS-Sahayak</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {uiMode === 'Simple'
                  ? uiStrings.appSubtitle
                  : 'Expert Mode · Full 16-Page Workbench'}
              </div>
            </div>
          </div>

          {/* SIMPLE MODE NAVIGATION (Only 4 pages: Ask, Check my tender, My saved specs, Help) */}
          {uiMode === 'Simple' ? (
            <nav className="grid grid-cols-2 md:grid-cols-1 gap-1.5" aria-label="Simple Navigation">
              {SIMPLE_PAGES.map((item) => {
                const isActive = simpleTab === item.id;
                const localizedLabel =
                  item.id === 'ask'
                    ? uiStrings.navAsk
                    : item.id === 'tender'
                    ? uiStrings.navTender
                    : item.id === 'saved'
                    ? uiStrings.navSaved
                    : uiStrings.navHelp;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigateSimple(item.id)}
                    className={`w-full text-left px-3.5 py-3 rounded-lg text-sm transition-colors flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-blue-900 text-white font-bold'
                        : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div>
                      <div>{localizedLabel}</div>
                      <div
                        className={`text-xs ${
                          isActive ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {item.subHi}
                      </div>
                    </div>
                    {item.id === 'saved' && specsNeedingAttentionCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-400 text-slate-950">
                        {specsNeedingAttentionCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          ) : (
            /* EXPERT MODE NAVIGATION (All 16 Pages + Role, Ranker, and Data Controls) */
            <div className="space-y-4">
              <nav className="space-y-0.5" aria-label="Expert Navigation">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  All 16 Expert Pages
                </div>
                {EXPERT_PAGES.map((p) => {
                  const isActive = expertPage === p.idx;
                  return (
                    <button
                      key={p.idx}
                      onClick={() => handleNavigateExpert(p.idx)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-blue-900 text-white font-semibold'
                          : 'text-slate-800 hover:bg-slate-200/80'
                      }`}
                    >
                      <span className="font-mono opacity-75">{p.code}</span>
                      <span className="truncate">{p.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-300 space-y-2.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Active Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                  >
                    <option value="officer">officer</option>
                    <option value="reviewer">reviewer</option>
                    <option value="admin">admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Active Ranker
                  </label>
                  <select
                    value={retrievalMode}
                    onChange={(e) => setRetrievalMode(e.target.value as RetrievalMode)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                  >
                    <option value="hybrid_rrf">Hybrid RRF (k=60)</option>
                    <option value="hybrid_rerank">Hybrid + Cross-Encoder Rerank</option>
                    <option value="learned_fusion">Learned Fusion (LightGBM)</option>
                    <option value="bm25">BM25 Lexical</option>
                    <option value="dense">Dense Multilingual</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Data Mode
                  </label>
                  <select
                    value={dataMode}
                    onChange={(e) => setDataMode(e.target.value as DataMode)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                  >
                    <option value="COMBINED">COMBINED ({activeStdsCount})</option>
                    <option value="SEED_ONLY">SEED_ONLY</option>
                    <option value="REAL_ONLY">REAL_ONLY</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer in Expert Mode */}
        {uiMode === 'Expert' && (
          <div className="p-4 border-t border-slate-300 text-xs space-y-1.5">
            <a
              href="/api/download/synthetic_dataset.zip"
              download="synthetic_dataset.zip"
              className="block px-2.5 py-1.5 text-center bg-white border border-slate-300 rounded text-slate-800 hover:bg-slate-50"
            >
              Download Dataset (.zip)
            </a>
            <a
              href="/api/download/is_sahayak_streamlit.zip"
              download="is_sahayak_streamlit_bundle.zip"
              className="block px-2.5 py-1.5 text-center bg-white border border-slate-300 rounded text-slate-800 hover:bg-slate-50"
            >
              Download Streamlit Bundle (.zip)
            </a>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header: Slim Provenance Strip + Global Simple / Expert Mode Toggle */}
        <header className="bg-white border-b border-slate-300 px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Unobtrusive Provenance & Ranker Strip (Never hidden per Non-Negotiable Rules #3 & #6) */}
          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
              SYNTHETIC DATA - NOT A VALIDATION RESULT
            </span>
            <span>
              {activeStdsCount} standards · {globalStore.registryVersion} ({globalStore.loadTimeMs} ms)
            </span>
            <span>·</span>
            <span>
              Ranker: <strong>{getHonestRankerLabel(retrievalMode)}</strong>
            </span>
          </div>

          {/* Translate to All 22 Indian Languages + Global UI Mode Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Indian Language Translate Bar */}
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-lg px-2 py-1">
              <Languages className="w-4 h-4 text-blue-900 shrink-0" />
              <label htmlFor="header-lang-select" className="text-xs font-semibold text-slate-700">
                भाषा / Language:
              </label>
              <select
                id="header-lang-select"
                value={targetLang}
                onChange={(e) => {
                  setTargetLang(e.target.value);
                  setTranslateTriggerCount((c) => c + 1);
                }}
                className="text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 cursor-pointer"
              >
                {INDIAN_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nameEn} ({lang.nameNative})
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (targetLang === 'en') {
                    setTargetLang('hi');
                  }
                  setTranslateTriggerCount((c) => c + 1);
                }}
                className="px-2.5 py-1 text-xs font-bold bg-blue-900 text-white rounded hover:bg-blue-950 transition-colors cursor-pointer"
              >
                Translate / अनुवाद
              </button>
            </div>

            {/* Global UI Mode Toggle: Simple (Default) / Expert */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Mode:</span>
              <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5">
                <button
                  onClick={() => setUiMode('Simple')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    uiMode === 'Simple'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setUiMode('Expert')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    uiMode === 'Expert'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Expert
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-6">
          {uiMode === 'Simple' ? (
            <>
              {simpleTab === 'ask' && (
                <SimpleAskPage
                  {...sharedProps}
                  presetQuery={presetQuery}
                  presetDebugFake={presetDebugFake}
                  onNavigateSimple={handleNavigateSimple}
                />
              )}
              {simpleTab === 'tender' && (
                <SimpleTenderPage
                  {...sharedProps}
                  onNavigateSimple={handleNavigateSimple}
                />
              )}
              {simpleTab === 'saved' && (
                <SimpleSavedSpecsPage
                  {...sharedProps}
                  onNavigateSimple={handleNavigateSimple}
                />
              )}
              {simpleTab === 'help' && (
                <SimpleHelpPage
                  {...sharedProps}
                  onNavigateSimple={handleNavigateSimple}
                />
              )}
            </>
          ) : (
            <>
              {expertPage === 0 && <Page00Home {...sharedProps} />}
              {expertPage === 1 && <Page01UspShowcase {...sharedProps} />}
              {expertPage === 2 && <Page02DemoMode {...sharedProps} />}
              {expertPage === 3 && <Page03DataAndEda {...sharedProps} />}
              {expertPage === 4 && <Page04RegistryExplorer {...sharedProps} />}
              {expertPage === 5 && <Page05ReferenceGraph {...sharedProps} />}
              {expertPage === 6 && <Page06QueryUnderstanding {...sharedProps} presetQuery={presetQuery} />}
              {expertPage === 7 && <Page07RetrievalLab {...sharedProps} />}
              {expertPage === 8 && (
                <Page08BundleBuilder
                  {...sharedProps}
                  presetQuery={presetQuery}
                  presetDebugFake={presetDebugFake}
                />
              )}
              {expertPage === 9 && <Page09TenderAudit {...sharedProps} />}
              {expertPage === 10 && <Page10ReviewQueue {...sharedProps} />}
              {expertPage === 11 && <Page11WatchList {...sharedProps} />}
              {expertPage === 12 && <Page12ModelLab {...sharedProps} />}
              {expertPage === 13 && <Page13Evaluation {...sharedProps} />}
              {expertPage === 14 && <Page14ResponsibleAi {...sharedProps} />}
              {expertPage === 15 && <Page15HelpAndGuide {...sharedProps} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
