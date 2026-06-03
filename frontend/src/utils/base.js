export const BASE = import.meta.env.BASE_URL;

export function url(path) {
	return BASE + path.replace(/^\//, "");
}
