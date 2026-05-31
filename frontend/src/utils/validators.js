const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export function isValidEmail(email) {
	return EMAIL_REGEX.test(email);
}

export function isValidPassword(password) {
	return PASSWORD_REGEX.test(password);
}

export function isValidName(name) {
	return name.trim().length >= 2;
}
