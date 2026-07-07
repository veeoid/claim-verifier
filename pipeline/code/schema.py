SEVERITY_RANK = {"none": 0, "unknown": 1, "low": 2, "medium": 3, "high": 4}

OBJECT_TYPES = {"car", "laptop", "package", "other", "unknown"}

CLAIM_STATUS = {"supported", "contradicted", "not_enough_information"}

ISSUE_TYPE = {
    "dent",
    "scratch",
    "crack",
    "glass_shatter",
    "broken_part",
    "missing_part",
    "torn_packaging",
    "crushed_packaging",
    "water_damage",
    "stain",
    "none",
    "unknown",
}

OBJECT_PARTS = {
    "car": {
        "front_bumper",
        "rear_bumper",
        "door",
        "hood",
        "windshield",
        "side_mirror",
        "headlight",
        "taillight",
        "fender",
        "quarter_panel",
        "body",
        "unknown",
    },
    "laptop": {
        "screen",
        "keyboard",
        "trackpad",
        "hinge",
        "lid",
        "corner",
        "port",
        "base",
        "body",
        "unknown",
    },
    "package": {
        "box",
        "package_corner",
        "package_side",
        "seal",
        "label",
        "contents",
        "item",
        "unknown",
    },
}

SEVERITY = {"none", "low", "medium", "high", "unknown"}

RISK_FLAGS = {
    "none",
    "blurry_image",
    "cropped_or_obstructed",
    "low_light_or_glare",
    "wrong_angle",
    "wrong_object",
    "wrong_object_part",
    "damage_not_visible",
    "claim_mismatch",
    "possible_manipulation",
    "non_original_image",
    "text_instruction_present",
    "user_history_risk",
    "manual_review_required",
}

QUALITY_FLAGS = {
    "blurry_image",
    "cropped_or_obstructed",
    "low_light_or_glare",
    "wrong_angle",
}

OUTPUT_COLUMNS = [
    "user_id",
    "image_paths",
    "user_claim",
    "claim_object",
    "evidence_standard_met",
    "evidence_standard_met_reason",
    "risk_flags",
    "issue_type",
    "object_part",
    "claim_status",
    "claim_status_justification",
    "supporting_image_ids",
    "valid_image",
    "severity",
]

ISSUE_SYNONYMS = {
    "cracked": "crack",
    "cracking": "crack",
    "deformation": "dent",
    "deformed": "dent",
    "dented": "dent",
    "damage": "unknown",  # too vague to map confidently
    "damaged": "unknown",
    "shattered": "glass_shatter",
    "broken": "broken_part",
    "missing": "missing_part",
    "scratched": "scratch",
    "scrape": "scratch",
    "scraped": "scratch",
    "scraping": "scratch",
    "scuff": "scratch",
    "scuffed": "scratch",
    "abrasion": "scratch",
    "paint_damage": "scratch",
    "torn": "torn_packaging",
    "crushed": "crushed_packaging",
    "water": "water_damage",
    "stained": "stain",
}


def norm(value, allowed, fallback="unknown"):
    if value is None:
        return fallback
    for piece in str(value).split(","):
        v = piece.strip().lower().replace(" ", "_").replace("-", "_")
        v = ISSUE_SYNONYMS.get(v, v)  # translate synonyms first
        if v in allowed:
            return v
    return fallback


def norm_part(value, claim_object):
    allowed = OBJECT_PARTS.get(claim_object, {"unknown"})
    return norm(value, allowed, "unknown")


def to_bool(value, default=False):
    """Coerce model output ("true", "yes", 1, True, ...) to a real bool."""
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        v = value.strip().lower()
        if v in ("true", "yes", "1"):
            return True
        if v in ("false", "no", "0"):
            return False
    return default


def _norm_quality(values):
    if not isinstance(values, list):
        values = [values]
    kept = []
    for q in values:
        v = str(q).strip().lower().replace(" ", "_").replace("-", "_")
        if v in QUALITY_FLAGS and v not in kept:
            kept.append(v)
    return kept if kept else ["none"]


def _norm_image_entry(entry, claim_object):
    if not isinstance(entry, dict):
        entry = {}
    raw_issue = str(entry.get("issue_observed") or "").strip().lower()
    return {
        "image_id": str(entry.get("image_id") or "unknown"),
        "object_seen": norm(entry.get("object_seen"), OBJECT_TYPES, "unknown"),
        "object_matches_claim": to_bool(entry.get("object_matches_claim"), False),
        "part_visible": norm_part(entry.get("part_visible"), claim_object),
        "issue_observed": norm(entry.get("issue_observed"), ISSUE_TYPE, "unknown"),
        # kept so decide() can tell "model saw damage it couldn't name" apart
        # from "model saw nothing" before trusting any claim-text fallback
        "issue_observed_raw": raw_issue,
        "issue_location_matches_claim": to_bool(
            entry.get("issue_location_matches_claim"), False
        ),
        "severity": norm(entry.get("severity"), SEVERITY, "unknown"),
        "quality_issues": _norm_quality(entry.get("quality_issues", ["none"])),
        "instruction_text_present": to_bool(
            entry.get("instruction_text_present"), False
        ),
        "description": str(entry.get("description") or ""),
    }


def normalize_perception(perception, images, claim_object):
    """Coerce raw VLM JSON into the exact perception shape decide() expects.

    Guarantees one per_image entry per submitted image (aligned by image_id),
    real bools, and enum-only values. Raises ValueError when the payload is
    not even dict-shaped, so callers can treat it like a parse failure.
    """
    if not isinstance(perception, dict):
        raise ValueError("perception is not a JSON object")

    raw_list = perception.get("per_image")
    if not isinstance(raw_list, list):
        raw_list = []
    by_id = {
        str(e.get("image_id")): e for e in raw_list if isinstance(e, dict)
    }

    per_image = []
    if images:
        for i, img in enumerate(images):
            entry = by_id.get(img["image_id"])
            if entry is None and i < len(raw_list):
                entry = raw_list[i]  # model renamed ids; fall back to position
            entry = _norm_image_entry(entry or {}, claim_object)
            entry["image_id"] = img["image_id"]
            per_image.append(entry)
    else:
        per_image = [_norm_image_entry(e, claim_object) for e in raw_list]

    cross = perception.get("cross_image")
    if not isinstance(cross, dict):
        cross = {}
    single = len(per_image) < 2
    cross_image = {
        "same_object_across_images": (
            True if single else to_bool(cross.get("same_object_across_images"), True)
        ),
        "identity_consistent": (
            True if single else to_bool(cross.get("identity_consistent"), True)
        ),
        "notes": str(cross.get("notes") or ""),
    }

    ev = perception.get("evidence_assessment")
    if not isinstance(ev, dict):
        ev = {}
    evidence_assessment = {
        "claimed_part_clearly_visible": to_bool(
            ev.get("claimed_part_clearly_visible"), False
        ),
        # defaults are conservative: a response missing this block can never
        # push a claim toward "supported"
        "sufficient_to_evaluate": to_bool(ev.get("sufficient_to_evaluate"), False),
        "reason": str(ev.get("reason") or "model did not provide an assessment."),
    }

    cu = perception.get("claim_understanding")
    if not isinstance(cu, dict):
        cu = {}
    raw_parts = cu.get("claimed_parts") or []
    raw_issues = cu.get("claimed_issues") or []
    if not isinstance(raw_parts, list):
        raw_parts = [raw_parts]
    if not isinstance(raw_issues, list):
        raw_issues = [raw_issues]
    claim_understanding = {
        "claimed_parts": [
            p
            for p in (norm_part(x, claim_object) for x in raw_parts)
            if p != "unknown"
        ],
        "claimed_issues": [
            i
            for i in (norm(x, ISSUE_TYPE, "unknown") for x in raw_issues)
            if i not in ("none", "unknown")
        ],
        "transcript_requests_override": to_bool(
            cu.get("transcript_requests_override"), False
        ),
    }

    return {
        "per_image": per_image,
        "cross_image": cross_image,
        "evidence_assessment": evidence_assessment,
        "claim_understanding": claim_understanding,
    }


def clean_flags(flags):
    kept = []
    for f in flags:
        v = str(f).strip().lower().replace(" ", "_").replace("-", "_")
        if v in RISK_FLAGS and v != "none" and v not in kept:
            kept.append(v)
    return ";".join(kept) if kept else "none"
