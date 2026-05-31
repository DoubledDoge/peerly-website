export const storage = {
	get(key, defaultValue = null) {
		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : defaultValue;
		} catch (error) {
			console.warn(`[Storage] Failed to read key "${key}":`, error);
			return defaultValue;
		}
	},

	set(key, value) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
			return true;
		} catch (error) {
			console.error(
				`[Storage] Failed to save "${key}" (Quota exceeded?):`,
				error,
			);
			return false;
		}
	},

	remove(key) {
		try {
			localStorage.removeItem(key);
		} catch (error) {
			console.warn(`[Storage] Failed to remove key "${key}":`, error);
		}
	},
};
