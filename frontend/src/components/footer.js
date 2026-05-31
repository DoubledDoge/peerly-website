export function initFooter() {
	const el = document.getElementById("footer");
	if (!el) return;

	el.classList.add("site-footer");

	const currentYear = new Date().getFullYear();

	el.innerHTML = `
		<div class="container">
			<div class="footer-main">
				<div class="footer-brand">
					<a href="/" class="footer-logo">
						Peerly
					</a>
					<p class="footer-tagline">
						The marketplace built for you, not businesses. Trade directly with people in your local area with zero corporate middlemen.
					</p>
				</div>

				<nav class="footer-nav" aria-label="Footer Navigation">
					<div class="footer-nav-group">
						<p class="footer-nav-title">Platform</p>
						<a href="/pages/listings.html">Browse listings</a>
						<a href="/pages/sell.html">Post an item</a>
						<a href="/pages/auth.html?mode=register">Create account</a>
					</div>
					<div class="footer-nav-group">
						<p class="footer-nav-title">Support</p>
						<a href="#">Help Center</a>
						<a href="#">Trust & Safety</a>
						<a href="#">Contact Us</a>
					</div>
					<div class="footer-nav-group">
						<p class="footer-nav-title">Legal</p>
						<a href="#">Terms of Service</a>
						<a href="#">Privacy Policy</a>
						<a href="#">Cookie Policy</a>
					</div>
				</nav>
			</div>

			<div class="footer-bottom">
				<p>Last updated: ${currentYear} Peerly. All rights reserved.</p>
				<p>Designed for peer-to-peer trading.</p>
			</div>
		</div>
	`;
}
