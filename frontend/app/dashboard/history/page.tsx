"use client";

import { api, ClaimResponse, Me } from "../../lib/api";
import { useRouter } from "next/navigation";
import { normalizeStatus, statusLabel, statusStyles } from "../../lib/status";
import Link from "next/link";

import { dateFormatter } from "../../lib/formatter";

import { useState, useEffect } from "react";

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

export default function HistoryPage() {
	const router = useRouter();
	const [user, setUser] = useState<Me | null>(null);
	const [checking, setChecking] = useState(true);
	const [claims, setClaims] = useState<ClaimResponse[]>([]);

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
		<div>
			<div className="lg:col-span-2 card overflow-hidden">
				<div className="flex items-center justify-between px-6 py-4 border-b border-line">
					<h2 className="text-sm font-semibold text-ink">Claims History</h2>
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
					<div className="max-h overflow-x-auto overflow-y-auto">
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
							<tbody className="overflow-y ">
								{claims.map((claim) => (
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
		</div>
	);
}
