import csv
import os


def load_claims(file_path="dataset/claims.csv"):
    claims = []
    with open(file_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            claims.append(row)
    return claims


def load_requirements(file_path="dataset/evidence_requirements.csv"):
    requirements = []
    with open(file_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            requirements.append(row)
    return requirements


def load_images(image_paths):
    images = []
    for raw in image_paths.split(";"):
        rel = raw.strip()
        if not rel:  # skip empty pieces
            continue
        image_id = os.path.splitext(os.path.basename(rel))[0]  # "img_1"
        full_path = os.path.join("dataset", rel)  # openable later
        images.append({"image_id": image_id, "rel_path": rel, "full_path": full_path})
    return images


def load_history(file_path="dataset/user_history.csv"):
    history = {}
    with open(file_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            history[row["user_id"]] = row
    return history


def select_requirements(requirements, claim_object):
    relevant = []
    for req in requirements:
        if req["claim_object"] in ("all", claim_object):
            relevant.append(req["minimum_image_evidence"])
    return relevant
