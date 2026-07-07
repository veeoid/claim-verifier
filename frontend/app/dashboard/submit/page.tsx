"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, ClaimResponse, Me } from "../../lib/api";

type PhotoEntry = {
	file: File;
	previewUrl: string;
};

type ClaimStatus = "verified" | "pending" | "flagged";

const statusStyles = {
	verified: "bg-green-50 text-green-700 ring-1 ring-green-600/20",
	pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
	flagged: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
};

function normalizeStatus(status: string): ClaimStatus {
	const s = status.toLowerCase();
	return s === "verified" || s === "flagged" ? s : "pending";
}

function ResultRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-y-1 py-3 sm:flex-row sm:items-baseline sm:gap-x-4">
			<dt className="w-40 shrink-0 text-xs font-medium text-ink-faint uppercase tracking-wide">
				{label}
			</dt>
			<dd className="text-sm text-ink">{value}</dd>
		</div>
	);
}

export default function SubmitClaimPage() {
	const router = useRouter();
	const [user, setUser] = useState<Me | null>(null);
	const [checking, setChecking] = useState(true);

	const [claimObject, setClaimObject] = useState("");
	const [description, setDescription] = useState("");
	const [photos, setPhotos] = useState<PhotoEntry[]>([]);
	const [dragActive, setDragActive] = useState(false);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<ClaimResponse | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		api
			.me()
			.then(setUser)
			.catch(() => router.push("/login"))
			.finally(() => setChecking(false));
	}, [router]);

	// Release preview object URLs when the page unmounts
	const photosRef = useRef<PhotoEntry[]>([]);
	useEffect(() => {
		photosRef.current = photos;
	}, [photos]);
	useEffect(() => {
		return () => {
			for (const photo of photosRef.current) {
				URL.revokeObjectURL(photo.previewUrl);
			}
		};
	}, []);

	function addFiles(files: FileList | File[]) {
		const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
		if (images.length === 0) return;
		setPhotos((prev) => [
			...prev,
			...images.map((file) => ({
				file,
				previewUrl: URL.createObjectURL(file),
			})),
		]);
		setError("");
	}

	function removePhoto(index: number) {
		setPhotos((prev) => {
			URL.revokeObjectURL(prev[index].previewUrl);
			return prev.filter((_, i) => i !== index);
		});
	}

	function handleDrop(event: React.DragEvent) {
		event.preventDefault();
		setDragActive(false);
		addFiles(event.dataTransfer.files);
	}

	async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (photos.length === 0) {
			setError("Add at least one photo of the damage.");
			return;
		}
		setSubmitting(true);
		setError("");

		try {
			const claim = await api.createClaim({
				description,
				claimObject,
				photos: photos.map((p) => p.file),
			});
			setResult(claim);
		} catch (err) {
			setError(
				err instanceof ApiError ? err.message : "Could not reach the server.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	function resetForm() {
		for (const photo of photos) {
			URL.revokeObjectURL(photo.previewUrl);
		}
		setPhotos([]);
		setClaimObject("");
		setDescription("");
		setResult(null);
		setError("");
	}

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

	// ---- Result view ----
	if (result) {
		const status = normalizeStatus(result.status);
		return (
			<div className="mx-auto w-full max-w-2xl p-6 lg:p-8 animate-fade-up">
				<div className="card overflow-hidden">
					<div className="border-b border-line px-8 py-6 text-center">
						<span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-accent-soft">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								aria-hidden="true"
								className="size-7 text-accent"
							>
								<path
									d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</span>
						<h1 className="font-serif text-xl font-medium tracking-tight text-ink">
							Claim submitted
						</h1>
						<p className="mt-1 text-sm text-ink-soft">
							Our AI has analyzed your claim. Here&apos;s the verdict.
						</p>
						<span
							className={`mt-4 inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ${statusStyles[status]}`}
						>
							{result.status}
						</span>
					</div>

					<dl className="divide-y divide-line px-8 py-4">
						<ResultRow label="Claim ID" value={`CLM-${result.id}`} />
						<ResultRow label="Item" value={result.claimObject} />
						{result.severity && (
							<ResultRow label="Severity" value={result.severity} />
						)}
						{result.issueType && (
							<ResultRow label="Issue type" value={result.issueType} />
						)}
						{result.objectPart && (
							<ResultRow label="Affected part" value={result.objectPart} />
						)}
						{result.claimStatusJustification && (
							<ResultRow
								label="Justification"
								value={result.claimStatusJustification}
							/>
						)}
						{result.evidenceStandardMet != null && (
							<ResultRow
								label="Evidence standard"
								value={
									result.evidenceStandardMet
										? "Met"
										: `Not met${result.evidenceStandardMetReason ? ` — ${result.evidenceStandardMetReason}` : ""}`
								}
							/>
						)}
						{result.riskFlags && (
							<ResultRow label="Risk flags" value={result.riskFlags} />
						)}
					</dl>

					<div className="flex items-center justify-center gap-x-4 border-t border-line px-8 py-6">
						<button type="button" onClick={resetForm} className="btn-ghost">
							Submit another claim
						</button>
						<Link href="/dashboard" className="btn-primary">
							Back to dashboard
						</Link>
					</div>
				</div>
			</div>
		);
	}

	// ---- Form view ----
	return (
		<div className="mx-auto w-full max-w-2xl p-6 lg:p-8 animate-fade-up">
			{/* Page header */}
			<div className="mb-8">
				<h1 className="font-serif text-2xl font-medium tracking-tight text-ink">
					Submit a claim
				</h1>
				<p className="mt-1 text-sm text-ink-soft">
					Describe what happened and attach photos — the AI takes it from there.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
				<div className="card flex flex-col gap-y-5 p-8">
					<div>
						<label
							htmlFor="claimObject"
							className="block text-sm font-medium text-ink mb-1.5"
						>
							What are you claiming for?
						</label>
						<select
							id="claimObject"
							name="claimObject"
							required
							value={claimObject}
							onChange={(e) => setClaimObject(e.target.value)}
							className="input-field"
						>
							<option value="">Select an item</option>
							<option value="car">Car</option>
							<option value="laptop">Laptop</option>
							<option value="package">Package</option>
						</select>
					</div>

					<div>
						<label
							htmlFor="description"
							className="block text-sm font-medium text-ink mb-1.5"
						>
							What happened?
						</label>
						<textarea
							id="description"
							name="description"
							required
							rows={4}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe the incident and the damage — when it happened, how, and what's affected."
							className="input-field resize-none"
						/>
					</div>

					{/* Photo dropzone */}
					<div>
						<span className="block text-sm font-medium text-ink mb-1.5">
							Photos of the damage
						</span>
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							onDragOver={(e) => {
								e.preventDefault();
								setDragActive(true);
							}}
							onDragLeave={() => setDragActive(false)}
							onDrop={handleDrop}
							className={`flex w-full flex-col items-center justify-center gap-y-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
								dragActive
									? "border-accent bg-accent-soft"
									: "border-line bg-black/[0.015] hover:border-accent/50 hover:bg-accent-soft/50"
							}`}
						>
							<span className="flex size-11 items-center justify-center rounded-lg bg-accent-soft">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									aria-hidden="true"
									className="size-6 text-accent"
								>
									<path
										d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</span>
							<span className="text-sm text-ink-soft">
								<span className="font-medium text-accent">Click to upload</span>{" "}
								or drag and drop
							</span>
							<span className="text-xs text-ink-faint">
								JPEG, PNG, or HEIC — clear, well-lit photos work best
							</span>
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							multiple
							className="hidden"
							onChange={(e) => {
								if (e.target.files) addFiles(e.target.files);
								e.target.value = "";
							}}
						/>

						{/* Previews */}
						{photos.length > 0 && (
							<ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
								{photos.map((photo, i) => (
									<li
										key={photo.previewUrl}
										className="group relative aspect-square overflow-hidden rounded-lg border border-line"
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={photo.previewUrl}
											alt={photo.file.name}
											className="size-full object-cover"
										/>
										<button
											type="button"
											onClick={() => removePhoto(i)}
											aria-label={`Remove ${photo.file.name}`}
											className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
										>
											<svg
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												aria-hidden="true"
												className="size-3.5"
											>
												<path
													d="M6 18 18 6M6 6l12 12"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</button>
									</li>
								))}
							</ul>
						)}
					</div>

					{error && <p className="text-sm text-red-600">{error}</p>}
				</div>

				<div className="flex items-center justify-end gap-x-4">
					<Link href="/dashboard" className="btn-ghost">
						Cancel
					</Link>
					<button type="submit" disabled={submitting} className="btn-primary">
						{submitting ? (
							<>
								<span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
								Analyzing claim...
							</>
						) : (
							"Submit claim"
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
