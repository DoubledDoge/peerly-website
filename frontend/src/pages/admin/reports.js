import { AdminTable } from "@components/admin-table.js";
import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { showToast } from "@components/toast.js";
import { api } from "@utils/api.js";
import { requireRole } from "@utils/auth-guard.js";
import { url } from "@utils/base.js";

await requireRole(["admin", "moderator"]);
initNavbar();
initFooter();
await initReportsTable();

async function initReportsTable() {
	const containerId = "reports-container";
	const container = document.getElementById(containerId);
	if (!container) return;

	const headers = ["Listing", "Reported By", "Reason", "Status", "Actions"];

	let allReports = [];

	try {
		const data = await api.get("/reports?status=all");
		allReports = data.data ?? [];
	} catch {
		container.innerHTML = `<p style="text-align:center;padding:2rem;color:var(--text-muted);">Failed to load reports.</p>`;
		return;
	}

	const renderTable = () => {
		AdminTable.render(containerId, headers, allReports, (report) => {
			const isOpen = report.status === "open";

			return `
				<tr>
					<td style="font-weight:500;">
						<a href="${url("/pages/listing-detail.html")}?id=${report.listing_id}"
						   target="_blank"
						   style="color:var(--primary-accent);text-decoration:underline;">
							${report.listing_title ?? `Listing #${report.listing_id}`}
						</a>
					</td>
					<td>${report.reporter_name ?? report.reporter_email ?? "Unknown"}</td>
					<td style="max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
					    title="${report.reason}">
						${report.reason}
					</td>
					<td>
						<span class="status-badge ${report.status}"
						      style="font-size:0.75rem;padding:0.25rem 0.75rem;border-radius:var(--radius-full);text-transform:uppercase;font-weight:700;">
							${report.status}
						</span>
					</td>
					<td class="report-actions">
						${
							isOpen
								? `<button class="btn btn-outline btn-sm btn-dismiss"
								   data-report-id="${report.id}"
								   style="margin-right:0.5rem;">
								   Dismiss
							   </button>
							   <button class="btn btn-sm btn-resolve-delete"
								   data-report-id="${report.id}"
								   data-listing-id="${report.listing_id}"
								   style="background-color:var(--color-error);border-color:var(--color-error);color:#fff;">
								   Remove Listing
							   </button>`
								: `<span style="color:var(--text-muted);font-size:0.875rem;">
								   ${report.status}
							   </span>`
						}
					</td>
				</tr>
			`;
		});
	};

	container.addEventListener("click", async (e) => {
		const dismissBtn = e.target.closest(".btn-dismiss");
		const resolveDeleteBtn = e.target.closest(".btn-resolve-delete");

		if (dismissBtn) {
			const reportId = dismissBtn.dataset.reportId;
			try {
				await api.put(`/reports?id=${reportId}`, { status: "dismissed" });

				const report = allReports.find(
					(r) => String(r.id) === String(reportId),
				);
				if (report) report.status = "dismissed";

				showToast("Report dismissed.", "success");
				renderTable();
			} catch (error) {
				showToast(error.message || "Failed to dismiss report.", "error");
			}
		}

		if (resolveDeleteBtn) {
			if (!confirm("Remove this listing and resolve the report?")) return;

			const reportId = resolveDeleteBtn.dataset.reportId;
			const listingId = resolveDeleteBtn.dataset.listingId;

			try {
				await api.delete(`/listings/detail?id=${listingId}`);
				await api.put(`/reports?id=${reportId}`, { status: "resolved" });

				const report = allReports.find(
					(r) => String(r.id) === String(reportId),
				);
				if (report) report.status = "resolved";

				showToast("Listing removed and report resolved.", "success");
				renderTable();
			} catch (error) {
				showToast(error.message || "Failed to resolve report.", "error");
			}
		}
	});

	renderTable();
}
