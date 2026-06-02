export function initFooter() {
	const el = document.getElementById("footer");
	if (!el) return;

	el.classList.add("site-footer");

	const currentYear = new Date().getFullYear();

	el.innerHTML = `
		<div class="footer-bottom container">
			<p>Last updated: ${currentYear} Peerly</p>
			<p>Designed for peer-to-peer trading.</p>
		</div>
	`;
}
