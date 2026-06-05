import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { authService } from "@services/auth-service.js";
import { api } from "@utils/api.js";
import { requireRole } from "@utils/auth-guard.js";

await requireRole(["admin", "moderator"]);
initNavbar();
initFooter();
await setupDashboard();

async function setupDashboard() {
	const user = authService.getUser();
	if (!user) return;

	document.getElementById("admin-name").textContent = user.name || "User";
	document.getElementById("admin-role-badge").textContent =
		user.role.toUpperCase();

	document.querySelectorAll("#admin-navigation a").forEach((link) => {
		const allowed = link.dataset.allowedRoles.split(",");
		if (!allowed.includes(user.role)) {
			link.style.display = "none";
		}
	});

	const isAdmin = user.role === "admin";

	const [usersResult, listingsResult, ordersResult, reportsResult] =
		await Promise.allSettled([
			isAdmin ? api.get("/users?per_page=1") : Promise.resolve(null),
			api.get("/listings?status=active&per_page=1"),
			api.get("/orders?per_page=1"),
			api.get("/reports?status=open&per_page=1"),
		]);

	if (isAdmin && usersResult.status === "fulfilled" && usersResult.value) {
		setMetric("metric-users-value", usersResult.value.total);
	} else if (!isAdmin) {
		document.getElementById("metric-users").style.display = "none";
	} else {
		setMetric("metric-users-value", "—");
	}

	if (listingsResult.status === "fulfilled" && listingsResult.value) {
		setMetric("metric-listings-value", listingsResult.value.total);
	} else {
		setMetric("metric-listings-value", "—");
	}

	if (ordersResult.status === "fulfilled" && ordersResult.value) {
		const count =
			ordersResult.value.total ?? ordersResult.value.orders?.length ?? "—";
		setMetric("metric-orders-value", count);
	} else {
		setMetric("metric-orders-value", "—");
	}

	if (reportsResult.status === "fulfilled" && reportsResult.value) {
		const open = reportsResult.value.total ?? 0;
		setMetric("metric-reports-value", open);

		if (open > 0) {
			document
				.getElementById("metric-reports")
				?.classList.add("metric-card--alert");

			const badge = document.getElementById("report-badge");
			if (badge) {
				badge.textContent = open > 99 ? "99+" : String(open);
				badge.style.display = "inline-flex";
			}
		}
	} else {
		setMetric("metric-reports-value", "—");
	}
}

function setMetric(id, value) {
	const el = document.getElementById(id);
	if (!el) return;
	el.textContent = typeof value === "number" ? value.toLocaleString() : value;
	el.classList.remove("metric-value--loading");
}
