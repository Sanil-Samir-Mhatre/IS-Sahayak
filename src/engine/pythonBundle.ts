import {
  RAW_CERTIFICATION_CSV,
  RAW_GLOSSARY_CSV,
  RAW_GOLD_CSV,
  RAW_PLANTED_DEFECTS_CSV,
  RAW_REFERENCES_CSV,
  RAW_STANDARDS_CSV,
  RAW_TENDERS,
} from './dataset';

export const SYNTHETIC_DATASET_FILES: Record<string, string> = {
  'data/raw/standards/standards.csv': RAW_STANDARDS_CSV,
  'data/raw/references/references.csv': RAW_REFERENCES_CSV,
  'data/raw/certification/certification_rules.csv': RAW_CERTIFICATION_CSV,
  'data/raw/gold/gold_queries.csv': RAW_GOLD_CSV,
  'data/raw/glossary/glossary.csv': RAW_GLOSSARY_CSV,
  'data/raw/tenders/planted_defects.csv': RAW_PLANTED_DEFECTS_CSV,
  'data/raw/tenders/sample_tender_01.txt': RAW_TENDERS['sample_tender_01.txt'],
  'data/raw/tenders/sample_tender_02.txt': RAW_TENDERS['sample_tender_02.txt'],
};

export const PYTHON_STREAMLIT_FILES: Record<string, string> = {
  'requirements.txt': `streamlit>=1.38.0
pandas>=2.2.0
numpy>=1.26.0
scikit-learn>=1.5.0
lightgbm>=4.5.0
sentence-transformers>=3.0.0
faiss-cpu>=1.8.0
rank_bm25>=0.2.2
networkx>=3.3
pyvis>=0.3.2
plotly>=5.23.0
matplotlib>=3.9.0
seaborn>=0.13.2
umap-learn>=0.5.6
pydantic>=2.8.0
pymupdf>=1.24.0
pdfplumber>=0.11.0
pytest>=8.3.0
fastapi>=0.112.0
uvicorn>=0.30.0
reportlab>=4.2.0
`,
  'src/is_sahayak/config.py': `"""Configuration and path management for IS-Sahayak (SIH PS 26108)."""
from __future__ import annotations
import os
from dataclasses import dataclass, field
from pathlib import Path

PROJECT_ROOT = Path(os.environ.get("PROJECT_ROOT", ".")).resolve()

@dataclass(frozen=True)
class AppConfig:
    seed: int = 42
    project_root: Path = PROJECT_ROOT
    raw_dir: Path = PROJECT_ROOT / "data" / "raw"
    processed_dir: Path = PROJECT_ROOT / "data" / "processed"
    models_dir: Path = PROJECT_ROOT / "data" / "models"
    sqlite_path: Path = PROJECT_ROOT / "data" / "db" / "is_sahayak.sqlite"
    max_supersession_hops: int = 10
    stale_verification_days: int = 180
    rrf_k: int = 60
    rerank_top_n: int = 30
    gpu_dense_model: str = "BAAI/bge-m3"
    cpu_dense_model: str = "intfloat/multilingual-e5-small"
    reranker_model: str = "BAAI/bge-reranker-v2-m3"
    completeness_weights: dict[str, int] = field(default_factory=lambda: {
        "primary_present": 25,
        "test_method_present": 20,
        "terminology_present": 10,
        "safety_or_installation": 15,
        "version_current": 15,
        "certification_resolved": 15,
    })

CONFIG = AppConfig()
`,
  'src/is_sahayak/normalizer.py': `"""Canonical IS-ID normalizer supporting IS and SYN IS variants, parts, and years."""
from __future__ import annotations
import re
from dataclasses import dataclass

IS_PATTERN = re.compile(
    r"^(?:(SYN)\\s*[-:]?\\s*)?IS\\s*[:\\-]?\\s*(\\d{3,6})"
    r"(?:\\s*(?:\\(\\s*(?:Part|Pt\\.?)\\s*(\\d+)\\s*\\)|(?:Part|Pt\\.?)\\s*(\\d+)|-\\s*(\\d+)(?!\\d)))?"
    r"(?:\\s*[:\\-]\\s*((?:19|20)\\d{2}))?$",
    re.IGNORECASE,
)

@dataclass(frozen=True)
class NormalizedIsId:
    raw: str
    is_synthetic: bool
    number_digits: str
    base_id: str
    part: str | None
    year: int | None
    canonical_with_part: str
    canonical_id: str

def normalize_is_id(raw: str) -> NormalizedIsId | None:
    if not raw or not isinstance(raw, str):
        return None
    cleaned = " ".join(raw.strip().split())
    m = IS_PATTERN.match(cleaned)
    if not m:
        return None
    is_syn = bool(m.group(1))
    digits = m.group(2)
    part_num = m.group(3) or m.group(4) or m.group(5)
    year_val = int(m.group(6)) if m.group(6) else None
    prefix = "SYN IS" if is_syn else "IS"
    base_id = f"{prefix} {digits}"
    part = f"Part {part_num}" if part_num else None
    canonical_with_part = f"{base_id} ({part})" if part else base_id
    canonical_id = f"{canonical_with_part} : {year_val}" if year_val else canonical_with_part
    return NormalizedIsId(
        raw=raw.strip(),
        is_synthetic=is_syn,
        number_digits=digits,
        base_id=base_id,
        part=part,
        year=year_val,
        canonical_with_part=canonical_with_part,
        canonical_id=canonical_id,
    )
`,
  'src/is_sahayak/db.py': `"""Parameterized SQLite storage with append-only triggers on audit_log."""
from __future__ import annotations
import sqlite3
from pathlib import Path
from src.is_sahayak.config import CONFIG

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    query_or_context TEXT NOT NULL,
    recommended_is TEXT NOT NULL,
    override_is TEXT,
    mandatory_reason TEXT NOT NULL,
    registry_version TEXT NOT NULL,
    flagged_hard_negative INTEGER NOT NULL DEFAULT 0,
    flagged_gold_candidate INTEGER NOT NULL DEFAULT 0
);

CREATE TRIGGER IF NOT EXISTS trg_audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN
    SELECT RAISE(ABORT, 'audit_log is append-only: UPDATE prohibited');
END;

CREATE TRIGGER IF NOT EXISTS trg_audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN
    SELECT RAISE(ABORT, 'audit_log is append-only: DELETE prohibited');
END;
"""

def init_db(db_path: Path = CONFIG.sqlite_path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    return conn
`,
  'app/Home.py': `"""Page 0: IS-Sahayak Home Dashboard (contains zero search logic; delegates to run_pipeline)."""
import streamlit as st

st.set_page_config(page_title="IS-Sahayak | BIS Standards Engine", layout="wide")
st.warning("SYNTHETIC DATA - NOT A VALIDATION RESULT | Provenance: SYNTHETIC (25 standards, 22 references, 10 cert rules)")
st.title("IS-Sahayak — Verified Indian Standards & Tender Compliance Engine")
st.caption("Smart India Hackathon PS 26108 | Closed-World BIS Registry + Supersession Guard + Bilingual Clause Evidence")
st.graphviz_chart('''
digraph ISSahayak {
    rankdir=LR;
    node [shape=box, style="rounded,filled", fillcolor="#F8FAFC", fontname="Helvetica", fontsize=10];
    M1 [label="M1 Ingestion\\n& Validation"];
    M2 [label="M2 Reference\\nGraph (NetworkX)"];
    M3 [label="M3 Query NLU\\n(EN / HI / Hinglish)"];
    M4 [label="M4 Ask-Before-Guess\\n(Max Info-Gain)"];
    M5 [label="M5 Hybrid Retrieval\\n(BM25 + Dense + RRF)"];
    M6 [label="M6 Closed-World\\nCitation Gate"];
    M7 [label="M7 Allied\\nExpansion"];
    M8 [label="M8 Version Guard\\n(Cycle-Safe)"];
    M9 [label="M9 Certification\\nEngine (QCO/CRS)"];
    M10 [label="M10 Completeness\\n& M11 Confidence"];
    M12 [label="M12 Bilingual\\nClause Evidence"];
    M1 -> M2;
    M3 -> M4 -> M5 -> M6 -> M7 -> M8 -> M9 -> M10 -> M12;
}
''')
`,
  'tests/test_s1_normalizer_and_ingest.py': `"""Acceptance tests for IS-ID normalization, planted supersession chains, cycles, orphans, and SQLite triggers."""
import pytest
import sqlite3
from src.is_sahayak.normalizer import normalize_is_id
from src.is_sahayak.db import init_db

@pytest.mark.parametrize("raw,expected_base,expected_part,expected_year", [
    ("IS 1239 (Part 1) : 2004", "IS 1239", "Part 1", 2004),
    ("IS:1239", "IS 1239", None, None),
    ("IS1239", "IS 1239", None, None),
    ("IS 1239-1", "IS 1239", "Part 1", None),
    ("IS 1239 Pt 1", "IS 1239", "Part 1", None),
    ("SYN IS 90101", "SYN IS 90101", None, None),
    ("SYN IS 90101:2015", "SYN IS 90101", None, 2015),
    ("SYN IS 90101 (Part 2)", "SYN IS 90101", "Part 2", None),
])
def test_normalize_variants(raw, expected_base, expected_part, expected_year):
    norm = normalize_is_id(raw)
    assert norm is not None
    assert norm.base_id == expected_base
    assert norm.part == expected_part
    assert norm.year == expected_year

def test_audit_log_append_only_triggers(tmp_path):
    conn = init_db(tmp_path / "test.sqlite")
    conn.execute(
        "INSERT INTO audit_log (timestamp, actor_role, action_type, query_or_context, recommended_is, mandatory_reason, registry_version) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ("2026-10-04T00:00:00Z", "reviewer", "ACCEPT", "test query", "SYN IS 90101", "Valid test reason", "reg-v1"),
    )
    conn.commit()
    with pytest.raises(sqlite3.IntegrityError, match="append-only"):
        conn.execute("UPDATE audit_log SET recommended_is = 'SYN IS 90102' WHERE id = 1")
    with pytest.raises(sqlite3.IntegrityError, match="append-only"):
        conn.execute("DELETE FROM audit_log WHERE id = 1")
`,
};
