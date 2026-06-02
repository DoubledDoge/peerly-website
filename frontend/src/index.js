import { initFooter } from "@components/footer.js";
import {
	loadFeaturedListings,
	loadHeroPreviewListings,
} from "@components/listing-card.js";
import { initNavbar } from "@components/navbar.js";
import { initSearchBar } from "@components/search-bar.js";

document.addEventListener("DOMContentLoaded", async () => {
	initNavbar();
	initFooter();
	initSearchBar("search-bar-container");

	await Promise.all([loadHeroPreviewListings(), loadFeaturedListings()]);
});
