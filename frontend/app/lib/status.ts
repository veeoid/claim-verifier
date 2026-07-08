// Maps the backend's Claim.Status values (pending, supported, contradicted,
// not_enough_information, analysis_failed) onto the UI's four visual buckets.
export type ClaimStatus = "verified" | "pending" | "flagged" | "failed";

const STATUS_MAP: Record<string, ClaimStatus> = {
	pending: "pending",
	supported: "verified",
	contradicted: "flagged",
	not_enough_information: "pending",
	analysis_failed: "failed",
};

export function normalizeStatus(status: string): ClaimStatus {
	return STATUS_MAP[status.toLowerCase()] ?? "pending";
}

const STATUS_LABELS: Record<string, string> = {
	pending: "Pending",
	supported: "Supported",
	contradicted: "Contradicted",
	not_enough_information: "Not enough information",
	analysis_failed: "Analysis failed",
};

export function statusLabel(status: string): string {
	return STATUS_LABELS[status.toLowerCase()] ?? status;
}

export const statusStyles: Record<ClaimStatus, string> = {
	verified: "bg-green-50 text-green-700 ring-1 ring-green-600/20",
	pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
	flagged: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
	failed: "bg-gray-100 text-gray-700 ring-1 ring-gray-500/20",
};
