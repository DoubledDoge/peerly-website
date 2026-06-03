import { storage } from "@utils/storage.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
	/\/$/,
	"",
);
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

async function apiFetch(endpoint, options = {}) {
	const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
	const url = `${API_BASE_URL}${path}`;

	const token = storage.get("authToken");

	const headers = {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...(API_KEY ? { "X-API-Key": API_KEY } : {}),
		...options.headers,
	};

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000);

	const config = {
		...options,
		headers,
		signal: controller.signal,
	};

	if (config.body && typeof config.body === "object") {
		config.body = JSON.stringify(config.body);
	}

	let response;

	try {
		response = await fetch(url, config);
		clearTimeout(timeoutId);
	} catch (error) {
		clearTimeout(timeoutId);
		if (error.name === "AbortError") {
			console.error(`[Timeout] ${options.method || "GET"} ${url}`);
			throw new Error("The request took too long. Please try again.");
		}
		console.error(
			`[Network] ${options.method || "GET"} ${url}:`,
			error.message,
		);
		throw new Error("A network error occurred. Please check your connection.");
	}

	if (response.status === 401) {
		storage.remove("authToken");
		storage.remove("user");
		window.dispatchEvent(new Event("userUpdated"));
	}

	if (!response.ok) {
		let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
		try {
			const errorData = await response.json();
			errorMessage = errorData.error || errorData.message || errorMessage;
		} catch {}

		console.error(`[API] ${options.method || "GET"} ${url}:`, errorMessage);
		throw new Error(errorMessage);
	}

	if (response.status === 204) return null;

	try {
		return await response.json();
	} catch (error) {
		console.error(`[Parse] ${url}:`, error.message);
		throw new Error("Failed to parse response from the server.");
	}
}

export const api = {
	get: (endpoint, headers) => apiFetch(endpoint, { method: "GET", headers }),
	post: (endpoint, body, headers) =>
		apiFetch(endpoint, { method: "POST", body, headers }),
	put: (endpoint, body, headers) =>
		apiFetch(endpoint, { method: "PUT", body, headers }),
	delete: (endpoint, headers) =>
		apiFetch(endpoint, { method: "DELETE", headers }),
};
