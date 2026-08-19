# SkinPlan Clinic v17.13.3 — Real Product Images

Fixed the placeholder packshots reported after v17.13.2.

## What changed
- 15 unique products that previously displayed “Packshot cache pending” now use a real packshot source first.
- The browser requests those images through `/api/product-image`, keeping them same-origin for report rendering and A4 PDF/PNG export.
- `product-image-sources.json` now contains explicit real image sources for every affected product.
- The existing local placeholder remains only as a last-resort fallback if all real sources are unavailable.
- The GitHub `Cache product packshots` workflow can use the same sources to replace the fallback files with cached local JPG packshots.

Affected products: CeraVe Skin Renewing Eye Cream; Neutrogena Clear & Defend 2% Salicylic Acid Face Wash; The Ordinary Multi-Peptide Eye Serum; The INKEY List Retinol Eye Cream; CeraVe Hydrating Hyaluronic Acid Serum; CeraVe Skin Renewing Retinol Serum; Neutrogena Retinol Boost Eye Cream; Neutrogena Retinol Boost+ Intense Night Serum; La Roche-Posay Cicaplast B5 Serum; La Roche-Posay Effaclar Purifying Cleansing Gel; La Roche-Posay Redermic Retinol Eye Cream; Avène Hyaluron Activ B3 Triple Correction Eye Care; Eucerin DermatoClean Cleansing Gel; Eucerin Hyaluron-Filler + Elasticity 3D Serum; Eucerin Hyaluron-Filler + Elasticity Eye Care.
