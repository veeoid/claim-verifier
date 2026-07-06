const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5076";

class ApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		...options,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	if (!res.ok) {
		const data = await res.json().catch(() => null);
		throw new ApiError(res.status, data?.message || "Something went wrong.");
	}

	if (res.status === 204) return undefined as T;

	const contentType = res.headers.get("content-type") || "";
	if (!contentType.includes("application/json")) {
		return undefined as T;
	}

	const text = await res.text();
	if (!text) return undefined as T;
	return JSON.parse(text) as T;
}

export type LoginRequest = { email: string; password: string };
export type RegisterRequest = {
	email: string;
	password: string;
	confirmPassword: string;
};
export type Me = { userId: string; email: string };
export type ClaimRequest = {
	description: string;
	claimObject: string;
	photos: File[];
};

export type ClaimResponse = {
	id: number;
	description: string;
	claimObject: string;
	status: string;
	createdAt: string;
};

export const api = {
	login: (body: LoginRequest) =>
		request<void>("/api/auth/login", {
			method: "POST",
			body: JSON.stringify(body),
		}),

	register: (body: RegisterRequest) =>
		request<void>("/api/auth/register", {
			method: "POST",
			body: JSON.stringify(body),
		}),

	logout: () => request<void>("/api/auth/logout", { method: "POST" }),

	me: () => request<Me>("/api/auth/me"),

	getAllClaims: () =>
		request<ClaimResponse[]>("/api/claims", {
			method: "GET",
		}),
};

export { ApiError };
