"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api, Me } from "../lib/api";
import { useState, useEffect } from "react";

const navItems = [
	{
		label: "Overview",
		href: "/dashboard",
		d: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
	},

	{
		label: "Submit Claim",
		href: "/dashboard/submit",
		d: "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5",
	},
	{
		label: "History",
		href: "/dashboard/history",
		d: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
	},
	{
		label: "Reports",
		href: "/dashboard/reports",
		d: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
	},
];

function SidebarIcon({ d }: { d: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			aria-hidden="true"
			className="size-5 shrink-0"
		>
			<path d={d} strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const [user, setUser] = useState<Me | null>(null);

	useEffect(() => {
		api.me().then(setUser).catch(null).finally();
	});

	return (
		<div className="flex flex-1">
			{/* Sidebar */}
			<aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-line bg-white">
				<nav className="flex flex-1 flex-col px-4 py-4">
					<ul className="flex flex-col">
						{navItems.map((item) => {
							const active =
								item.href === "/dashboard"
									? pathname === "/dashboard"
									: pathname.startsWith(item.href);
							return (
								<li key={item.label}>
									<Link
										href={item.href}
										className={`flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
											active
												? "bg-accent-soft text-accent"
												: "text-ink-soft hover:bg-black/[0.04] hover:text-ink"
										}`}
									>
										<SidebarIcon d={item.d} />
										{item.label}
									</Link>
								</li>
							);
						})}
					</ul>

					<div className="mt-auto pt-6 border-t border-line flex flex-col">
						<Link
							href="/dashboard/settings"
							className="flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-black/[0.04] hover:text-ink transition-colors"
						>
							<SidebarIcon d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
							Settings
						</Link>
						<div className="px-3 py-2 text-sm font-medium text-ink-soft">
							{user?.email}
						</div>
					</div>
				</nav>
			</aside>

			{/* Page content */}
			<div className="flex flex-1 flex-col min-w-0">{children}</div>
		</div>
	);
}
