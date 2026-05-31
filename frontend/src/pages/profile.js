import { initFooter } from "@components/footer.js";
import { renderListingCard } from "@components/listing-card.js";
import { initNavbar } from "@components/navbar.js";
import { showToast } from "@components/toast.js";
import { authService } from "@services/auth-service.js";
import { listingsService } from "@services/listings-service.js";
import { api } from "@utils/api.js";
import { requireAuth } from "@utils/auth-guard.js";

document.addEventListener("DOMContentLoaded", async () => {
	requireAuth();
	initNavbar();
	initFooter();
	await initProfilePage();
});

async function initProfilePage() {
	const user = authService.getUser();
	if (!user) return;

	initProfileForm(user);
	await renderUserListings(user);
}

function initProfileForm(user) {
	const form = document.getElementById("profile-form");
	const logoutBtn = document.getElementById("btn-logout");
	const roleBadgeContainer = document.getElementById("role-badge-container");

	if (!form) return;

	form.elements.name.value = user.name || "";
	form.elements.email.value = user.email || "";
	if (form.elements.bio) form.elements.bio.value = user.bio || "";
	if (form.elements.city) form.elements.city.value = user.city || "";

	if (
		roleBadgeContainer &&
		(user.role === "admin" || user.role === "moderator")
	) {
		const label = user.role.charAt(0).toUpperCase() + user.role.slice(1);
		roleBadgeContainer.innerHTML = `
			<span class="role-badge ${user.role}" title="${label} Privileges">${user.role}</span>
		`;
	}

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		const btn = form.querySelector('button[type="submit"]');
		const originalText = btn.textContent;
		btn.textContent = "Saving...";
		btn.disabled = true;

		const updates = {
			name: form.elements.name.value.trim(),
			city: form.elements.city?.value.trim() || "",
			bio: form.elements.bio?.value.trim() || "",
		};

		try {
			await api.put(`/users?id=${user.id}`, updates);

			authService.updateUserCache(updates);

			btn.textContent = "Saved!";
			showToast("Profile updated successfully.", "success");
		} catch (error) {
			showToast(error.message || "Failed to save profile.", "error");
		} finally {
			setTimeout(() => {
				btn.textContent = originalText;
				btn.disabled = false;
			}, 1500);
		}
	});

	logoutBtn?.addEventListener("click", async () => {
		await authService.logout();
		window.location.href = "/";
	});
}

async function renderUserListings(user) {
	const section = document.getElementById("user-listings-section");
	const grid = document.getElementById("user-listings-grid");

	if (!section || !grid) return;

	try {
		const result = await listingsService.getUserListings(user.id, "all");
		const listings = result.data ?? [];

		if (listings.length === 0) return;

		section.style.display = "block";
		grid.innerHTML = listings.map(renderListingCard).join("");

		grid.addEventListener("click", async (e) => {
			const deleteBtn = e.target.closest("[data-delete-listing]");
			if (!deleteBtn) return;

			const id = deleteBtn.dataset.deleteListing;
			if (!confirm("Remove this listing?")) return;

			try {
				await listingsService.deleteListing(id);
				deleteBtn.closest(".listing-card").remove();
				showToast("Listing removed.", "success");
			} catch (error) {
				showToast(error.message || "Could not remove listing.", "error");
			}
		});
	} catch (error) {
		console.error("Failed to load user listings:", error);
	}
}
