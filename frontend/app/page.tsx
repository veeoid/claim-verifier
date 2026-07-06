export default function HomePage() {
	return (
		<main className="mx-auto w-full max-w-8xl">
			{/* Hero */}
			<section className="mx-auto max-w-7xl px-6 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-16 lg:px-8">
				<div className="relative isolate overflow-hidden bg-gray-900 px-6 pt-16 shadow-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
					<svg
						viewBox="0 0 2000 2000"
						aria-hidden="true"
						className="absolute top-1/2 left-1/2 -z-10 size-256 -translate-y-1/2 mask-[radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
					>
						<circle
							r="512"
							cx="512"
							cy="512"
							fill="url(#hero-gradient)"
							fillOpacity="0.7"
						/>
						<defs>
							<radialGradient id="hero-gradient">
								<stop stopColor="#e6e5f9" />
								<stop offset="1" stopColor="#1ea3c7" />
							</radialGradient>
						</defs>
					</svg>
					<div className="mx-auto max-w-md text-center lg:mx-0 lg:-ml-6 lg:py-32 lg:text-left">
						<h1 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
							Verify claims in seconds.
						</h1>
						<p className="mt-6 text-lg/8 text-pretty text-gray-300">
							Upload a photo and let AI detect the damage, score the severity,
							and flag the claim — no manual review.
						</p>
						<div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
							<a
								href="/dashboard"
								className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
							>
								Get started
							</a>
							<a
								href="#how-it-works"
								className="text-sm/6 font-semibold text-white hover:text-gray-100"
							>
								Learn more <span aria-hidden="true">→</span>
							</a>
						</div>
					</div>
					<div className="relative mt-16 lg:mt-8 lg:h-80">
						<img
							width="2000"
							height="1080"
							src="/images/hero-image.png"
							alt="App screenshot"
							className="mx-auto block w-full max-w-none rounded-md bg-white/5 ring-1 ring-white/10 lg:absolute lg:top-5 lg:-left-16 lg:w-140"
						/>
					</div>
				</div>
			</section>

			{/* Stats */}
			<section className="mx-auto max-w-7xl px-6 pb-12 lg:px-8">
				<dl className="grid grid-cols-1 gap-px bg-white/5 rounded-2xl overflow-hidden sm:grid-cols-3">
					{[
						{ label: "Claims processed", value: "10,000+" },
						{ label: "AI accuracy", value: "98.5%" },
						{ label: "Time saved per claim", value: "~80%" },
					].map(({ label, value }) => (
						<div
							key={label}
							className="flex flex-col items-center justify-center gap-y-2 bg-gray-900/60 px-8 py-10 text-center"
						>
							<dt className="text-sm/6 text-gray-400">{label}</dt>
							<dd className="text-4xl font-semibold tracking-tight text-white">
								{value}
							</dd>
						</div>
					))}
				</dl>
			</section>

			{/* Features */}
			<section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
				<div className="mx-auto max-w-2xl text-center mb-12">
					<h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
						Everything you need to process claims faster
					</h2>
					<p className="mt-4 text-lg text-gray-400">
						Powered by computer vision and machine learning trained on millions
						of damage photos.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{[
						{
							d: "m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z",
							title: "AI Damage Detection",
							description:
								"Upload any photo and get an instant, detailed breakdown of damage type, location, and extent.",
						},
						{
							d: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
							title: "Severity Scoring",
							description:
								"Every claim gets a 0–100 confidence score so adjusters can prioritize high-risk cases instantly.",
						},
						{
							d: "M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5",
							title: "Auto Flagging",
							description:
								"Suspicious patterns and high-value claims are automatically flagged for human review before approval.",
						},
						{
							d: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
							title: "Instant Reports",
							description:
								"Generate structured PDF reports with damage photos, scores, and recommendations in one click.",
						},
						{
							d: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
							title: "Real-Time Processing",
							description:
								"Results in under 10 seconds. No waiting for a batch job or a human adjuster to get back to you.",
						},
						{
							d: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
							title: "Audit Trail",
							description:
								"Every decision is logged with the photo, model version, and confidence score for full compliance.",
						},
					].map(({ d, title, description }) => (
						<div
							key={title}
							className="rounded-2xl bg-gray-900/60 p-8 ring-1 ring-white/10 hover:ring-indigo-500/50 transition-all"
						>
							<div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-indigo-500/10">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									aria-hidden="true"
									className="size-6 text-indigo-400"
								>
									<path d={d} strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</div>
							<h3 className="text-base font-semibold text-white">{title}</h3>
							<p className="mt-2 text-sm/6 text-gray-400">{description}</p>
						</div>
					))}
				</div>
			</section>

			{/* How it works */}
			<section
				id="how-it-works"
				className="mx-auto max-w-7xl px-6 pb-16 lg:px-8"
			>
				<div className="rounded-3xl bg-gray-900/60 ring-1 ring-white/10 px-8 py-16 sm:px-16">
					<div className="mx-auto max-w-2xl text-center mb-12">
						<h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
							How it works
						</h2>
						<p className="mt-4 text-lg text-gray-400">
							From photo to verified report in three steps.
						</p>
					</div>
					<ol className="grid grid-cols-1 gap-8 sm:grid-cols-3">
						{[
							{
								step: "01",
								title: "Upload a photo",
								description:
									"Drag and drop any damage photo — vehicle, property, or equipment. Supports JPEG, PNG, and HEIC.",
							},
							{
								step: "02",
								title: "AI analyzes the claim",
								description:
									"Our model identifies damage type, location, and severity, then cross-references against historical claim data.",
							},
							{
								step: "03",
								title: "Get your report",
								description:
									"Receive a structured report with a severity score, flag status, and recommended next action.",
							},
						].map(({ step, title, description }) => (
							<li key={step} className="flex flex-col">
								<span className="text-5xl font-bold text-indigo-500/30 mb-4">
									{step}
								</span>
								<h3 className="text-base font-semibold text-white mb-2">
									{title}
								</h3>
								<p className="text-sm/6 text-gray-400">{description}</p>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/* Bottom CTA */}
			<section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
				<div className="relative isolate overflow-hidden rounded-3xl bg-indigo-500 px-8 py-16 text-center shadow-2xl sm:px-16">
					<h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
						Start verifying claims today.
					</h2>
					<p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
						No setup fee. No manual review. Just upload, score, and decide.
					</p>
					<div className="mt-8 flex items-center justify-center gap-x-6">
						<a
							href="/dashboard"
							className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 shadow-xs hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
						>
							Get started for free
						</a>
						<a
							href="#how-it-works"
							className="text-sm/6 font-semibold text-white hover:text-indigo-100"
						>
							See how it works <span aria-hidden="true">→</span>
						</a>
					</div>
					<svg
						viewBox="0 0 1024 1024"
						aria-hidden="true"
						className="absolute top-1/2 left-1/2 -z-10 size-256 -translate-y-1/2 -translate-x-1/2 mask-[radial-gradient(closest-side,white,transparent)]"
					>
						<circle
							r="512"
							cx="512"
							cy="512"
							fill="url(#cta-gradient)"
							fillOpacity="0.3"
						/>
						<defs>
							<radialGradient id="cta-gradient">
								<stop stopColor="#fff" />
								<stop offset="1" stopColor="#818cf8" />
							</radialGradient>
						</defs>
					</svg>
				</div>
			</section>
		</main>
	);
}
