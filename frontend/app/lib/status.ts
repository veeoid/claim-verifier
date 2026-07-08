// Maps the backend's Claim.Status values (pending, supported, contradicted,
// not_enough_information, analysis_failed) onto the UI's five visual buckets.
export type ClaimStatus =
	| "verified"
	| "pending"
	| "flagged"
	| "failed"
	| "not_enough_information";

const STATUS_MAP: Record<string, ClaimStatus> = {
	pending: "pending",
	supported: "verified",
	contradicted: "flagged",
	not_enough_information: "not_enough_information",
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

// Keyed by the raw backend status (same keys as STATUS_LABELS), not the
// normalized bucket — callers pass claim.status directly.
const ACTIVITY_LABELS: Record<string, string> = {
	pending: "Still under processing",
	supported: "Claims verified successfully",
	contradicted: "Flagged for contradiction",
	not_enough_information: "Not enough information",
	analysis_failed: "Analysis failed — needs retry",
};

const ACTIVITY_DOTS: Record<string, string> = {
	pending: "bg-amber-400",
	supported: "bg-green-500",
	contradicted: "bg-red-500",
	not_enough_information: "bg-blue-400",
	analysis_failed: "bg-gray-400",
};

export function statusLabel(status: string): string {
	return STATUS_LABELS[status.toLowerCase()] ?? status;
}

export function activityLabel(status: string): string {
	return ACTIVITY_LABELS[status.toLowerCase()] ?? status;
}

export function activityDot(status: string): string {
	return ACTIVITY_DOTS[status.toLowerCase()] ?? "bg-gray-300";
}

export const statusStyles: Record<ClaimStatus, string> = {
	verified: "bg-green-50 text-green-700 ring-1 ring-green-600/20",
	pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
	flagged: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
	failed: "bg-gray-100 text-gray-700 ring-1 ring-gray-500/20",
	not_enough_information: "bg-blue-50 text-blue-700 ring-1 ring-blue-500/20",
};
