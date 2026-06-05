import placeholderUrl from "@assets/placeholder.png";
import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { renderStarRating } from "@components/star-rating.js";
import { showToast } from "@components/toast.js";
import { authService } from "@services/auth-service.js";
import { cartService } from "@services/cart-service.js";
import { currencyService } from "@services/currency-service.js";
import { listingsService } from "@services/listings-service.js";
import { api } from "@utils/api.js";

initNavbar();
initFooter();
await initProductDetail();

async function initProductDetail() {
	const params = new URLSearchParams(window.location.search);
	const productId = params.get("id");
	const errorState = document.getElementById("error-state");
	const productView = document.getElementById("product-view");

	if (!productId) {
		errorState.style.display = "block";
		return;
	}

	let product;
	try {
		product = await listingsService.getListingById(productId);
	} catch {
		errorState.style.display = "block";
		return;
	}

	if (!product) {
		errorState.style.display = "block";
		return;
	}

	document.getElementById("detail-image").src =
		product.photo_url || placeholderUrl;
	document.getElementById("detail-title").textContent = product.title;
	document.getElementById("detail-description").textContent =
		product.description;
	document.getElementById("detail-category").textContent = product.category;
	document.getElementById("detail-price").textContent =
		currencyService.formatPrice(product.price);
	document.getElementById("seller-name").textContent =
		product.seller_name || "Anonymous Seller";

	const sellerCityEl = document.getElementById("seller-city");
	if (sellerCityEl)
		sellerCityEl.textContent = product.seller_city || "South Africa";

	const sellerBioEl = document.getElementById("seller-bio");
	if (sellerBioEl)
		sellerBioEl.textContent =
			product.seller_bio || "This seller hasn't added a bio yet.";

	document.getElementById("seller-rating-container").innerHTML =
		renderStarRating(product.seller_rating ?? 0);

	const isSold = product.status === "sold";
	const statusBadge = document.getElementById("detail-status");
	statusBadge.className = `status-badge ${product.status}`;
	statusBadge.textContent = isSold ? "Sold Out" : "Available";

	const contactBtn = document.getElementById("btn-contact-seller");
	if (contactBtn) {
		if (product.seller_email) {
			const subject = encodeURIComponent(`Inquiry: ${product.title}`);
			contactBtn.href = `mailto:${product.seller_email}?subject=${subject}`;
		} else {
			contactBtn.style.display = "none";
		}
	}

	const cartBtn = document.getElementById("btn-add-to-cart");
	if (isSold) {
		cartBtn.textContent = "Item Unavailable";
		cartBtn.classList.add("btn-disabled");
		cartBtn.disabled = true;
	} else {
		cartBtn.addEventListener("click", () => {
			const added = cartService.addToCart({
				id: product.id,
				title: product.title,
				price: product.price,
				photo_url: product.photo_url,
				seller_name: product.seller_name,
			});
			showToast(
				added ? "Item added to cart!" : "Item is already in your cart.",
				added ? "success" : "error",
			);
		});
	}

	initReportForm(product);
	await initReviews(product.id, product.seller_id);
	productView.style.display = "grid";
}

function initReportForm(product) {
	const reportBtn = document.getElementById("btn-report-listing");
	const reportFormContainer = document.getElementById("report-form-container");
	const cancelReportBtn = document.getElementById("btn-cancel-report");
	const submitReportBtn = document.getElementById("btn-submit-report");
	const reportReasonInput = document.getElementById("report-reason");

	if (!reportBtn || !reportFormContainer) return;

	reportBtn.addEventListener("click", () => {
		if (!authService.isAuthenticated()) {
			showToast("You must be logged in to report a listing.", "error");
			return;
		}
		reportBtn.style.display = "none";
		reportFormContainer.style.display = "block";
		reportReasonInput.focus();
	});

	cancelReportBtn.addEventListener("click", () => {
		reportFormContainer.style.display = "none";
		reportBtn.style.display = "inline-flex";
		reportReasonInput.value = "";
	});

	submitReportBtn.addEventListener("click", async () => {
		const reason = reportReasonInput.value.trim();
		if (!reason) {
			showToast("Please provide a reason for the report.", "error");
			return;
		}

		submitReportBtn.textContent = "Submitting...";
		submitReportBtn.disabled = true;

		try {
			await api.post("/reports", { listing_id: product.id, reason });

			reportFormContainer.style.display = "none";
			reportBtn.innerHTML = "✅ Reported";
			reportBtn.disabled = true;
			reportBtn.style.display = "inline-flex";
			showToast("Listing reported to administrators.", "success");
		} catch (error) {
			showToast(error.message || "Failed to submit report.", "error");
			submitReportBtn.textContent = "Submit Report";
			submitReportBtn.disabled = false;
		}
	});
}

async function initReviews(listingId, sellerId) {
	const reviewsList = document.getElementById("reviews-list");
	const reviewForm = document.getElementById("review-form");

	if (!reviewsList) return;

	const escapeHTML = (str) => {
		if (!str) return "";
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	};

	const renderReview = (r) => {
		const reviewerName = escapeHTML(r.reviewer_name ?? r.name ?? "Anonymous");
		const comment = escapeHTML(r.comment ?? "");
		return `
			<div class="review-card">
				<div class="review-header">
					<strong>${reviewerName}</strong>
					${renderStarRating(r.rating)}
				</div>
				<p>${comment}</p>
			</div>
		`;
	};

	try {
		const data = await api.get(`/reviews?listing_id=${listingId}`);
		const reviews = data.reviews ?? [];
		reviewsList.innerHTML = reviews.length
			? reviews.map(renderReview).join("")
			: `<p class="reviews-empty">No reviews yet. Be the first!</p>`;
	} catch {
		reviewsList.innerHTML = `<p class="reviews-empty">Could not load reviews.</p>`;
	}

	reviewForm?.addEventListener("submit", async (e) => {
		e.preventDefault();

		if (!authService.isAuthenticated()) {
			showToast("You must be logged in to leave a review.", "error");
			return;
		}

		const rating = parseInt(document.getElementById("review-rating").value, 10);
		const comment = document.getElementById("review-comment").value.trim();

		if (!rating || !comment) {
			showToast("Please provide a rating and comment.", "error");
			return;
		}

		const btn = reviewForm.querySelector('button[type="submit"]');
		btn.disabled = true;
		btn.textContent = "Submitting...";

		try {
			const data = await api.post("/reviews", {
				listing_id: listingId,
				seller_id: sellerId,
				rating,
				comment,
			});

			const newCard = document.createElement("div");
			newCard.innerHTML = renderReview(data.review ?? { rating, comment });
			reviewsList.prepend(newCard.firstElementChild);

			reviewForm.reset();
			showToast("Review submitted!", "success");
		} catch (error) {
			showToast(error.message || "Failed to submit review.", "error");
		} finally {
			btn.disabled = false;
			btn.textContent = "Submit Review";
		}
	});
}
