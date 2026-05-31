import cartIconUrl from "@assets/icons/cart.svg?raw";
import closeIconUrl from "@assets/icons/close.svg?raw";
import menuIconUrl from "@assets/icons/menu.svg?raw";
import shieldIconUrl from "@assets/icons/shield.svg?raw";
import userIconUrl from "@assets/icons/user.svg?raw";
import { authService } from "@services/auth-service.js";
import { cartService } from "@services/cart-service.js";
import { initThemeToggle } from "./theme-toggle.js";

const navLinks = [
	{ href: "/", label: "Home" },
	{ href: "/pages/listings.html", label: "Browse" },
	{ href: "/pages/sell.html", label: "Sell" },
];

function isCurrentPage(href) {
	const path = window.location.pathname;
	if (href === "/") return path === "/" || path === "/index.html";
	return path.includes(href.replace(".html", ""));
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
				? `<a href="/pages/admin/index.html" class="nav-icon-btn" aria-label="Admin Dashboard" title="Admin Dashboard">${shieldIconUrl}</a>`
				: "";

		return `
			<div style="display: flex; gap: 0.5rem; align-items: center;">
				${adminLink}
				<a href="/pages/profile.html" class="nav-icon-btn" aria-label="Your Profile" title="Your Profile">
					${userIconUrl}
				</a>
			</div>
		`;
	}
	return `<a href="../pages/auth.html" class="btn btn-primary btn-sm">Sign In</a>`;
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
			<a href="/" aria-label="Home" class="navbar-logo">
				<img src="/favicon.svg" width="50" alt="Logo" class="navbar-logo">
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
					<a href="/pages/cart.html" class="nav-icon-btn cart-btn" aria-label="View your cart" title="View your cart">
						${cartIconUrl}
						<span class="cart-badge" id="cart-badge" style="display: none;">0</span>
					</a>
				</li>
				<li class="mobile-toggle">
					<button type="button" aria-controls="primary-navigation" aria-expanded="false" id="hamburger" class="nav-icon-btn">
						<span class="icon-menu">${menuIconUrl}</span>
						<span class="icon-close" hidden>${closeIconUrl}</span>
					</button>
				</li>
			</menu>
		</div>
	`;

	initMobileMenu();
	initThemeToggle();
	updateCartBadge();

	authService.rehydrate().then(() => {
		const authContainer = document.getElementById("auth-action-container");
		if (authContainer) authContainer.innerHTML = renderAuthAction();
	});

	window.addEventListener("cartUpdated", updateCartBadge);
	window.addEventListener("userUpdated", () => {
		const authContainer = document.getElementById("auth-action-container");
		if (authContainer) authContainer.innerHTML = renderAuthAction();
	});
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
