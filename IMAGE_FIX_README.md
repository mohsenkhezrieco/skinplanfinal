# v16.1 image fix

Two separate issues were found in the uploaded repository:

1. Several source URLs returned blank/error images, so the GitHub Action kept the old placeholder files.
2. `sw.js` used cache-first behavior for all same-origin files, including `/assets/products/*.jpg`, so a browser could continue showing the old product image even after GitHub/Vercel had a newer file.

This patch:
- replaces the known bad image sources for Avène Tolérance Control Cream, Eucerin Pigment Control SPF50+, La Roche-Posay UVMune Oil Control, The Ordinary Salicylic Acid 2%, and The Ordinary Azelaic Acid;
- adds simple blank/error-image validation to the downloader;
- changes product images to `?v=161` URLs;
- changes the service worker so product images are fetched fresh instead of cache-first;
- bumps the service-worker cache to `skinplan-v16-1`.

After uploading these files:
1. Commit to GitHub.
2. Run `Actions -> Cache product packshots -> Run workflow`.
3. Wait for the GitHub Actions bot commit that refreshes `assets/products`.
4. Wait for Vercel to redeploy that bot commit.
5. Reload the site once.
