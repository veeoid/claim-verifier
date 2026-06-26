import "@tailwindplus/elements";

export default function Navbar() {
	return (
		<header className="bg-gray-900 border-b border-gray-700 [box-shadow:0_4px_24px_rgba(99,102,241,0.2)]">
			<nav
				aria-label="Global"
				className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
			>
				{/* Logo */}
				<div className="flex lg:flex-1">
					<a href="/" className="-m-1.5 flex items-center gap-x-2.5 p-1.5">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							aria-hidden="true"
							className="size-8 text-indigo-400"
						>
							<path
								d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
						<span className="text-sm font-semibold text-white">
							ClaimVerifier
						</span>
					</a>
				</div>

				{/* Mobile menu button */}
				<div className="flex lg:hidden">
					<button
						type="button"
						command="show-modal"
						commandfor="mobile-menu"
						className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400"
					>
						<span className="sr-only">Open main menu</span>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							data-slot="icon"
							aria-hidden="true"
							className="size-6"
						>
							<path
								d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				</div>

				{/* Desktop nav links */}
				<div className="hidden lg:flex lg:gap-x-10">
					<a href="/dashboard" className="text-sm/6 font-semibold text-white">
						Dashboard
					</a>
					<a
						href="#"
						className="text-sm/6 font-semibold text-gray-300 hover:text-white"
					>
						Submit Claim
					</a>
					<a
						href="#"
						className="text-sm/6 font-semibold text-gray-300 hover:text-white"
					>
						History
					</a>
					<a
						href="#"
						className="text-sm/6 font-semibold text-gray-300 hover:text-white"
					>
						Reports
					</a>
				</div>

				{/* Desktop right side */}
				<div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:gap-x-6">
					<a
						href="/login"
						className="text-sm/6 font-semibold text-gray-300 hover:text-white"
					>
						Log in
					</a>
					<a
						href="#"
						className="rounded-md bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
					>
						Get started
					</a>
				</div>
			</nav>

			{/* Mobile menu */}
			<el-dialog>
				<dialog id="mobile-menu" className="backdrop:bg-transparent lg:hidden">
					<div tabIndex={0} className="fixed inset-0 focus:outline-none">
						<el-dialog-panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 p-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
							<div className="flex items-center justify-between">
								<a
									href="/"
									className="-m-1.5 flex items-center gap-x-2.5 p-1.5"
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
										aria-hidden="true"
										className="size-8 text-indigo-400"
									>
										<path
											d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
									<span className="text-sm font-semibold text-white">
										ClaimVerifier
									</span>
								</a>
								<button
									type="button"
									command="close"
									commandfor="mobile-menu"
									className="-m-2.5 rounded-md p-2.5 text-gray-400"
								>
									<span className="sr-only">Close menu</span>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
										data-slot="icon"
										aria-hidden="true"
										className="size-6"
									>
										<path
											d="M6 18 18 6M6 6l12 12"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</button>
							</div>
							<div className="mt-6 flow-root">
								<div className="-my-6 divide-y divide-white/10">
									<div className="space-y-2 py-6">
										<a
											href="/dashboard"
											className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-white/5"
										>
											Dashboard
										</a>
										<a
											href="#"
											className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-300 hover:bg-white/5 hover:text-white"
										>
											Submit Claim
										</a>
										<a
											href="#"
											className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-300 hover:bg-white/5 hover:text-white"
										>
											History
										</a>
										<a
											href="#"
											className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-300 hover:bg-white/5 hover:text-white"
										>
											Reports
										</a>
									</div>
									<div className="py-6 space-y-3">
										<a
											href="/login"
											className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-300 hover:bg-white/5 hover:text-white"
										>
											Log in
										</a>
										<a
											href="#"
											className="-mx-3 block rounded-lg bg-indigo-500 px-3 py-2.5 text-center text-base/7 font-semibold text-white hover:bg-indigo-400"
										>
											Get started
										</a>
									</div>
								</div>
							</div>
						</el-dialog-panel>
					</div>
				</dialog>
			</el-dialog>
		</header>
	);
}
