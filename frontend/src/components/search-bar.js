import searchIconUrl from "@assets/icons/search.svg?raw";

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
			const url = new URL(window.location);
			url.searchParams.set("q", query);
			window.history.pushState({}, "", url);
			window.dispatchEvent(new Event("searchUpdated"));
		} else {
			window.location.href = `/pages/listings.html?q=${encodeURIComponent(query)}`;
		}
	});

	const handleSearchInput = debounce(() => {
		if (window.location.pathname.includes("listings.html")) {
			window.dispatchEvent(new Event("searchUpdated"));
		}
	}, 300);

	input.addEventListener("input", handleSearchInput);
}
