import { storage } from "@utils/storage.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
	/\/$/,
	"",
);
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

function withAuthParams(url, token) {
	const params = [];
	if (API_KEY) params.push(`api_key=${encodeURIComponent(API_KEY)}`);
	if (token) params.push(`auth_token=${encodeURIComponent(token)}`);
	if (params.length === 0) return url;
	const separator = url.includes("?") ? "&" : "?";
	return `${url}${separator}${params.join("&")}`;
}

async function apiFetch(endpoint, options = {}) {
	const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
	const token = storage.get("authToken");
	const requestedMethod = (options.method || "GET").toUpperCase();

	const needsOverride =
		requestedMethod === "PUT" || requestedMethod === "DELETE";
	const wireMethod = needsOverride ? "POST" : requestedMethod;

	let url = withAuthParams(`${API_BASE_URL}${path}`, token);
	if (needsOverride) {
		const separator = url.includes("?") ? "&" : "?";
		url = `${url}${separator}_method=${requestedMethod}`;
	}

	const hasBody = options.body !== undefined && options.body !== null;

	const headers = {
		...(hasBody ? { "Content-Type": "text/plain" } : {}),
		...options.headers,
	};

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000);

	const config = {
		...options,
		method: wireMethod,
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
			console.error(`[Timeout] ${requestedMethod} ${url}`);
			throw new Error("The request took too long. Please try again.");
		}
		console.error(`[Network] ${requestedMethod} ${url}:`, error.message);
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

		console.error(`[API] ${requestedMethod} ${url}:`, errorMessage);
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
