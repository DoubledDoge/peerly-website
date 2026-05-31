(() => {
	const savedTheme = localStorage.getItem("theme");
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

	if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
		document.documentElement.setAttribute("data-theme", "dark");
	} else {
		document.documentElement.setAttribute("data-theme", "light");
	}
})();
