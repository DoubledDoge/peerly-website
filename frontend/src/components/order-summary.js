import { cartService } from "@services/cart-service.js";
import { currencyService } from "@services/currency-service.js";

export function renderOrderSummary(containerId, options = {}) {
	const container = document.getElementById(containerId);
	if (!container) return;

	const cartItems = cartService.getCart();

	const subtotalZAR = cartItems.reduce(
		(sum, item) => sum + currencyService.parsePrice(item.price),
		0,
	);
	const platformFeeZAR = subtotalZAR * 0.05;
	const shippingZAR = 150;
	const netTotalZAR = subtotalZAR + platformFeeZAR + shippingZAR;

	const formattedSubtotal = currencyService.formatPrice(subtotalZAR);
	const formattedFee = currencyService.formatPrice(platformFeeZAR);
	const formattedShipping = currencyService.formatPrice(shippingZAR);
	const formattedTotal = currencyService.formatPrice(netTotalZAR);

	let itemsHtml = "";
	if (options.showItems) {
		itemsHtml =
			`<ul class="summary-items-list">` +
			cartItems
				.map((item) => {
					return `
				<li>
					<span>${item.title}</span>
					<span>${currencyService.formatPrice(item.price)}</span>
				</li>
			`;
				})
				.join("") +
			`</ul>`;
	}

	let actionHtml = "";
	if (options.showCheckoutButton) {
		actionHtml = `
			<a href="../pages/checkout.html" class="btn btn-primary btn-lg full-width checkout-btn" style="width: 100%; display: block; text-align: center;">
				Proceed to Checkout
			</a>
		`;
	}

	container.innerHTML = `
		<div class="summary-card">
			<h2>Order Summary</h2>
			${itemsHtml}
			<div class="summary-row">
				<span>Subtotal</span>
				<span>${formattedSubtotal}</span>
			</div>
			<div class="summary-row">
				<span>Platform Fee (5%)</span>
				<span>${formattedFee}</span>
			</div>
			<div class="summary-row">
				<span>Estimated Shipping</span>
				<span>${formattedShipping}</span>
			</div>
			<hr class="summary-divider" />
			<div class="summary-row total-row">
				<span>Net Total</span>
				<span>${formattedTotal}</span>
			</div>
			${actionHtml}
		</div>
	`;
}
