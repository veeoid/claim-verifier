"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ClaimResponse, imageUrl } from "../../lib/api";

const statusStyles = {
	verified: "bg-green-50 text-green-700 ring-1 ring-green-600/20",
	pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
	flagged: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
};

function normalizeStatus(status: string) {
	const s = status.toLowerCase();
	return s === "verified" || s === "flagged" ? s : "pending";
}

function formatValue(value: string | boolean | null | undefined) {
	if (value === null || value === undefined) return "Not available";
	if (typeof value === "boolean") return value ? "Yes" : "No";
	return value;
}

export default function ClaimCard() {
	const searchParams = useSearchParams();
	const claimId = searchParams.get("id");
	const [claim, setClaim] = useState<ClaimResponse | null>(null);
	const [loading, setLoading] = useState(Boolean(claimId));

	useEffect(() => {
		if (!claimId) {
			setClaim(null);
			setLoading(false);
			return;
		}

		let isMounted = true;
		setLoading(true);

		api
			.getClaim(claimId)
			.then((data) => {
				if (isMounted) setClaim(data);
			})
			.catch(() => {
				if (isMounted) setClaim(null);
			})
			.finally(() => {
				if (isMounted) setLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, [claimId]);

	const status = useMemo(() => {
		if (!claim) return "pending";
		return normalizeStatus(claim.status);
	}, [claim]);

	if (!claimId) {
		return (
			<div className="rounded-2xl border border-line bg-paper p-8 text-sm text-ink-soft shadow-sm">
				<p>No claim selected.</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="rounded-2xl border border-line bg-paper p-8 text-sm text-ink-soft shadow-sm">
				<p>Loading claim details...</p>
			</div>
		);
	}

	if (!claim) {
		return (
			<div className="rounded-2xl border border-line bg-paper p-8 text-sm text-ink-soft shadow-sm">
				<p>Claim could not be loaded.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 p-6 lg:p-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-accent">Claim Analysis</p>
					<h1 className="mt-1 font-serif text-2xl font-medium tracking-tight text-ink">
						Claim #{claim.id}
					</h1>
					<p className="mt-2 max-w-2xl text-sm text-ink-soft">
						{claim.description}
					</p>
				</div>
				<div
					className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusStyles[status]}`}
				>
					{claim.status}
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
				<div className="card p-6">
					<h2 className="text-sm font-semibold text-ink">Claim overview</h2>
					<div className="mt-5 grid gap-4 sm:grid-cols-2">
						{[
							{ label: "Claim object", value: claim.claimObject },
							{ label: "Severity", value: claim.severity },
							{ label: "Issue type", value: claim.issueType },
							{ label: "Object part", value: claim.objectPart },
						].map((item) => (
							<div
								key={item.label}
								className="rounded-xl border border-line bg-black/[0.015] p-4"
							>
								<p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
									{item.label}
								</p>
								<p className="mt-2 text-sm text-ink">
									{formatValue(item.value)}
								</p>
							</div>
						))}
					</div>
				</div>

				<div className="card p-6">
					<h2 className="text-sm font-semibold text-ink">Evidence summary</h2>
					<div className="mt-5 space-y-4 text-sm text-ink-soft">
						<div className="rounded-xl border border-line bg-black/[0.015] p-4">
							<p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
								Evidence standard met
							</p>
							<p className="mt-2 text-sm text-ink">
								{formatValue(claim.evidenceStandardMet)}
							</p>
						</div>
						<div className="rounded-xl border border-line bg-black/[0.015] p-4">
							<p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
								Reason
							</p>
							<p className="mt-2 text-sm text-ink">
								{formatValue(claim.evidenceStandardMetReason)}
							</p>
						</div>
						<div className="rounded-xl border border-line bg-black/[0.015] p-4">
							<p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
								Risk flags
							</p>
							<p className="mt-2 text-sm text-ink">
								{formatValue(claim.riskFlags)}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
				<div className="card p-6">
					<div className="flex items-center justify-between gap-3">
						<h2 className="text-sm font-semibold text-ink">
							Submission details
						</h2>
						<Link
							href="/dashboard"
							className="text-sm font-medium text-accent hover:text-accent-strong"
						>
							Back to dashboard
						</Link>
					</div>
					<div className="mt-5 grid gap-4 sm:grid-cols-2">
						{[
							{
								label: "Created",
								value: new Date(claim.createdAt).toLocaleString(),
							},
							{ label: "Valid image", value: claim.validImage },
							{ label: "Justification", value: claim.claimStatusJustification },
							{ label: "Status", value: claim.status },
						].map((item) => (
							<div
								key={item.label}
								className="rounded-xl border border-line bg-black/[0.015] p-4"
							>
								<p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
									{item.label}
								</p>
								<p className="mt-2 text-sm text-ink">
									{formatValue(item.value)}
								</p>
							</div>
						))}
					</div>
				</div>

				<div className="card p-6">
					<h2 className="text-sm font-semibold text-ink">Supporting images</h2>
					{claim.images?.length ? (
						<div className="mt-5 grid gap-4 sm:grid-cols-2">
							{claim.images.map((image) => (
								<div
									key={image.imageId}
									className="overflow-hidden rounded-xl border border-line bg-black/[0.015]"
								>
									<img
										src={imageUrl(image.path)}
										alt={`Claim ${claim.id} evidence`}
										className="h-48 w-full object-cover"
									/>
									<div className="flex items-center justify-between px-4 py-3 text-sm text-ink-soft">
										<span>
											{image.isSupporting ? "Supporting" : "Reference"}
										</span>
										<span className="text-xs uppercase tracking-wide text-ink-faint">
											{image.imageId}
										</span>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="mt-5 rounded-xl border border-dashed border-line bg-black/[0.015] p-8 text-center text-sm text-ink-soft">
							No images were attached to this claim.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
