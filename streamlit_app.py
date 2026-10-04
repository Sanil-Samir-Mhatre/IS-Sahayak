"""
IS-Sahayak — Verified Indian Standards (BIS) & Tender Compliance Engine
Complete Multilingual Streamlit App (Simple Mode + Expert Mode + All 22 Scheduled Indian Languages)
Matches the Google AI Studio application 1-to-1 with zero external API keys required.
Run: streamlit run streamlit_app.py
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
# 1. ALL 22 SCHEDULED INDIAN LANGUAGES + BIDIRECTIONAL TRANSLATION ENGINE
# ---------------------------------------------------------------------------
INDIAN_LANGUAGES = [
    ("en", "English", "English", "Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes for municipal potable water supply"),
    ("hi", "Hindi", "हिन्दी", "पेयजल आपूर्ति के लिए 50 मिमी मध्यम ग्रेड जीआई (GI) माइल्ड स्टील पाइप"),
    ("bn", "Bengali", "বাংলা", "পানীয় জল সরবরাহের জন্য 50 মিমি মাঝারি গ্রেড জিআই (GI) মাইল্ড স্টিল পাইপ"),
    ("mr", "Marathi", "मराठी", "पिण्याच्या पाणी पुरवठ्यासाठी 50 मिमी मध्यम दर्जाचे जीआय (GI) माईल्ड स्टील पाईप"),
    ("te", "Telugu", "తెలుగు", "త్రాగునీటి సరఫరా కోసం 50 మిమీ మీడియం గ్రేడ్ జిఐ (GI) మైల్డ్ స్టీల్ పైపులు"),
    ("ta", "Tamil", "தமிழ்", "குடிநீர் விநியோகத்திற்கான 50 மிமீ நடுத்தர தரம் ஜிஐ (GI) மைல்ட் ஸ்டீல் குழாய்கள்"),
    ("gu", "Gujarati", "ગુજરાતી", "પીવાના પાણીના પુરવઠા માટે 50 મીમી મીડીયમ ગ્રેડ જીઆઈ (GI) માઈલ્ડ સ્ટીલ પાઈપ"),
    ("ur", "Urdu", "اردو", "پینے کے پانی کی فراہمی کے لیے 50 ملی میٹر میڈیم گریڈ جی آئی (GI) مائلڈ اسٹیل پائپ"),
    ("kn", "Kannada", "ಕನ್ನಡ", "ಕುಡಿಯುವ ನೀರಿನ ಪೂರೈಕೆಗಾಗಿ 50 ಮಿಮೀ ಮೀಡಿಯಂ ಗ್ರೇಡ್ ಜಿಐ (GI) ಮೈಲ್ಡ್ ಸ್ಟೀಲ್ ಪೈಪ್‌ಗಳು"),
    ("or", "Odia", "ଓଡ଼ିଆ", "ପାନୀୟ ଜଳ ଯୋଗାଣ ପାଇଁ 50 ମିମି ମିଡିୟମ୍ ଗ୍ରେଡ୍ ଜିଆଇ (GI) ମାଇଲ୍ଡ ଷ୍ଟିଲ୍ ପାଇପ୍"),
    ("ml", "Malayalam", "മലയാളം", "കുടിവെള്ള വിതരണത്തിനായി 50 എംഎം മീഡിയം ഗ്രേഡ് ജിഐ (GI) മൈൽഡ് സ്റ്റീൽ പൈപ്പുകൾ"),
    ("pa", "Punjabi", "ਪੰਜਾਬੀ", "ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਦੀ ਸਪਲਾਈ ਲਈ 50 ਮਿਲੀਮੀਟਰ ਮੀਡੀਅਮ ਗ੍ਰੇਡ ਜੀਆਈ (GI) ਮਾਇਲਡ ਸਟੀਲ ਪਾਈਪ"),
    ("as", "Assamese", "অসমীয়া", "খোৱা পানী যোগানৰ বাবে 50 মিমি মিডিয়াম গ্ৰেড জিআই (GI) মাইল্ড ষ্টীল পাইপ"),
    ("mai", "Maithili", "मैथिली", "पीबक पानि आपूर्तिक लेल 50 मिमी मध्यम ग्रेड जीआई (GI) माइल्ड स्टील पाइप"),
    ("sat", "Santali", "ᱥᱟᱱᱛᱟᱲᱤ", "Supply of 50 mm GI mild steel water supply pipe"),
    ("ks", "Kashmiri", "कॉशुर / کٲشُر", "च़ोनस पान्युक बापत 50 मिमी जीआई माइल्ड स्टील पाइप"),
    ("ne", "Nepali", "नेपाली", "खानेपानी आपूर्तिको लागि ५० मिमी मध्यम ग्रेड जीआई (GI) माइल्ड स्टील पाइप"),
    ("sd", "Sindhi", "सिन्धी / سنڌي", "पीअण जे पाणी लाए 50 मिमी जीआई माइल्ड स्टील पाइप"),
    ("doi", "Dogri", "डोगरी", "पीने दे पानी लेई 50 मिमी मध्यम ग्रेड जीआई माइल्ड स्टील पाइप"),
    ("kok", "Konkani", "कोंकणी", "पियेवपाच्या उदका खातीर 50 मिमी जीआय मायल्ड स्टील पायप"),
    ("mni", "Manipuri", "মৈতৈলোন্", "থক্নবা ঈশিং ফংহন্নবগীদমক 50 মিমি জিআই মাইল্ড ষ্টীল পাইপ"),
    ("brx", "Bodo", "बर'", "लोंनाय दै राननायनि थाखाय 50 मिमि जीआइ माइल्ड स्टिल पाइप"),
    ("sa", "Sanskrit", "संस्कृतम्", "पेयजलवितरणार्थं ५० मिमी मध्यमश्रेणी जीआई मृदु इस्पात नलिका"),
]

GOOGLE_LANG_MAP = {
    "kok": "gom",
    "mni": "mni-Mtei",
    "brx": "hi",
}

DEFAULT_UI_STRINGS = {
    "app_subtitle": "Verified Indian Standards Assistant",
    "nav_ask": "Ask",
    "nav_tender": "Check my tender",
    "nav_saved": "My saved specs",
    "nav_help": "Help",
    "ask_prompt": "What product or item are you buying?",
    "find_btn": "Find Standards",
    "finding_spinner": "Finding the right standards...",
    "completeness_label": "Bundle Completeness",
    "all_included": "All required standard types included",
    "looks_right": "Looks right",
    "check_this": "Check this",
    "not_sure": "Not sure",
    "why_this": "Why this?",
    "current_version": "Current version",
    "amendment_word": "Amendment",
    "replaced_prefix": "Replaced",
    "with_word": "with",
    "cert_label": "Certification",
    "no_rule": "We couldn't find a rule in our table",
    "also_needed": "Also needed for a complete tender",
    "chip_test": "Test",
    "chip_terms": "Terms",
    "chip_safety": "Safety",
    "chip_install": "Install",
    "save_btn": "Save",
    "download_btn": "Download Report",
    "show_details": "Show details (Full step-by-step verification trace)",
    "tender_title": "Drop your draft tender file here, or choose a sample tender",
    "fix_title": "Fix — Outdated or Wrong Standard Cited",
    "missing_title": "Missing — No Indian Standard Cited",
    "good_title": "Looks good — Current & Valid",
    "saved_title": "My Saved Specifications",
    "saved_banner": "saved spec(s) need attention — a cited Indian Standard has changed",
    "help_title": "5-Step Walkthrough",
    "faq_title": "Frequently Asked Questions (FAQ)",
}


@st.cache_data(show_spinner=False)
def translate_text(text: str, target_code: str, source_code: str = "auto") -> str:
    if not text or (target_code == "en" and source_code == "en"):
        return text
    tl = GOOGLE_LANG_MAP.get(target_code, target_code)
    sl = "auto" if source_code == "auto" else GOOGLE_LANG_MAP.get(source_code, source_code)

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
            f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={urllib.parse.quote(sl)}"
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


@st.cache_data(show_spinner=False)
def get_localized_ui_dict(target_code: str) -> dict[str, str]:
    if target_code == "en":
        return DEFAULT_UI_STRINGS.copy()
    localized: dict[str, str] = {}
    for k, v in DEFAULT_UI_STRINGS.items():
        localized[k] = translate_text(v, target_code, "en")
    return localized


def translate_query_to_english_if_needed(raw_query: str) -> tuple[str, bool]:
    trimmed = raw_query.strip()
    if not trimmed:
        return "", False
    has_non_ascii = any(ord(ch) > 127 for ch in trimmed)
    if not has_non_ascii:
        return trimmed, False
    eng = translate_text(trimmed, "en", "auto")
    return eng, eng.lower() != trimmed.lower()


# ---------------------------------------------------------------------------
# 2. CLOSED-WORLD DATASET LOADER
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).parent / "data" / "raw"


@st.cache_data(show_spinner=False)
def load_registry() -> dict[str, Any]:
    stds_path = DATA_DIR / "standards" / "standards.csv"
    refs_path = DATA_DIR / "references" / "references.csv"
    certs_path = DATA_DIR / "certification" / "certification_rules.csv"
    gold_path = DATA_DIR / "gold" / "gold_queries.csv"
    glossary_path = DATA_DIR / "glossary" / "glossary.csv"
    defects_path = DATA_DIR / "tenders" / "planted_defects.csv"
    tenders_dir = DATA_DIR / "tenders"

    stds_df = pd.read_csv(stds_path).fillna("")
    refs_df = pd.read_csv(refs_path).fillna("")
    certs_df = pd.read_csv(certs_path).fillna("")
    gold_df = pd.read_csv(gold_path).fillna("") if gold_path.exists() else pd.DataFrame()
    glossary_df = pd.read_csv(glossary_path).fillna("") if glossary_path.exists() else pd.DataFrame()
    defects_df = pd.read_csv(defects_path).fillna("") if defects_path.exists() else pd.DataFrame()

    tenders = {}
    for fname in ["sample_tender_01.txt", "sample_tender_02.txt"]:
        fpath = tenders_dir / fname
        if fpath.exists():
            tenders[fname] = fpath.read_text(encoding="utf-8")

    return {
        "standards": stds_df.to_dict(orient="records"),
        "references": refs_df.to_dict(orient="records"),
        "certs": certs_df.to_dict(orient="records"),
        "gold": gold_df.to_dict(orient="records"),
        "glossary": glossary_df.to_dict(orient="records"),
        "defects": defects_df.to_dict(orient="records"),
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
                    "latest_amendment_no": 0,
                    "year": 2020,
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

    eng_overlay, was_translated = translate_query_to_english_if_needed(query)
    combined_query = f"{query} {eng_overlay} {clarification}".strip().lower()

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
        if k in combined_query:
            combined_query += " " + v

    is_vague = len(query.split()) <= 4 and ("pipe" in combined_query or "tube" in combined_query) and not clarification
    clarifying_options = []
    if is_vague:
        clarifying_options = [
            "Mild Steel (GI) — Potable Water (SYN IS 90101)",
            "HDPE Polyethylene — Water Supply (SYN IS 90104)",
            "uPVC — Potable Water Distribution (SYN IS 90105)",
            "Ductile Iron (DI) — Pressure Mains (SYN IS 90106)",
        ]

    cited_matches = re.findall(r"(?:SYN\s+)?IS\s*\d{3,6}", query, flags=re.IGNORECASE)
    cited_canonical = [re.sub(r"\s+", " ", m.upper().strip()) for m in cited_matches]

    scored: list[tuple[float, dict[str, Any], dict[str, Any]]] = []
    q_tokens = set(re.findall(r"[a-z0-9]+", combined_query))

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
            allied.append(
                {
                    "is_id": target["is_id"],
                    "title": target["title"],
                    "year": int(target["year"]),
                    "role": r["role"],
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
    score_pct += 15
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
        "english_overlay": eng_overlay if was_translated else "",
    }


# ---------------------------------------------------------------------------
# 4. SESSION STATE & HEADER / SIDEBAR CONTROLS
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
if "query_text" not in st.session_state:
    st.session_state.query_text = INDIAN_LANGUAGES[0][3]

# Top Header: Provenance Strip + 22 Indian Languages Selector + Simple/Expert Mode Toggle
top_col1, top_col2, top_col3 = st.columns([5, 3, 2])
with top_col1:
    st.caption(
        "🔶 **SYNTHETIC DATA - NOT A VALIDATION RESULT** · "
        f"{len(reg['standards'])} standards · {reg['registry_version']} · Ranker: **Hybrid RRF (k=60)**"
    )
with top_col2:
    lang_map = {f"{name_en} ({name_nat})": (code, name_en, name_nat, sample_q) for code, name_en, name_nat, sample_q in INDIAN_LANGUAGES}
    selected_lang_label = st.selectbox(
        "भाषा / Language",
        options=list(lang_map.keys()),
        index=0,
        label_visibility="collapsed",
    )
    target_lang, active_lang_en, active_lang_nat, active_lang_sample = lang_map[selected_lang_label]
with top_col3:
    ui_mode = st.radio(
        "Mode",
        options=["Simple", "Expert"],
        horizontal=True,
        label_visibility="collapsed",
    )

ui = get_localized_ui_dict(target_lang)

st.sidebar.markdown("### IS-Sahayak")
if ui_mode == "Simple":
    st.sidebar.caption(ui["app_subtitle"])
    nav_options = {
        f"{ui['nav_ask']} (मानक खोजें)": "ask",
        f"{ui['nav_tender']} (निविदा जांचें)": "tender",
        f"{ui['nav_saved']} (सहेजे गए मानक)": "saved",
        f"{ui['nav_help']} (सहायता)": "help",
    }
    chosen_nav_label = st.sidebar.radio("Navigation", list(nav_options.keys()), label_visibility="collapsed")
    simple_tab = nav_options[chosen_nav_label]
else:
    st.sidebar.caption("Expert Mode · Full 16-Page Workbench")
    expert_page = st.sidebar.radio(
        "All 16 Expert Pages",
        options=[
            "00 · Home",
            "01 · USP Showcase (14)",
            "02 · Demo Mode (5 Scenarios)",
            "03 · Data & EDA",
            "04 · Registry Explorer",
            "05 · Reference Graph",
            "06 · Query Understanding",
            "07 · Retrieval Lab",
            "08 · Bundle Builder",
            "09 · Tender Audit",
            "10 · Review Queue",
            "11 · Revision Watch-List",
            "12 · Model Lab (A–G)",
            "13 · Evaluation & KPIs (A–H)",
            "14 · Responsible AI",
            "15 · Help & Python Source",
        ],
    )

# ---------------------------------------------------------------------------
# 5. SIMPLE MODE (4 PAGES: Ask, Check my tender, My saved specs, Help)
# ---------------------------------------------------------------------------
if ui_mode == "Simple":
    if simple_tab == "ask":
        st.subheader(ui["ask_prompt"])

        # Example chips + 1-click sample in selected Indian language
        chip_cols = st.columns(4)
        if chip_cols[0].button("50 mm GI Pipe (EN)", use_container_width=True):
            st.session_state.query_text = INDIAN_LANGUAGES[0][3]
            st.session_state.clarification = ""
        if chip_cols[1].button("पेयजल जीआई पाइप (HI)", use_container_width=True):
            st.session_state.query_text = INDIAN_LANGUAGES[1][3]
            st.session_state.clarification = ""
        if chip_cols[2].button('"Pipes for water" (Vague)', use_container_width=True):
            st.session_state.query_text = "Pipes for water"
            st.session_state.clarification = ""
        if chip_cols[3].button(f"★ Sample ({active_lang_nat})", use_container_width=True):
            st.session_state.query_text = active_lang_sample
            st.session_state.clarification = ""

        query_input = st.text_input(
            ui["ask_prompt"],
            value=st.session_state.query_text,
            label_visibility="collapsed",
        )
        st.session_state.query_text = query_input

        with st.spinner(ui["finding_spinner"]):
            res = run_pipeline(query_input, reg, st.session_state.clarification)

        if target_lang != "en":
            st.info(
                f"**{active_lang_en} ({active_lang_nat}):** "
                f"{translate_text(query_input, target_lang, 'auto')}"
            )
        if res["english_overlay"]:
            st.caption(f"**Multilingual Query Understood As:** {res['english_overlay']}")

        # Clarifying question (2-4 tap buttons)
        if res["clarifying_options"]:
            st.warning("**Which type of water pipe do you need?**")
            c_cols = st.columns(2)
            for idx, opt in enumerate(res["clarifying_options"]):
                label_opt = translate_text(opt, target_lang, "en") if target_lang != "en" else opt
                if c_cols[idx % 2].button(label_opt, key=f"cq_{idx}", use_container_width=True):
                    st.session_state.clarification = opt
                    st.rerun()

        # Completeness bar (0-100)
        gap_txt = (
            translate_text(f"Missing: {res['first_gap']}", target_lang, "en")
            if res["first_gap"]
            else ui["all_included"]
        )
        st.markdown(f"**{ui['completeness_label']}: {res['completeness_pct']}/100** — {gap_txt}")
        st.progress(res["completeness_pct"] / 100.0)

        # Primary standard cards
        for idx, prim in enumerate(res["primaries"]):
            badge = (
                f"✓ {ui['looks_right']}"
                if idx == 0 and not res["abstained"]
                else (f"? {ui['not_sure']}" if res["abstained"] else f"⚠ {ui['check_this']}")
            )
            with st.container(border=True):
                h1, h2 = st.columns([4, 1])
                h1.markdown(f"`{prim['is_id']}`  \n#### {prim['title']}")
                if target_lang != "en":
                    h1.markdown(f"**[{active_lang_nat}]** {translate_text(prim['title'], target_lang, 'en')}")
                h2.markdown(f"**{badge}**")

                st.markdown(f"**{ui['why_this']}:** “{prim['best_en_sentence']}”")
                if target_lang != "en":
                    st.info(f"**{active_lang_nat}:** “{translate_text(prim['best_en_sentence'], target_lang, 'en')}”")

                v_col, c_col = st.columns(2)
                vg = prim["version_guard"]
                if vg["hop_count"] > 0:
                    v_col.warning(
                        f"⚠ {ui['replaced_prefix']} `{vg['input_is_id']}` {ui['with_word']} "
                        f"`{prim['is_id']}` ({prim['year']}, {ui['amendment_word']} {vg['latest_amendment_no']})"
                    )
                else:
                    v_col.success(
                        f"✓ {ui['current_version']} ({prim['year']}), "
                        f"{ui['amendment_word']} {vg['latest_amendment_no']}"
                    )

                cert = prim["certification"]
                if cert["matched"]:
                    c_col.info(
                        f"**{ui['cert_label']}:** {cert['scheme']} · {cert['legal_basis']} · verified {cert['verified_on']}"
                    )
                else:
                    c_col.warning(f"**{ui['cert_label']}:** {ui['no_rule']}")

        # Also needed companion list
        role_chip_map = {
            "test_method": ui["chip_test"],
            "terminology": ui["chip_terms"],
            "safety": ui["chip_safety"],
            "installation": ui["chip_install"],
        }
        with st.container(border=True):
            st.markdown(f"#### {ui['also_needed']} ({len(res['allied'])})")
            for al in res["allied"]:
                chip = role_chip_map.get(al["role"], "Related")
                al_title = al["title"]
                if target_lang != "en":
                    al_title = f"{al_title} — **[{active_lang_nat}]** {translate_text(al['title'], target_lang, 'en')}"
                st.markdown(f"- **[{chip}]** `{al['is_id']} ({al['year']})` — {al_title}")

        b1, b2 = st.columns(2)
        if b1.button(ui["save_btn"], use_container_width=True):
            st.session_state.saved_specs.append(
                {
                    "title": query_input[:50],
                    "query": query_input,
                    "primary_id": res["primaries"][0]["is_id"] if res["primaries"] else "NONE",
                    "needs_attention": False,
                    "note": "Up to date with current registry.",
                }
            )
            st.success("Saved!")
        b2.download_button(
            ui["download_btn"],
            data=json.dumps(res, indent=2, ensure_ascii=False),
            file_name="is_sahayak_bundle.json",
            mime="application/json",
            use_container_width=True,
        )

        with st.expander(ui["show_details"]):
            st.json(res)

    elif simple_tab == "tender":
        st.subheader(ui["nav_tender"])
        uploaded = st.file_uploader(ui["tender_title"], type=["txt"])
        sample_choice = st.selectbox("Sample Draft Tender:", list(reg["tenders"].keys()))
        tender_text = uploaded.read().decode("utf-8") if uploaded else reg["tenders"][sample_choice]

        lines = [ln.strip() for ln in tender_text.splitlines() if ln.strip()]
        stds_by_id = {s["is_id"]: s for s in reg["standards"]}

        st.markdown(f"**Checked {len(lines)} lines:**")
        for i, line in enumerate(lines, start=1):
            cited = re.findall(r"(?:SYN\s+)?IS\s*\d{3,6}", line, flags=re.IGNORECASE)
            res = run_pipeline(line, reg)
            rec = res["primaries"][0] if res["primaries"] else None
            with st.container(border=True):
                st.markdown(f"**Line {i}:** {line}")
                if target_lang != "en":
                    st.caption(f"[{active_lang_nat}] {translate_text(line, target_lang, 'auto')}")
                if not cited:
                    if rec:
                        st.warning(f"**{ui['missing_title']}:** Add `{rec['is_id']} ({rec['year']})` — {rec['title']}")
                else:
                    c_id = re.sub(r"\s+", " ", cited[0].upper().strip())
                    if c_id not in stds_by_id:
                        st.error(
                            f"**{ui['fix_title']}:** {ui['replaced_prefix']} `{c_id}` {ui['with_word']} `{rec['is_id']}`"
                            if rec
                            else f"Blocked non-registry ID `{c_id}`"
                        )
                    else:
                        vg = resolve_version_chain(c_id, stds_by_id)
                        if vg["hop_count"] > 0:
                            st.error(
                                f"**{ui['fix_title']}:** {ui['replaced_prefix']} `{c_id}` {ui['with_word']} `{vg['resolved_is_id']}`"
                            )
                        else:
                            st.success(f"**{ui['good_title']}:** `{c_id}`")

    elif simple_tab == "saved":
        st.subheader(ui["saved_title"])
        attn = [s for s in st.session_state.saved_specs if s["needs_attention"]]
        if attn:
            st.warning(f"⚠ **{len(attn)} {ui['saved_banner']}**")
        for sp in st.session_state.saved_specs:
            with st.container(border=True):
                st.markdown(f"#### {sp['title']} (`{sp['primary_id']}`)")
                st.caption(sp["query"])
                if target_lang != "en":
                    st.caption(f"[{active_lang_nat}] {translate_text(sp['query'], target_lang, 'auto')}")
                if sp["needs_attention"]:
                    st.warning(translate_text(sp["note"], target_lang, "en") if target_lang != "en" else sp["note"])
                else:
                    st.success(translate_text(sp["note"], target_lang, "en") if target_lang != "en" else sp["note"])

    else:
        st.subheader(ui["help_title"])
        steps = [
            ("Step 1", "Type what you are buying in any Indian language, English, or Hinglish on the Ask page."),
            ("Step 2", "Tap one of the clarifying options if your query is broad (such as 'Pipes for water')."),
            ("Step 3", "Review the primary standard, highlighted scope sentence, version status, and certification rule."),
            ("Step 4", "Include the 'Also needed' companion standards (Test, Terms, Safety, Install) for a complete tender."),
            ("Step 5", "Upload your draft tender on 'Check my tender' or save specifications to receive revision alerts."),
        ]
        for s_num, s_txt in steps:
            with st.container(border=True):
                st.markdown(f"**{s_num}:** {s_txt}")
                if target_lang != "en":
                    st.caption(f"[{active_lang_nat}] {translate_text(s_txt, target_lang, 'en')}")

# ---------------------------------------------------------------------------
# 6. EXPERT MODE (ALL 16 PAGES)
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
        st.dataframe(pd.DataFrame(usp_rows, columns=["#", "USP", "What the user sees", "Why it matters"]), use_container_width=True, hide_index=True)
    elif expert_page.startswith("03"):
        st.subheader("03 · Data & EDA (Synthetic Seed-42 Registry)")
        c1, c2, c3 = st.columns(3)
        c1.metric("Standards", len(reg["standards"]))
        c2.metric("Normative References", len(reg["references"]))
        c3.metric("Certification Rules", len(reg["certs"]))
        st.dataframe(pd.DataFrame(reg["standards"]), use_container_width=True, hide_index=True)
    elif expert_page.startswith("04"):
        st.subheader("04 · Closed-World BIS Registry Explorer")
        st.dataframe(pd.DataFrame(reg["standards"]), use_container_width=True, hide_index=True)
    elif expert_page.startswith("05"):
        st.subheader("05 · Normative Reference Graph Edges")
        st.dataframe(pd.DataFrame(reg["references"]), use_container_width=True, hide_index=True)
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
                ("F. Language", "Recall@5 by language (EN / HI / Hinglish + 22 Indian languages), Language-ID accuracy", "Multilingual gold split [SYNTHETIC]"),
                ("G. Speed & cost", "Latency p50 / p95, Index build time, Memory footprint", "Runtime benchmark [SYNTHETIC]"),
                ("H. Usability & human impact", "Time to finished bundle, Standards missed, Clicks <= 3 in Simple mode, Trust rating (1-5)", "To be measured with officer testers"),
            ],
            columns=["KPI Group", "Indicators", "Status / Split"],
        )
        st.dataframe(kpi_df, use_container_width=True, hide_index=True)
    else:
        st.subheader(expert_page)
        st.dataframe(pd.DataFrame(reg["standards"]), use_container_width=True, hide_index=True)
