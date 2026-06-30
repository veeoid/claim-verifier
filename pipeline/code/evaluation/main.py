import csv
import sys
from collections import defaultdict

# Columns scored by exact match (the decision-bearing ones).
SCORED = [
    "evidence_standard_met",
    "issue_type",
    "object_part",
    "claim_status",
    "valid_image",
    "severity",
]

# risk_flags is scored as a SET (order/count vary), separately.


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def norm(s):
    # normalize a cell for comparison: lowercase, strip
    return (s or "").strip().lower()


def flagset(s):
    # turn "a;b;none" into {"a","b"} — drop none/empty for fair comparison
    return {x for x in norm(s).split(";") if x and x != "none"}


def evaluate(gold_path, pred_path):
    gold = read_csv(gold_path)
    pred = read_csv(pred_path)

    # match predictions to gold by user_id (pred may have fewer rows if limited)
    pred_by_id = {row["user_id"]: row for row in pred}

    correct = defaultdict(int)
    total = 0
    mismatches = []
    flag_tp = flag_fp = flag_fn = 0

    for g in gold:
        uid = g["user_id"]
        if uid not in pred_by_id:
            continue  # skip gold rows we didn't predict (limited run)
        p = pred_by_id[uid]
        total += 1

        for col in SCORED:
            if norm(g[col]) == norm(p[col]):
                correct[col] += 1
            else:
                mismatches.append((uid, col, g[col], p[col]))

        gs, ps = flagset(g["risk_flags"]), flagset(p["risk_flags"])
        flag_tp += len(gs & ps)
        flag_fp += len(ps - gs)
        flag_fn += len(gs - ps)

    # print results
    print(f"Scored {total} claims\n")
    for col in SCORED:
        acc = correct[col] / total if total else 0
        print(f"  {col:24s} {acc:6.1%}  ({correct[col]}/{total})")

    prec = flag_tp / (flag_tp + flag_fp) if (flag_tp + flag_fp) else 0
    rec = flag_tp / (flag_tp + flag_fn) if (flag_tp + flag_fn) else 0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0
    print(f"\n  risk_flags  P={prec:.2f} R={rec:.2f} F1={f1:.2f}")

    print("\nMismatches (gold -> pred):")
    for uid, col, gv, pv in mismatches:
        print(f"  {uid:10s} {col:22s} {gv!r:25.25s} -> {pv!r}")


if __name__ == "__main__":
    gold = sys.argv[1] if len(sys.argv) > 1 else "dataset/sample_claims.csv"
    pred = sys.argv[2] if len(sys.argv) > 2 else "output.csv"
    evaluate(gold, pred)
