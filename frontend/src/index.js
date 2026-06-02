import { initFooter } from "@components/footer.js";
import {
	loadFeaturedListings,
	loadHeroPreviewListings,
} from "@components/listing-card.js";
import { initNavbar } from "@components/navbar.js";
import { initSearchBar } from "@components/search-bar.js";

initNavbar();
initFooter();
initSearchBar("search-bar-container");

Promise.all([loadHeroPreviewListings(), loadFeaturedListings()]).catch(
	console.error,
);
