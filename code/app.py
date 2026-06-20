import csv
import os
import sys
import uuid
import time
import json

from flask import Flask, render_template, jsonify, send_file, abort, request

# Allow importing vision / decide / etc. from the same code/ directory
CODE_DIR = os.path.dirname(os.path.abspath(__file__))
if CODE_DIR not in sys.path:
    sys.path.insert(0, CODE_DIR)

from vision import analyze_claim
from decide import decide
from data import load_history, load_requirements, select_requirements

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB upload limit

BASE_DIR = os.path.dirname(CODE_DIR)
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
SAMPLE_CSV = os.path.join(DATASET_DIR, "sample_claims.csv")
OUTPUT_CSV = os.path.join(DATASET_DIR, "output.csv")
UPLOADS_DIR = os.path.join(DATASET_DIR, "images", "submissions")
os.makedirs(UPLOADS_DIR, exist_ok=True)

ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}


# ── helpers ──────────────────────────────────────────────────────────────────

def load_csv(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def enrich(rows, source_label):
    result = []
    for i, row in enumerate(rows):
        row = dict(row)
        row["_source"] = source_label
        row["_id"] = i
        paths = [p.strip() for p in row.get("image_paths", "").split(";") if p.strip()]
        row["_image_list"] = paths
        flags = [f.strip() for f in row.get("risk_flags", "none").split(";")
                 if f.strip() and f.strip() != "none"]
        row["_flag_list"] = flags
        result.append(row)
    return result


def compute_stats(claims):
    total = len(claims)
    if not total:
        return {}
    statuses = [c.get("claim_status", "") for c in claims]
    objects = [c.get("claim_object", "") for c in claims]
    supported = statuses.count("supported")
    contradicted = statuses.count("contradicted")
    nei = statuses.count("not_enough_information")
    return {
        "total": total,
        "supported": supported,
        "contradicted": contradicted,
        "not_enough_information": nei,
        "supported_pct": round(supported / total * 100) if total else 0,
        "contradicted_pct": round(contradicted / total * 100) if total else 0,
        "nei_pct": round(nei / total * 100) if total else 0,
        "cars": objects.count("car"),
        "laptops": objects.count("laptop"),
        "packages": objects.count("package"),
    }


# ── routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    sample = enrich(load_csv(SAMPLE_CSV), "sample")
    output = enrich(load_csv(OUTPUT_CSV), "output")
    all_claims = sample + output
    return render_template("index.html", claims=all_claims, stats=compute_stats(all_claims))


@app.route("/image/<path:image_path>")
def serve_image(image_path):
    full = os.path.join(DATASET_DIR, image_path)
    if not os.path.exists(full):
        abort(404)
    return send_file(full)


@app.route("/api/submit", methods=["POST"])
def api_submit():
    user_id = (request.form.get("user_id") or "").strip() or f"user_{uuid.uuid4().hex[:6]}"
    claim_object = request.form.get("claim_object", "car").strip()
    user_claim = (request.form.get("user_claim") or "").strip()
    mode = request.form.get("mode", "mock").strip()

    if claim_object not in ("car", "laptop", "package"):
        return jsonify({"error": "Invalid claim_object"}), 400
    if not user_claim:
        return jsonify({"error": "user_claim is required"}), 400

    # Save uploaded images
    files = request.files.getlist("images")
    session_id = f"{int(time.time())}_{uuid.uuid4().hex[:6]}"
    save_dir = os.path.join(UPLOADS_DIR, session_id)
    os.makedirs(save_dir, exist_ok=True)

    images = []
    image_rel_paths = []

    for idx, f in enumerate(files):
        if not f or not f.filename:
            continue
        ext = os.path.splitext(f.filename)[1].lower()
        if ext not in ALLOWED_EXTS:
            continue
        fname = f"img_{idx + 1}{ext}"
        full_path = os.path.join(save_dir, fname)
        f.save(full_path)
        image_id = f"img_{idx + 1}"
        rel = os.path.join("images", "submissions", session_id, fname)
        images.append({"image_id": image_id, "rel_path": rel, "full_path": full_path})
        image_rel_paths.append(rel)

    if not images:
        return jsonify({"error": "At least one valid image is required"}), 400

    claim = {
        "user_id": user_id,
        "claim_object": claim_object,
        "user_claim": user_claim,
        "image_paths": ";".join(image_rel_paths),
    }

    try:
        requirements = load_requirements(os.path.join(DATASET_DIR, "evidence_requirements.csv"))
        selected_reqs = select_requirements(requirements, claim_object)
        history = load_history(os.path.join(DATASET_DIR, "user_history.csv"))
        hist_row = history.get(user_id)

        perception = analyze_claim(claim, images, selected_reqs, mode=mode)
        result = decide(claim, perception, hist_row)
    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

    # Enrich for frontend
    result["_source"] = "live"
    result["_image_list"] = image_rel_paths
    flags = [f.strip() for f in result.get("risk_flags", "none").split(";")
             if f.strip() and f.strip() != "none"]
    result["_flag_list"] = flags
    result["_perception"] = perception

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5050)
