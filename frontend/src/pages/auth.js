import { initFooter } from "@components/footer.js";
import { initNavbar } from "@components/navbar.js";
import { authService } from "@services/auth-service.js";
import { redirectIfAuthenticated } from "@utils/auth-guard.js";
import { url } from "@utils/base.js";
import {
	isValidEmail,
	isValidName,
	isValidPassword,
} from "@utils/validators.js";

document.addEventListener("DOMContentLoaded", () => {
	redirectIfAuthenticated();
	initNavbar();
	initFooter();
	initAuthTabs();
	initFormValidation();
});

function initAuthTabs() {
	const tabLogin = document.getElementById("tab-login");
	const tabRegister = document.getElementById("tab-register");
	const formLogin = document.getElementById("form-login");
	const formRegister = document.getElementById("form-register");

	if (!tabLogin || !tabRegister || !formLogin || !formRegister) return;

	const switchTab = (mode) => {
		const isLogin = mode === "login";
		tabLogin.setAttribute("aria-selected", isLogin ? "true" : "false");
		tabRegister.setAttribute("aria-selected", isLogin ? "false" : "true");
		formLogin.setAttribute("data-active", isLogin ? "true" : "false");
		formRegister.setAttribute("data-active", isLogin ? "false" : "true");

		const u = new URL(window.location.href);
		u.searchParams.set("mode", mode);
		window.history.replaceState({}, "", u);
	};

	tabLogin.addEventListener("click", () => switchTab("login"));
	tabRegister.addEventListener("click", () => switchTab("register"));

	const params = new URLSearchParams(window.location.search);
	switchTab(params.get("mode") === "register" ? "register" : "login");
}

function setError(inputElement, message) {
	const formGroup = inputElement.closest(".form-group");
	formGroup.classList.add("has-error");
	formGroup.querySelector(".error-message").textContent = message;
}

function clearErrors(form) {
	for (const group of form.querySelectorAll(".form-group")) {
		group.classList.remove("has-error");
		group.querySelector(".error-message").textContent = "";
	}
	const globalError = form.querySelector(".auth-global-error");
	if (globalError) {
		globalError.style.display = "none";
		globalError.textContent = "";
	}
}

function showGlobalError(form, message) {
	const globalError = form.querySelector(".auth-global-error");
	if (!globalError) return;
	globalError.textContent = message;
	globalError.style.display = "block";
}

function setLoading(btn, loadingText) {
	btn.dataset.originalText = btn.textContent;
	btn.textContent = loadingText;
	btn.disabled = true;
}

function clearLoading(btn) {
	btn.textContent = btn.dataset.originalText;
	btn.disabled = false;
}

function getRedirectTarget() {
	const params = new URLSearchParams(window.location.search);
	const redirect = params.get("redirect");

	if (redirect) {
		try {
			const decodedTarget = decodeURIComponent(redirect);
			const parsedUrl = new URL(decodedTarget, window.location.origin);

			if (parsedUrl.origin === window.location.origin) {
				return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
			}
		} catch (error) {
			console.warn("Invalid redirect attempt:", error.message);
		}
	}

	return url("/");
}

function initFormValidation() {
	const formLogin = document.getElementById("form-login");
	const formRegister = document.getElementById("form-register");
	const forgotBtn = document.getElementById("btn-forgot-password");

	// Login
	formLogin?.addEventListener("submit", async (e) => {
		e.preventDefault();
		clearErrors(formLogin);

		const email = formLogin.elements.email.value.trim();
		const password = formLogin.elements.password.value;
		let isValid = true;

		if (!isValidEmail(email)) {
			setError(formLogin.elements.email, "Please enter a valid email address.");
			isValid = false;
		}
		if (!password) {
			setError(formLogin.elements.password, "Password is required.");
			isValid = false;
		}
		if (!isValid) return;

		const btn = formLogin.querySelector('button[type="submit"]');
		setLoading(btn, "Signing In...");

		try {
			const result = await authService.login(email, password);

			if (result.success) {
				window.location.href = getRedirectTarget();
			} else {
				showGlobalError(formLogin, result.error || "Invalid credentials.");
			}
		} catch {
			showGlobalError(formLogin, "A system error occurred. Please try again.");
		} finally {
			clearLoading(btn);
		}
	});

	// Register
	formRegister?.addEventListener("submit", async (e) => {
		e.preventDefault();
		clearErrors(formRegister);

		const name = formRegister.elements.name.value.trim();
		const email = formRegister.elements.email.value.trim();
		const password = formRegister.elements.password.value;
		let isValid = true;

		if (!isValidName(name)) {
			setError(formRegister.elements.name, "Please enter your full name.");
			isValid = false;
		}
		if (!isValidEmail(email)) {
			setError(
				formRegister.elements.email,
				"Please enter a valid email address.",
			);
			isValid = false;
		}
		if (!isValidPassword(password)) {
			setError(
				formRegister.elements.password,
				"Password must be 8+ characters with uppercase, lowercase, number, and symbol.",
			);
			isValid = false;
		}
		if (!isValid) return;

		const btn = formRegister.querySelector('button[type="submit"]');
		setLoading(btn, "Creating Account...");

		try {
			const result = await authService.register(name, email, password);

			if (result.success) {
				window.location.href = getRedirectTarget();
			} else {
				showGlobalError(formRegister, result.error || "Registration failed.");
			}
		} catch {
			showGlobalError(formRegister, "An error occurred during registration.");
		} finally {
			clearLoading(btn);
		}
	});

	forgotBtn?.addEventListener("click", () => {
		const emailInput = formLogin.elements.email;
		const email = emailInput.value.trim();

		clearErrors(formLogin);

		if (!isValidEmail(email)) {
			setError(
				emailInput,
				"Please enter your email address to reset your password.",
			);
			emailInput.focus();
			return;
		}

		forgotBtn.disabled = true;
		forgotBtn.textContent = "Sending...";

		setTimeout(() => {
			const globalError = formLogin.querySelector(".auth-global-error");
			if (globalError) {
				globalError.textContent =
					"If an account exists, a reset link has been sent to your email.";
				globalError.style.display = "block";
				globalError.style.backgroundColor = "oklch(65% 0.15 150 / 15%)";
				globalError.style.color = "oklch(65% 0.15 150)";
			}
			forgotBtn.textContent = "Forgot your password?";
			forgotBtn.disabled = false;
		}, 1200);
	});
}
