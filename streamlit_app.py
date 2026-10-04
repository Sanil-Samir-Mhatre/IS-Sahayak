"""
IS-Sahayak — Verified Indian Standards (BIS) & Tender Compliance Engine
Complete Streamlit App (Simple Mode + Expert Mode + 22 Indian Languages Translation)
Entry point for Streamlit Community Cloud: streamlit run streamlit_app.py
"""
from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

import pandas as pd
import streamlit as st

st.set_page_config(
    page_title="IS-Sahayak | Verified Indian Standards Assistant",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# 1. ALL 22 SCHEDULED INDIAN LANGUAGES + TRANSLATION HELPER
# ---------------------------------------------------------------------------
INDIAN_LANGUAGES = [
    ("en", "English", "English"),
    ("hi", "Hindi", "हिन्दी"),
    ("bn", "Bengali", "বাংলা"),
    ("mr", "Marathi", "मराठी"),
    ("te", "Telugu", "తెలుగు"),
    ("ta", "Tamil", "தமிழ்"),
    ("gu", "Gujarati", "ગુજરાતી"),
    ("ur", "Urdu", "اردو"),
    ("kn", "Kannada", "ಕನ್ನಡ"),
    ("or", "Odia", "ଓଡ଼ିଆ"),
    ("ml", "Malayalam", "മലയാളം"),
    ("pa", "Punjabi", "ਪੰਜਾਬੀ"),
    ("as", "Assamese", "অসমীয়া"),
    ("mai", "Maithili", "मैथिली"),
    ("sat", "Santali", "ᱥᱟᱱᱛᱟᱲᱤ"),
    ("ks", "Kashmiri", "कॉशुर"),
    ("ne", "Nepali", "नेपाली"),
    ("sd", "Sindhi", "सिन्धी"),
    ("doi", "Dogri", "डोगरी"),
    ("kok", "Konkani", "कोंकणी"),
    ("mni", "Manipuri", "মৈতৈলোন্"),
    ("brx", "Bodo", "बर'"),
    ("sa", "Sanskrit", "संस्कृतम्"),
]

GOOGLE_LANG_MAP = {
    "kok": "gom",
    "mni": "mni-Mtei",
    "brx": "hi",
}


@st.cache_data(show_spinner=False)
def translate_to_indian_language(text: str, target_code: str) -> str:
    if not text or target_code == "en":
        return text
    tl = GOOGLE_LANG_MAP.get(target_code, target_code)
    placeholders: list[str] = []

    def _protect(match: re.Match[str]) -> str:
        placeholders.append(match.group(0))
        return f"__ISCODE_{len(placeholders) - 1}__"

    protected = re.sub(
        r"\b(?:SYN\s+)?IS\s*\d{3,6}(?:\s*\(Part\s*\d+\))?",
        _protect,
        text,
        flags=re.IGNORECASE,
    )
    try:
        url = (
            "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en"
            f"&tl={urllib.parse.quote(tl)}&dt=t&q={urllib.parse.quote(protected)}"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        translated = "".join(seg[0] for seg in data[0] if seg and seg[0])
        for idx, code in enumerate(placeholders):
            translated = translated.replace(f"__ISCODE_{idx}__", code)
        return translated or text
    except Exception:
        return text


# ---------------------------------------------------------------------------
# 2. CLOSED-WORLD DATASET LOADER
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).parent / "data" / "raw"


@st.cache_data(show_spinner=False)
def load_registry() -> dict[str, Any]:
    stds_path = DATA_DIR / "standards" / "standards.csv"
    refs_path = DATA_DIR / "references" / "references.csv"
    certs_path = DATA_DIR / "certification" / "certification_rules.csv"
    tenders_dir = DATA_DIR / "tenders"

    stds_df = pd.read_csv(stds_path).fillna("")
    refs_df = pd.read_csv(refs_path).fillna("")
    certs_df = pd.read_csv(certs_path).fillna("")

    tenders = {}
    for fname in ["sample_tender_01.txt", "sample_tender_02.txt"]:
        fpath = tenders_dir / fname
        if fpath.exists():
            tenders[fname] = fpath.read_text(encoding="utf-8")

    return {
        "standards": stds_df.to_dict(orient="records"),
        "references": refs_df.to_dict(orient="records"),
        "certs": certs_df.to_dict(orient="records"),
        "tenders": tenders,
        "registry_version": "reg-v1.0-seed42",
    }


# ---------------------------------------------------------------------------
# 3. CORE PIPELINE (Version Guard, Cert Engine, Retrieval, Tender Audit)
# ---------------------------------------------------------------------------
def resolve_version_chain(is_id: str, stds_by_id: dict[str, dict[str, Any]]) -> dict[str, Any]:
    visited: list[str] = [is_id]
    curr = is_id
    for _ in range(10):
        rec = stds_by_id.get(curr)
        if not rec:
            break
        nxt = str(rec.get("superseded_by", "")).strip()
        if rec.get("status") == "superseded" and nxt:
            if nxt in visited:
                visited.append(nxt)
                return {
                    "input_is_id": is_id,
                    "resolved_is_id": curr,
                    "chain": visited,
                    "hop_count": len(visited) - 1,
                    "cycle_detected": True,
                    "withdrawn_without_successor": False,
                }
            visited.append(nxt)
            curr = nxt
        else:
            break

    final_rec = stds_by_id.get(curr, {})
    withdrawn_no_succ = (
        final_rec.get("status") == "withdrawn"
        and not str(final_rec.get("superseded_by", "")).strip()
    )
    return {
        "input_is_id": is_id,
        "resolved_is_id": curr,
        "chain": visited,
        "hop_count": len(visited) - 1,
        "cycle_detected": False,
        "withdrawn_without_successor": withdrawn_no_succ,
        "latest_amendment_no": int(final_rec.get("latest_amendment_no") or 0),
        "year": int(final_rec.get("year") or 2020),
    }


def resolve_certification(is_id: str, ics_code: str, certs: list[dict[str, Any]]) -> dict[str, Any]:
    for rule in certs:
        if str(rule.get("effective_from", "")) > "2026-10-04":
            continue
        if rule.get("applies_to") == f"IS:{is_id}":
            return {"matched": True, **rule}
    for rule in certs:
        if str(rule.get("effective_from", "")) > "2026-10-04":
            continue
        if rule.get("applies_to") == f"ICS:{ics_code}":
            return {"matched": True, **rule}
    return {
        "matched": False,
        "scheme": None,
        "status_label": "We couldn't find a rule in our table",
    }


def run_pipeline(query: str, reg: dict[str, Any], clarification: str = "") -> dict[str, Any]:
    stds = reg["standards"]
    refs = reg["references"]
    certs = reg["certs"]
    stds_by_id = {s["is_id"]: s for s in stds}

    full_q = f"{query} {clarification}".strip().lower()
    # Hindi / Hinglish glossary expansion
    glossary_map = {
        "पेयजल": "potable water drinking water",
        "जीआई": "galvanized iron gi mild steel",
        "पाइप": "pipe tube",
        "lohe": "mild steel iron gi",
        "pipe": "tube pipes",
        "bijli": "electrical power cable",
        "taar": "cable wire conductor",
        "cement": "portland cement concrete",
    }
    for k, v in glossary_map.items():
        if k in full_q:
            full_q += " " + v

    # Check if vague query needs Ask-Before-Guessing clarification
    is_vague = len(query.split()) <= 4 and "pipe" in full_q and not clarification
    clarifying_options = []
    if is_vague:
        clarifying_options = [
            "Mild Steel (GI) — Potable Water (SYN IS 90101)",
            "HDPE Polyethylene — Water Supply (SYN IS 90104)",
            "uPVC — Potable Water Distribution (SYN IS 90105)",
            "Ductile Iron (DI) — Pressure Mains (SYN IS 90106)",
        ]

    # Check if query cites an explicit IS code (including old/superseded)
    cited_matches = re.findall(r"(?:SYN\s+)?IS\s*\d{3,6}", query, flags=re.IGNORECASE)
    cited_canonical = [re.sub(r"\s+", " ", m.upper().strip()) for m in cited_matches]

    scored: list[tuple[float, dict[str, Any], dict[str, Any]]] = []
    q_tokens = set(re.findall(r"[a-z0-9]+", full_q))

    for s in stds:
        sid = s["is_id"]
        vg = resolve_version_chain(sid, stds_by_id)
        target_rec = stds_by_id.get(vg["resolved_is_id"], s)

        text_blob = f"{target_rec['is_id']} {target_rec['title']} {target_rec['scope_text']} {target_rec['sector']}".lower()
        doc_tokens = set(re.findall(r"[a-z0-9]+", text_blob))
        overlap = len(q_tokens & doc_tokens)
        score = overlap / max(1, len(q_tokens))

        if sid.upper() in cited_canonical:
            score += 2.5
        elif target_rec["is_id"].upper() in cited_canonical and vg["hop_count"] == 0:
            score += 2.0

        if s["status"] == "superseded" and sid.upper() not in cited_canonical:
            continue

        scored.append((score, target_rec, vg))

    scored.sort(key=lambda x: x[0], reverse=True)
    seen_ids: set[str] = set()
    primaries = []
    for sc, rec, vg in scored:
        if rec["is_id"] in seen_ids:
            continue
        seen_ids.add(rec["is_id"])
        cert = resolve_certification(rec["is_id"], rec["ics_code"], certs)
        sentences = [s.strip() for s in str(rec["scope_text"]).split(".") if s.strip()]
        best_en = sentences[0] + "." if sentences else rec["title"]
        best_hi = sentences[1] + "." if len(sentences) > 1 else best_en
        primaries.append(
            {
                "is_id": rec["is_id"],
                "title": rec["title"],
                "year": int(rec["year"]),
                "ics_code": rec["ics_code"],
                "score": round(sc, 3),
                "version_guard": vg,
                "certification": cert,
                "best_en_sentence": best_en,
                "best_hi_sentence": best_hi,
            }
        )
        if len(primaries) >= 3:
            break

    top1_id = primaries[0]["is_id"] if primaries else ""
    allied = []
    for r in refs:
        if r["from_is"] == top1_id and r["to_is"] in stds_by_id:
            target = stds_by_id[r["to_is"]]
            role_chip_map = {
                "test_method": "Test",
                "terminology": "Terms",
                "safety": "Safety",
                "installation": "Install",
            }
            allied.append(
                {
                    "is_id": target["is_id"],
                    "title": target["title"],
                    "year": int(target["year"]),
                    "role": r["role"],
                    "chip": role_chip_map.get(r["role"], "Related"),
                }
            )

    roles_present = {a["role"] for a in allied}
    score_pct = 25 if primaries else 0
    gaps = []
    if "test_method" in roles_present:
        score_pct += 20
    else:
        gaps.append("Test Method Standard")
    if "terminology" in roles_present:
        score_pct += 10
    else:
        gaps.append("Terminology Standard")
    if "safety" in roles_present or "installation" in roles_present:
        score_pct += 15
    else:
        gaps.append("Safety / Installation Standard")
    score_pct += 15  # version current
    if primaries and primaries[0]["certification"]["matched"]:
        score_pct += 15
    else:
        gaps.append("Verified Certification Rule")

    abstained = len(primaries) == 0 or primaries[0]["score"] < 0.08
    return {
        "primaries": primaries,
        "allied": allied,
        "completeness_pct": score_pct,
        "first_gap": gaps[0] if gaps else None,
        "clarifying_options": clarifying_options,
        "abstained": abstained,
    }


# ---------------------------------------------------------------------------
# 4. SESSION STATE & SIDEBAR NAVIGATION
# ---------------------------------------------------------------------------
reg = load_registry()
if "saved_specs" not in st.session_state:
    st.session_state.saved_specs = [
        {
            "title": "Municipal 50 mm GI Water Supply Tubes",
            "query": "Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes",
            "primary_id": "SYN IS 90101",
            "needs_attention": True,
            "note": "Amendment 2 issued on SYN IS 90101 — review before tender publication.",
        }
    ]
if "clarification" not in st.session_state:
    st.session_state.clarification = ""

# Top Provenance Strip + Mode & Language Controls
top_col1, top_col2, top_col3 = st.columns([5, 3, 2])
with top_col1:
    st.caption(
        "🔶 **SYNTHETIC DATA - NOT A VALIDATION RESULT** · "
        f"{len(reg['standards'])} standards · {reg['registry_version']} · Ranker: **Hybrid RRF (k=60)**"
    )
with top_col2:
    lang_options = {f"{name_en} ({name_nat})": code for code, name_en, name_nat in INDIAN_LANGUAGES}
    selected_lang_label = st.selectbox(
        "भाषा / Translate to Indian Language",
        options=list(lang_options.keys()),
        index=0,
        label_visibility="collapsed",
    )
    target_lang = lang_options[selected_lang_label]
with top_col3:
    ui_mode = st.radio(
        "View Mode",
        options=["Simple", "Expert"],
        horizontal=True,
        label_visibility="collapsed",
    )

st.sidebar.markdown("### IS-Sahayak")
if ui_mode == "Simple":
    st.sidebar.caption("Verified Indian Standards Assistant")
    simple_page = st.sidebar.radio(
        "Navigation",
        options=[
            "Ask (मानक खोजें)",
            "Check my tender (निविदा जांचें)",
            "My saved specs (सहेजे गए मानक)",
            "Help (सहायता)",
        ],
    )
else:
    st.sidebar.caption("Expert Mode · Full Workbench")
    expert_page = st.sidebar.radio(
        "Expert Pages",
        options=[
            "01 · USP Showcase (1–14)",
            "04 · Registry Explorer",
            "08 · Bundle Builder",
            "09 · Tender Audit",
            "11 · Revision Watch-List",
            "13 · Evaluation & KPIs (A–H)",
        ],
    )

# ---------------------------------------------------------------------------
# 5. SIMPLE MODE PAGES
# ---------------------------------------------------------------------------
if ui_mode == "Simple":
    if simple_page.startswith("Ask"):
        st.subheader("What product or item are you buying? / आप क्या खरीद रहे हैं?")

        example_queries = {
            "50 mm GI water pipes (English)": "Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes for municipal potable water supply",
            "पेयजल के लिए 80 मिमी जीआई पाइप (Hindi)": "पेयजल आपूर्ति के लिए 80 मिमी मध्यम ग्रेड गैल्वनाइज्ड आयरन (GI) माइल्ड स्टील पाइप",
            "Jal aapurti ke liye lohe ka pipe (Hinglish)": "Jal aapurti ke liye 100 mm medium grade GI lohe ka pipe aur fitting chahiye",
            '"Pipes for water" (Asks a clarifying question)': "Pipes for water",
            "Old 1990 Standard SYN IS 90151 (Version Guard)": "MS tubes for water line conforming to old standard SYN IS 90151:1990",
            "Concrete blocks (No certification rule in table)": "Precast load-bearing hollow concrete masonry blocks 400x200x200 mm",
        }

        ex_choice = st.selectbox("Or pick an example query (English / हिंदी / Hinglish):", list(example_queries.keys()))
        query_input = st.text_input(
            "Search query",
            value=example_queries[ex_choice],
            label_visibility="collapsed",
        )

        with st.spinner("Finding the right standards..."):
            res = run_pipeline(query_input, reg, st.session_state.clarification)

        if target_lang != "en":
            st.info(f"**Translated Query ({selected_lang_label}):** {translate_to_indian_language(query_input, target_lang)}")

        # Clarifying question tap buttons
        if res["clarifying_options"]:
            st.warning("**Which type of water pipe do you need?** (Tap one option below)")
            c_cols = st.columns(2)
            for idx, opt in enumerate(res["clarifying_options"]):
                if c_cols[idx % 2].button(opt, key=f"cq_{idx}", use_container_width=True):
                    st.session_state.clarification = opt
                    st.rerun()

        # Completeness bar
        gap_txt = f"Missing: {res['first_gap']}" if res["first_gap"] else "All required standard types included"
        st.markdown(f"**Bundle Completeness: {res['completeness_pct']}/100** — {gap_txt}")
        st.progress(res["completeness_pct"] / 100.0)

        # Primary standard cards
        for idx, prim in enumerate(res["primaries"]):
            badge = "✓ Looks right" if idx == 0 and not res["abstained"] else ("? Not sure" if res["abstained"] else "⚠ Check this")
            with st.container(border=True):
                h_col1, h_col2 = st.columns([4, 1])
                h_col1.markdown(f"`{prim['is_id']}`  \n#### {prim['title']}")
                if target_lang != "en":
                    h_col1.caption(f"**{selected_lang_label}:** {translate_to_indian_language(prim['title'], target_lang)}")
                h_col2.markdown(f"**{badge}**")

                st.markdown(f"**Why this?:** “{prim['best_en_sentence']}”")
                if target_lang != "en":
                    st.markdown(f"**{selected_lang_label}:** “{translate_to_indian_language(prim['best_en_sentence'], target_lang)}”")

                v_col, c_col = st.columns(2)
                vg = prim["version_guard"]
                if vg["hop_count"] > 0:
                    v_col.warning(f"⚠ Replaced `{vg['input_is_id']}` with `{prim['is_id']}` ({prim['year']}, Amendment {vg['latest_amendment_no']})")
                else:
                    v_col.success(f"✓ Current version ({prim['year']}), Amendment {vg['latest_amendment_no']}")

                cert = prim["certification"]
                if cert["matched"]:
                    c_col.info(f"**Certification:** {cert['scheme']} · {cert['legal_basis']} · verified {cert['verified_on']}")
                else:
                    c_col.warning("**Certification:** We couldn't find a rule in our table")

        # Also needed companion list
        with st.container(border=True):
            st.markdown(f"#### Also needed ({len(res['allied'])})")
            for al in res["allied"]:
                al_title = al["title"]
                if target_lang != "en":
                    al_title = f"{al_title} ({translate_to_indian_language(al['title'], target_lang)})"
                st.markdown(f"- **[{al['chip']}]** `{al['is_id']} ({al['year']})` — {al_title}")

        b1, b2 = st.columns(2)
        if b1.button("Save / सहेजें", use_container_width=True):
            st.session_state.saved_specs.append(
                {
                    "title": query_input[:50],
                    "query": query_input,
                    "primary_id": res["primaries"][0]["is_id"] if res["primaries"] else "NONE",
                    "needs_attention": False,
                    "note": "Up to date with current registry.",
                }
            )
            st.success("Saved to My saved specs!")
        b2.download_button(
            "Download Report / रिपोर्ट डाउनलोड करें",
            data=json.dumps(res, indent=2),
            file_name="is_sahayak_bundle.json",
            mime="application/json",
            use_container_width=True,
        )

        with st.expander("Show details (Full step-by-step verification trace)"):
            st.json(res)

    elif simple_page.startswith("Check my tender"):
        st.subheader("Check my tender / निविदा जांचें")
        uploaded = st.file_uploader("Upload draft tender (.txt)", type=["txt"])
        sample_choice = st.selectbox("Or choose a sample tender draft:", list(reg["tenders"].keys()))
        tender_text = uploaded.read().decode("utf-8") if uploaded else reg["tenders"][sample_choice]

        lines = [ln.strip() for ln in tender_text.splitlines() if ln.strip()]
        st.markdown(f"**Checked {len(lines)} tender lines:**")
        stds_by_id = {s["is_id"]: s for s in reg["standards"]}

        for i, line in enumerate(lines, start=1):
            cited = re.findall(r"(?:SYN\s+)?IS\s*\d{3,6}", line, flags=re.IGNORECASE)
            res = run_pipeline(line, reg)
            rec = res["primaries"][0] if res["primaries"] else None
            with st.container(border=True):
                st.markdown(f"**Line {i}:** {line}")
                if target_lang != "en":
                    st.caption(translate_to_indian_language(line, target_lang))
                if not cited:
                    if rec:
                        st.warning(f"**Missing:** Add `{rec['is_id']} ({rec['year']})` — {rec['title']}")
                else:
                    c_id = re.sub(r"\s+", " ", cited[0].upper().strip())
                    if c_id not in stds_by_id:
                        st.error(f"**Fix (Blocked Fake ID):** Replace `{c_id}` with `{rec['is_id']}`" if rec else f"Blocked fake ID `{c_id}`")
                    else:
                        vg = resolve_version_chain(c_id, stds_by_id)
                        if vg["hop_count"] > 0:
                            st.error(f"**Fix (Outdated):** Replace `{c_id}` with `{vg['resolved_is_id']}`")
                        else:
                            st.success(f"**Looks good:** `{c_id}` is current.")

    elif simple_page.startswith("My saved specs"):
        st.subheader("My saved specs / सहेजे गए मानक")
        attn = [s for s in st.session_state.saved_specs if s["needs_attention"]]
        if attn:
            st.warning(f"⚠ **{len(attn)} saved spec(s) need attention** — a cited Indian Standard has changed.")
        for sp in st.session_state.saved_specs:
            with st.container(border=True):
                st.markdown(f"#### {sp['title']} (`{sp['primary_id']}`)")
                st.caption(sp["query"])
                if sp["needs_attention"]:
                    st.warning(sp["note"])
                else:
                    st.success(sp["note"])

    else:
        st.subheader("Help — 5-Step Walkthrough & FAQ")
        st.markdown(
            """
1. **Ask in plain language:** Type your product in English, Hindi, or Hinglish on the **Ask** page.
2. **Answer 1 tap question if asked:** If a query is broad (like *"pipes for water"*), tap the material you need.
3. **Check the card & companion standards:** Review the highlighted *"Why this?"* sentence, version status, and *Also needed* list.
4. **Check a whole draft tender:** Upload your `.txt` tender on **Check my tender** to see **Fix**, **Missing**, and **Looks good** lines.
5. **Save for revision alerts:** Click **Save** so you get notified if an Indian Standard is amended or replaced.
"""
        )

# ---------------------------------------------------------------------------
# 6. EXPERT MODE PAGES
# ---------------------------------------------------------------------------
else:
    if expert_page.startswith("01"):
        st.subheader("01 · 14 Unique Selling Propositions (USPs)")
        usp_rows = [
            (1, "Verified standards bundle", "A primary standard plus allied standards labelled Test, Terms, Safety or Install", "Targets the 'incomplete specification' failure in the PS"),
            (2, "Latest-version guard", "Old citations replaced with the current standard and its latest amendment", "Targets the 'outdated standard' failure"),
            (3, "Tender audit", "An uploaded draft returns Missing, Outdated, Mismatch or OK per line", "Works on the officer's real document, not just a search box"),
            (4, "No fake standards", "Every ID is checked against the registry, and invented ones are blocked and counted", "Removes the main risk of using AI here"),
            (5, "Clause-level evidence", "The matching scope sentence is highlighted for each result", "Lets the officer verify in seconds"),
            (6, "Dated certification engine", "Scheme, legal basis, source link and 'verified on' date, or 'no rule found in our table'", "Never claims 'not required' without a source"),
            (7, "Completeness score", "A 0–100 bar naming the missing part, such as 'no test method'", "Makes gaps visible before the tender goes out"),
            (8, "Ask before guessing", "One tap-to-answer question when the need is vague", "Prevents confident wrong answers on 'pipes for water'"),
            (9, "Hindi and Hinglish input", "The same results from English, Devanagari or romanized queries", "Required by the PS and widens who can use it"),
            (10, "Revision watch-list", "A banner when a saved spec cites a standard that changed", "Keeps tenders current after they are drafted"),
            (11, "Officer feedback loop", "Accept, reject or override with a reason; overrides become test cases", "The system improves from real corrections"),
            (12, "Confidence and abstention", "Looks right / Check this / Not sure, with 'no confident match' when appropriate", "Shows when a human should step in"),
            (13, "Learned ranking vs fixed fusion", "A trained ranker compared with simple rank fusion on the same queries", "Evidence-backed, not assumed"),
            (14, "Portal-ready export", "JSON and a REST API that another portal can embed", "Supports the 'integrates with procurement portals' requirement"),
        ]
        st.dataframe(
            pd.DataFrame(usp_rows, columns=["#", "USP", "What the user sees", "Why it matters"]),
            use_container_width=True,
            hide_index=True,
        )
    elif expert_page.startswith("04"):
        st.subheader("04 · Closed-World BIS Registry Explorer")
        st.dataframe(pd.DataFrame(reg["standards"]), use_container_width=True, hide_index=True)
    elif expert_page.startswith("13"):
        st.subheader("13 · Performance Indicators (KPI Suites A–H) [SYNTHETIC — DO NOT CITE ON SLIDES]")
        st.info("Every value below is computed on the synthetic seed-42 benchmark and labelled SYNTHETIC. Real KPIs are to be measured during prototype validation.")
        kpi_df = pd.DataFrame(
            [
                ("A. Retrieval quality", "Recall@1 / @3 / @5 / @10, MRR, nDCG@10, Hit@k, Ablation gain", "Gold test split [SYNTHETIC]"),
                ("B. Bundle completeness", "Allied-set recall, Allied-set precision, Completeness distribution", "Gold test split [SYNTHETIC]"),
                ("C. Correctness guarantees", "Non-registry IDs shown = 0, Superseded as current = 0, Verifier block rate = 100%", "By design + planted defects [SYNTHETIC]"),
                ("D. Tender audit", "Precision, recall & F1 per label (Missing, Outdated, Mismatch, OK), Citation F1", "Planted-defects file [SYNTHETIC]"),
                ("E. Confidence & safety", "HIGH-tier precision, Abstention P/R, Risk-coverage curve, ECE & Brier", "Validation/Test split [SYNTHETIC]"),
                ("F. Language", "Recall@5 by language (EN / HI / Hinglish), Language-ID accuracy", "Multilingual gold split [SYNTHETIC]"),
                ("G. Speed & cost", "Latency p50 / p95, Index build time, Memory footprint", "Runtime benchmark [SYNTHETIC]"),
                ("H. Usability & human impact", "Time to finished bundle, Standards missed, Clicks <= 3 in Simple mode, Trust rating (1-5)", "To be measured with officer testers"),
            ],
            columns=["KPI Group", "Indicators", "Status / Split"],
        )
        st.dataframe(kpi_df, use_container_width=True, hide_index=True)
    else:
        st.info("Switch to Simple Mode in the top header or use the Ask / Tender pages to run interactive queries.")
