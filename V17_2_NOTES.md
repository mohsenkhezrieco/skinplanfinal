# SkinPlan v17.2 — complete packshot cache fix

Problem found:
Products added after Avène Cleanance Comedomed had placeholder JPG files and empty `imageSourceUrls`, so the image-cache Action often had nothing reliable to download.

Fix:
- Added Boots Scene7 stock-code candidates to all products that had no direct source list.
- Downloader now tries: direct sources → multiple Scene7 stock-code URLs → live Boots product-page image discovery.
- Browser product-image query version bumped to `v=172`.
- Service-worker cache bumped to v17.2.
- Workflow logs a clear list of any individual products that still fail, instead of silently hiding the issue.

Products that previously had empty source lists and now receive automatic candidates: 44.
