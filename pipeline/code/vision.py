import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv
from cache import get_cached, save_cache
import base64
import time
from groq import Groq

load_dotenv()

PERCEPTION_SCHEMA = {
    "per_image": [
        {
            "image_id": "str",
            "object_seen": "car|laptop|package|other|unknown",
            "object_matches_claim": "bool",
            "part_visible": "<object-specific part or unknown>",
            "issue_observed": "<issue_type enum or none/unknown>",
            "issue_location_matches_claim": "bool",
            "severity": "none|low|medium|high|unknown",
            "quality_issues": [
                "blurry_image|cropped_or_obstructed|low_light_or_glare|wrong_angle|none"
            ],
            "description": "short, grounded in the image",
        }
    ],
    "cross_image": {
        "same_object_across_images": "bool",
        "identity_consistent": "bool",
        "notes": "str",
    },
    "evidence_assessment": {
        "claimed_part_clearly_visible": "bool",
        "sufficient_to_evaluate": "bool",
        "reason": "str",
    },
}


def analyze_claim_mock(claim, images, requirement_texts):
    claim_object = claim["claim_object"]
    per_image = []
    for img in images:
        per_image.append(
            {
                "image_id": img["image_id"],
                "object_seen": claim_object,
                "object_matches_claim": True,
                "part_visible": "unknown",
                "issue_observed": "unknown",
                "issue_location_matches_claim": True,
                "severity": "unknown",
                "quality_issues": ["none"],
                "description": f"[mock] {img['image_id']} assumed usable for {claim_object}.",
            }
        )
    return {
        "per_image": per_image,
        "cross_image": {
            "same_object_across_images": True,
            "identity_consistent": True,
            "notes": "[mock] no cross-image conflict assumed.",
        },
        "evidence_assessment": {
            "claimed_part_clearly_visible": True,
            "sufficient_to_evaluate": True,
            "reason": "[mock] perception layer not yet wired to a real model.",
        },
    }


def analyze_claim_gemini(
    claim, images, requirement_texts, model="gemini-2.5-flash-lite"
):
    cached = get_cached(images)
    if cached is not None:
        return cached

    parts = []
    for image in images:
        with open(image["full_path"], "rb") as f:
            parts.append(types.Part.from_bytes(data=f.read(), mime_type="image/jpeg"))
    parts.append(_build_prompt(claim, images, requirement_texts))
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    response = client.models.generate_content(
        model=model,
        contents=parts,
        config=types.GenerateContentConfig(
            temperature=0, response_mime_type="application/json"
        ),
    )
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    try:
        perception = json.loads(text)
    except json.JSONDecodeError:
        return _fallback_perception(claim, images)

    save_cache(images, perception)  # only successful results get cached
    return perception


def analyze_claim_groq(claim, images, requirement_texts, model="meta-llama/llama-4-scout-17b-16e-instruct"):
    cached = get_cached(images)
    if cached is not None:
        return cached

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Build OpenAI-style content: the prompt text, then each image as a base64 data URL.
    content = [
        {"type": "text", "text": _build_prompt(claim, images, requirement_texts)}
    ]
    for image in images:
        b64, mime = _load_image_b64(image["full_path"])
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime};base64,{b64}"},
            }
        )

    for attempt in range(4):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": content}],
                temperature=0,
                response_format={"type": "json_object"},
            )
            text = response.choices[0].message.content.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            perception = json.loads(text)
            save_cache(images, perception)
            return perception
        except Exception as e:
            print(f"[vision] attempt {attempt+1} failed for {[i['image_id'] for i in images]}: {e}")
            if attempt < 3:
                time.sleep(2**attempt * 5)
                continue
            return _fallback_perception(claim, images)


def _load_image_b64(path):
    """Read an image file, convert AVIF/unsupported formats to JPEG, return (b64, mime)."""
    MAGIC = {b"\xff\xd8\xff": "image/jpeg", b"\x89PNG": "image/png"}
    with open(path, "rb") as f:
        raw = f.read()
    for sig, mime in MAGIC.items():
        if raw[: len(sig)] == sig:
            return base64.b64encode(raw).decode("utf-8"), mime
    # Anything else (AVIF, WebP, etc.) — convert to JPEG via Pillow.
    from io import BytesIO
    from PIL import Image
    img = Image.open(BytesIO(raw)).convert("RGB")
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode("utf-8"), "image/jpeg"


def _build_prompt(claim, images, requirement_texts):
    image_ids = ", ".join([i["image_id"] for i in images])
    reqs = "\n".join(f"- {text}" for text in requirement_texts)
    return f"""You are a visual-evidence inspector for damage claims. Look ONLY at the
    images and report what you actually see. Do NOT decide whether the claim is
    'supported' -- another component does that. The conversation may be in any
    language. Be direct and concise — no filler phrases like "it appears", "I believe",
    or "it seems". State only what is clearly visible.

    Object type claimed: {claim["claim_object"]}
    Claim conversation (transcript): {claim["user_claim"]}
    Image IDs provided: {image_ids}

    Minimum evidence requirements to judge sufficiency against:
    {reqs}

    Return ONLY JSON matching this shape (use the exact allowed enum values; if
    unsure use "unknown"; for quality use ["none"] when the image is fine):
    {json.dumps(PERCEPTION_SCHEMA, indent=2)}

    Rules:
    - issue_observed must reflect what is VISIBLE, not what the user claimed.
    - If multiple images appear to show DIFFERENT objects, set
    cross_image.identity_consistent = false.
    - part_visible must use the part vocabulary for a {claim["claim_object"]}.
    """


def analyze_claim(claim, images, requirement_texts, mode="mock"):
    if mode == "groq":
        return analyze_claim_groq(claim, images, requirement_texts)
    if mode == "gemini":
        return analyze_claim_gemini(claim, images, requirement_texts)
    return analyze_claim_mock(claim, images, requirement_texts)


def _fallback_perception(claim, images):
    return {
        "per_image": [
            {
                "image_id": img["image_id"],
                "object_seen": "unknown",
                "object_matches_claim": False,
                "part_visible": "unknown",
                "issue_observed": "unknown",
                "issue_location_matches_claim": False,
                "severity": "unknown",
                "quality_issues": ["none"],
                "description": "perception failed; treated as unevaluable.",
            }
            for img in images
        ],
        "cross_image": {
            "same_object_across_images": False,
            "identity_consistent": False,
            "notes": "perception failed.",
        },
        "evidence_assessment": {
            "claimed_part_clearly_visible": False,
            "sufficient_to_evaluate": False,
            "reason": "model response could not be parsed.",
        },
    }
