# Company Indicator

Shows the **Company selected in Session Defaults** in the Frappe / ERPNext desk navbar, so you always
know which company you are working on when a site has more than one.

- Works on Frappe **v15 and v16**, with or without ERPNext.
- Click the badge to open the Session Defaults dialog and switch company.
- The navbar is flex based, so the badge sits on the right in LTR languages and on the left in RTL ones.
- If a navbar list cannot be found, a small floating badge is shown in the bottom corner instead.

## Install

```bash
bench get-app https://github.com/<your-user>/company_indicator
bench --site <site> install-app company_indicator
bench build --app company_indicator
```

On Frappe Cloud: add the repo as an app, deploy, then hard refresh the browser (`Ctrl+Shift+R`).

## Notes

The badge reads `Company` from your user defaults (what Session Defaults saves), falling back to the
system default company. If you have not picked a company in Session Defaults, the system default is shown.
