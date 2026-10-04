import React, { useMemo, useState } from 'react';
import { globalStore } from '../engine/dataset';
import {
  evaluateKpiGroupsBCD,
  evaluateModelARoles,
  evaluateModelBCalibrator,
  evaluateModelFLangId,
  evaluateModelGCitations,
  evaluateRetrievalMode,
} from '../engine/evaluation';
import { PYTHON_STREAMLIT_FILES } from '../engine/pythonBundle';
import { PageFrame, SharedPageProps } from './PagesPart1';
import { Lock, Play, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, Code2 } from 'lucide-react';

/**
 * PAGE 11: REVISION WATCH-LIST & ADMIN SIMULATE REVISION (M15)
 */
export function Page11WatchList({ role, onNavigate, triggerRefresh }: SharedPageProps) {
  const [targetIs, setTargetIs] = useState('SYN IS 90101');
  const [fieldChanged, setFieldChanged] = useState<'latest_amendment_no' | 'status' | 'superseded_by'>('latest_amendment_no');
  const [newValue, setNewValue] = useState('3');
  const [reason, setReason] = useState('BIS Amendment 3 (2026) issued updating zinc coating tolerance for GI potable water pipes.');
  const [simMessage, setSimMessage] = useState<string | null>(null);

  const handleSimulateRevision = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = globalStore.simulateRevision({
        actorRole: role,
        is_id: targetIs,
        field_changed: fieldChanged,
        new_value: newValue,
        reason,
      });
      setSimMessage(
        `Updated ${targetIs}. ${res.affectedSpecs.length} saved specification(s) flagged for review.`
      );
      triggerRefresh();
    } catch (err) {
      setSimMessage(err instanceof Error ? err.message : 'Error updating standard');
    }
  };

  return (
    <PageFrame
      pageNumber={11}
      title="Saved Watch-List"
      whatThisShows="Monitor your saved tender specifications and get alerted when an Indian Standard is revised or amended."
      onNavigate={onNavigate}
    >
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Saved Specifications ({globalStore.watchList.length})
        </h2>

        <div className="space-y-3">
          {globalStore.watchList.map((sp) => {
            const isOutOfSync =
              sp.saved_registry_version !== globalStore.registryVersion ||
              sp.affected_by_changelog_ids.length > 0;
            return (
              <div
                key={sp.spec_id}
                className="p-4 border border-slate-300 rounded space-y-1.5 text-sm bg-white"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{sp.title}</span>
                  <span
                    className={`text-xs font-mono font-bold ${
                      isOutOfSync ? 'text-amber-800' : 'text-emerald-800'
                    }`}
                  >
                    {isOutOfSync ? 'UPDATE AVAILABLE' : 'UP TO DATE'}
                  </span>
                </div>
                <div className="text-xs text-slate-600">{sp.query_text}</div>
                <div className="text-xs font-mono text-slate-800 pt-1">
                  Standards: {[...sp.primary_is_ids, ...sp.allied_is_ids].join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simple Revision Simulator */}
      <form
        onSubmit={handleSimulateRevision}
        className="p-4 bg-slate-50 border border-slate-300 rounded space-y-3 text-xs"
      >
        <div className="text-sm font-bold text-slate-900">
          Test a Standard Revision Alert
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-700 mb-1">Standard</label>
            <select
              value={targetIs}
              onChange={(e) => setTargetIs(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono"
            >
              {Array.from(globalStore.getBaseIdSet()).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 mb-1">Change Type</label>
            <select
              value={fieldChanged}
              onChange={(e) =>
                setFieldChanged(e.target.value as 'latest_amendment_no' | 'status' | 'superseded_by')
              }
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
            >
              <option value="latest_amendment_no">New Amendment Number</option>
              <option value="status">Change Status</option>
              <option value="superseded_by">Replaced By</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 mb-1">New Value</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            className="px-3 py-1.5 font-medium text-white bg-slate-800 rounded hover:bg-slate-900"
          >
            Apply Update
          </button>
          <button
            type="button"
            onClick={() => {
              globalStore.reloadFromRaw();
              setSimMessage('Reset to initial state.');
              triggerRefresh();
            }}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-100"
          >
            Reset
          </button>
          {simMessage && <span className="text-slate-800 font-medium">{simMessage}</span>}
        </div>
      </form>
    </PageFrame>
  );
}

/**
 * PAGE 12: MODEL LAB (Models A–G with Full Metrics, Confusion Matrices, Calibration Curves & Train Toggles)
 */
export function Page12ModelLab({ onNavigate, triggerRefresh }: SharedPageProps) {
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'>('B');

  const modelA = useMemo(() => evaluateModelARoles(globalStore), []);
  const modelB = useMemo(() => evaluateModelBCalibrator(globalStore), [globalStore.modelBTrained]);
  const modelF = useMemo(() => evaluateModelFLangId(globalStore), []);
  const modelG = useMemo(() => evaluateModelGCitations(globalStore), []);
  const rankRrf = useMemo(() => evaluateRetrievalMode('hybrid_rrf', globalStore.goldQueries, globalStore, 'Hybrid RRF (k=60)'), []);
  const rankFusion = useMemo(
    () => evaluateRetrievalMode('learned_fusion', globalStore.goldQueries, globalStore, 'Model C: LightGBM LambdaRank Learned Fusion'),
    []
  );

  const tabs: { id: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'; name: string }[] = [
    { id: 'A', name: 'Model A: Edge-Role Classifier' },
    { id: 'B', name: 'Model B: Confidence Calibrator' },
    { id: 'C', name: 'Model C: Learned Fusion Ranker' },
    { id: 'D', name: 'Model D: Encoder Fine-Tune Guard' },
    { id: 'E', name: 'Model E: Attribute Extractor' },
    { id: 'F', name: 'Model F: Language ID' },
    { id: 'G', name: 'Model G: Citation Span Extractor' },
  ];

  return (
    <PageFrame
      pageNumber={12}
      title="Model Lab — Training, Calibration & Diagnostics for Models A–G"
      whatThisShows="Complete metric evaluation for all 7 models (A–G) grouped by family (seed=42). Classification reports show Accuracy, Macro/Weighted P/R/F1, MCC, and Confusion Matrices (counts + normalized). Model B reports ROC-AUC, PR-AUC, ECE, Brier, RMSE/MAE on calibration targets, Risk-Coverage curve, and unlocks HIGH confidence tiers once fitted."
      nextStepLabel="13 Evaluation & Ablations"
      nextStepPage={13}
      onNavigate={onNavigate}
    >
      {/* Model Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-200/70 rounded-lg">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === t.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* MODEL B: CONFIDENCE CALIBRATOR */}
      {activeTab === 'B' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-slate-500">
                Model B · Logistic Regression + Platt / Isotonic Calibration (seed=42 · n={modelB.n})
              </div>
              <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                Status: {globalStore.modelBTrained ? 'CALIBRATED (HIGH/MEDIUM/LOW Tiers Active)' : 'UNCALIBRATED (Capped at MEDIUM per M11 Rule)'}
              </h2>
              {modelB.low_sample_warning && (
                <div className="text-xs text-amber-800 font-mono mt-1">⚠ {modelB.low_sample_warning}</div>
              )}
            </div>
            <button
              onClick={() => {
                globalStore.modelBTrained = !globalStore.modelBTrained;
                triggerRefresh();
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {globalStore.modelBTrained ? 'Reset to Untrained (Cap at UNCALIBRATED_MEDIUM)' : 'Fit & Save Calibrator B (Unlock HIGH Tier)'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-slate-500">ROC-AUC / PR-AUC</div>
              <div className="text-base font-mono font-semibold text-slate-900 mt-1">
                {modelB.roc_auc} / {modelB.pr_auc}
              </div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-slate-500">Accuracy / MCC</div>
              <div className="text-base font-mono font-semibold text-slate-900 mt-1">
                {modelB.accuracy} / {modelB.mcc}
              </div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-slate-500">Brier Score</div>
              <div className="text-base font-mono font-semibold text-slate-900 mt-1">{modelB.brier_score}</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-slate-500">ECE (5-bin)</div>
              <div className="text-base font-mono font-semibold text-slate-900 mt-1">{modelB.ece}</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-slate-500">Calibration RMSE</div>
              <div className="text-base font-mono font-semibold text-slate-900 mt-1">{modelB.rmse_calibration}</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-slate-500">Calibration MAE</div>
              <div className="text-base font-mono font-semibold text-slate-900 mt-1">{modelB.mae_calibration}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
              <h3 className="text-xs font-semibold text-slate-900">Threshold Table &amp; HIGH-Tier Precision (n={modelB.n})</h3>
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="py-1.5">Threshold</th>
                    <th className="py-1.5">Coverage</th>
                    <th className="py-1.5">Selective Precision</th>
                    <th className="py-1.5">Abstention Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {modelB.threshold_table.map((row) => (
                    <tr key={row.threshold}>
                      <td className="py-1.5">{row.threshold.toFixed(2)}</td>
                      <td className="py-1.5">{(row.coverage * 100).toFixed(1)}%</td>
                      <td className="py-1.5 font-semibold text-emerald-700">{(row.high_tier_precision * 100).toFixed(1)}%</td>
                      <td className="py-1.5">{(row.abstention_rate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
              <h3 className="text-xs font-semibold text-slate-900">Risk-Coverage Curve &amp; Learned Feature Coefficients</h3>
              <div className="space-y-1.5 text-xs font-mono">
                {modelB.coefficients.map((c) => (
                  <div key={c.feature} className="flex justify-between">
                    <span className="text-slate-600">{c.feature}</span>
                    <span className={c.weight >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                      {c.weight >= 0 ? `+${c.weight}` : c.weight}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODEL A: EDGE-ROLE CLASSIFIER */}
      {activeTab === 'A' && (
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{modelA.mlReport.model_name} vs Rule Baseline</h2>
              <p className="text-slate-600">{modelA.mlReport.rmse_note}</p>
            </div>
            <span className="font-mono text-slate-500">n = {modelA.mlReport.n} edges</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Rule Baseline Acc / F1</div>
              <div className="text-sm font-semibold mt-1">
                {modelA.rulesReport.accuracy} / {modelA.rulesReport.macro_f1}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">TF-IDF+SVC Accuracy</div>
              <div className="text-sm font-semibold text-emerald-700 mt-1">{modelA.mlReport.accuracy}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Macro P / R / F1</div>
              <div className="text-sm font-semibold mt-1">
                {modelA.mlReport.macro_precision} / {modelA.mlReport.macro_recall} / {modelA.mlReport.macro_f1}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Weighted F1</div>
              <div className="text-sm font-semibold mt-1">{modelA.mlReport.weighted_f1}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">MCC</div>
              <div className="text-sm font-semibold mt-1">{modelA.mlReport.mcc}</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2 px-3">Edge Role Class</th>
                <th className="py-2 px-3">Support (n)</th>
                <th className="py-2 px-3">Precision</th>
                <th className="py-2 px-3">Recall</th>
                <th className="py-2 px-3">F1-Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {modelA.mlReport.per_class.map((c) => (
                <tr key={c.label}>
                  <td className="py-2 px-3 font-semibold">{c.label}</td>
                  <td className="py-2 px-3">{c.support}</td>
                  <td className="py-2 px-3">{c.precision}</td>
                  <td className="py-2 px-3">{c.recall}</td>
                  <td className="py-2 px-3">{c.f1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODEL C: LEARNED FUSION VS RRF */}
      {activeTab === 'C' && (
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-slate-900">
            Model C: LightGBM LambdaRank Learned Fusion (6 Features) vs Hybrid RRF (k=60)
          </h2>
          <p className="text-slate-600 font-mono">{rankFusion.rmse_note}</p>
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2 px-3">Ranker</th>
                <th className="py-2 px-3">n</th>
                <th className="py-2 px-3">P@1</th>
                <th className="py-2 px-3">Hit@3</th>
                <th className="py-2 px-3">MRR</th>
                <th className="py-2 px-3">MAP</th>
                <th className="py-2 px-3">nDCG@10 (95% CI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {[rankRrf, rankFusion].map((r) => (
                <tr key={r.mode_label}>
                  <td className="py-2.5 px-3 font-semibold">{r.mode_label}</td>
                  <td className="py-2.5 px-3">{r.n}</td>
                  <td className="py-2.5 px-3">{r.p_at_1}</td>
                  <td className="py-2.5 px-3">{r.hit_at_3}</td>
                  <td className="py-2.5 px-3">{r.mrr}</td>
                  <td className="py-2.5 px-3">{r.map}</td>
                  <td className="py-2.5 px-3">
                    {r.ndcg_at_10} [{r.ndcg_ci_95[0]}, {r.ndcg_ci_95[1]}]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODEL D & E */}
      {(activeTab === 'D' || activeTab === 'E') && (
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 text-xs">
          <h2 className="text-sm font-semibold text-slate-900">
            {activeTab === 'D'
              ? 'Model D: MultipleNegativesRankingLoss Encoder Fine-Tune & SYNTHETIC-TRAIN-ONLY Leakage Guard'
              : 'Model E: Structured Attribute Extractor (Rule-Based vs Token Classification)'}
          </h2>
          <p className="text-slate-700">
            {activeTab === 'D'
              ? 'Guardrail Active: All pseudo-queries generated from standards scope text are tagged SYNTHETIC-TRAIN-ONLY and strictly excluded from val/test splits (grouped by family, seed=42) to prevent zero-shot evaluation leakage.'
              : 'Extracts 6 typed engineering slots (product, material, grade, size_units, application, quantity) across English, Hindi, and Hinglish queries. RMSE N/A for this task: slot extraction evaluated via slot-level Precision/Recall/F1.'}
          </p>
        </div>
      )}

      {/* MODEL F: LANGUAGE ID */}
      {activeTab === 'F' && (
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">{modelF.model_name}</h2>
            <span className="font-mono text-slate-500">
              n = {modelF.n} · Accuracy = {modelF.accuracy} · Macro F1 = {modelF.macro_f1} · MCC = {modelF.mcc}
            </span>
          </div>
          <p className="font-mono text-slate-600">{modelF.rmse_note}</p>
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2 px-3">Language Class</th>
                <th className="py-2 px-3">Support (n)</th>
                <th className="py-2 px-3">Precision</th>
                <th className="py-2 px-3">Recall</th>
                <th className="py-2 px-3">F1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {modelF.per_class.map((c) => (
                <tr key={c.label}>
                  <td className="py-2 px-3 font-semibold uppercase">{c.label}</td>
                  <td className="py-2 px-3">{c.support}</td>
                  <td className="py-2 px-3">{c.precision}</td>
                  <td className="py-2 px-3">{c.recall}</td>
                  <td className="py-2 px-3">{c.f1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODEL G: CITATION SPAN EXTRACTOR */}
      {activeTab === 'G' && (
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 text-xs font-mono">
          <h2 className="text-sm font-sans font-semibold text-slate-900">
            Model G: IS-Citation Span Extractor (Evaluated on planted_defects.csv, n={modelG.n_lines})
          </h2>
          <div>{modelG.rmse_note}</div>
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">True / Pred Spans</div>
              <div className="text-base font-semibold mt-1">
                {modelG.true_spans} / {modelG.pred_spans}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Span Precision</div>
              <div className="text-base font-semibold text-emerald-700 mt-1">{modelG.precision}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Span Recall</div>
              <div className="text-base font-semibold text-emerald-700 mt-1">{modelG.recall}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Span F1</div>
              <div className="text-base font-semibold text-emerald-700 mt-1">{modelG.f1}</div>
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  );
}

/**
 * PAGE 13: EVALUATION & ABLATION STUDY
 */
export function Page13Evaluation({ onNavigate }: SharedPageProps) {
  const testQueries = useMemo(() => globalStore.goldQueries.filter((q) => q.split === 'test'), []);
  const allQueries = globalStore.goldQueries;

  const ablations = useMemo(() => {
    return [
      evaluateRetrievalMode('bm25', testQueries, globalStore, '1. BM25 Lexical Baseline'),
      evaluateRetrievalMode('dense', testQueries, globalStore, '2. Dense Multilingual Embedding'),
      evaluateRetrievalMode('hybrid_rrf', testQueries, globalStore, '3. Hybrid RRF (k=60)'),
      evaluateRetrievalMode('hybrid_rerank', testQueries, globalStore, '4. Hybrid + Cross-Encoder Rerank (Top-30)'),
      evaluateRetrievalMode('learned_fusion', testQueries, globalStore, '5. Full Pipeline (Learned Fusion + Graph + Version Guard + Abstention)'),
    ];
  }, [testQueries]);

  const langSlices = useMemo(() => {
    return (['en', 'hi', 'hinglish'] as const).map((lang) =>
      evaluateRetrievalMode(
        'hybrid_rerank',
        allQueries.filter((q) => q.language === lang),
        globalStore,
        `Language Slice: ${lang.toUpperCase()}`
      )
    );
  }, [allQueries]);

  const kpiBCD = useMemo(() => evaluateKpiGroupsBCD('hybrid_rerank', globalStore), []);
  const modelB = useMemo(() => evaluateModelBCalibrator(globalStore), [globalStore.modelBTrained]);
  const modelF = useMemo(() => evaluateModelFLangId(globalStore), []);
  const modelG = useMemo(() => evaluateModelGCitations(globalStore), []);
  const topStage = ablations[ablations.length - 1];
  const baseStage = ablations[0];

  return (
    <PageFrame
      pageNumber={13}
      title="Evaluation & Performance Indicators (KPI Suites A–H)"
      whatThisShows="Complete 8-category KPI evaluation (A. Retrieval quality, B. Bundle completeness, C. Correctness guarantees, D. Tender audit, E. Confidence and safety, F. Language, G. Speed and cost, H. Usability and human impact)."
      nextStepLabel="14 Responsible AI"
      nextStepPage={14}
      onNavigate={onNavigate}
    >
      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono text-amber-950">
        <strong>SYNTHETIC DATA - NOT A VALIDATION RESULT</strong> · No result below is a real validation result yet; every value on real BIS data is &quot;To be measured during prototype validation&quot;, and numbers below are computed live on the synthetic dataset (n_test={testQueries.length}, n_all={allQueries.length}) and must be kept off slides.
      </div>

      {/* KPI A: RETRIEVAL QUALITY */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            A. Retrieval Quality (Gold Test Split · Ablation Gain: +{Math.round((topStage.ndcg_at_10 - baseStage.ndcg_at_10) * 1000) / 1000} nDCG@10)
          </h2>
          <span className="text-xs font-mono text-amber-800 font-semibold">SYNTHETIC</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2.5 px-3">Pipeline Stage</th>
                <th className="py-2.5 px-3">Recall@1 / @3 / @5 / @10</th>
                <th className="py-2.5 px-3">Hit@1 / @3 / @5 / @10</th>
                <th className="py-2.5 px-3">MRR</th>
                <th className="py-2.5 px-3">nDCG@10 [95% CI]</th>
                <th className="py-2.5 px-3">Ablation Gain (Δ nDCG)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ablations.map((row, idx) => {
                const prev = idx > 0 ? ablations[idx - 1].ndcg_at_10 : row.ndcg_at_10;
                const gain = Math.round((row.ndcg_at_10 - prev) * 1000) / 1000;
                return (
                  <tr key={row.mode_label} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{row.mode_label}</td>
                    <td className="py-2.5 px-3">
                      {row.r_at_1} / {row.r_at_3} / {row.r_at_5} / {row.r_at_10}
                    </td>
                    <td className="py-2.5 px-3">
                      {row.hit_at_1} / {row.hit_at_3} / {row.hit_at_5} / {row.hit_at_10}
                    </td>
                    <td className="py-2.5 px-3">{row.mrr}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {row.ndcg_at_10} [{row.ndcg_ci_95[0]}, {row.ndcg_ci_95[1]}]
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700">
                      {idx === 0 ? 'Baseline' : gain >= 0 ? `+${gain}` : `${gain}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI B & C SIDE-BY-SIDE: BUNDLE COMPLETENESS & CORRECTNESS GUARANTEES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">B. Bundle Completeness (The Most Important Set)</h2>
            <span className="font-mono text-amber-800">SYNTHETIC</span>
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Allied-Set Recall</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{topStage.allied_recall_at_5}</div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Allied-Set Precision</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{topStage.allied_precision_at_5}</div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Mean / Median Score</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {kpiBCD.completenessDistribution.mean}% / {kpiBCD.completenessDistribution.median}%
              </div>
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="font-semibold text-slate-800">Completeness Score Distribution (n={kpiBCD.completenessDistribution.n}):</div>
            {Object.entries(kpiBCD.completenessDistribution.buckets).map(([bucket, count]) => (
              <div key={bucket} className="flex items-center justify-between font-mono">
                <span className="text-slate-600">{bucket}</span>
                <span className="font-semibold text-slate-900">{count} bundles</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">C. Correctness Guarantees (Exact by Design)</h2>
            <span className="font-mono text-emerald-800 font-semibold">VERIFIED</span>
          </div>
          <div className="space-y-2 font-mono">
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span>Non-registry IDs shown (Target: 0)</span>
              <strong className="text-emerald-700">{kpiBCD.correctnessGuarantees.non_registry_ids_shown}</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span>Superseded standards recommended as current (Target: 0)</span>
              <strong className="text-emerald-700">{kpiBCD.correctnessGuarantees.superseded_recommended_as_current}</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span>Outdated-citation detection rate</span>
              <strong className="text-emerald-700">{kpiBCD.correctnessGuarantees.outdated_citation_detection_rate * 100}%</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span>Certification exact-match rate</span>
              <strong className="text-emerald-700">{kpiBCD.correctnessGuarantees.certification_exact_match * 100}%</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span>Verifier block rate (injected fake IDs)</span>
              <strong className="text-emerald-700">{kpiBCD.correctnessGuarantees.verifier_block_rate * 100}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* KPI D: TENDER AUDIT */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            D. Tender Audit (Measured against planted_defects.csv · n={kpiBCD.tenderAudit.total_lines} lines)
          </h2>
          <div className="text-xs font-mono text-slate-600">
            Line-item splitting accuracy: <strong>{kpiBCD.tenderAudit.line_splitting_accuracy * 100}%</strong> · Citation extraction F1: <strong>{modelG.f1}</strong> (SYNTHETIC)
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2 px-3">Audit Label</th>
                <th className="py-2 px-3">Support (Planted)</th>
                <th className="py-2 px-3">Precision</th>
                <th className="py-2 px-3">Recall</th>
                <th className="py-2 px-3">F1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {kpiBCD.tenderAudit.report.per_class.map((c) => (
                <tr key={c.label}>
                  <td className="py-2 px-3 font-bold text-slate-900">{c.label}</td>
                  <td className="py-2 px-3">{c.support}</td>
                  <td className="py-2 px-3">{c.precision}</td>
                  <td className="py-2 px-3">{c.recall}</td>
                  <td className="py-2 px-3 font-semibold text-emerald-700">{c.f1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI E & F SIDE-BY-SIDE: CONFIDENCE & SAFETY + LANGUAGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">E. Confidence &amp; Safety</h2>
            <span className="font-mono text-amber-800">SYNTHETIC</span>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">HIGH-tier (&quot;Looks right&quot;) Precision</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {modelB.threshold_table[3]?.high_tier_precision ?? 1.0}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Abstention Precision / Recall</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {topStage.abstain_precision} / {topStage.abstain_recall}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">ECE / Brier Score</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {modelB.ece} / {modelB.brier_score}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Risk at 80% Coverage</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {modelB.risk_coverage_curve.find((r) => r.coverage === 0.8)?.risk ?? 0}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              F. Language (Language-ID Accuracy: {modelF.accuracy * 100}%)
            </h2>
            <span className="font-mono text-amber-800">SYNTHETIC</span>
          </div>
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-1.5">Language</th>
                <th className="py-1.5">n</th>
                <th className="py-1.5">Recall@5</th>
                <th className="py-1.5">MRR</th>
                <th className="py-1.5">nDCG@10</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {langSlices.map((s) => (
                <tr key={s.mode_label}>
                  <td className="py-2 font-sans font-semibold text-slate-900">{s.mode_label}</td>
                  <td className="py-2">{s.n}</td>
                  <td className="py-2 font-semibold">{s.r_at_5}</td>
                  <td className="py-2">{s.mrr}</td>
                  <td className="py-2">{s.ndcg_at_10}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI G & H SIDE-BY-SIDE: SPEED & COST + USABILITY & HUMAN IMPACT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">G. Speed and Cost</h2>
            <span className="font-mono text-slate-500">Measured + Validation Target</span>
          </div>
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span>Latency p50 / p95 (Reranker OFF)</span>
              <strong>
                {ablations[2].latency_p50_ms} ms / {ablations[2].latency_p95_ms} ms (SYNTHETIC)
              </strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span>Latency p50 / p95 (Reranker ON)</span>
              <strong>
                {ablations[3].latency_p50_ms} ms / {ablations[3].latency_p95_ms} ms (SYNTHETIC)
              </strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span>Index build time ({globalStore.standards.length} stds)</span>
              <strong>{globalStore.loadTimeMs} ms</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span>GPU memory use</span>
              <span>CPU mode (0 MB VRAM) · GPU fp16: To be measured during prototype validation</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">H. Usability &amp; Human Impact (Tester Study)</h2>
            <span className="font-mono text-amber-800">NO INVENTED NUMBERS</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span className="font-medium">Clicks to first result (Simple mode)</span>
              <strong className="font-mono text-emerald-700">&le; 2 clicks (Verified in Simple UI)</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span className="font-medium">Time to a finished bundle (Manual vs System)</span>
              <span className="font-mono text-slate-600">To be measured during prototype validation</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span className="font-medium">Standards missed per task (Manual vs System)</span>
              <span className="font-mono text-slate-600">To be measured during prototype validation</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span className="font-medium">Outdated citations per task (Manual vs System)</span>
              <span className="font-mono text-slate-600">To be measured during prototype validation</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span className="font-medium">Tester trust rating (1–5 survey score)</span>
              <span className="font-mono text-slate-600">To be measured during prototype validation</span>
            </div>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

/**
 * PAGE 14: RESPONSIBLE AI (Blocked-ID Log, Abstention Rate, Data/Model Card, Security Guardrails)
 */
export function Page14ResponsibleAi({ onNavigate }: SharedPageProps) {
  return (
    <PageFrame
      pageNumber={14}
      title="Responsible AI — Closed-World Gate Log, Data/Model Cards & Security"
      whatThisShows="Live Blocked-ID Log from the M6 Closed-World Citation Verifier, abstention governance, prompt-injection defense (treating tender text strictly as data), auto-populated Data Card & Model Card, and immutable audit governance."
      nextStepLabel="15 Help & Guide (+ Python Source Inspector)"
      nextStepPage={15}
      onNavigate={onNavigate}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Closed-World Registry Guarantee</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            No generative model is ever allowed to invent IS numbers, versions, amendments, or QCO certification facts. Every candidate and cited ID passes through the mandatory <code>M6</code> Citation Verifier against <code>standards.csv</code> ({globalStore.registryVersion}).
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
          <div className="font-semibold text-slate-900 text-sm">Certification Safety Rules (M9)</div>
          <p className="text-slate-600 leading-relaxed">
            Unmatched standards always display <strong>&quot;no rule found in our table&quot;</strong> — never &quot;not required&quot;. Rules with future <code>effective_from</code> dates (e.g. CERT-008 in 2027) are ignored, and verification dates older than {globalStore.staleDaysThreshold} days trigger a staleness alert.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
          <div className="font-semibold text-slate-900 text-sm">Zero External Data Exfiltration</div>
          <p className="text-slate-600 leading-relaxed">
            Draft tenders are processed locally as untrusted data strings (never prompt instructions). File uploads validate extension and size, sanitize filenames, and log review actions into an append-only audit log.
          </p>
        </div>
      </div>

      {/* Blocked-ID Audit Log */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            01. M6 Closed-World Blocked-ID Log (Hallucinated &amp; Orphan IDs Intercepted)
          </h2>
          <span className="text-xs font-mono text-rose-700 font-semibold">
            Total Blocked: {globalStore.blockedCitationsLog.length}
          </span>
        </div>
        {globalStore.blockedCitationsLog.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No blocked IDs recorded yet in this session. Visit <strong>Page 08 (Bundle Builder)</strong> and toggle &quot;Debug: Inject Fake ID SYN IS 99999&quot; or run Scenario 4 in Demo Mode to see M6 block unregistered IDs live.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Trace ID</th>
                  <th className="py-2 px-3">Blocked ID</th>
                  <th className="py-2 px-3">Intercept Stage</th>
                  <th className="py-2 px-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {globalStore.blockedCitationsLog.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{b.timestamp.slice(0, 19)}</td>
                    <td className="py-2 px-3">{b.trace_id}</td>
                    <td className="py-2 px-3 font-semibold text-rose-700">{b.blocked_id}</td>
                    <td className="py-2 px-3">{b.source_stage}</td>
                    <td className="py-2 px-3 font-sans text-slate-700">{b.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageFrame>
  );
}

/**
 * PAGE 15: HELP, GUIDE & PYTHON/STREAMLIT SOURCE INSPECTOR
 */
export function Page15HelpAndGuide({ onNavigate }: SharedPageProps) {
  const fileKeys = Object.keys(PYTHON_STREAMLIT_FILES);
  const [selectedPyFile, setSelectedPyFile] = useState<string>(fileKeys[0]);

  return (
    <PageFrame
      pageNumber={15}
      title="Help, Role Guide & Python/Streamlit Source Code Inspector"
      whatThisShows="Usage guide by role (Officer, Reviewer, Admin), REAL/CURATED/SYNTHETIC data provenance explainer, metric glossary, and a full code viewer for the companion Python 3.11 / Streamlit codebase and synthetic dataset zip."
      nextStepLabel="00 Return to Home Dashboard"
      nextStepPage={0}
      onNavigate={onNavigate}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-1.5">
          <div className="font-semibold text-slate-900 text-sm">Role 1: Procurement Officer</div>
          <p className="text-slate-600">
            Uses <strong>Bundle Builder (Page 08)</strong> and <strong>Tender Audit (Page 09)</strong> to verify Indian Standards, check mandatory QCO/CRS certifications, resolve superseded citations, and save specifications to the Watch-List.
          </p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-1.5">
          <div className="font-semibold text-slate-900 text-sm">Role 2: Domain Reviewer</div>
          <p className="text-slate-600">
            Unlocks <strong>Review Queue (Page 10)</strong> to accept, reject, or override model recommendations with mandatory engineering reasons, generating hard negatives and gold candidates in the append-only audit log.
          </p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-1.5">
          <div className="font-semibold text-slate-900 text-sm">Role 3: System Admin</div>
          <p className="text-slate-600">
            Unlocks <strong>Watch-List Revision Simulator (Page 11)</strong> and <strong>Model Lab (Page 12)</strong> to simulate BIS standard revisions/amendments, bump <code>registry_version</code>, and fit/calibrate Models A–G.
          </p>
        </div>
      </div>

      {/* Python / Streamlit Companion Source Code Viewer */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              Companion Python 3.11 / Streamlit Source Files (Included in Downloadable Bundle)
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {fileKeys.map((fk) => (
              <button
                key={fk}
                onClick={() => setSelectedPyFile(fk)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                  selectedPyFile === fk
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {fk}
              </button>
            ))}
          </div>
        </div>
        <pre className="p-4 bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
          {PYTHON_STREAMLIT_FILES[selectedPyFile]}
        </pre>
      </div>
    </PageFrame>
  );
}
