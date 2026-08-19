# SkinPlan v17.21.1 — Secure Product Library

- Restores a customer-facing Product Library tab.
- Customer catalogue is alphabetically sorted and exposes only safe product metadata: brand, product name, public category, image, generic use-time guidance and product-information link.
- Internal rank number, score, role ID, fallback order and decision rationale are not returned by `/api/library`.
- Adds an Owner-only `/api/admin-formulary` view containing the full internal role rankings and rationale.
- Access Control now links to the Owner Formulary View.
- The server-side decision engine, formulary data and selection algorithm are otherwise unchanged from v17.20.0.
