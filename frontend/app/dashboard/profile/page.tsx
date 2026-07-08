"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, ClaimResponse, Me } from "../../lib/api";
import { normalizeStatus } from "../../lib/status";
import { longDateFormatter } from "../../lib/formatter";

function initialsFor(email: string) {
	const local = email.split("@")[0] ?? email;
	const parts = local.split(/[._-]/).filter(Boolean);
	if (parts.length >= 2) {
		return (parts[0][0] + parts[1][0]).toUpperCase();
	}
	return local.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
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

	const activityStats = useMemo(() => {
		const count = (status: string) =>
			claims.filter((c) => normalizeStatus(c.status) === status).length;
		return [
			{ label: "Total Claims", value: claims.length },
			{ label: "Verified", value: count("verified") },
			{ label: "Flagged", value: count("flagged") },
			{ label: "Pending", value: count("pending") },
		];
	}, [claims]);

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

	const memberSince = user.createdAt
		? longDateFormatter.format(new Date(user.createdAt))
		: "Not available";

	const details = [
		{ label: "Email", value: user.email },
		{ label: "User ID", value: user.userId },
		{ label: "Member since", value: memberSince },
		{ label: "Account status", value: "Active" },
	];

	return (
		<div className="flex flex-col gap-y-8 p-6 lg:p-8 animate-fade-up">
			{/* Page header */}
			<div>
				<h1 className="font-serif text-2xl font-medium tracking-tight text-ink">
					Profile
				</h1>
				<p className="mt-1 text-sm text-ink-faint">Your account details</p>
			</div>

			{/* Identity card */}
			<div className="card flex flex-wrap items-center justify-between gap-6 p-6">
				<div className="flex items-center gap-x-5">
					<span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent-soft font-serif text-xl font-medium text-accent">
						{initialsFor(user.email)}
					</span>
					<div>
						<p className="font-serif text-lg font-medium text-ink">
							{user.email}
						</p>
						<p className="mt-1 text-sm text-ink-faint">Member since {memberSince}</p>
					</div>
				</div>
				<button
					type="button"
					disabled
					title="Editing your profile is coming soon"
					className="btn-ghost cursor-not-allowed opacity-55"
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
							d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					Edit profile
				</button>
			</div>

			{/* Account details */}
			<div className="card p-6">
				<h2 className="text-sm font-semibold text-ink">Account details</h2>
				<div className="mt-5 grid gap-4 sm:grid-cols-2">
					{details.map((item) => (
						<div
							key={item.label}
							className="rounded-xl border border-line bg-black/[0.015] p-4"
						>
							<p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
								{item.label}
							</p>
							<p className="mt-2 text-sm text-ink">{item.value}</p>
						</div>
					))}
				</div>
			</div>

			{/* Activity summary */}
			<div className="card p-6">
				<h2 className="text-sm font-semibold text-ink">Activity summary</h2>
				<dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
					{activityStats.map(({ label, value }) => (
						<div
							key={label}
							className="rounded-xl border border-line bg-black/[0.015] p-4"
						>
							<dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
								{label}
							</dt>
							<dd className="mt-2 font-serif text-2xl font-medium tracking-tight text-ink tabular-nums">
								{value}
							</dd>
						</div>
					))}
				</dl>
			</div>
		</div>
	);
}
