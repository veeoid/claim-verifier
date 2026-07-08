export const dateFormatter = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	hour12: true,
	hourCycle: "h12",
});

export const todayFormatter = new Intl.DateTimeFormat("en-US", {
	weekday: "long",
	year: "numeric",
	month: "long",
	day: "numeric",
});

export const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
});
