import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { renderOrderSummary } from "@components/order-summary.js";
import { showToast } from "@components/toast.js";
import { cartService } from "@services/cart-service.js";
import { currencyService } from "@services/currency-service.js";
import { requireAuth } from "@utils/auth-guard.js";

initNavbar();
initFooter();
requireAuth();
initCartPage();

function initCartPage() {
	const emptyState = document.getElementById("empty-cart-state");
	const cartLayout = document.getElementById("cart-layout");
	const listContainer = document.getElementById("cart-items-list");
	const countText = document.getElementById("cart-count-text");

	const renderCart = () => {
		const cartItems = cartService.getCart();

		if (cartItems.length === 0) {
			emptyState.style.display = "block";
			cartLayout.style.display = "none";
			countText.textContent = "0 items";
			return;
		}

		emptyState.style.display = "none";
		cartLayout.style.display = "grid";
		countText.textContent = `${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}`;

		listContainer.innerHTML = cartItems
			.map((item) => {
				const photo = item.photo_url || "";
				const sellerName = item.seller_name || "Anonymous Seller";

				return `
				<li class="cart-item">
					<div class="item-media">
						${photo ? `<img src="${photo}" alt="${item.title}" />` : ""}
					</div>
					<div class="item-details">
						<h3>${item.title}</h3>
						<span class="item-seller">Sold by ${sellerName}</span>
					</div>
					<div class="item-actions">
						<span class="item-price">${currencyService.formatPrice(item.price)}</span>
						<button class="btn-remove" data-id="${item.id}">Remove</button>
					</div>
				</li>
			`;
			})
			.join("");

		renderOrderSummary("order-summary-mount", { showCheckoutButton: true });
	};

	listContainer.addEventListener("click", (e) => {
		if (e.target.classList.contains("btn-remove")) {
			cartService.removeFromCart(e.target.dataset.id);
			showToast("Item removed from cart.");
			renderCart();
		}
	});

	renderCart();
}
