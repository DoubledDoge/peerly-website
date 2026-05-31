export const currencyService = {
	parsePrice(priceStr) {
		if (typeof priceStr === "number") return priceStr;
		const parsed = parseFloat(String(priceStr).replace(/[^0-9.-]+/g, ""));
		return Number.isNaN(parsed) ? 0 : parsed;
	},

	formatPrice(priceStr) {
		const basePriceZAR = this.parsePrice(priceStr);

		const formatter = new Intl.NumberFormat("en-ZA", {
			style: "currency",
			currency: "ZAR",
		});

		return formatter.format(basePriceZAR);
	},
};
