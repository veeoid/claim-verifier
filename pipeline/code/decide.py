from schema import (
    norm,
    clean_flags,
    normalize_perception,
    ISSUE_TYPE,
    SEVERITY_RANK,
    QUALITY_FLAGS,
)


def decide(claim, perception, history_row):
    claim_object = claim["claim_object"]
    # Idempotent guard: vision already normalizes, but decide() must never
    # crash on a hand-built or legacy-cached perception dict.
    perception = normalize_perception(perception, None, claim_object)
    per_image = perception["per_image"]
    cross = perception["cross_image"]
    ev = perception["evidence_assessment"]
    cu = perception["claim_understanding"]

    flags = []

    # 1. VALID IMAGE — usable if at least one image has no real quality defect.
    usable = 0
    for img in per_image:
        defects = [q for q in img["quality_issues"] if q in QUALITY_FLAGS]
        flags.extend(defects)
        if not defects:
            usable += 1
    valid_image = usable > 0

    # 2. CROSS-IMAGE IDENTITY — the "different cars" case.
    identity_ok = True if len(per_image) < 2 else cross["identity_consistent"]
    if not identity_ok:
        flags.extend(["wrong_object", "claim_mismatch", "manual_review_required"])

    # 3. OBJECT MATCH — evidence only counts from images showing the claimed
    # object type. If NO image shows it, the claim cannot be evaluated at all.
    # Small VLMs sometimes report object_matches_claim=false to mean "the
    # claimed PART is not visible", so object_seen agreeing with the claimed
    # type also counts; part-level mismatch is handled separately below.
    matching = [
        img
        for img in per_image
        if img["object_matches_claim"] or img["object_seen"] == claim_object
    ]
    if len(matching) < len(per_image):
        flags.append("wrong_object")
    object_ok = bool(matching)
    if per_image and not object_ok:
        flags.append("claim_mismatch")

    # 4. WHAT THE CUSTOMER CLAIMS — VLM-extracted (handles any language),
    # with a word-scan of the transcript as backstop.
    claimed_parts = set(cu["claimed_parts"])
    claimed_issues = list(cu["claimed_issues"])
    text_issue = _issue_from_text(claim["user_claim"])
    if text_issue and text_issue not in claimed_issues:
        claimed_issues.append(text_issue)

    # 5. OBSERVED ISSUE + PART — images are the source of truth; only images
    # showing the claimed object may contribute.
    issue_type, object_part, supporting_ids, location_ok = _pick_issue(
        matching, claim_object
    )

    # 5b. NAMING FALLBACK — the model saw damage but returned a label outside
    # the enum (e.g. "damage"). Borrow the claimed issue name for reporting.
    # This never fires when the model saw nothing, so text alone can never
    # push a claim toward "supported".
    saw_unnamed_issue = any(
        img["issue_observed_raw"] not in ("", "none", "unknown")
        and img["issue_observed"] == "unknown"
        for img in matching
    )
    if issue_type == "unknown" and saw_unnamed_issue and claimed_issues:
        issue_type = claimed_issues[0]

    # 5c. LOCATION — a visible issue only supports the claim if it sits on the
    # claimed part (per the model) or the observed part matches the transcript.
    if object_part in claimed_parts:
        location_ok = True
    if not claimed_parts and not claimed_issues:
        location_ok = True  # nothing specific was claimed; don't penalize

    # 6. INSTRUCTION INJECTION — text pressuring the reviewer never changes the
    # verdict, but always earns flags for a human to see.
    if cu["transcript_requests_override"] or any(
        img["instruction_text_present"] for img in per_image
    ):
        flags.extend(["text_instruction_present", "manual_review_required"])

    # 7. EVIDENCE STANDARD.
    evidence_met = (
        ev["sufficient_to_evaluate"] and valid_image and identity_ok and object_ok
    )
    evidence_reason = ev["reason"]

    # 8. CLAIM STATUS — the core verdict.
    if not valid_image or not identity_ok or not object_ok or not evidence_met:
        status = "not_enough_information"
    elif issue_type == "none":
        # Contradiction is a strong call: only when the claimed part was
        # clearly visible and undamaged.
        status = (
            "contradicted"
            if ev["claimed_part_clearly_visible"]
            else "not_enough_information"
        )
    elif issue_type == "unknown":
        status = "not_enough_information"
    elif not location_ok:
        status = "not_enough_information"
        flags.extend(["wrong_object_part", "claim_mismatch"])
    else:
        status = "supported"

    # 9. SEVERITY — worst severity among supporting images when supported.
    if status == "supported":
        pool = [i for i in matching if i["image_id"] in supporting_ids] or matching
        severity = max(
            (i["severity"] for i in pool), key=lambda s: SEVERITY_RANK[s]
        )
    elif status == "not_enough_information":
        severity = "unknown"
    else:
        severity = "none"

    # 10. HISTORY LAST — can ONLY add a risk flag, never change status.
    flags = apply_history(flags, history_row)

    if status != "supported":
        supporting_ids = []

    # 11. JUSTIFICATION.
    img_ref = (" (" + ";".join(supporting_ids) + ")") if supporting_ids else ""
    if status == "supported":
        justification = f"Image evidence shows {issue_type} on {object_part}{img_ref}; history adds no overriding risk."
    elif status == "contradicted":
        justification = f"The {object_part} is clearly visible and shows no damage, contradicting the claim."
    elif not valid_image:
        justification = (
            "Submitted images are not usable enough to evaluate the claimed damage."
        )
    elif not identity_ok:
        justification = "Images appear to show different objects, so the claimed damage cannot be tied to one item."
    elif not object_ok:
        justification = f"None of the images show the claimed {claim_object}, so the claim cannot be evaluated."
    elif "wrong_object_part" in flags:
        justification = f"Visible {issue_type} is on the {object_part}, not on the claimed part, so it does not support this claim."
    else:
        justification = "Available image evidence is insufficient to confirm or contradict the claim."

    return {
        "user_id": claim["user_id"],
        "image_paths": claim["image_paths"],
        "user_claim": claim["user_claim"],
        "claim_object": claim_object,
        "evidence_standard_met": "true" if evidence_met else "false",
        "evidence_standard_met_reason": evidence_reason,
        "risk_flags": clean_flags(flags),
        "issue_type": issue_type,
        "object_part": object_part,
        "claim_status": status,
        "claim_status_justification": justification,
        "supporting_image_ids": ";".join(supporting_ids) if supporting_ids else "none",
        "valid_image": "true" if valid_image else "false",
        "severity": severity,
    }


def _pick_issue(matching, claim_object):
    """Choose the observed issue/part and every image that shows it.

    Returns (issue_type, object_part, supporting_ids, location_ok).
    """
    for img in matching:
        issue = img["issue_observed"]
        if issue in ("none", "unknown"):
            continue
        supporting = [
            i["image_id"] for i in matching if i["issue_observed"] == issue
        ]
        location_ok = any(
            i["issue_location_matches_claim"]
            for i in matching
            if i["issue_observed"] == issue
        )
        return issue, img["part_visible"], supporting, location_ok
    if matching:
        return matching[0]["issue_observed"], matching[0]["part_visible"], [], False
    return "unknown", "unknown", [], False


def _issue_from_text(user_claim):
    """Word-scan the transcript for an issue enum (English-only backstop)."""
    for word in (user_claim or "").lower().replace("-", "_").split():
        candidate = norm(word, ISSUE_TYPE, "unknown")
        if candidate not in ("none", "unknown"):
            return candidate
    return None


def apply_history(flags, history_row):
    if not history_row:
        return flags
    history_flags = (history_row.get("history_flags") or "none").strip().lower()
    recent_claims = int(history_row.get("last_90_days_claim_count") or 0)
    rejected_claims = int(history_row.get("rejected_claim") or 0)
    if history_flags not in ("", "none") or recent_claims >= 4 or rejected_claims >= 2:
        flags.append("user_history_risk")
    return flags
