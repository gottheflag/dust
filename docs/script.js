// Dust docs — vanilla JS, no build step, no dependencies.

(() => {
	/* ---------------------------------------------------------- */
	/* Mobile nav toggle                                          */
	/* ---------------------------------------------------------- */

	const sidebar = document.querySelector(".sidebar");
	const menuToggle = document.querySelector(".menu-toggle");

	if (menuToggle && sidebar) {
		menuToggle.addEventListener("click", () => {
			sidebar.classList.toggle("open");
		});

		sidebar.querySelectorAll("a").forEach((link) => {
			link.addEventListener("click", () => sidebar.classList.remove("open"));
		});

		document.addEventListener("click", (e) => {
			if (
				sidebar.classList.contains("open") &&
				!sidebar.contains(e.target) &&
				!menuToggle.contains(e.target)
			) {
				sidebar.classList.remove("open");
			}
		});
	}

	/* ---------------------------------------------------------- */
	/* Scroll-spy: highlight the sidebar link for the section in   */
	/* view                                                        */
	/* ---------------------------------------------------------- */

	const sections = Array.from(document.querySelectorAll("main section[id]"));
	const navLinks = Array.from(document.querySelectorAll(".sidebar a[href^='#']"));

	const linkFor = (id) => navLinks.find((a) => a.getAttribute("href") === `#${id}`);

	if (sections.length && navLinks.length && "IntersectionObserver" in window) {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const link = linkFor(entry.target.id);
					if (!link) continue;

					if (entry.isIntersecting) {
						navLinks.forEach((a) => a.classList.remove("active"));
						link.classList.add("active");
					}
				}
			},
			{ rootMargin: "-10% 0px -70% 0px", threshold: 0 }
		);

		sections.forEach((s) => observer.observe(s));
	}

	/* ---------------------------------------------------------- */
	/* Copy buttons on every code block                           */
	/* ---------------------------------------------------------- */

	document.querySelectorAll("pre").forEach((pre) => {
		const btn = document.createElement("button");
		btn.className = "copy-btn";
		btn.type = "button";
		btn.textContent = "copy";

		btn.addEventListener("click", async () => {
			const code = pre.querySelector("code");
			const text = code ? code.textContent : pre.textContent;

			try {
				await navigator.clipboard.writeText(text ?? "");
				btn.textContent = "copied";
				btn.classList.add("copied");
			} catch {
				btn.textContent = "select + ⌘C";
			}

			setTimeout(() => {
				btn.textContent = "copy";
				btn.classList.remove("copied");
			}, 1400);
		});

		pre.appendChild(btn);
	});

	/* ---------------------------------------------------------- */
	/* Install command tabs (npm / pnpm / yarn / bun)              */
	/* ---------------------------------------------------------- */

	document.querySelectorAll(".install-tabs").forEach((widget) => {
		const buttons = Array.from(widget.querySelectorAll(".install-tab-list button"));
		const panes = Array.from(widget.querySelectorAll(".install-tab-body > pre"));

		buttons.forEach((btn, i) => {
			btn.addEventListener("click", () => {
				buttons.forEach((b) => b.classList.remove("active"));
				panes.forEach((p) => (p.style.display = "none"));
				btn.classList.add("active");
				panes[ i ].style.display = "block";
			});
		});
	});

	/* ---------------------------------------------------------- */
	/* Ctrl/Cmd+K search — filters sidebar links by text match      */
	/* ---------------------------------------------------------- */

	const searchInput = document.querySelector(".search input");

	if (searchInput) {
		document.addEventListener("keydown", (e) => {
			const isCombo = (e.key === '/');

			if (isCombo) {
				e.preventDefault();
				searchInput.focus();
				searchInput.select();
			}

			if (e.key === "Escape" && document.activeElement === searchInput) {
				searchInput.value = "";
				searchInput.dispatchEvent(new Event("input"));
				searchInput.blur();
			}
		});

		searchInput.addEventListener("input", () => {
			const query = searchInput.value.trim().toLowerCase();

			document.querySelectorAll(".nav-group").forEach((group) => {
				let groupHasMatch = false;

				group.querySelectorAll("li").forEach((li) => {
					const text = li.textContent.toLowerCase();
					const matches = query === "" || text.includes(query);
					li.style.display = matches ? "" : "none";
					if (matches) groupHasMatch = true;
				});

				group.style.display = groupHasMatch ? "" : "none";
			});
		});
	}
})();
