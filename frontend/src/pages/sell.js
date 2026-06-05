import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { showToast } from "@components/toast.js";
import { listingsService } from "@services/listings-service.js";
import { requireAuth } from "@utils/auth-guard.js";
import { url } from "@utils/base.js";

initNavbar();
initFooter();
initSellForm();

function initSellForm() {
	const form = document.getElementById("sell-form");
	const photoInput = document.getElementById("listing-photo");
	const dropzone = document.getElementById("photo-dropzone");
	const uploadPrompt = document.getElementById("upload-prompt");
	const photoPreviewContainer = document.getElementById("photo-preview");
	const currencySymbol = document.getElementById("currency-symbol");

	if (!form) return;

	if (currencySymbol) {
		currencySymbol.textContent = "R";
	}

	let base64ImageString = null;

	dropzone?.addEventListener("click", () => {
		photoInput.click();
	});

	photoInput?.addEventListener("change", (e) => {
		const file = e.target.files?.[0];

		if (file) {
			const reader = new FileReader();

			reader.onload = (event) => {
				base64ImageString = event.target.result;

				photoPreviewContainer.innerHTML = "";

				const dynamicImg = document.createElement("img");
				dynamicImg.src = base64ImageString;
				dynamicImg.alt = "Product Preview";
				dynamicImg.id = "preview-img";
				dynamicImg.title = "Click to change photo";

				photoPreviewContainer.appendChild(dynamicImg);

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

		if (!base64ImageString) {
			showToast("Please select a product photo.", "error");
			return;
		}

		btn.textContent = "Posting Item...";
		btn.disabled = true;

		const formData = new FormData(form);
		const price = parseFloat(String(formData.get("price")));
		const title = formData.get("title")?.toString().trim();
		const category = formData.get("category");
		const description = formData.get("description")?.toString().trim();

		if (!title) {
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
		if (!category) {
			showToast("Please select a category.", "error");
			btn.textContent = originalText;
			btn.disabled = false;
			return;
		}

		const payload = {
			title: title,
			description: description || "",
			price: price,
			category: category,
			photo_url: base64ImageString,
		};

		try {
			await listingsService.createListing(payload);

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
