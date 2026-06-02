import { AdminTable } from "@components/admin-table.js";
import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { showToast } from "@components/toast.js";
import { currencyService } from "@services/currency-service.js";
import { listingsService } from "@services/listings-service.js";
import { api } from "@utils/api.js";
import { requireRole } from "@utils/auth-guard.js";
import { url } from "@utils/base.js";

document.addEventListener("DOMContentLoaded", async () => {
	await requireRole(["admin", "moderator"]);
	initNavbar();
	initFooter();
	await initAdminListingsTable();
});

async function initAdminListingsTable() {
	const containerId = "listings-container";
	const container = document.getElementById(containerId);
	if (!container) return;

	const headers = ["Product", "Seller", "Price", "Status", "Actions"];

	let allListings = [];
	try {
		const result = await listingsService.getAllListings({
			status: "all",
			sort: "newest",
			per_page: 100,
		});
		allListings = result.data ?? [];
	} catch {
		container.innerHTML = `<p style="text-align:center;padding:2rem;color:var(--text-muted);">Failed to load listings.</p>`;
		return;
	}

	const renderTable = () => {
		AdminTable.render(containerId, headers, allListings, (listing) => {
			const price = currencyService.formatPrice(listing.price);
			const isRemoved = listing.status === "removed";
			const seller = listing.seller_name || listing.seller_email || "Unknown";

			return `
				<tr>
					<td>
						<div class="listing-preview">
							<img
								src="${listing.photo_url || url("/assets/icons/camera.svg")}"
								alt="Thumb"
								class="listing-thumb"
								loading="lazy"
							/>
							<div>
								<a href="${url("/pages/listing-detail.html")}?id=${listing.id}"
								   target="_blank"
								   style="font-weight:500;color:var(--text-colour);text-decoration:none;">
									${listing.title}
								</a>
								<div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">
									ID: ${listing.id}
								</div>
							</div>
						</div>
					</td>
					<td>${seller}</td>
					<td style="font-weight:600;">${price}</td>
					<td>
						<span class="status-badge ${listing.status}">${listing.status}</span>
					</td>
					<td>
						${
							isRemoved
								? `<button class="btn btn-outline btn-sm btn-restore"
								   data-id="${listing.id}"
								   style="color:var(--color-success);border-color:var(--color-success-bg);">
								   Restore
							   </button>`
								: `<button class="btn btn-outline btn-sm btn-remove"
								   data-id="${listing.id}"
								   style="color:var(--color-error);border-color:var(--color-error-bg);">
								   Remove
							   </button>`
						}
					</td>
				</tr>
			`;
		});
	};

	container.addEventListener("click", async (e) => {
		const removeBtn = e.target.closest(".btn-remove");
		const restoreBtn = e.target.closest(".btn-restore");

		if (removeBtn) {
			if (!confirm("Remove this listing? It will be hidden from the public."))
				return;

			const id = removeBtn.dataset.id;
			try {
				await api.delete(`/listings/detail?id=${id}`);
				const listing = allListings.find((l) => String(l.id) === String(id));
				if (listing) listing.status = "removed";
				showToast("Listing removed.", "success");
				renderTable();
			} catch (error) {
				showToast(error.message || "Failed to remove listing.", "error");
			}
		}

		if (restoreBtn) {
			const id = restoreBtn.dataset.id;
			try {
				await api.put(`/listings/detail?id=${id}`, { status: "active" });
				const listing = allListings.find((l) => String(l.id) === String(id));
				if (listing) listing.status = "active";
				showToast("Listing restored.", "success");
				renderTable();
			} catch (error) {
				showToast(error.message || "Failed to restore listing.", "error");
			}
		}
	});

	renderTable();
}
