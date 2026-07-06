"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { api, ClaimResponse, Me } from "../lib/api";

type ClaimStatus = "verified" | "pending" | "flagged";

const stats = [
	{
		label: "Total Claims",
		value: 0,
		change: "0%",
		up: true,
		icon: (
			<path
				d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
	},
	{
		label: "Pending Review",
		value: 0,
		change: "0%",
		up: false,
		icon: (
			<path
				d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
	},
	{
		label: "Verified",
		value: 0,
		change: "0%",
		up: true,
		icon: (
			<path
				d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
	},
	{
		label: "Flagged",
		value: 0,
		change: "0%",
		up: true,
		icon: (
			<path
				d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
	},
];

const activity = [
	{
		id: "CLM-4471",
		action: "Verified automatically",
		time: "2 min ago",
		color: "bg-green-500",
	},
];

const statusStyles = {
	verified: "bg-green-500/10 text-green-400 ring-1 ring-green-500/20",
	pending: "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20",
	flagged: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
};

const statusLabel = {
	verified: "Verified",
	pending: "Pending Review",
	flagged: "Flagged",
};

function ConfidenceBar({ value }: { value: number }) {
	const color =
		value >= 90 ? "bg-green-500" : value >= 75 ? "bg-yellow-500" : "bg-red-500";
	return (
		<div className="flex items-center gap-x-3">
			<div className="h-1.5 w-20 rounded-full bg-white/10">
				<div
					className={`h-1.5 rounded-full ${color}`}
					style={{ width: `${value}%` }}
				/>
			</div>
			<span className="text-sm tabular-nums text-gray-300">{value}%</span>
		</div>
	);
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	hour12: true,
	hourCycle: "h12",
});

export default function Dashboard() {
	const router = useRouter();
	const [user, setUser] = useState<Me | null>(null);
	const [checking, setChecking] = useState(true);
	const [claims, setClaims] = useState<ClaimResponse[]>([]);
	const [totalClaims, setTotalClaims] = useState(0);
	const [pendingClaims, setPendingClaims] = useState(0);
	const [verifiedClaims, setVerifiedClaims] = useState(0);
	const [flaggedClaims, setFlaggedClaims] = useState(0);

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
			.then((claims) => {
				setClaims(claims);
				setTotalClaims(claims.length);
				setPendingClaims(
					claims.filter((c) => c.status.toLowerCase() === "pending").length,
				);
				setVerifiedClaims(
					claims.filter((c) => c.status.toLowerCase() === "verified").length,
				);
				setFlaggedClaims(
					claims.filter((c) => c.status.toLowerCase() === "flagged").length,
				);
			})
			.catch(() => {
				// Handle error if needed
			});
	}, [user]);

	if (checking) {
		return <div className="p-8 text-gray-400">Loading...</div>;
	}

	if (!user) {
		return null;
	}

	return (
		<div className="flex flex-col gap-y-8 p-6 lg:p-8">
			{/* Page header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-white">Overview</h1>
					<p className="mt-1 text-sm text-gray-400">Thursday, June 26, 2026</p>
				</div>
				<a
					href="/dashboard/submit"
					className="flex items-center gap-x-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
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
							d="M12 4.5v15m7.5-7.5h-15"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					Submit Claim
				</a>
			</div>

			{/* Stats */}
			<dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{stats.map(({ label, value, change, up, icon }) => (
					<div
						key={label}
						className="flex flex-col gap-y-3 rounded-2xl bg-gray-900 p-6 ring-1 ring-white/10"
					>
						<div className="flex items-center justify-between">
							<dt className="text-sm text-gray-400">{label}</dt>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								aria-hidden="true"
								className="size-5 text-gray-600"
							>
								{icon}
							</svg>
						</div>
						<dd className="text-3xl font-semibold tracking-tight text-white">
							{value}
						</dd>
						<dd
							className={`text-xs font-medium ${up ? "text-green-400" : "text-red-400"}`}
						>
							{change} vs last month
						</dd>
					</div>
				))}
			</dl>

			{/* Claims table + Activity feed */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Claims table */}
				<div className="lg:col-span-2 rounded-2xl bg-gray-900 ring-1 ring-white/10 overflow-hidden">
					<div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
						<h2 className="text-sm font-semibold text-white">Recent Claims</h2>
						<a
							href="/dashboard/claims"
							className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
						>
							View all →
						</a>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-white/5">
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
										Claim ID
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
										Type
									</th>
									<th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
										Vehicle
									</th>
									{/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
										Confidence
									</th> */}
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
										Status
									</th>
									<th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
										Date
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/5">
								{claims.map((claim) => (
									<tr
										key={claim.id}
										className="hover:bg-white/[0.02] transition-colors cursor-pointer"
									>
										<td className="px-6 py-4 font-mono text-xs text-indigo-400 font-medium whitespace-nowrap">
											{claim.id}
										</td>
										<td className="px-6 py-4 text-gray-200 whitespace-nowrap">
											{claim.description}
										</td>
										<td className="hidden md:table-cell px-6 py-4 text-gray-400 whitespace-nowrap">
											{claim.claimObject}
										</td>
										{/* <td className="px-6 py-4">
											<ConfidenceBar value={claim.confidence} />
										</td> */}
										<td className="px-6 py-4">
											<span
												className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusStyles[claim.status.toLowerCase() as ClaimStatus]}`}
											>
												{claim.status}
											</span>
										</td>
										<td className="hidden sm:table-cell px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
											{dateFormatter.format(new Date(claim.createdAt))}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Activity feed */}
				<div className="rounded-2xl bg-gray-900 ring-1 ring-white/10 overflow-hidden">
					<div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
						<h2 className="text-sm font-semibold text-white">Live Activity</h2>
						<span className="flex items-center gap-x-1.5 text-xs text-green-400">
							<span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
							Live
						</span>
					</div>
					<ul className="divide-y divide-white/5">
						{activity.map((item) => (
							<li
								key={item.id + item.time}
								className="flex items-start gap-x-4 px-6 py-4"
							>
								<span
									className={`mt-1 size-2 shrink-0 rounded-full ${item.color}`}
								/>
								<div className="min-w-0 flex-1">
									<p className="font-mono text-xs text-indigo-400 font-medium">
										{item.id}
									</p>
									<p className="mt-0.5 text-sm text-gray-300">{item.action}</p>
									<p className="mt-1 text-xs text-gray-500">{item.time}</p>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* Confidence distribution */}
			<div className="rounded-2xl bg-gray-900 ring-1 ring-white/10 p-6">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-sm font-semibold text-white">
							Confidence Distribution
						</h2>
						<p className="mt-1 text-xs text-gray-400">
							AI confidence scores across all claims this month
						</p>
					</div>
					<div className="flex items-center gap-x-4 text-xs text-gray-400">
						<span className="flex items-center gap-x-1.5">
							<span className="size-2 rounded-full bg-green-500" /> High (≥90%)
						</span>
						<span className="flex items-center gap-x-1.5">
							<span className="size-2 rounded-full bg-yellow-500" /> Medium
							(75–89%)
						</span>
						<span className="flex items-center gap-x-1.5">
							<span className="size-2 rounded-full bg-red-500" /> Low (&lt;75%)
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
									? "bg-yellow-500"
									: "bg-red-500";
						return (
							<div
								key={i}
								className="group relative flex-1 flex flex-col justify-end"
							>
								<div
									className={`w-full rounded-sm ${color} opacity-80 group-hover:opacity-100 transition-opacity`}
									style={{ height: `${v}%` }}
								/>
								<div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10">
									{v}%
								</div>
							</div>
						);
					})}
				</div>
				<div className="mt-3 flex justify-between text-xs text-gray-600">
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
