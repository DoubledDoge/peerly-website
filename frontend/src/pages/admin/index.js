import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { requireRole } from "@utils/auth-guard.js";

document.addEventListener("DOMContentLoaded", async () => {
	await requireRole(["admin", "moderator"]);
	initNavbar();
	initFooter();
});
