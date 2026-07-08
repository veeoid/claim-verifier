"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ClaimResponse, Me } from "../lib/api";
import {
	ClaimStatus,
	normalizeStatus,
	statusLabel,
	statusStyles,
	activityLabel,
	activityDot,
} from "../lib/status";

const statIcons = {
	total: (
		<path
			d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	),
	pending: (
		<path
			d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	),
	verified: (
		<path
			d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	),
	flagged: (
		<path
			d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	),
	failed: (
		<path
			d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	),
	not_enough_information: (
		<path
			d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	),
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	hour12: true,
	hourCycle: "h12",
});

const todayFormatter = new Intl.DateTimeFormat("en-US", {
	weekday: "long",
	year: "numeric",
	month: "long",
	day: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
});

const EVIDENCE_TREND_DAYS = 14;

// good/warning/critical — fixed status hues, validated against the light
// card surface (never reused as categorical series colors).
const RATE_COLORS = {
	good: "#0ca30c",
	warning: "#fab219",
	critical: "#d03b3b",
	noData: "#e8e5de",
};

function rateColor(rate: number | null) {
	if (rate === null) return RATE_COLORS.noData;
	if (rate >= 90) return RATE_COLORS.good;
	if (rate >= 75) return RATE_COLORS.warning;
	return RATE_COLORS.critical;
}

export default function Dashboard() {
	const router = useRouter();
	const [user, setUser] = useState<Me | null>(null);
	const [checking, setChecking] = useState(true);
	const [claims, setClaims] = useState<ClaimResponse[]>([]);
	const [today] = useState(() => todayFormatter.format(new Date()));

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

	const stats = useMemo(() => {
		const count = (status: ClaimStatus) =>
			claims.filter((c) => normalizeStatus(c.status) === status).length;
		return [
			{ label: "Total Claims", value: claims.length, icon: statIcons.total },
			{
				label: "Pending Review",
				value: count("pending"),
				icon: statIcons.pending,
			},
			{ label: "Verified", value: count("verified"), icon: statIcons.verified },
			{ label: "Flagged", value: count("flagged"), icon: statIcons.flagged },
			{ label: "Failed", value: count("failed"), icon: statIcons.failed },
			{
				label: "Not Enough Info",
				value: count("not_enough_information"),
				icon: statIcons.not_enough_information,
			},
		];
	}, [claims]);

	const recentActivity = useMemo(
		() =>
			[...claims].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			),
		[claims],
	);

	// claims already come back sorted newest-first from the API
	const recentClaims = useMemo(() => claims.slice(0, 6), [claims]);

	// Daily share of claims meeting the evidence standard, last EVIDENCE_TREND_DAYS days.
	// `rate` is null (no bar color / "no claims") for days with no submissions,
	// rather than fabricating a 0%.
	const evidenceTrend = useMemo(() => {
		const counts = new Map<string, { total: number; met: number }>();
		for (const claim of claims) {
			const key = new Date(claim.createdAt).toDateString();
			const entry = counts.get(key) ?? { total: 0, met: 0 };
			entry.total += 1;
			if (claim.evidenceStandardMet) entry.met += 1;
			counts.set(key, entry);
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		return Array.from({ length: EVIDENCE_TREND_DAYS }, (_, i) => {
			const date = new Date(today);
			date.setDate(date.getDate() - (EVIDENCE_TREND_DAYS - 1 - i));
			const entry = counts.get(date.toDateString());
			const total = entry?.total ?? 0;
			return {
				date,
				total,
				rate: total > 0 ? Math.round((entry!.met / total) * 100) : null,
			};
		});
	}, [claims]);

	const trendTickIndices = Array.from({ length: 5 }, (_, i) =>
		Math.round((i * (EVIDENCE_TREND_DAYS - 1)) / 4),
	);

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
			{/* Page header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-serif text-2xl font-medium tracking-tight text-ink">
						Overview
					</h1>
					<p className="mt-1 text-sm text-ink-faint">{today}</p>
				</div>
				<Link href="/dashboard/submit" className="btn-primary">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						aria-hidden="true"
						className="size-4"
					>
						<path
							d="M12 4.5v15m7.5-7.5h-15"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					Submit Claim
				</Link>
			</div>

			{/* Stats */}
			<dl className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
				{stats.map(({ label, value, icon }) => (
					<div
						key={label}
						className="card card-hover flex flex-col gap-y-3 p-6"
					>
						<div className="flex items-center justify-between">
							<dt className="text-sm text-ink-soft">{label}</dt>
							<span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									aria-hidden="true"
									className="size-5 text-accent"
								>
									{icon}
								</svg>
							</span>
						</div>
						<dd className="font-serif text-3xl font-medium tracking-tight text-ink tabular-nums">
							{value}
						</dd>
					</div>
				))}
			</dl>

			{/* Claims table + Activity feed */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Claims table */}
				<div className="lg:col-span-2 card overflow-hidden">
					<div className="flex items-center justify-between px-6 py-4 border-b border-line">
						<h2 className="text-sm font-semibold text-ink">Recent Claims</h2>
						<Link
							href="/dashboard/claims"
							className="text-xs font-medium text-accent hover:text-accent-strong transition-colors"
						>
							View all →
						</Link>
					</div>
					{claims.length === 0 ? (
						<div className="flex flex-col items-center gap-y-4 px-6 py-16 text-center">
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
										d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</span>
							<div>
								<p className="text-sm font-medium text-ink">No claims yet</p>
								<p className="mt-1 text-sm text-ink-soft">
									Submit your first claim to see it analyzed here.
								</p>
							</div>
							<Link href="/dashboard/submit" className="btn-primary">
								Submit a claim
							</Link>
						</div>
					) : (
						<div className="max-h-[420px] overflow-x-auto overflow-y-auto">
							<table className="w-full text-sm">
								<thead className="sticky top-0 bg-paper">
									<tr className="border-b border-line bg-black/[0.015]">
										<th className="px-6 py-3 text-left text-xs font-medium text-ink-faint uppercase tracking-wide">
											Claim ID
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-ink-faint uppercase tracking-wide">
											Description
										</th>
										<th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-ink-faint uppercase tracking-wide">
											Type
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-ink-faint uppercase tracking-wide">
											Status
										</th>
										<th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-ink-faint uppercase tracking-wide">
											Date
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-line">
									{recentClaims.map((claim) => (
										<tr
											key={claim.id}
											className="hover:bg-black/[0.02] transition-colors cursor-pointer"
											onClick={() =>
												router.push(`/dashboard/claim?id=${claim.id}`)
											}
										>
											<td className="px-6 py-4 font-mono text-xs text-accent font-medium whitespace-nowrap">
												{claim.id}
											</td>
											<td className="px-6 py-4 text-ink whitespace-nowrap">
												{claim.description}
											</td>
											<td className="hidden md:table-cell px-6 py-4 text-ink-soft whitespace-nowrap">
												{claim.claimObject}
											</td>
											<td className="px-6 py-4">
												<span
													className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusStyles[normalizeStatus(claim.status)]}`}
												>
													{statusLabel(claim.status)}
												</span>
											</td>
											<td className="hidden sm:table-cell px-6 py-4 text-ink-faint whitespace-nowrap text-xs">
												{dateFormatter.format(new Date(claim.createdAt))}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Activity feed */}
				<div className="card overflow-hidden">
					<div className="flex items-center justify-between px-6 py-4 border-b border-line">
						<h2 className="text-sm font-semibold text-ink">Live Activity</h2>
						<span className="flex items-center gap-x-1.5 text-xs text-green-700">
							<span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
							Live
						</span>
					</div>
					{recentActivity.length === 0 ? (
						<p className="px-6 py-10 text-center text-sm text-ink-faint">
							Activity will appear here once claims come in.
						</p>
					) : (
						<ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
							{recentActivity.map((claim) => {
								return (
									<li
										key={claim.id}
										className="flex items-start gap-x-4 px-6 py-4"
									>
										<span
											className={`mt-1 size-2 shrink-0 rounded-full ${activityDot(claim.status)}`}
										/>
										<div className="min-w-0 flex-1">
											<p className="font-mono text-xs text-accent font-medium">
												CLM-{claim.id}
											</p>
											<p className="mt-0.5 text-sm text-ink">
												{activityLabel(claim.status)}
											</p>
											<p className="mt-1 text-xs text-ink-faint">
												{dateFormatter.format(new Date(claim.createdAt))}
											</p>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</div>

			{/* Evidence standard trend */}
			<div className="card p-6">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-sm font-semibold text-ink">
							Evidence Standard Rate
						</h2>
						<p className="mt-1 text-xs text-ink-faint">
							Daily share of claims meeting the evidence standard, last{" "}
							{EVIDENCE_TREND_DAYS} days
						</p>
					</div>
					<div className="flex items-center gap-x-4 text-xs text-ink-soft">
						<span className="flex items-center gap-x-1.5">
							<span
								className="size-2 rounded-full"
								style={{ backgroundColor: RATE_COLORS.good }}
							/>{" "}
							High (≥90%)
						</span>
						<span className="flex items-center gap-x-1.5">
							<span
								className="size-2 rounded-full"
								style={{ backgroundColor: RATE_COLORS.warning }}
							/>{" "}
							Medium (75–89%)
						</span>
						<span className="flex items-center gap-x-1.5">
							<span
								className="size-2 rounded-full"
								style={{ backgroundColor: RATE_COLORS.critical }}
							/>{" "}
							Low (&lt;75%)
						</span>
						<span className="flex items-center gap-x-1.5">
							<span
								className="size-2 rounded-full"
								style={{ backgroundColor: RATE_COLORS.noData }}
							/>{" "}
							No claims
						</span>
					</div>
				</div>
				<div className="flex items-end gap-x-1.5 h-32">
					{evidenceTrend.map((day, i) => (
						<div
							key={i}
							className="group relative h-full flex-1 flex flex-col justify-end"
						>
							<div
								className="w-full rounded-t-sm opacity-80 transition-opacity group-hover:opacity-100"
								style={{
									height: day.rate !== null ? `${day.rate}%` : "3px",
									backgroundColor: rateColor(day.rate),
								}}
							/>
							<div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-ink text-paper text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10">
								{day.rate !== null
									? `${day.rate}% · ${day.total} claim${day.total === 1 ? "" : "s"}`
									: "No claims"}
							</div>
						</div>
					))}
				</div>
				<div className="mt-3 flex justify-between text-xs text-ink-faint">
					{trendTickIndices.map((idx) => (
						<span key={idx}>
							{shortDateFormatter.format(evidenceTrend[idx].date)}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
