import { authService } from "@services/auth-service.js";

export function requireAuth() {
	if (!authService.isAuthenticated()) {
		const returnUrl = encodeURIComponent(
			window.location.pathname + window.location.search,
		);
		window.location.href = `/pages/auth.html?redirect=${returnUrl}`;
	}
}

export function redirectIfAuthenticated() {
	if (authService.isAuthenticated()) {
		window.location.href = "/pages/profile.html";
	}
}

export async function requireRole(allowedRoles = []) {
	if (!authService.isAuthenticated()) {
		const returnUrl = encodeURIComponent(
			window.location.pathname + window.location.search,
		);
		window.location.href = `/pages/auth.html?redirect=${returnUrl}`;
		return;
	}

	const user = await authService.rehydrate();

	if (!user) {
		window.location.href = "/pages/auth.html";
		return;
	}

	if (!allowedRoles.includes(user.role)) {
		alert("You do not have permission to access this area.");
		window.location.href = "/";
	}
}
