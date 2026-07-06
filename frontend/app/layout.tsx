import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const fraunces = Fraunces({
	variable: "--font-fraunces",
	subsets: ["latin"],
	axes: ["opsz"],
});

export const metadata: Metadata = {
	title: "Claim Verifier",
	description: "Verify and manage your claims",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col bg-paper text-ink">
				<div className="flex min-h-screen flex-col">
					<Navbar />
					{children}
				</div>
			</body>
		</html>
	);
}
