// Company Indicator: shows the Company chosen in Session Defaults in the desk header,
// so it is always clear which company you are working on. Click it to change it.
//
// Works on Frappe v15 and v16, which have different layouts:
//   v15: top navbar          -> header.navbar ul.navbar-nav
//   v16: no top navbar, every page has its own header -> .page-head .standard-items-section
// The header is flex based, so the badge sits on the right in LTR languages and on the left
// in RTL ones. If neither place is found a small floating badge is used instead.
//
// Each company gets its own colour (derived from its name), so you can tell companies apart at a glance.
(function () {
	const BADGE_ID = "company-indicator-badge";
	const STYLE_ID = "company-indicator-style";

	const ICON =
		'<svg class="company-indicator-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" ' +
		'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
		'<path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>' +
		'<path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></svg>';

	const CSS = `
		#${BADGE_ID} { --ci-h: 210; flex-shrink: 0; }
		#${BADGE_ID} .company-indicator-pill {
			display: inline-flex; align-items: center; gap: 7px;
			max-width: 240px; height: 28px; padding: 0 12px 0 10px;
			border-radius: 999px; cursor: pointer; white-space: nowrap;
			font-size: var(--text-sm, 12px); font-weight: 600; line-height: 1;
			color: var(--text-color, #1f272e);
			background: hsla(var(--ci-h), 70%, 50%, 0.12);
			border: 1px solid hsla(var(--ci-h), 70%, 50%, 0.35);
			transition: background-color .15s ease, border-color .15s ease;
		}
		#${BADGE_ID} .company-indicator-pill:hover {
			background: hsla(var(--ci-h), 70%, 50%, 0.2);
			border-color: hsla(var(--ci-h), 70%, 50%, 0.6);
			text-decoration: none;
		}
		#${BADGE_ID} .company-indicator-pill:focus-visible {
			outline: 2px solid hsl(var(--ci-h), 70%, 50%); outline-offset: 2px;
		}
		#${BADGE_ID} .company-indicator-icon { color: hsl(var(--ci-h), 60%, 45%); flex-shrink: 0; }
		[data-theme="dark"] #${BADGE_ID} .company-indicator-icon { color: hsl(var(--ci-h), 80%, 70%); }
		#${BADGE_ID} .company-name { overflow: hidden; text-overflow: ellipsis; }
		#${BADGE_ID}.company-indicator-floating {
			position: fixed; bottom: 12px; inset-inline-end: 12px; z-index: 1030;
			box-shadow: var(--shadow-base, 0 2px 8px rgba(0,0,0,.15)); border-radius: 999px;
			background: var(--card-bg, #fff);
		}
		#${BADGE_ID}.company-indicator-inline { margin-inline-end: 8px; }
		@media (max-width: 767px) {
			#${BADGE_ID} .company-indicator-pill { max-width: 140px; padding: 0 9px 0 8px; }
		}
	`;

	function inject_style() {
		if (document.getElementById(STYLE_ID)) return;
		const style = document.createElement("style");
		style.id = STYLE_ID;
		style.textContent = CSS;
		document.head.appendChild(style);
	}

	// stable hue 0-359 from the company name
	function hue_for(name) {
		let h = 0;
		for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
		return h;
	}

	function current_company() {
		const from_defaults = frappe.defaults && frappe.defaults.get_user_default("Company");
		if (from_defaults) return from_defaults;
		return (frappe.boot && frappe.boot.sysdefaults && frappe.boot.sysdefaults.company) || "";
	}

	function open_session_defaults() {
		if (frappe.ui.toolbar && typeof frappe.ui.toolbar.setup_session_defaults === "function") {
			frappe.ui.toolbar.setup_session_defaults();
		}
	}

	// returns { $parent, kind } for the place the badge should live in right now
	function find_target() {
		const $nav = $("header.navbar ul.navbar-nav").first();
		if ($nav.length) return { $parent: $nav, kind: "navbar" };

		// v16 keeps one .page-head per opened page in the DOM, only the current one is visible
		const $head = $(".page-head:visible .standard-items-section").first();
		if ($head.length) return { $parent: $head, kind: "page-head" };

		return { $parent: $("body"), kind: "floating" };
	}

	function paint($badge, company) {
		$badge.css("--ci-h", hue_for(company));
		$badge.find(".company-name").text(company);
		$badge.find(".company-indicator-pill").attr({
			title: company + " — " + __("Session Defaults"),
			"aria-label": company + " — " + __("Session Defaults"),
		});
	}

	function make_badge(company, kind) {
		const cls =
			kind === "floating" ? "company-indicator-floating" : "company-indicator-inline";
		const $badge = $(
			kind === "navbar"
				? `<li class="nav-item d-flex align-items-center ${cls}" id="${BADGE_ID}"></li>`
				: `<div class="d-flex align-items-center ${cls}" id="${BADGE_ID}"></div>`
		);
		const $pill = $(
			`<a class="company-indicator-pill" role="button" tabindex="0">${ICON}<span class="company-name"></span></a>`
		);
		$pill.on("click", open_session_defaults).on("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				open_session_defaults();
			}
		});
		$badge.append($pill).attr("data-kind", kind);
		paint($badge, company);
		return $badge;
	}

	function render() {
		const company = current_company();
		const $existing = $("#" + BADGE_ID);

		if (!company) {
			$existing.remove();
			return;
		}

		inject_style();
		const target = find_target();
		const in_place =
			$existing.length &&
			$existing.attr("data-kind") === target.kind &&
			($existing.parent().is(target.$parent) || target.kind === "floating");

		if (in_place) {
			paint($existing, company);
			return;
		}

		// wrong place (e.g. v16 moved to another page) or not there yet: rebuild it
		$existing.remove();
		const $badge = make_badge(company, target.kind);
		if (target.kind === "floating") {
			target.$parent.append($badge);
		} else {
			target.$parent.prepend($badge);
		}
	}

	$(document).on("startup page-change toolbar_setup", render);
	$(function () {
		setTimeout(render, 500);
		// Frappe rebuilds headers when you open pages, which drops the badge, so re-check
		setInterval(render, 1500);
	});
})();
