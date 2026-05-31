export function renderStarRating(rating) {
	const ratingValue = Number(rating) || 0;

	return `
		<div class="seller-rating" aria-label="Rating: ${ratingValue} out of 5">
			<span class="stars" style="--rating: ${ratingValue};">★★★★★</span>
			<span class="rating-number">(${ratingValue})</span>
		</div>
	`;
}
