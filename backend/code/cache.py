import os
import json
import hashlib

CACHE_DIR = "cache"


def _cache_key(images):
    # build a stable key from the image paths of this claim
    joined = ";".join(sorted(img["rel_path"] for img in images))
    return hashlib.md5(joined.encode()).hexdigest()


def get_cached(images):
    os.makedirs(CACHE_DIR, exist_ok=True)
    path = os.path.join(CACHE_DIR, _cache_key(images) + ".json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def save_cache(images, perception):
    os.makedirs(CACHE_DIR, exist_ok=True)
    path = os.path.join(CACHE_DIR, _cache_key(images) + ".json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(perception, f)
