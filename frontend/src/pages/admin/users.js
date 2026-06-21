import { AdminTable } from "@components/admin-table.js";
import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { showToast } from "@components/toast.js";
import { authService } from "@services/auth-service.js";
import { api } from "@utils/api.js";
import { requireRole } from "@utils/auth-guard.js";

await requireRole(["admin"]);
initNavbar();
initFooter();
await initUsersTable();

async function initUsersTable() {
	const containerId = "users-container";
	const container = document.getElementById(containerId);
	if (!container) return;

	const headers = ["Name", "Email", "City", "Joined", "Role", "Actions"];
	const sessionUser = authService.getUser();

	let allUsers = [];
	try {
		const result = await api.get("/users");
		allUsers = result.data ?? [];
	} catch {
		container.innerHTML = `<p style="text-align:center;padding:2rem;color:var(--text-muted);">Failed to load users.</p>`;
		return;
	}

	const renderTable = () => {
		AdminTable.render(containerId, headers, allUsers, (user) => {
			const isSelf = String(user.id) === String(sessionUser?.id);
			const isInactive = user.is_active === 0 || user.is_active === false;

			const joinDate = user.created_at
				? new Date(user.created_at).toLocaleDateString(undefined, {
						year: "numeric",
						month: "short",
						day: "numeric",
					})
				: "—";

			return `
				<tr style="${isInactive ? "opacity:0.5;" : ""}">
					<td class="cell-strong">${user.name}</td>
					<td>${user.email}</td>
					<td>${user.city || "—"}</td>
					<td class="cell-muted">${joinDate}</td>
					<td>
						<select class="role-select" data-id="${user.id}" ${isSelf ? "disabled" : ""}>
							<option value="buyer"     ${user.role === "buyer" ? "selected" : ""}>Buyer</option>
							<option value="seller"    ${user.role === "seller" ? "selected" : ""}>Seller</option>
							<option value="moderator" ${user.role === "moderator" ? "selected" : ""}>Moderator</option>
							<option value="admin"     ${user.role === "admin" ? "selected" : ""}>Admin</option>
						</select>
					</td>
					<td>
						${
							isSelf
								? `<span class="cell-muted">You</span>`
								: isInactive
									? `<button class="btn btn-outline btn-sm btn-unban"
									   data-id="${user.id}"
									   style="color:var(--color-success);border-color:var(--color-success-bg);">
									   Unban
								   </button>`
									: `<button class="btn btn-outline btn-sm btn-ban"
									   data-id="${user.id}"
									   style="color:var(--color-error);border-color:var(--color-error-bg);">
									   Ban
								   </button>`
						}
					</td>
				</tr>
			`;
		});
	};

	container.addEventListener("change", async (e) => {
		if (!e.target.classList.contains("role-select")) return;

		const userId = e.target.dataset.id;
		const newRole = e.target.value;

		try {
			await api.put(`/users?id=${userId}`, { role: newRole });

			const user = allUsers.find((u) => String(u.id) === String(userId));
			if (user) user.role = newRole;

			showToast(`Role updated to ${newRole}.`, "success");
		} catch (error) {
			showToast(error.message || "Failed to update role.", "error");
			renderTable();
		}
	});

	container.addEventListener("click", async (e) => {
		const banBtn = e.target.closest(".btn-ban");
		const unbanBtn = e.target.closest(".btn-unban");

		if (banBtn) {
			if (!confirm("Ban this user? They will no longer be able to log in."))
				return;

			const userId = banBtn.dataset.id;
			try {
				await api.put(`/users?id=${userId}`, { is_active: false });

				const user = allUsers.find((u) => String(u.id) === String(userId));
				if (user) user.is_active = false;

				showToast("User banned.", "success");
				renderTable();
			} catch (error) {
				showToast(error.message || "Failed to ban user.", "error");
			}
		}

		if (unbanBtn) {
			const userId = unbanBtn.dataset.id;
			try {
				await api.put(`/users?id=${userId}`, { is_active: true });

				const user = allUsers.find((u) => String(u.id) === String(userId));
				if (user) user.is_active = true;

				showToast("User unbanned.", "success");
				renderTable();
			} catch (error) {
				showToast(error.message || "Failed to unban user.", "error");
			}
		}
	});

	renderTable();
}
