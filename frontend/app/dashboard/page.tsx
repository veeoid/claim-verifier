"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ClaimResponse, Me } from "../lib/api";

type ClaimStatus = "verified" | "pending" | "flagged";

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
};

const statusStyles = {
	verified: "bg-green-50 text-green-700 ring-1 ring-green-600/20",
	pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
	flagged: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
};

const activityDot = {
	verified: "bg-green-500",
	pending: "bg-amber-400",
	flagged: "bg-red-500",
};

const activityAction = {
	verified: "Verified automatically",
	pending: "Awaiting review",
	flagged: "Flagged for review",
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

function normalizeStatus(status: string): ClaimStatus {
	const s = status.toLowerCase();
	return s === "verified" || s === "flagged" ? s : "pending";
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
			{ label: "Pending Review", value: count("pending"), icon: statIcons.pending },
			{ label: "Verified", value: count("verified"), icon: statIcons.verified },
			{ label: "Flagged", value: count("flagged"), icon: statIcons.flagged },
		];
	}, [claims]);

	const recentActivity = useMemo(
		() =>
			[...claims]
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				)
				.slice(0, 6),
		[claims],
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
			<dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{stats.map(({ label, value, icon }) => (
					<div key={label} className="card card-hover flex flex-col gap-y-3 p-6">
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
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-line bg-black/[0.015]">
										<th className="px-6 py-3 text-left text-xs font-medium text-ink-faint uppercase tracking-wide">
											Claim ID
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-ink-faint uppercase tracking-wide">
											Type
										</th>
										<th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-ink-faint uppercase tracking-wide">
											Vehicle
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
									{claims.map((claim) => (
										<tr
											key={claim.id}
											className="hover:bg-black/[0.02] transition-colors cursor-pointer"
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
													{claim.status}
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
						<ul className="divide-y divide-line">
							{recentActivity.map((claim) => {
								const status = normalizeStatus(claim.status);
								return (
									<li
										key={claim.id}
										className="flex items-start gap-x-4 px-6 py-4"
									>
										<span
											className={`mt-1 size-2 shrink-0 rounded-full ${activityDot[status]}`}
										/>
										<div className="min-w-0 flex-1">
											<p className="font-mono text-xs text-accent font-medium">
												CLM-{claim.id}
											</p>
											<p className="mt-0.5 text-sm text-ink">
												{activityAction[status]}
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

			{/* Confidence distribution */}
			<div className="card p-6">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-sm font-semibold text-ink">
							Confidence Distribution
						</h2>
						<p className="mt-1 text-xs text-ink-faint">
							AI confidence scores across all claims this month
						</p>
					</div>
					<div className="flex items-center gap-x-4 text-xs text-ink-soft">
						<span className="flex items-center gap-x-1.5">
							<span className="size-2 rounded-full bg-green-500" /> High (≥90%)
						</span>
						<span className="flex items-center gap-x-1.5">
							<span className="size-2 rounded-full bg-amber-400" /> Medium
							(75–89%)
						</span>
						<span className="flex items-center gap-x-1.5">
							<span className="size-2 rounded-full bg-red-400" /> Low (&lt;75%)
						</span>
					</div>
				</div>
				<div className="flex items-end gap-x-1.5 h-32">
					{[
						72, 85, 91, 78, 94, 88, 96, 63, 89, 97, 82, 91, 74, 88, 95, 79, 92,
						86, 98, 71, 90, 83, 77, 93,
					].map((v, i) => {
						const color =
							v >= 90
								? "bg-green-500"
								: v >= 75
									? "bg-amber-400"
									: "bg-red-400";
						return (
							<div
								key={i}
								className="group relative h-full flex-1 flex flex-col justify-end"
							>
								<div
									className={`w-full rounded-sm ${color} opacity-80 group-hover:opacity-100 transition-opacity`}
									style={{ height: `${v}%` }}
								/>
								<div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-ink text-paper text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10">
									{v}%
								</div>
							</div>
						);
					})}
				</div>
				<div className="mt-3 flex justify-between text-xs text-ink-faint">
					<span>Jun 1</span>
					<span>Jun 8</span>
					<span>Jun 15</span>
					<span>Jun 22</span>
					<span>Jun 26</span>
				</div>
			</div>
		</div>
	);
}
