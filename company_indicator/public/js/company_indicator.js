// Company Indicator: shows the Company chosen in Session Defaults in the desk header,
// so it is always clear which company you are working on. Click it to change it.
//
// Works on Frappe v15 and v16, which have different layouts:
//   v15: top navbar          -> header.navbar ul.navbar-nav
//   v16: no top navbar, every page has its own header -> .page-head .standard-items-section
// The header is flex based, so the badge sits on the right in LTR languages and on the left
// in RTL ones. If neither place is found a small floating badge is used instead.
(function () {
	const BADGE_ID = "company-indicator-badge";

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

	function make_badge(company, kind) {
		const $badge = $(
			kind === "navbar"
				? `<li class="nav-item d-flex align-items-center" id="${BADGE_ID}"></li>`
				: `<div class="company-indicator d-flex align-items-center" id="${BADGE_ID}"></div>`
		);
		const $link = $(
			`<a class="btn btn-default btn-sm" role="button" style="max-width:260px;cursor:pointer;">
				<span class="company-name d-inline-block text-truncate align-middle" style="max-width:220px;"></span>
			</a>`
		);
		$link.find(".company-name").text(company).attr("title", company);
		$link.on("click", open_session_defaults);
		$badge.append($link).attr("data-kind", kind);

		if (kind === "page-head") {
			// small gap from the neighbouring buttons, on whichever side faces them
			$badge.css({ "margin-inline-end": "8px" });
		} else if (kind === "floating") {
			// inset-inline-end puts it on the left in RTL languages and on the right in LTR
			$badge.css({ position: "fixed", bottom: "12px", "inset-inline-end": "12px", "z-index": 1030 });
		}
		return $badge;
	}

	function render() {
		const company = current_company();
		const $existing = $("#" + BADGE_ID);

		if (!company) {
			$existing.remove();
			return;
		}

		const target = find_target();
		const in_place =
			$existing.length &&
			$existing.attr("data-kind") === target.kind &&
			($existing.parent().is(target.$parent) || target.kind === "floating");

		if (in_place) {
			$existing.find(".company-name").text(company).attr("title", company);
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
