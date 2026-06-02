import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { renderOrderSummary } from "@components/order-summary.js";
import { showToast } from "@components/toast.js";
import { cartService } from "@services/cart-service.js";
import { api } from "@utils/api.js";
import { requireAuth } from "@utils/auth-guard.js";
import { url } from "@utils/base.js";

requireAuth();
initNavbar();
initFooter();
initCheckout();

function initCheckout() {
	const cartItems = cartService.getCart();

	if (cartItems.length === 0) {
		window.location.href = url("/pages/cart.html");
		return;
	}

	renderOrderSummary("order-summary-mount", { showItems: true });

	const form = document.getElementById("checkout-form");
	const btn = document.getElementById("btn-place-order");

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		btn.textContent = "Processing...";
		btn.disabled = true;

		try {
			const orderPromises = cartItems.map((item) =>
				api.post("/orders", { listing_id: item.id }),
			);

			await Promise.all(orderPromises);

			cartService.clearCart();
			showToast("Order placed successfully!", "success");
			btn.textContent = "Order Confirmed!";

			setTimeout(() => {
				window.location.href = url("/pages/profile.html");
			}, 1500);
		} catch (error) {
			showToast(
				error.message ||
					"Could not place order. An item may no longer be available.",
				"error",
			);
			btn.textContent = "Place Order";
			btn.disabled = false;
		}
	});
}
