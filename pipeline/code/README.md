# Claim Verifier — Code

Multi-modal damage claim verification system for HackerRank Orchestrate (June 2026).

## How it works

Each claim is processed in three stages:

1. **Vision** (`vision.py`) — sends claim images and conversation to a VLM (Gemini or Groq). The model reports what it sees per image: issue type, object part, severity, quality defects, and cross-image identity. It does not decide claim status.
2. **Decide** (`decide.py`) — applies deterministic rules over the VLM output to produce claim status, flags, severity, and justification.
3. **Output** (`main.py`) — writes one row per claim to `output.csv`.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install google-genai groq python-dotenv pillow
```

Create `code/.env`:

```
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

## Running

Run from the repo root (not from inside `code/`):

```bash
# Full test run with Gemini (recommended)
.venv/bin/python code/main.py --claims dataset/claims.csv --out output.csv --mode gemini

# Full test run with Groq
.venv/bin/python code/main.py --claims dataset/claims.csv --out output.csv --mode groq

# Limit to first N rows (for testing)
.venv/bin/python code/main.py --claims dataset/claims.csv --out output.csv --mode gemini --limit 5

# Run on sample claims for evaluation
.venv/bin/python code/main.py --claims dataset/sample_claims.csv --out sample_output.csv --mode gemini
```

## Evaluating

```bash
.venv/bin/python code/evaluation/main.py dataset/sample_claims.csv sample_output.csv
```

Prints per-column accuracy and risk-flag precision/recall/F1 against the labeled sample.

## File overview

| File | Purpose |
|---|---|
| `main.py` | Entry point; reads claims, calls vision, writes output |
| `vision.py` | VLM integration (Gemini, Groq, mock); image encoding; prompt |
| `decide.py` | Rule layer; converts VLM perception into final output row |
| `schema.py` | Enums, synonyms, normalization helpers |
| `data.py` | CSV loaders and image path resolver |
| `cache.py` | MD5-keyed JSON cache for VLM responses |
| `evaluation/main.py` | Evaluation script |
| `evaluation/evaluation_report.md` | Operational analysis |

## Caching

Successful VLM responses are cached in `cache/` as `<md5_of_image_paths>.json`. Re-running the same claim hits the cache and skips the API call. Delete the `cache/` folder to force a fresh run.

## Image format handling

Some images have `.jpg` extensions but are actually AVIF format. The system detects the real format via magic bytes and converts AVIF to JPEG before sending to the API, since most VLM APIs do not accept AVIF.
