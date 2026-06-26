export default function LoginForm() {
	return (
		<div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-12">
			<div className="w-full max-w-sm">
				{/* Logo */}
				<div className="flex flex-col items-center mb-8">
					<div className="flex items-center gap-x-2.5">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							aria-hidden="true"
							className="size-9 text-indigo-400"
						>
							<path
								d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
						<span className="text-lg font-semibold text-white">
							ClaimVerifier
						</span>
					</div>
					<h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
						Sign in to your account
					</h2>
					<p className="mt-2 text-sm text-gray-400">
						Don&apos;t have an account?{" "}
						<a
							href="#"
							className="text-indigo-400 hover:text-indigo-300 font-medium"
						>
							Get started for free
						</a>
					</p>
				</div>

				{/* Card */}
				<div className="rounded-2xl bg-gray-900 ring-1 ring-white/10 px-8 py-8">
					<form className="flex flex-col gap-y-5" action="#" method="POST">
						{/* Email */}
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-300 mb-1.5"
							>
								Email address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								placeholder="you@example.com"
								className="block w-full rounded-lg bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
							/>
						</div>

						{/* Password */}
						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label
									htmlFor="password"
									className="block text-sm font-medium text-gray-300"
								>
									Password
								</label>
								<a
									href="#"
									className="text-xs text-indigo-400 hover:text-indigo-300"
								>
									Forgot password?
								</a>
							</div>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								placeholder="••••••••"
								className="block w-full rounded-lg bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
							/>
						</div>

						{/* Submit */}
						<button
							type="submit"
							className="mt-1 w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors"
						>
							Sign in
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
