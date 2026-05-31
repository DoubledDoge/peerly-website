export const AdminTable = {
	render(containerId, headers, data, rowRenderer) {
		const container = document.getElementById(containerId);
		if (!container) return;

		if (!data || data.length === 0) {
			container.innerHTML = `<p style="text-align: center; padding: 2rem; color: var(--text-muted);">No data found.</p>`;
			return;
		}

		const thead = `
            <thead>
                <tr>
                    ${headers.map((header) => `<th>${header}</th>`).join("")}
                </tr>
            </thead>
        `;

		const tbody = `
            <tbody>
                ${data.map((item) => rowRenderer(item)).join("")}
            </tbody>
        `;

		container.innerHTML = `
            <table class="admin-table">
                ${thead}
                ${tbody}
            </table>
        `;
	},
};
