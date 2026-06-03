import { api } from "@utils/api.js";
import { storage } from "@utils/storage.js";

function _persistSession(data) {
	storage.set("authToken", data.token);
	storage.set("user", data.user);
	sessionStorage.setItem("sessionValidated", "1");
	window.dispatchEvent(new Event("userUpdated"));
}

function _clearSession() {
	storage.remove("authToken");
	storage.remove("user");
	sessionStorage.removeItem("sessionValidated");
	window.dispatchEvent(new Event("userUpdated"));
}

export const authService = {
	async login(email, password) {
		if (!email || !password) {
			return { success: false, error: "Email and password are required." };
		}
		try {
			const data = await api.post("/auth/login", { email, password });
			_persistSession(data);
			return { success: true, user: data.user };
		} catch (error) {
			return { success: false, error: error.message };
		}
	},

	async register(name, email, password) {
		if (!name || !email || !password) {
			return { success: false, error: "All fields are required." };
		}
		try {
			const data = await api.post("/auth/register", { name, email, password });
			_persistSession(data);
			return { success: true, user: data.user };
		} catch (error) {
			return { success: false, error: error.message };
		}
	},

	async logout() {
		try {
			await api.post("/auth/logout");
		} catch {
		} finally {
			_clearSession();
		}
	},

	async rehydrate() {
		const token = storage.get("authToken");
		if (!token) return null;
		try {
			const data = await api.get("/auth/me");
			storage.set("user", data.user);
			sessionStorage.setItem("sessionValidated", "1");
			window.dispatchEvent(new Event("userUpdated"));
			return data.user;
		} catch {
			_clearSession();
			return null;
		}
	},

	getUser() {
		try {
			return storage.get("user", null);
		} catch {
			return null;
		}
	},

	isAuthenticated() {
		return storage.get("authToken") !== null;
	},

	updateUserCache(updates) {
		const user = this.getUser();
		if (!user) return null;
		const updated = { ...user, ...updates };
		storage.set("user", updated);
		window.dispatchEvent(new Event("userUpdated"));
		return updated;
	},
};
