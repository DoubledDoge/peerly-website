import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { showToast } from "@components/toast.js";
import { listingsService } from "@services/listings-service.js";
import { requireAuth } from "@utils/auth-guard.js";
import { url } from "@utils/base.js";

requireAuth();
initNavbar();
initFooter();
initSellForm();

function initSellForm() {
	const form = document.getElementById("sell-form");
	const photoInput = document.getElementById("listing-photo");
	const dropzone = document.getElementById("photo-dropzone");
	const previewImg = document.getElementById("preview-img");
	const uploadPrompt = document.getElementById("upload-prompt");
	const currencySymbol = document.getElementById("currency-symbol");
	const photoPreviewContainer = document.getElementById("photo-preview");

	if (currencySymbol) {
		currencySymbol.textContent = "R";
	}

	if (!form) return;

	dropzone?.addEventListener("click", () => {
		photoInput.click();
	});

	photoInput?.addEventListener("change", (e) => {
		const file = e.target.files;
		if (file) {
			const reader = new FileReader();

			reader.onload = (event) => {
				previewImg.src = event.target.result;
				previewImg.style.display = "block";
				photoPreviewContainer.style.display = "flex";
				uploadPrompt.style.display = "none";
			};

			reader.readAsDataURL(file);
		}
	});

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const btn = form.querySelector('button[type="submit"]');
		const originalText = btn.textContent;
		btn.textContent = "Posting Item...";
		btn.disabled = true;

		const formData = new FormData(form);
		const price = parseFloat(String(formData.get("price")));

		if (!formData.get("title")?.name && !formData.get("title").trim()) {
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

		try {
			await listingsService.createListing(formData);

			showToast("Listing posted successfully!", "success");

			setTimeout(() => {
				window.location.href = url("/pages/profile.html");
			}, 1000);
		} catch (error) {
			showToast(error.message || "Failed to post listing.", "error");
			btn.textContent = originalText;
			btn.disabled = false;
		}
	});
}
