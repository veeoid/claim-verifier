import base64
import binascii
import hashlib
import os
import sys
import tempfile
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# vision.py / decide.py use flat imports (from cache import ..., from schema
# import ...), so pipeline/code must be on sys.path regardless of CWD.
PIPELINE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(PIPELINE_DIR, "code"))

from vision import analyze_claim
from decide import decide
from data import load_requirements, select_requirements

app = FastAPI()

PIPELINE_MODE = os.getenv("PIPELINE_MODE", "groq")  # mock | gemini | groq

# The web client sends no requirement_texts, so the sufficiency standard the
# VLM judges against lives here, loaded once from the dataset.
REQUIREMENTS = load_requirements(
    os.path.join(PIPELINE_DIR, "dataset", "evidence_requirements.csv")
)


class AnalyzeImage(BaseModel):
    image_id: str
    image_base64: str


class HistoryRow(BaseModel):
    history_flags: Optional[str] = "none"
    last_90_days_claim_count: Optional[int] = 0
    rejected_claim: Optional[int] = 0


class AnalyzeRequest(BaseModel):
    user_id: str = "web_user"
    claim_object: str
    user_claim: str
    image_paths: str = ""
    images: list[AnalyzeImage]
    requirement_texts: list[str] = []
    history: Optional[HistoryRow] = None


@app.get("/health")
def health():
    return {"status": "ok", "mode": PIPELINE_MODE}


@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    claim = {
        "user_id": request.user_id,
        "claim_object": request.claim_object.strip().lower(),
        "user_claim": request.user_claim,
        "image_paths": request.image_paths,
    }

    if not request.images:
        return _no_image_result(claim)

    requirement_texts = request.requirement_texts or select_requirements(
        REQUIREMENTS, claim["claim_object"]
    )

    temp_paths = []
    try:
        images = []
        for img in request.images:
            try:
                raw = base64.b64decode(img.image_base64, validate=True)
            except (binascii.Error, ValueError):
                raise HTTPException(
                    status_code=400,
                    detail=f"image {img.image_id!r} is not valid base64",
                )
            if not raw:
                raise HTTPException(
                    status_code=400, detail=f"image {img.image_id!r} is empty"
                )
            fd, path = tempfile.mkstemp(suffix=".jpg")
            with os.fdopen(fd, "wb") as f:
                f.write(raw)
            temp_paths.append(path)
            images.append(
                {
                    "image_id": img.image_id,
                    "full_path": path,
                    # cache.py keys on rel_path; content hash makes identical
                    # uploads cache-hit while temp paths stay random.
                    "rel_path": hashlib.md5(raw).hexdigest(),
                }
            )

        history_row = request.history.model_dump() if request.history else None
        try:
            perception = analyze_claim(
                claim, images, requirement_texts, mode=PIPELINE_MODE
            )
            result = decide(claim, perception, history_row)
        except Exception as e:
            # Surface pipeline faults as a 5xx so the API marks the claim
            # "failed" for retry instead of storing a fabricated verdict.
            print(f"[service] analysis failed: {e!r}")
            raise HTTPException(status_code=502, detail="analysis pipeline failed")

        # decide() emits "true"/"false" strings for the CSV pipeline; the API
        # client deserializes these fields as booleans.
        result["evidence_standard_met"] = result["evidence_standard_met"] == "true"
        result["valid_image"] = result["valid_image"] == "true"
        return result
    finally:
        for path in temp_paths:
            try:
                os.remove(path)
            except OSError:
                pass


def _no_image_result(claim):
    return {
        "user_id": claim["user_id"],
        "image_paths": claim["image_paths"],
        "user_claim": claim["user_claim"],
        "claim_object": claim["claim_object"],
        "evidence_standard_met": False,
        "evidence_standard_met_reason": "No images were submitted with the claim.",
        "risk_flags": "none",
        "issue_type": "unknown",
        "object_part": "unknown",
        "claim_status": "not_enough_information",
        "claim_status_justification": "No images were submitted, so the claim cannot be evaluated.",
        "supporting_image_ids": "none",
        "valid_image": False,
        "severity": "unknown",
    }
