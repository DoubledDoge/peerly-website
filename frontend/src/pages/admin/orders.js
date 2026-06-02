import { AdminTable } from "@components/admin-table.js";
import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { showToast } from "@components/toast.js";
import { currencyService } from "@services/currency-service.js";
import { api } from "@utils/api.js";
import { requireRole } from "@utils/auth-guard.js";

await requireRole(["admin", "moderator"]);
initNavbar();
initFooter();
await initOrdersTable();

async function initOrdersTable() {
	const containerId = "orders-container";
	const container = document.getElementById(containerId);
	if (!container) return;

	const headers = ["Order ID & Date", "Buyer", "Listing", "Total", "Status"];

	let allOrders = [];

	try {
		const data = await api.get("/orders");
		allOrders = data.orders ?? [];
	} catch {
		container.innerHTML = `<p style="text-align:center;padding:2rem;color:var(--text-muted);">Failed to load orders.</p>`;
		return;
	}

	allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

	const renderTable = () => {
		AdminTable.render(containerId, headers, allOrders, (order) => {
			const formattedTotal = currencyService.formatPrice(order.price_at_sale);
			const orderDate = new Date(order.created_at).toLocaleDateString(
				undefined,
				{ year: "numeric", month: "short", day: "numeric" },
			);

			return `
				<tr>
					<td>
						<div style="font-weight:600;color:var(--text-colour);">#${order.id}</div>
						<div style="font-size:0.75rem;color:var(--text-muted);">${orderDate}</div>
					</td>
					<td>${order.buyer_name ?? order.buyer_email ?? "Unknown"}</td>
					<td>
						<a href="/pages/listing-detail.html?id=${order.listing_id}"
						   target="_blank"
						   style="color:var(--primary-accent);text-decoration:underline;">
							${order.listing_title ?? `Listing #${order.listing_id}`}
						</a>
					</td>
					<td style="font-weight:600;">${formattedTotal}</td>
					<td>
						<select class="status-select" data-id="${order.id}">
							<option value="pending"   ${order.status === "pending" ? "selected" : ""}>Pending</option>
							<option value="confirmed" ${order.status === "confirmed" ? "selected" : ""}>Confirmed</option>
							<option value="completed" ${order.status === "completed" ? "selected" : ""}>Completed</option>
							<option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Cancelled</option>
						</select>
					</td>
				</tr>
			`;
		});
	};

	container.addEventListener("change", async (e) => {
		if (!e.target.classList.contains("status-select")) return;

		const orderId = e.target.dataset.id;
		const newStatus = e.target.value;

		try {
			await api.put(`/orders?id=${orderId}`, { status: newStatus });

			const order = allOrders.find((o) => String(o.id) === String(orderId));
			if (order) order.status = newStatus;

			showToast(`Order #${orderId} marked as ${newStatus}.`, "success");
		} catch (error) {
			showToast(error.message || "Failed to update order status.", "error");
			renderTable();
		}
	});

	renderTable();
}
