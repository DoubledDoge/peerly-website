import { initFooter } from "@components/footer.js";
import { renderListingCard } from "@components/listing-card.js";
import { initNavbar } from "@components/navbar.js";
import { initSearchBar } from "@components/search-bar.js";
import { showToast } from "@components/toast.js";
import { cartService } from "@services/cart-service.js";
import { listingsService } from "@services/listings-service.js";

initNavbar();
initFooter();
initSearchBar("search-bar-container");
await initListingsPage();

async function initListingsPage() {
	const grid = document.getElementById("listings-grid");
	const countEl = document.getElementById("results-count");
	const searchInput = document.getElementById("global-search");
	const sortSelect = document.getElementById("sort-select");
	const paginationContainer = document.getElementById("pagination-container");
	const categoryRadios = document.querySelectorAll('input[name="category"]');
	const statusRadios = document.querySelectorAll('input[name="status"]');

	if (!grid) return;

	const params = new URLSearchParams(window.location.search);
	if (params.get("q") && searchInput) searchInput.value = params.get("q");
	if (params.get("category")) {
		const radio = document.querySelector(
			`input[name="category"][value="${params.get("category")}"]`,
		);
		if (radio) radio.checked = true;
	}

	let currentPage = 1;
	const perPage = 9;
	let currentListings = [];

	function renderPagination(totalPages) {
		if (!paginationContainer) return;

		if (totalPages <= 1) {
			paginationContainer.innerHTML = "";
			return;
		}

		let startPage = Math.max(1, currentPage - 1);
		const endPage = Math.min(totalPages, startPage + 4);
		if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

		let html = `<button class="page-btn" id="btn-prev" ${currentPage === 1 ? "disabled" : ""}>&lt;</button>`;

		for (let i = startPage; i <= endPage; i++) {
			html += `<button class="page-btn num-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
		}

		html += `<button class="page-btn" id="btn-next" ${currentPage === totalPages ? "disabled" : ""}>&gt;</button>`;
		paginationContainer.innerHTML = html;

		document.getElementById("btn-prev")?.addEventListener("click", () => {
			if (currentPage > 1) {
				currentPage--;
				void fetchAndRender();
				window.scrollTo(0, 0);
			}
		});
		document.getElementById("btn-next")?.addEventListener("click", () => {
			if (currentPage < totalPages) {
				currentPage++;
				void fetchAndRender();
				window.scrollTo(0, 0);
			}
		});
		paginationContainer.querySelectorAll(".num-btn").forEach((btn) => {
			btn.addEventListener("click", (e) => {
				currentPage = parseInt(e.target.dataset.page, 10);
				void fetchAndRender();
				window.scrollTo({ top: 0, behavior: "smooth" });
			});
		});
	}

	async function fetchAndRender() {
		grid.innerHTML = `<p class="listings-loading" style="grid-column:1/-1;text-align:center;padding:4rem;">Loading...</p>`;

		const search = searchInput?.value.trim() ?? "";
		const category =
			document.querySelector('input[name="category"]:checked')?.value ?? "all";
		const status =
			document.querySelector('input[name="status"]:checked')?.value ?? "all";
		const sort = sortSelect?.value ?? "newest";

		const sortMap = {
			newest: "newest",
			"price-low": "price_asc",
			"price-high": "price_desc",
		};

		try {
			const result = await listingsService.getAllListings({
				search: search || undefined,
				category: category !== "all" ? category : undefined,
				status: status !== "all" ? status : undefined,
				sort: sortMap[sort] ?? "newest",
				page: currentPage,
				per_page: perPage,
			});

			const { data = [], total = 0 } = result;
			currentListings = data;

			const totalPages = Math.ceil(total / perPage);

			countEl.textContent = `Showing ${data.length} of ${total} result${total !== 1 ? "s" : ""}`;
			renderPagination(totalPages);

			if (data.length === 0) {
				grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-muted);">No items found matching your filters.</div>`;
				return;
			}

			grid.innerHTML = data.map(renderListingCard).join("");
		} catch (error) {
			console.error("Failed to load listings:", error);
			grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-muted);">Could not load listings. Please try again.</div>`;
		}
	}

	grid.addEventListener("click", (e) => {
		const cartBtn = e.target.closest(".listing-card__add-btn");
		if (cartBtn) {
			e.stopPropagation();
			const listing = currentListings.find(
				(l) => String(l.id) === String(cartBtn.dataset.listingId),
			);
			if (!listing) return;

			const added = cartService.addToCart({
				id: listing.id,
				title: listing.title,
				price: listing.price,
				photo_url: listing.photo_url,
				seller_name: listing.seller_name,
			});

			showToast(
				added ? `"${listing.title}" added to cart.` : "Already in your cart.",
				added ? "success" : "error",
			);
			return;
		}

		const card = e.target.closest(".listing-card");
		if (card) {
			window.location.href = `/pages/listing-detail.html?id=${card.dataset.id}`;
		}
	});

	const handleFilterChange = () => {
		currentPage = 1;
		void fetchAndRender();
	};

	window.addEventListener("searchUpdated", handleFilterChange);
	sortSelect?.addEventListener("change", handleFilterChange);
	categoryRadios.forEach((r) => {
		r.addEventListener("change", handleFilterChange);
	});
	statusRadios.forEach((r) => {
		r.addEventListener("change", handleFilterChange);
	});

	await fetchAndRender();
}
