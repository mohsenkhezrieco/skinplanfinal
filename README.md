# SkinPlan Clinic v17.13 — Final Library Role Audit

This build retains the 9-brand tier system and performs a role-by-role formulary correction. The library now contains 91 curated products.

## Brand tiers
- Budget: The Ordinary, The INKEY List, Beauty of Joseon
- Mid-range: CeraVe, Neutrogena, Bioderma
- Premium: La Roche-Posay, Avène, Eucerin

## Major library corrections
- La Roche-Posay now has both sensitive and oily/blemish cleanser pathways.
- Dedicated eye-ageing rankings now include eight products across the three price tiers.
- CeraVe Skin Renewing Retinol replaces Resurfacing Retinol for wrinkle/ageing ranking.
- Eucerin DermatoClean replaces the acid Correcting Cleanser as a base cleanser.
- Barrier-support rankings now include LRP Cicaplast B5 Serum and CeraVe Hydrating HA Serum.
- Face retinoid ranking is split into a conservative automatic clinic-starter list and a separate advanced-efficacy list. The Ordinary Retinal 0.2% leads the advanced list.

Product strategy remains mutually exclusive: Clinical efficacy first OR Budget tier first. Optional Priority Brand remains available.

Product images remain local under `assets/products/`. Pushing the changed `products.json` triggers the included GitHub Action to cache packshots for new products.

Cosmetic skincare maintenance guidance only — not a diagnosis or prescription.

## v17.13.2 real packshot fallback
If a newly added product has not yet been cached into `assets/products/`, the website now loads its real product packshot through the same-origin `/api/product-image` route. This removes blank product cards while keeping local cached images as the preferred source and preserving PNG/PDF export compatibility.
