"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "../lib/api";

export default function SignupForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError("");

		try {
			await api.register({ email, password, confirmPassword });
			router.push("/login");
		} catch (err) {
			setError(
				err instanceof ApiError ? err.message : "Could not reach the server.",
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-1 items-center justify-center px-6 py-12">
			<div className="w-full max-w-sm animate-fade-up">
				{/* Logo */}
				<div className="flex flex-col items-center mb-8">
					<span className="flex size-12 items-center justify-center rounded-xl bg-accent">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							aria-hidden="true"
							className="size-7 text-white"
						>
							<path
								d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</span>
					<h2 className="mt-6 font-serif text-2xl font-medium tracking-tight text-ink">
						Create an account
					</h2>
					<p className="mt-2 text-sm text-ink-soft">
						Already have an account?{" "}
						<Link
							href="/login"
							className="font-medium text-accent hover:text-accent-strong"
						>
							Log in
						</Link>
					</p>
				</div>

				{/* Card */}
				<div className="card px-8 py-8">
					<form className="flex flex-col gap-y-5" onSubmit={handleSubmit}>
						{/* Email */}
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-ink mb-1.5"
							>
								Email address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								className="input-field"
							/>
						</div>

						{/* Password */}
						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-ink mb-1.5"
							>
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="new-password"
								required
								value={password}
								placeholder="••••••••"
								onChange={(e) => setPassword(e.target.value)}
								className="input-field"
							/>
						</div>

						{/* Confirm password */}
						<div>
							<label
								htmlFor="confirmPassword"
								className="block text-sm font-medium text-ink mb-1.5"
							>
								Confirm Password
							</label>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								autoComplete="new-password"
								required
								value={confirmPassword}
								placeholder="••••••••"
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="input-field"
							/>
						</div>

						{error && <p className="text-sm text-red-600">{error}</p>}
						{/* Submit */}
						<button
							type="submit"
							disabled={loading}
							className="btn-primary mt-1 w-full"
						>
							{loading ? "Creating account..." : "Create account"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
