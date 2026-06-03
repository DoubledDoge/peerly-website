import searchIconUrl from "@assets/icons/search.svg?raw";
import { url } from "@utils/base.js";

function debounce(func, delay) {
	let timeoutId;
	return (...args) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			func.apply(null, args);
		}, delay);
	};
}

export function initSearchBar(containerId) {
	const container = document.getElementById(containerId);
	if (!container) return;

	container.innerHTML = `
		<form id="search-form" class="search-form search-bar" role="search">
			<span class="search-icon" aria-hidden="true">${searchIconUrl}</span>
			<input type="search" id="global-search" placeholder="Search for anything..." aria-label="Search for anything..." autocomplete="off" />
			<button type="submit" class="btn-search">Search</button>
		</form>
	`;

	const form = container.querySelector("#search-form");
	const input = container.querySelector("#global-search");

	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const query = input.value.trim();
		if (!query) return;

		if (window.location.pathname.includes("listings.html")) {
			const currentUrl = new URL(window.location.href);
			currentUrl.searchParams.set("q", query);
			window.history.pushState({}, "", currentUrl);
			window.dispatchEvent(new Event("searchUpdated"));
		} else {
			window.location.href = url(
				`/pages/listings.html?q=${encodeURIComponent(query)}`,
			);
		}
	});

	const handleSearchInput = debounce(() => {
		if (window.location.pathname.includes("listings.html")) {
			window.dispatchEvent(new Event("searchUpdated"));
		}
	}, 300);

	input.addEventListener("input", handleSearchInput);
}
