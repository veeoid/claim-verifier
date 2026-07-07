import csv
import argparse

from schema import OUTPUT_COLUMNS
from data import (
    load_claims,
    load_history,
    load_requirements,
    load_images,
    select_requirements,
)
from vision import analyze_claim
from decide import decide


def run(claims_file, output_file, mode, limit=None):
    claims = load_claims(claims_file)
    if limit:
        claims = claims[:limit]
    history = load_history()
    requirements = load_requirements()

    rows = []
    for curr_idx, claim in enumerate(claims, 1):
        images = load_images(claim["image_paths"])
        selected_requirements = select_requirements(requirements, claim["claim_object"])
        perception = analyze_claim(claim, images, selected_requirements, mode=mode)
        hist_row = history.get(claim["user_id"])
        row = decide(claim, perception, hist_row)
        rows.append(row)

    write_output(rows, output_file)


def write_output(rows, file_path="daoutput.csv"):
    with open(file_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--claims", default="dataset/sample_claims.csv")
    ap.add_argument("--out", default="output.csv")
    ap.add_argument("--mode", choices=["mock", "gemini", "groq"], default="mock")
    ap.add_argument("--limit", type=int, default=None)
    args = ap.parse_args()
    run(args.claims, args.out, args.mode, limit=args.limit)
