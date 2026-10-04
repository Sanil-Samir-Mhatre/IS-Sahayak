import express from 'express';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { globalStore } from './src/engine/dataset';
import { runPipeline, runTenderAudit } from './src/engine/pipeline';
import { PYTHON_STREAMLIT_FILES, SYNTHETIC_DATASET_FILES } from './src/engine/pythonBundle';
import { DataMode, RetrievalMode } from './src/engine/types';

let cachedAi: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!cachedAi) {
    cachedAi = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAi;
}

async function buildSyntheticZipBuffer(): Promise<Buffer> {
  const zip = new JSZip();
  for (const [relPath, content] of Object.entries(SYNTHETIC_DATASET_FILES)) {
    zip.file(relPath, content);
  }
  return await zip.generateAsync({ type: 'nodebuffer' });
}

async function buildFullStreamlitRepoZipBuffer(): Promise<Buffer> {
  const zip = new JSZip();
  for (const [relPath, content] of Object.entries(SYNTHETIC_DATASET_FILES)) {
    zip.file(relPath, content);
  }
  for (const [relPath, content] of Object.entries(PYTHON_STREAMLIT_FILES)) {
    zip.file(relPath, content);
  }
  // Include root streamlit_app.py, requirements.txt, render.yaml, and README.md from disk
  for (const rootFile of ['streamlit_app.py', 'requirements.txt', 'render.yaml', 'README.md']) {
    const fullPath = path.resolve(process.cwd(), rootFile);
    if (fs.existsSync(fullPath)) {
      zip.file(rootFile, fs.readFileSync(fullPath, 'utf-8'));
    }
  }
  const datasetBuf = await buildSyntheticZipBuffer();
  zip.file('data/synthetic_dataset.zip', datasetBuf);
  return await zip.generateAsync({ type: 'nodebuffer' });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Ensure data/synthetic_dataset.zip and all data/raw/* files exist on disk for GitHub & Streamlit Cloud
  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    for (const [relPath, content] of Object.entries(SYNTHETIC_DATASET_FILES)) {
      const targetPath = path.resolve(process.cwd(), relPath);
      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(targetPath, content, 'utf-8');
    }
    const zipBuf = await buildSyntheticZipBuffer();
    fs.writeFileSync(path.join(dataDir, 'synthetic_dataset.zip'), zipBuf);
  } catch (err) {
    console.warn('Could not write data files on startup:', err);
  }

  // M16 Endpoint 1: Healthcheck
  app.get('/healthz', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'IS-Sahayak API (M16)',
      seed: 42,
      registry_version: globalStore.registryVersion,
      standards_count: globalStore.standards.length,
      references_count: globalStore.references.length,
      certification_rules_count: globalStore.certificationRules.length,
      provenance: 'SYNTHETIC',
    });
  });

  // M16 Endpoint 2: POST /v1/recommend
  app.post('/v1/recommend', (req, res) => {
    try {
      const query = String(req.body?.query || '').trim();
      if (!query) {
        return res.status(400).json({ error: 'Field "query" is required.' });
      }
      const retrievalMode = (req.body?.retrieval_mode as RetrievalMode) || 'hybrid_rrf';
      const dataMode = (req.body?.data_mode as DataMode) || 'COMBINED';
      const clarificationAnswer = req.body?.clarification_answer
        ? String(req.body.clarification_answer)
        : undefined;
      const injectFakeIdDebug = Boolean(req.body?.inject_fake_id_debug);

      const result = runPipeline(query, {
        retrievalMode,
        dataMode,
        clarificationAnswer,
        injectFakeIdDebug,
      });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Internal pipeline error',
      });
    }
  });

  // M16 Endpoint 3: POST /v1/audit
  app.post('/v1/audit', (req, res) => {
    try {
      const filename = String(req.body?.filename || 'uploaded_tender.txt').replace(/[^a-zA-Z0-9._-]/g, '_');
      const tenderText = String(req.body?.tender_text || '').trim();
      if (!tenderText) {
        return res.status(400).json({ error: 'Field "tender_text" is required.' });
      }
      const retrievalMode = (req.body?.retrieval_mode as RetrievalMode) || 'hybrid_rrf';
      const report = runTenderAudit(filename, tenderText, { retrievalMode });
      return res.json(report);
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Internal audit error',
      });
    }
  });

  // M16 Endpoint 4: GET /v1/standards/:id
  app.get('/v1/standards/:id', (req, res) => {
    const rawId = decodeURIComponent(req.params.id).trim();
    const matches = globalStore.standards.filter(
      (s) => s.is_id.toLowerCase() === rawId.toLowerCase()
    );
    if (matches.length === 0) {
      return res.status(404).json({
        error: `Standard "${rawId}" does not exist in closed-world BIS registry.`,
        closed_world_blocked: true,
      });
    }
    return res.json({
      is_id: matches[0].is_id,
      parts: matches,
      registry_version: globalStore.registryVersion,
    });
  });

  // Download synthetic_dataset.zip
  app.get('/api/download/synthetic_dataset.zip', async (_req, res) => {
    const buf = await buildSyntheticZipBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="synthetic_dataset.zip"');
    res.send(buf);
  });

  // Download full Streamlit + Synthetic Dataset repo bundle
  app.get('/api/download/is_sahayak_streamlit.zip', async (_req, res) => {
    const buf = await buildFullStreamlitRepoZipBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="is_sahayak_streamlit_bundle.zip"');
    res.send(buf);
  });

  // Helper: map 22 Scheduled Indian language codes to Google Translate codes
  const GOOGLE_LANG_MAP: Record<string, string> = {
    hi: 'hi',
    bn: 'bn',
    mr: 'mr',
    te: 'te',
    ta: 'ta',
    gu: 'gu',
    ur: 'ur',
    kn: 'kn',
    or: 'or',
    ml: 'ml',
    pa: 'pa',
    as: 'as',
    mai: 'mai',
    sat: 'sat',
    ks: 'ks',
    ne: 'ne',
    sd: 'sd',
    doi: 'doi',
    kok: 'gom',
    mni: 'mni-Mtei',
    brx: 'hi',
    sa: 'sa',
  };

  async function translateSingleViaGoogleGtx(
    text: string,
    targetCode: string,
    sourceCode: string = 'auto'
  ): Promise<string> {
    const tl = GOOGLE_LANG_MAP[targetCode] || targetCode;
    const sl = sourceCode === 'auto' ? 'auto' : GOOGLE_LANG_MAP[sourceCode] || sourceCode;
    // Protect IS numbers like "SYN IS 90101" or "IS 1239" so they are never altered
    const placeholders: string[] = [];
    const protectedText = text.replace(/\b(?:SYN\s+)?IS\s*\d{3,6}(?:\s*\(Part\s*\d+\))?/gi, (m) => {
      placeholders.push(m);
      return `__ISCODE_${placeholders.length - 1}__`;
    });

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sl
    )}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(protectedText)}`;

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    if (!resp.ok) {
      throw new Error(`GTX status ${resp.status}`);
    }
    const data = await resp.json();
    let translated = '';
    if (Array.isArray(data) && Array.isArray(data[0])) {
      for (const segment of data[0]) {
        if (Array.isArray(segment) && typeof segment[0] === 'string') {
          translated += segment[0];
        }
      }
    }
    if (!translated) {
      throw new Error('Empty GTX translation');
    }

    // Restore protected IS codes
    return translated.replace(/__ISCODE_(\d+)__/g, (_m, idx) => placeholders[Number(idx)] || _m);
  }

  // Server-side Translation Endpoint for all 22 Scheduled Indian Languages (bidirectional)
  app.post('/api/translate', async (req, res) => {
    const texts: string[] = Array.isArray(req.body?.texts) ? req.body.texts.map(String) : [];
    const targetLangCode = String(req.body?.targetLangCode || 'hi').trim();
    const targetLangName = String(req.body?.targetLangName || 'Hindi').trim();
    const sourceLangCode = String(req.body?.sourceLangCode || 'auto').trim();

    if (texts.length === 0) {
      return res.json({ translations: texts, provider: 'Identity' });
    }

    // Tier 1: Fast Google Translate GTX endpoint (instant ~80ms, no 503 model overload)
    try {
      const gtxResults = await Promise.all(
        texts.map((t) => translateSingleViaGoogleGtx(t, targetLangCode, sourceLangCode))
      );
      return res.json({
        translations: gtxResults,
        provider: 'Google Indian Language Translator',
      });
    } catch (_gtxErr) {
      // Proceed to Tier 2 (Gemini cascade) if GTX is unreachable
    }

    // Tier 2: Gemini Model Cascade (tries multiple models if one has 503 high demand)
    const aiClient = getGeminiClient();
    if (aiClient) {
      const candidateModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
      for (const modelName of candidateModels) {
        try {
          const response = await aiClient.models.generateContent({
            model: modelName,
            contents: `Translate each of the following ${texts.length} English procurement and Indian Standards (BIS) specification strings into ${targetLangName} (language code: ${targetLangCode}).
Rules:
1. Return a JSON array of exactly ${texts.length} translated strings in the exact same order.
2. Preserve all Indian Standard identifiers (such as "SYN IS 90101", "IS 1239", "Part 1"), years, numbers, and metric units (mm, sq.mm, MPa, Grade) exactly as written.

Input JSON array:
${JSON.stringify(texts)}`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },
              temperature: 0.1,
            },
          });

          const rawText = (response.text || '[]').trim();
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return res.json({
              translations: texts.map((t, idx) => (parsed[idx] ? String(parsed[idx]) : t)),
              provider: `Gemini (${modelName})`,
            });
          }
        } catch (_geminiErr) {
          // Try next model in cascade
        }
      }
    }

    // Tier 3: Never return 500/503 — return graceful local fallback
    return res.json({
      translations: texts,
      provider: 'Local Fallback',
    });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`IS-Sahayak server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
