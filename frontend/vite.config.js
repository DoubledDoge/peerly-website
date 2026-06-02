// noinspection JSCheckFunctionSignatures

import path from "node:path";
import { defineConfig } from "vite";

const currentDir = import.meta.dirname;
export default defineConfig({
	base: "/peerly-website/",
	root: "src",
	publicDir: "public",
	build: {
		outDir: "../dist",
		emptyOutDir: true,
		sourcemap: true,
		minify: "oxc",
		cssMinify: "lightningcss",
		assetsDir: "assets",
		rolldownOptions: {
			input: {
				home: path.resolve(currentDir, "src/index.html"),
				listings: path.resolve(currentDir, "src/pages/listings.html"),
				listingDetail: path.resolve(
					currentDir,
					"src/pages/listing-detail.html",
				),
				cart: path.resolve(currentDir, "src/pages/cart.html"),
				checkout: path.resolve(currentDir, "src/pages/checkout.html"),
				auth: path.resolve(currentDir, "src/pages/auth.html"),
				profile: path.resolve(currentDir, "src/pages/profile.html"),
				sell: path.resolve(currentDir, "src/pages/sell.html"),
				adminIndex: path.resolve(currentDir, "src/pages/admin/index.html"),
				adminUsers: path.resolve(currentDir, "src/pages/admin/users.html"),
				adminListings: path.resolve(
					currentDir,
					"src/pages/admin/listings.html",
				),
				adminOrders: path.resolve(currentDir, "src/pages/admin/orders.html"),
				adminReports: path.resolve(currentDir, "src/pages/admin/reports.html"),
			},
			output: {
				assetFileNames: "assets/[name]-[hash][extname]",
				chunkFileNames: "assets/[name]-[hash].js",
				entryFileNames: "assets/[name]-[hash].js",
			},
		},
	},
	server: {
		port: 5173,
		strictPort: true,
		proxy: {
			"/api": {
				target: "http://localhost:8080",
				changeOrigin: true,
				secure: false,
			},
		},
	},
	preview: {
		port: 4173,
		strictPort: true,
	},
	resolve: {
		alias: {
			"@": path.resolve(currentDir, "src"),
			"@pages": path.resolve(currentDir, "src/pages"),
			"@components": path.resolve(currentDir, "src/components"),
			"@services": path.resolve(currentDir, "src/services"),
			"@styles": path.resolve(currentDir, "src/styles"),
			"@types": path.resolve(currentDir, "src/types"),
			"@utils": path.resolve(currentDir, "src/utils"),
			"@assets": path.resolve(currentDir, "src/assets"),
		},
	},
	css: {
		devSourcemap: true,
		transformer: "lightningcss",
	},
});
