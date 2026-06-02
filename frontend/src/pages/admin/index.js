import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { requireRole } from "@utils/auth-guard.js";

await requireRole(["admin", "moderator"]);
initNavbar();
initFooter();
