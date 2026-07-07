SEVERITY_RANK = {"none": 0, "unknown": 1, "low": 2, "medium": 3, "high": 4}

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


def clean_flags(flags):
    kept = []
    for f in flags:
        v = str(f).strip().lower().replace(" ", "_").replace("-", "_")
        if v in RISK_FLAGS and v != "none" and v not in kept:
            kept.append(v)
    return ";".join(kept) if kept else "none"
