import moonIconUrl from "@assets/icons/moon.svg?raw";
import sunIconUrl from "@assets/icons/sun.svg?raw";

export function initThemeToggle() {
	const btn = document.getElementById("theme-toggle");
	if (!btn) return;

	applyTheme(getTheme(), btn);
	btn.addEventListener("click", () => toggleTheme(btn));
}

function getTheme() {
	const stored = localStorage.getItem("theme");
	if (stored === "light" || stored === "dark") return stored;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyTheme(theme, btn) {
	document.documentElement.setAttribute("data-theme", theme);
	localStorage.setItem("theme", theme);

	const placeholder = btn.querySelector(".icon-theme");
	if (!placeholder) return;
	placeholder.innerHTML = theme === "light" ? sunIconUrl : moonIconUrl;
}

function toggleTheme(btn) {
	const current = getTheme();
	const next = current === "light" ? "dark" : "light";

	if (!document.startViewTransition) {
		applyTheme(next, btn);
		return;
	}

	document.startViewTransition(() => applyTheme(next, btn));
}
