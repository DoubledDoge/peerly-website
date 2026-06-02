export const BASE = import.meta.env.BASE_URL; // always has a trailing slash

export function url(path) {
	return BASE + path.replace(/^\//, "");
}
