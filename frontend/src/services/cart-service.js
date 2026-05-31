import { storage } from "@utils/storage.js";

export const cartService = {
	getCart() {
		try {
			return storage.get("cart", []);
		} catch (error) {
			console.error("Failed to parse cart from localStorage:", error);
			return [];
		}
	},

	addToCart(product) {
		const cart = this.getCart();

		if (cart.some((item) => String(item.id) === String(product.id))) {
			return false;
		}

		cart.push(product);
		storage.set("cart", cart);
		window.dispatchEvent(new Event("cartUpdated"));
		return true;
	},

	removeFromCart(productId) {
		let cart = this.getCart();
		const initialLength = cart.length;

		cart = cart.filter((item) => String(item.id) !== String(productId));

		if (cart.length !== initialLength) {
			storage.set("cart", cart);
			window.dispatchEvent(new Event("cartUpdated"));
			return true;
		}
		return false;
	},

	clearCart() {
		storage.set("cart", []);
		window.dispatchEvent(new Event("cartUpdated"));
	},

	getCartCount() {
		return this.getCart().length;
	},
};
