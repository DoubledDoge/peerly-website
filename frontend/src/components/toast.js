// @ts-nocheck
import "@styles/components/toast.css";
import alertIconUrl from "@assets/icons/alert-triangle.svg?raw";
import checkIconUrl from "@assets/icons/square-check.svg?raw";
export function showToast(message, type = "success") {
	let container = document.getElementById("toast-container");
	if (!container) {
		container = document.createElement("div");
		container.id = "toast-container";
		document.body.appendChild(container);
	}

	const toast = document.createElement("div");
	toast.className = `toast toast-${type}`;

	const icon = type === "success" ? checkIconUrl : alertIconUrl;
	toast.innerHTML = `<span aria-hidden="true">${icon}</span> ${message}`;

	container.appendChild(toast);
	void toast.offsetWidth;
	toast.classList.add("show");

	setTimeout(() => {
		toast.classList.remove("show");
		setTimeout(() => toast.remove(), 400);
	}, 3000);
}
