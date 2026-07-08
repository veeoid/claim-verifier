"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, ClaimResponse, Me } from "../../lib/api";
import { ClaimStatus, normalizeStatus } from "../../lib/status";
import { monthFormatter, longDateFormatter } from "../../lib/formatter";

const STATUS_ORDER: ClaimStatus[] = [
	"verified",
	"pending",
	"flagged",
	"not_enough_information",
	"failed",
];

const STATUS_LABELS: Record<ClaimStatus, string> = {
	verified: "Verified",
	pending: "Pending",
	flagged: "Flagged",
	not_enough_information: "Not enough info",
	failed: "Failed",
};

// Reuses the same good/warning/critical hues as the dashboard's evidence
// trend, plus the blue already used for "not enough information" elsewhere.
const STATUS_COLORS: Record<ClaimStatus, string> = {
	verified: "#0ca30c",
	pending: "#fab219",
	flagged: "#d03b3b",
	not_enough_information: "#60a5fa",
	failed: "#8a877d",
};

const SEVERITY_ORDER = ["high", "medium", "low", "none", "unknown"] as const;

const SEVERITY_LABELS: Record<string, string> = {
	high: "High",
	medium: "Medium",
	low: "Low",
	none: "None",
	unknown: "Unknown",
};

const SEVERITY_COLORS: Record<string, string> = {
	high: "#d03b3b",
	medium: "#fab219",
	low: "#0ca30c",
	none: "#d6d2c8",
	unknown: "#8a877d",
};

const RATE_COLORS = {
	good: "#0ca30c",
	warning: "#fab219",
	critical: "#d03b3b",
	noData: "#c8c4b8",
};

function rateColor(rate: number | null) {
	if (rate === null) return RATE_COLORS.noData;
	if (rate >= 90) return RATE_COLORS.good;
	if (rate >= 75) return RATE_COLORS.warning;
	return RATE_COLORS.critical;
}

function titleCase(value: string) {
	return value
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

const MONTHLY_LEDGER_MONTHS = 6;

function escapeCsvValue(value: unknown) {
	const str = value === null || value === undefined ? "" : String(value);
	if (/[",\n]/.test(str)) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

function downloadClaimsCsv(claims: ClaimResponse[]) {
	const headers = [
		"id",
		"description",
		"claimObject",
		"status",
		"severity",
		"evidenceStandardMet",
		"riskFlags",
		"issueType",
		"objectPart",
		"createdAt",
	];
	const rows = claims.map((claim) =>
		[
			claim.id,
			claim.description,
			claim.claimObject,
			claim.status,
			claim.severity,
			claim.evidenceStandardMet,
			claim.riskFlags,
			claim.issueType,
			claim.objectPart,
			claim.createdAt,
		]
			.map(escapeCsvValue)
			.join(","),
	);
	const csv = [headers.join(","), ...rows].join("\n");

	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `claims-report-${new Date().toISOString().slice(0, 10)}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}

export default function ReportsPage() {
	const router = useRouter();
	const [user, setUser] = useState<Me | null>(null);
	const [checking, setChecking] = useState(true);
	const [claims, setClaims] = useState<ClaimResponse[]>([]);
	const [generatedAt] = useState(() => new Date());

	useEffect(() => {
		api
			.me()
			.then(setUser)
			.catch(() => router.push("/login"))
			.finally(() => setChecking(false));
	}, [router]);

	useEffect(() => {
		if (!user) return;
		api
			.getAllClaims()
			.then(setClaims)
			.catch(() => {
				// Handle error if needed
			});
	}, [user]);

	const total = claims.length;
	const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

	const statusCounts = useMemo(() => {
		const counts = new Map<ClaimStatus, number>();
		for (const claim of claims) {
			const key = normalizeStatus(claim.status);
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return STATUS_ORDER.map((key) => ({ key, count: counts.get(key) ?? 0 }));
	}, [claims]);

	const severityCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const claim of claims) {
			const key = (claim.severity ?? "unknown").toLowerCase();
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return SEVERITY_ORDER.map((key) => ({ key, count: counts.get(key) ?? 0 }));
	}, [claims]);

	// One entry per claim, bucketed by severity — rendered as a waffle chart
	// so the reader can feel the proportion rather than read it off an axis.
	const severityUnits = useMemo(
		() => severityCounts.flatMap(({ key, count }) => Array(count).fill(key)),
		[severityCounts],
	);

	const claimObjectCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const claim of claims) {
			const key = claim.claimObject || "unknown";
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return Array.from(counts.entries())
			.map(([key, count]) => ({ key, count }))
			.sort((a, b) => b.count - a.count);
	}, [claims]);

	const riskFlagCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const claim of claims) {
			if (!claim.riskFlags || claim.riskFlags === "none") continue;
			for (const flag of claim.riskFlags.split(";")) {
				const key = flag.trim();
				if (!key || key === "none") continue;
				counts.set(key, (counts.get(key) ?? 0) + 1);
			}
		}
		return Array.from(counts.entries())
			.map(([key, count]) => ({ key, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 8);
	}, [claims]);

	const monthlyLedger = useMemo(() => {
		const counts = new Map<
			string,
			{ total: number; met: number; verified: number; flagged: number }
		>();
		for (const claim of claims) {
			const d = new Date(claim.createdAt);
			const key = `${d.getFullYear()}-${d.getMonth()}`;
			const entry = counts.get(key) ?? {
				total: 0,
				met: 0,
				verified: 0,
				flagged: 0,
			};
			entry.total += 1;
			if (claim.evidenceStandardMet) entry.met += 1;
			const bucket = normalizeStatus(claim.status);
			if (bucket === "verified") entry.verified += 1;
			if (bucket === "flagged") entry.flagged += 1;
			counts.set(key, entry);
		}

		const anchor = new Date();
		anchor.setDate(1);
		anchor.setHours(0, 0, 0, 0);

		return Array.from({ length: MONTHLY_LEDGER_MONTHS }, (_, i) => {
			const date = new Date(anchor);
			date.setMonth(date.getMonth() - (MONTHLY_LEDGER_MONTHS - 1 - i));
			const entry = counts.get(`${date.getFullYear()}-${date.getMonth()}`);
			const monthTotal = entry?.total ?? 0;
			return {
				date,
				total: monthTotal,
				verified: entry?.verified ?? 0,
				flagged: entry?.flagged ?? 0,
				rate:
					monthTotal > 0 ? Math.round((entry!.met / monthTotal) * 100) : null,
			};
		});
	}, [claims]);

	const maxClaimObjectCount = Math.max(1, ...claimObjectCounts.map((c) => c.count));
	const maxRiskFlagCount = Math.max(1, ...riskFlagCounts.map((r) => r.count));

	const verifiedCount = statusCounts.find((s) => s.key === "verified")?.count ?? 0;
	const flaggedCount = statusCounts.find((s) => s.key === "flagged")?.count ?? 0;
	const evidenceMetCount = claims.filter((c) => c.evidenceStandardMet).length;
	const highSeverityCount = severityCounts.find((s) => s.key === "high")?.count ?? 0;

	if (checking) {
		return (
			<div className="flex flex-1 items-center justify-center p-8">
				<div className="flex items-center gap-x-3 text-ink-soft">
					<span className="size-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
					Loading...
				</div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<div className="flex flex-col gap-y-8 p-6 lg:p-8 animate-fade-up">
			{/* Page header, framed like a document rather than an app screen */}
			<div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
				<div>
					<p className="text-sm font-medium text-accent">Claims Report</p>
					<h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-ink">
						Verification Summary
					</h1>
					<p className="mt-2 text-sm text-ink-faint">
						Generated {longDateFormatter.format(generatedAt)} · {total} claim
						{total === 1 ? "" : "s"} on record
					</p>
				</div>
				<button
					type="button"
					onClick={() => downloadClaimsCsv(claims)}
					disabled={total === 0}
					className="btn-ghost"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						aria-hidden="true"
						className="size-4"
					>
						<path
							d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 12 12 16.5m0 0L16.5 12M12 16.5V3"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					Export CSV
				</button>
			</div>

			{total === 0 ? (
				<div className="card flex flex-col items-center gap-y-4 px-6 py-16 text-center">
					<span className="flex size-12 items-center justify-center rounded-full bg-accent-soft">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							aria-hidden="true"
							className="size-6 text-accent"
						>
							<path
								d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</span>
					<div>
						<p className="text-sm font-medium text-ink">Nothing to report yet</p>
						<p className="mt-1 text-sm text-ink-soft">
							Submit a claim to start seeing report insights here.
						</p>
					</div>
				</div>
			) : (
				<>
					{/* Lede: one pull number + a written summary, in place of a stat grid */}
					<div className="card grid gap-8 p-8 lg:grid-cols-[auto_1fr] lg:items-center">
						<div className="flex flex-col items-start gap-y-2 lg:items-center lg:border-r lg:border-line lg:pr-10">
							<span className="font-serif text-6xl font-medium tracking-tight text-accent tabular-nums">
								{pct(evidenceMetCount)}%
							</span>
							<span className="text-xs font-medium uppercase tracking-wide text-ink-faint whitespace-nowrap">
								Evidence standard met
							</span>
						</div>
						<p className="font-serif text-lg leading-relaxed text-ink">
							This report covers <strong className="text-accent">{total}</strong>{" "}
							claim{total === 1 ? "" : "s"} submitted to date.{" "}
							<strong className="text-accent">{pct(verifiedCount)}%</strong> were
							verified against photo evidence, while{" "}
							<strong className="text-accent">{flaggedCount}</strong> claim
							{flaggedCount === 1 ? " was" : "s were"} flagged for contradiction
							and <strong className="text-accent">{highSeverityCount}</strong>{" "}
							reported high-severity damage.
						</p>
					</div>

					{/* Status distribution — single stacked bar instead of a bar chart */}
					<div className="card p-6">
						<h2 className="text-sm font-semibold text-ink">Status Distribution</h2>
						<p className="mt-1 text-xs text-ink-faint">
							Every claim on record, grouped by verification outcome
						</p>
						<div className="mt-6 flex h-4 w-full overflow-hidden rounded-full bg-black/[0.04]">
							{statusCounts
								.filter((s) => s.count > 0)
								.map(({ key, count }, idx, arr) => (
									<div
										key={key}
										className="group relative h-full"
										style={{
											width: `${pct(count)}%`,
											marginRight: idx < arr.length - 1 ? "2px" : 0,
										}}
									>
										<div
											className="h-full w-full"
											style={{ backgroundColor: STATUS_COLORS[key] }}
										/>
										<div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-xs text-paper group-hover:block z-10">
											{STATUS_LABELS[key]}: {count} ({pct(count)}%)
										</div>
									</div>
								))}
						</div>
						<div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
							{statusCounts.map(({ key, count }) => (
								<span key={key} className="flex items-center gap-x-2 text-ink-soft">
									<span
										className="size-2 rounded-full"
										style={{ backgroundColor: STATUS_COLORS[key] }}
									/>
									{STATUS_LABELS[key]}{" "}
									<span className="text-ink-faint tabular-nums">{count}</span>
								</span>
							))}
						</div>
					</div>

					{/* Severity distribution — a waffle chart: one square per claim */}
					<div className="card p-6">
						<h2 className="text-sm font-semibold text-ink">Severity Distribution</h2>
						<p className="mt-1 text-xs text-ink-faint">
							One square per claim, colored by reported issue severity
						</p>
						<div className="mt-6 flex flex-wrap gap-1">
							{severityUnits.map((key, i) => (
								<span
									key={i}
									className="size-3 rounded-[3px]"
									style={{ backgroundColor: SEVERITY_COLORS[key] }}
									title={SEVERITY_LABELS[key]}
								/>
							))}
						</div>
						<div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
							{severityCounts.map(({ key, count }) => (
								<span key={key} className="flex items-center gap-x-2 text-ink-soft">
									<span
										className="size-2 rounded-[2px]"
										style={{ backgroundColor: SEVERITY_COLORS[key] }}
									/>
									{SEVERITY_LABELS[key]}{" "}
									<span className="text-ink-faint tabular-nums">{count}</span>
								</span>
							))}
						</div>
					</div>

					{/* Claim object + risk flag breakdown, styled as ranked ledgers */}
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<div className="card p-6">
							<h2 className="text-sm font-semibold text-ink">Claims by Object Type</h2>
							<p className="mt-1 text-xs text-ink-faint">
								Which kinds of items are being claimed on
							</p>
							<ol className="mt-6 space-y-5">
								{claimObjectCounts.map(({ key, count }, i) => (
									<li key={key}>
										<div className="flex items-baseline gap-x-3">
											<span className="font-serif text-sm text-ink-faint tabular-nums">
												{String(i + 1).padStart(2, "0")}
											</span>
											<span className="flex-1 text-sm text-ink">{titleCase(key)}</span>
											<span className="font-serif text-lg text-ink tabular-nums">
												{count}
											</span>
										</div>
										<div className="mt-2 h-px w-full bg-line">
											<div
												className="h-px bg-accent"
												style={{ width: `${(count / maxClaimObjectCount) * 100}%` }}
											/>
										</div>
									</li>
								))}
							</ol>
						</div>

						<div className="card p-6">
							<h2 className="text-sm font-semibold text-ink">Top Risk Flags</h2>
							<p className="mt-1 text-xs text-ink-faint">
								Most frequent evidence risk flags raised during analysis
							</p>
							{riskFlagCounts.length === 0 ? (
								<div className="mt-6 rounded-xl border border-dashed border-line bg-black/[0.015] p-8 text-center text-sm text-ink-soft">
									No risk flags raised across your claims.
								</div>
							) : (
								<ol className="mt-6 space-y-5">
									{riskFlagCounts.map(({ key, count }, i) => (
										<li key={key}>
											<div className="flex items-baseline gap-x-3">
												<span className="font-serif text-sm text-ink-faint tabular-nums">
													{String(i + 1).padStart(2, "0")}
												</span>
												<span className="flex-1 text-sm text-ink">{titleCase(key)}</span>
												<span className="font-serif text-lg text-ink tabular-nums">
													{count}
												</span>
											</div>
											<div className="mt-2 h-px w-full bg-line">
												<div
													className="h-px bg-accent"
													style={{ width: `${(count / maxRiskFlagCount) * 100}%` }}
												/>
											</div>
										</li>
									))}
								</ol>
							)}
						</div>
					</div>

					{/* Monthly ledger, in place of a bar chart */}
					<div className="card overflow-hidden">
						<div className="border-b border-line px-6 py-4">
							<h2 className="text-sm font-semibold text-ink">Monthly Ledger</h2>
							<p className="mt-1 text-xs text-ink-faint">
								Volume and evidence-standard performance, last{" "}
								{MONTHLY_LEDGER_MONTHS} months — dot reflects the rate (green ≥90%,
								amber 75–89%, red &lt;75%)
							</p>
						</div>
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-line bg-black/[0.015] text-xs font-medium uppercase tracking-wide text-ink-faint">
									<th className="px-6 py-3 text-left">Month</th>
									<th className="px-6 py-3 text-right">Claims</th>
									<th className="px-6 py-3 text-right">Verified</th>
									<th className="px-6 py-3 text-right">Flagged</th>
									<th className="px-6 py-3 text-right">Evidence Met</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{monthlyLedger.map((month, i) => (
									<tr key={i}>
										<td className="px-6 py-3 text-ink">
											{monthFormatter.format(month.date)}
										</td>
										<td className="px-6 py-3 text-right text-ink tabular-nums">
											{month.total}
										</td>
										<td className="px-6 py-3 text-right text-ink-soft tabular-nums">
											{month.verified}
										</td>
										<td className="px-6 py-3 text-right text-ink-soft tabular-nums">
											{month.flagged}
										</td>
										<td className="px-6 py-3 text-right">
											<span className="inline-flex items-center gap-x-1.5 tabular-nums">
												<span
													className="size-1.5 rounded-full"
													style={{ backgroundColor: rateColor(month.rate) }}
												/>
												{month.rate !== null ? `${month.rate}%` : "—"}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<p className="pt-2 text-center font-serif text-sm italic text-ink-faint">
						— End of report —
					</p>
				</>
			)}
		</div>
	);
}
