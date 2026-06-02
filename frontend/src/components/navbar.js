import { authService } from "@services/auth-service.js";
import { cartService } from "@services/cart-service.js";
import { url } from "@utils/base.js";
import { initThemeToggle } from "./theme-toggle.js";

const navLinks = [
	{ href: url("/"), label: "Home" },
	{ href: url("/pages/listings.html"), label: "Browse" },
	{ href: url("/pages/sell.html"), label: "Sell" },
];

function isCurrentPage(href) {
	const path = window.location.pathname;
	const base = import.meta.env.BASE_URL.replace(/\/$/, "");
	const stripped = path.replace(base, "") || "/";
	if (href === url("/")) return stripped === "/" || stripped === "/index.html";
	return stripped.includes(href.replace(url("/"), "/").replace(".html", ""));
}

function renderNavLinks() {
	return navLinks
		.map(
			({ href, label }) => `
			<li>
				<a href="${href}" ${isCurrentPage(href) ? 'aria-current="page"' : ""}>${label}</a>
			</li>
		`,
		)
		.join("");
}

function renderAuthAction() {
	const user = authService.getUser();
	if (user) {
		const adminLink =
			user.role === "admin" || user.role === "moderator"
				? `<a href="${url("/pages/admin/index.html")}" class="nav-icon-btn" aria-label="Admin Dashboard" title="Admin Dashboard"><img src="${url("/assets/icons/shield.svg")}" class="inline-icon" alt="shield-icon"></a>`
				: "";

		return `
			<div style="display: flex; gap: 0.5rem; align-items: center;">
				${adminLink}
				<a href="${url("/pages/profile.html")}" class="nav-icon-btn" aria-label="Your Profile" title="Your Profile">
					<img src=${url("/assets/icons/user.svg")}" alt="user-icon" class="inline-icon">
				</a>
			</div>
		`;
	}
	return `<a href="${url("/pages/auth.html")}" class="btn btn-primary btn-sm">Sign In</a>`;
}

function updateAuthContainer() {
	const authContainer = document.getElementById("auth-action-container");
	if (authContainer) authContainer.innerHTML = renderAuthAction();
}

function updateCartBadge() {
	const badge = document.getElementById("cart-badge");
	if (!badge) return;
	const count = cartService.getCartCount();
	badge.textContent = String(count);
	badge.style.display = count > 0 ? "flex" : "none";
}

export function initNavbar() {
	const el = document.getElementById("navbar");
	if (!el) return;
	el.classList.add("site-navbar");

	el.innerHTML = `
		<div class="container">
			<a href="${url("/")}" aria-label="Home" class="navbar-logo">
				<img src="${url("/favicon.svg")}" width="50" alt="Logo" class="navbar-logo">
				Peerly
			</a>

			<nav id="primary-navigation">
				<ul data-state="closed">
					${renderNavLinks()}
				</ul>
			</nav>

			<menu>
				<li id="auth-action-container">${renderAuthAction()}</li>
				<li>
					<button class="theme-toggle nav-icon-btn" aria-label="Toggle theme" title="Toggle theme" id="theme-toggle">
						<span class="icon-theme"></span>
					</button>
				</li>
				<li>
					<a href="${url("/pages/cart.html")}" class="nav-icon-btn cart-btn" aria-label="View your cart" title="View your cart">
						<img src="${url("/assets/icons/cart.svg")}" class="inline-icon" alt="cart-icon">
						<span class="cart-badge" id="cart-badge" style="display: none;">0</span>
					</a>
				</li>
				<li class="mobile-toggle">
					<button type="button" aria-controls="primary-navigation" aria-expanded="false" id="hamburger" class="nav-icon-btn">
						<img src="${url("/assets/icons/menu.svg")}"  alt="menu-icon" class="inline-icon">
						<img src="${url("/assets/icons/close.svg")}" alt="close-icon" class="inline-icon icon-close" hidden>
					</button>
				</li>
			</menu>
		</div>
	`;

	initMobileMenu();
	initThemeToggle();
	updateCartBadge();

	const token = localStorage.getItem("authToken");
	const alreadyValidated = sessionStorage.getItem("sessionValidated");

	if (token && !alreadyValidated) {
		authService.rehydrate().then((user) => {
			if (user) sessionStorage.setItem("sessionValidated", "1");
			updateAuthContainer();
		});
	}

	window.addEventListener("cartUpdated", updateCartBadge);
	window.addEventListener("userUpdated", updateAuthContainer);
}

function initMobileMenu() {
	const hamburger = document.getElementById("hamburger");
	const navList = document.querySelector("#primary-navigation ul");
	if (!hamburger || !navList) return;

	const iconMenu = hamburger.querySelector(".icon-menu");
	const iconClose = hamburger.querySelector(".icon-close");

	hamburger.addEventListener("click", () => {
		const isOpen = hamburger.getAttribute("aria-expanded") === "true";
		const next = !isOpen;
		hamburger.setAttribute("aria-expanded", String(next));
		navList.setAttribute("data-state", next ? "open" : "closed");
		if (iconMenu) iconMenu.hidden = next;
		if (iconClose) iconClose.hidden = !next;
	});
}
