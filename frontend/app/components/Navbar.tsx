"use client";
import "@tailwindplus/elements";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "../lib/api";

const navLinks = [
	{ label: "Dashboard", href: "/dashboard" },
	{ label: "Submit Claim", href: "/dashboard/submit" },
];

function Logo() {
	return (
		<Link href="/" className="-m-1.5 flex items-center gap-x-2.5 p-1.5">
			<span className="flex size-8 items-center justify-center rounded-lg bg-accent">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					aria-hidden="true"
					className="size-5 text-white"
				>
					<path
						d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</span>
			<span className="font-serif text-base font-semibold tracking-tight text-ink">
				ClaimVerifier
			</span>
		</Link>
	);
}

export default function Navbar() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const pathName = usePathname();

	useEffect(() => {
		api
			.me()
			.then(() => setIsLoggedIn(true))
			.catch(() => setIsLoggedIn(false));
	}, [pathName]);

	async function handleLogout() {
		await api.logout();
		setIsLoggedIn(false);
		window.location.href = "/login";
	}

	function isActive(href: string) {
		return href === "/dashboard"
			? pathName === "/dashboard"
			: pathName.startsWith(href);
	}

	return (
		<header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-sm">
			<nav
				aria-label="Global"
				className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8"
			>
				{/* Logo */}
				<div className="flex lg:flex-1">
					<Logo />
				</div>

				{/* Mobile menu button */}
				<div className="flex lg:hidden">
					<button
						type="button"
						command="show-modal"
						commandfor="mobile-menu"
						className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-ink-soft"
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
				<div className="hidden lg:flex lg:gap-x-1">
					{navLinks.map(({ label, href }) => (
						<Link
							key={href}
							href={href}
							className={`rounded-lg px-3 py-1.5 text-sm/6 font-medium transition-colors ${
								isActive(href)
									? "bg-accent-soft text-accent"
									: "text-ink-soft hover:bg-black/[0.04] hover:text-ink"
							}`}
						>
							{label}
						</Link>
					))}
				</div>

				{/* Desktop right side */}
				<div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:gap-x-4">
					{isLoggedIn ? (
						<button type="button" className="btn-ghost" onClick={handleLogout}>
							Log out
						</button>
					) : (
						<>
							<Link
								href="/login"
								className="text-sm/6 font-medium text-ink-soft hover:text-ink transition-colors"
							>
								Log in
							</Link>
							<Link href="/signup" className="btn-primary">
								Get started
							</Link>
						</>
					)}
				</div>
			</nav>

			{/* Mobile menu */}
			<el-dialog>
				<dialog id="mobile-menu" className="backdrop:bg-transparent lg:hidden">
					<div tabIndex={0} className="fixed inset-0 focus:outline-none">
						<el-dialog-panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-paper p-6 sm:max-w-sm sm:border-l sm:border-line">
							<div className="flex items-center justify-between">
								<Logo />
								<button
									type="button"
									command="close"
									commandfor="mobile-menu"
									className="-m-2.5 rounded-md p-2.5 text-ink-soft"
								>
									<span className="sr-only">Close menu</span>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
										data-slot="icon"
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
								<div className="-my-6 divide-y divide-line">
									<div className="space-y-2 py-6">
										{navLinks.map(({ label, href }) => (
											<Link
												key={href}
												href={href}
												className={`-mx-3 block rounded-lg px-3 py-2 text-base/7 font-medium hover:bg-black/[0.04] ${
													isActive(href) ? "text-accent" : "text-ink"
												}`}
											>
												{label}
											</Link>
										))}
									</div>
									<div className="py-6 space-y-3">
										{isLoggedIn ? (
											<button
												type="button"
												className="btn-ghost w-full"
												onClick={handleLogout}
											>
												Log out
											</button>
										) : (
											<>
												<Link href="/login" className="btn-ghost w-full">
													Log in
												</Link>
												<Link href="/signup" className="btn-primary w-full">
													Get started
												</Link>
											</>
										)}
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
