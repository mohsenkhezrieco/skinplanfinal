# SkinPlan Clinic v16 — Local Product Images

This version removes the runtime product-image proxy. The website uses only local paths under `assets/products/`.

## What happens after you upload this version to GitHub
1. GitHub Actions runs `Cache product packshots`.
2. It downloads the current product packshots once.
3. It converts them to consistent 900×900 JPEG files.
4. It commits those files into `assets/products/` in your repository.
5. That commit triggers a second Vercel deployment.
6. From then on the live website/report uses repository-local images and does not depend on the external product-image URLs.

Ten product images are already seeded from your previous local SkinPlan assets. The workflow replaces or fills the rest when downloads succeed. If a retailer blocks an image, the existing local file is kept instead of being deleted.

## Files to upload
Upload the complete contents of this ZIP to the existing GitHub repository. Important new folders/files:
- `.github/workflows/cache-product-images.yml`
- `scripts/fetch-product-images.mjs`
- `assets/products/`
- `product-image-sources.json`

`api/x3-report.js` remains the working X3 server importer. `api/product-image.js` has been removed.

## If GitHub Actions does not run automatically
Open GitHub → your repository → Actions → **Cache product packshots** → **Run workflow**. After it finishes, verify that `assets/products/` contains updated product photos. Vercel will then redeploy automatically.

## Product library
34 selected products across the ranked brand engine. Brand enable/disable settings and the phased skincare algorithm from v15 are retained.

Cosmetic skincare maintenance guidance only; not a medical diagnosis or prescription.
