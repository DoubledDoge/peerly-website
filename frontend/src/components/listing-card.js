import trashIconUrl from "@assets/icons/trash.svg?raw";
import placeholderUrl from "@assets/placeholder.png";
import { renderStarRating } from "@components/star-rating.js";
import { showToast } from "@components/toast.js";
import { authService } from "@services/auth-service.js";
import { cartService } from "@services/cart-service.js";
import { currencyService } from "@services/currency-service.js";
import { listingsService } from "@services/listings-service.js";
import { url } from "@utils/base.js";

export function renderListingCard(listing) {
	const isSold = listing.status === "sold";
	const photoSrc = listing.photo_url || placeholderUrl;
	const location = listing.seller_city || "";

	const currentUser = authService.getUser();
	const isOwner =
		currentUser && String(currentUser.id) === String(listing.seller_id);

	return `
		<article class="listing-card ${isSold ? "listing-card_sold" : ""}"
		         data-id="${listing.id}">
			${
				isOwner
					? `
				<button
					class="listing-card_delete"
					data-listing-id="${listing.id}"
					aria-label="Delete ${listing.title}"
					title="Delete listing"
				>
					${trashIconUrl}
				</button>
			`
					: ""
			}

			<a href="${url("/pages/listing-detail.html")}?id=${listing.id}" class="listing-card_media">
				<img
					src="${photoSrc}"
					alt="${listing.title}"
					loading="lazy"
				/>
				${isSold ? `<span class="listing-card_badge">Sold</span>` : ""}
			</a>

			<a href="${url("/pages/listing-detail.html")}?id=${listing.id}" class="listing-card_body">
				<h3 class="listing-card_title">${listing.title}</h3>
				<p class="listing-card_price">${currencyService.formatPrice(listing.price)}</p>

				<div class="listing-card_seller">
					<span class="listing-card_seller-name">${listing.seller_name ?? "Unknown"}</span>
					${location ? `<span class="listing-card_location">${location}</span>` : ""}
					${renderStarRating(listing.seller_rating ?? 0)}
				</div>
			</a>

			${
				!isSold
					? `
				<button
					class="btn btn-primary btn-sm listing-card_add-btn"
					style="text-align: center;"
					data-listing-id="${listing.id}"
					aria-label="Add ${listing.title} to cart"
				>
					Add to Cart
				</button>
			`
					: `
				<button class="btn btn-sm listing-card_sold-btn" style="text-align: center;" disabled>Sold</button>
			`
			}
		</article>
	`;
}

export function renderListingGrid(containerId, listings) {
	const container = document.getElementById(containerId);
	if (!container) return;

	if (!listings || listings.length === 0) {
		container.innerHTML = `
			<p class="listings-empty">No listings found.</p>
		`;
		return;
	}

	container.innerHTML = listings.map(renderListingCard).join("");

	container.addEventListener("click", (e) => {
		const deleteBtn = e.target.closest(".listing-card_delete");
		if (deleteBtn) {
			e.preventDefault();
			e.stopPropagation();
			handleDeleteListing(deleteBtn, listings).then();
			return;
		}

		const btn = e.target.closest(".listing-card_add-btn");
		if (!btn) return;

		const listingId = btn.dataset.listingId;
		const listing = listings.find((l) => String(l.id) === String(listingId));
		if (!listing) return;

		const added = cartService.addToCart({
			id: listing.id,
			title: listing.title,
			price: listing.price,
			photo_url: listing.photo_url,
			seller_name: listing.seller_name,
		});

		if (added) {
			showToast(`"${listing.title}" added to cart.`, "success");
		} else {
			showToast("This item is already in your cart.", "error");
		}
	});
}

async function handleDeleteListing(deleteBtn, listings) {
	const listingId = deleteBtn.dataset.listingId;
	const listing = listings.find((l) => String(l.id) === String(listingId));
	if (!listing) return;

	if (!confirm(`Delete "${listing.title}"? This can't be undone.`)) return;

	deleteBtn.disabled = true;

	try {
		await listingsService.deleteListing(listingId);
		deleteBtn.closest(".listing-card")?.remove();
		showToast("Listing deleted.", "success");
	} catch (error) {
		showToast(error.message || "Could not delete listing.", "error");
		deleteBtn.disabled = false;
	}
}

export async function loadFeaturedListings() {
	const grid = document.getElementById("featured-grid");
	if (!grid) return;

	grid.innerHTML = `<p class="listings-loading">Loading listings...</p>`;

	try {
		const result = await listingsService.getAllListings({
			status: "active",
			sort: "newest",
			per_page: 8,
		});

		renderListingGrid("featured-grid", result.data ?? []);
	} catch (error) {
		console.error("Failed to load featured listings:", error);
		grid.innerHTML = `
			<p class="listings-error">Could not load listings at this time. Please try again later.</p>
		`;
	}
}

export async function loadHeroPreviewListings() {
	const grid = document.getElementById("hero-preview-grid");
	if (!grid) return;

	grid.innerHTML = `<p class="listings-loading">Loading previews...</p>`;

	try {
		const result = await listingsService.getAllListings({
			status: "active",
			per_page: 10,
		});

		let listings = result.data ?? [];

		listings = listings.sort(() => 0.5 - Math.random()).slice(0, 3);

		renderListingGrid("hero-preview-grid", listings);
	} catch (error) {
		console.error("Failed to load preview listings:", error);
		grid.innerHTML = ``;
	}
}
