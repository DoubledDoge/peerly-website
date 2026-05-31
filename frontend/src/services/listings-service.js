import { api } from "@utils/api.js";

export const listingsService = {
	async getAllListings(filters = {}) {
		const params = new URLSearchParams();

		if (filters.category) params.set("category", filters.category);
		if (filters.search) params.set("search", filters.search);
		if (filters.sort) params.set("sort", filters.sort);
		if (filters.status) params.set("status", filters.status);
		if (filters.page) params.set("page", filters.page);
		if (filters.per_page) params.set("per_page", filters.per_page);

		const query = params.toString();
		return await api.get(`/listings${query ? `?${query}` : ""}`);
	},

	async getListingById(id) {
		const data = await api.get(`/listings/detail?id=${id}`);
		return data.listing ?? null;
	},

	async getUserListings(sellerId, status = "active") {
		return await this.getAllListings({ seller_id: sellerId, status });
	},

	async createListing(listingData) {
		const data = await api.post("/listings", listingData);
		return data.listing;
	},

	// Intentionally Unused
	// TODO: Implement a way to update listings through the UI
	async updateListing(id, updates) {
		const data = await api.put(`/listings/detail?id=${id}`, updates);
		return data.listing;
	},

	async deleteListing(id) {
		return await api.delete(`/listings/detail?id=${id}`);
	},
};
