import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { showToast } from "@components/toast.js";
import { listingsService } from "@services/listings-service.js";
import { requireAuth } from "@utils/auth-guard.js";

document.addEventListener("DOMContentLoaded", () => {
	requireAuth();
	initNavbar();
	initFooter();
	initSellForm();
});

function initSellForm() {
	const form = document.getElementById("sell-form");
	const photoUrlInput = document.getElementById("listing-photo-url");
	const previewImg = document.getElementById("preview-img");

	if (!form) return;

	photoUrlInput?.addEventListener("input", () => {
		const url = photoUrlInput.value.trim();

		if (previewImg) {
			let isSafe = false;
			let safeUrl = "";

			if (url) {
				try {
					const parsedUrl = new URL(url);
					if (
						parsedUrl.protocol === "http:" ||
						parsedUrl.protocol === "https:"
					) {
						isSafe = true;
						safeUrl = parsedUrl.href;
					}
				} catch (error) {
					console.warn("Error parsing URL:", error);
				}
			}

			if (isSafe) {
				previewImg.src = safeUrl;
				previewImg.hidden = false;
			} else {
				previewImg.src = "";
				previewImg.hidden = true;
			}
		}
	});

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const btn = form.querySelector('button[type="submit"]');
		const originalText = btn.textContent;
		btn.textContent = "Posting Item...";
		btn.disabled = true;

		const formData = new FormData(form);
		const data = Object.fromEntries(formData.entries());
		const price = parseFloat(typeof data.price === "string" ? data.price : "");

		if (!data.title?.trim()) {
			showToast("Please enter a title.", "error");
			btn.textContent = originalText;
			btn.disabled = false;
			return;
		}
		if (Number.isNaN(price) || price <= 0) {
			showToast("Please enter a valid price.", "error");
			btn.textContent = originalText;
			btn.disabled = false;
			return;
		}
		if (!data.category) {
			showToast("Please select a category.", "error");
			btn.textContent = originalText;
			btn.disabled = false;
			return;
		}

		const payload = {
			title: data.title.trim(),
			description: data.description?.trim() || "",
			price: price,
			category: data.category,
			photo_url:
				typeof data.photo_url === "string"
					? data.photo_url.trim() || null
					: null,
		};

		try {
			await listingsService.createListing(payload);
			showToast("Listing posted successfully!", "success");

			setTimeout(() => {
				window.location.href = "/pages/profile.html";
			}, 1000);
		} catch (error) {
			showToast(error.message || "Failed to post listing.", "error");
			btn.textContent = originalText;
			btn.disabled = false;
		}
	});
}
