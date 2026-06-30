from schema import (
    norm,
    norm_part,
    clean_flags,
    ISSUE_TYPE,
    SEVERITY,
    SEVERITY_RANK,
    QUALITY_FLAGS,
)


def decide(claim, perception, history_row):
    claim_object = claim["claim_object"]
    per_image = perception["per_image"]
    cross = perception["cross_image"]
    ev = perception["evidence_assessment"]

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

    # 3. OBJECT MATCH — did the model see the claimed object type?
    if not all(img["object_matches_claim"] for img in per_image):
        flags.append("wrong_object")

    # 4. PICK OBSERVED ISSUE + PART (images = truth, normalized to single enums).
    issue_type, object_part, supporting_ids = "unknown", "unknown", []
    for img in per_image:
        candidate = norm(img["issue_observed"], ISSUE_TYPE, "unknown")
        if candidate not in ("none", "unknown"):
            issue_type = candidate
            object_part = norm_part(img["part_visible"], claim_object)
            supporting_ids = [img["image_id"]]
            break
    else:
        if per_image:
            issue_type = norm(per_image[0]["issue_observed"], ISSUE_TYPE, "unknown")
            object_part = norm_part(per_image[0]["part_visible"], claim_object)

    # 4b. CLAIM-TEXT FALLBACK — if perception gave only "unknown", scan the
    # claim transcript word-by-word so a VLM that returned "damage" doesn't
    # silently discard what the customer clearly described.
    if issue_type == "unknown":
        for word in claim["user_claim"].lower().replace("-", "_").split():
            candidate = norm(word, ISSUE_TYPE, "unknown")
            if candidate not in ("none", "unknown"):
                issue_type = candidate
                break

    # 5. EVIDENCE STANDARD — model said sufficient AND usable AND identity ok.
    evidence_met = ev["sufficient_to_evaluate"] and valid_image and identity_ok
    evidence_reason = ev["reason"]

    # 6. CLAIM STATUS — the core verdict.
    if not valid_image or not identity_ok or not evidence_met:
        status = "not_enough_information"
    elif issue_type == "none":
        status = "contradicted"
    elif issue_type == "unknown":
        status = "not_enough_information"
    else:
        status = "supported"

    # 7. SEVERITY — worst real severity when supported; unknown/none otherwise.
    if status == "supported":
        severity = max(
            (norm(i["severity"], SEVERITY) for i in per_image),
            key=lambda s: SEVERITY_RANK[s],
        )
    elif status == "not_enough_information":
        severity = "unknown"
    else:
        severity = "none"

    # 8. HISTORY LAST — can ONLY add a risk flag, never change status.
    flags = apply_history(flags, history_row)

    # 9. JUSTIFICATION.
    img_ref = (" (" + ";".join(supporting_ids) + ")") if supporting_ids else ""
    if status == "supported":
        justification = f"Image evidence shows {issue_type} on {object_part}{img_ref}; history adds no overriding risk."
    elif status == "contradicted":
        justification = f"The {object_part} is visible and shows no claimed damage, contradicting the claim{img_ref}."
    elif not valid_image:
        justification = (
            "Submitted images are not usable enough to evaluate the claimed damage."
        )
    elif not identity_ok:
        justification = "Images appear to show different objects, so the claimed damage cannot be tied to one item."
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


def apply_history(flags, history_row):
    if not history_row:
        return flags
    history_flags = (history_row.get("history_flags") or "none").strip().lower()
    recent_claims = int(history_row.get("last_90_days_claim_count") or 0)
    rejected_claims = int(history_row.get("rejected_claim") or 0)
    if history_flags not in ("", "none") or recent_claims >= 4 or rejected_claims >= 2:
        flags.append("user_history_risk")
    return flags
