// Company Indicator: shows the Company chosen in Session Defaults in the desk navbar,
// so it is always clear which company you are working on. Click it to change it.
// Written to work on Frappe v15 and v16: it does not depend on one exact navbar layout.
// If no navbar list is found it falls back to a small floating badge.
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

	function make_badge(company, floating) {
		const $badge = $(
			floating
				? `<div id="${BADGE_ID}" class="company-indicator-floating"></div>`
				: `<li class="nav-item d-flex align-items-center" id="${BADGE_ID}"></li>`
		);
		const $link = $(
			`<a class="btn btn-default btn-sm" role="button" style="max-width:260px;cursor:pointer;">
				<span class="company-name d-inline-block text-truncate align-middle" style="max-width:220px;"></span>
			</a>`
		);
		$link.find(".company-name").text(company).attr("title", company);
		$link.on("click", open_session_defaults);
		$badge.append($link);
		if (floating) {
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
		if ($existing.length) {
			$existing.find(".company-name").text(company).attr("title", company);
			return;
		}

		const $nav = $("header.navbar ul.navbar-nav, .navbar ul.navbar-nav").first();
		if ($nav.length) {
			$nav.prepend(make_badge(company, false));
		} else if (document.body) {
			$("body").append(make_badge(company, true));
		}
	}

	$(document).on("startup page-change toolbar_setup", render);
	$(function () {
		setTimeout(render, 500);
		// Frappe can rebuild the header after load, which drops the badge, so re-check
		setInterval(render, 2000);
	});
})();
