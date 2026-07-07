import base64
import hashlib
import os
import sys
import tempfile
from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel

# vision.py / decide.py use flat imports (from cache import ..., from schema
# import ...), so pipeline/code must be on sys.path regardless of CWD.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "code"))

from vision import analyze_claim
from decide import decide

app = FastAPI()

PIPELINE_MODE = os.getenv("PIPELINE_MODE", "mock")  # mock | gemini | groq


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


@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    claim = {
        "user_id": request.user_id,
        "claim_object": request.claim_object,
        "user_claim": request.user_claim,
        "image_paths": request.image_paths,
    }

    temp_paths = []
    try:
        images = []
        for img in request.images:
            raw = base64.b64decode(img.image_base64)
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
        perception = analyze_claim(
            claim, images, request.requirement_texts, mode=PIPELINE_MODE
        )
        result = decide(claim, perception, history_row)
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
