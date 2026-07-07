import os
import json
import hashlib

# Anchor to pipeline/cache regardless of the process CWD so the CSV runner
# and the FastAPI service share one cache.
CACHE_DIR = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "cache")
)


def _cache_key(images, context=""):
    # Perception depends on the prompt (claim text, object, requirements,
    # model), not just the pixels — same photos under a different claim must
    # NOT share a cache entry.
    joined = ";".join(sorted(img["rel_path"] for img in images))
    return hashlib.md5(f"{joined}||{context}".encode()).hexdigest()


def get_cached(images, context=""):
    path = os.path.join(CACHE_DIR, _cache_key(images, context) + ".json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None  # corrupt entry — treat as a miss, it will be rewritten
    return None


def save_cache(images, perception, context=""):
    os.makedirs(CACHE_DIR, exist_ok=True)
    path = os.path.join(CACHE_DIR, _cache_key(images, context) + ".json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(perception, f)
