# SkinPlan Clinic v17.13.2 — Real product packshot fix

The v17.13.1 ZIP contained product records for several newly added library products before their local JPEG cache had been generated. That caused broken/blank images until the GitHub image-cache workflow completed.

v17.13.2 adds a same-origin real-packshot fallback:

- Local `assets/products/*.jpg` remains first choice.
- If a local image is missing, the browser automatically requests `/api/product-image?id=<product-id>`.
- The server route only accepts known product IDs and retrieves the real packshot from approved product-image sources / the current Boots product page.
- The returned image is same-origin and cached, so it can also be included by the PNG/A4-PDF export.
- The existing GitHub Action still caches remote packshots into `assets/products/`, so local files remain the long-term preferred source.
- A new automated image-coverage audit prevents a product from shipping with neither a local packshot nor a real-image source.
