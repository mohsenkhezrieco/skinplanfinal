# SkinPlan v17

## Main changes
- Removed the redundant top-level AM/PM routine from the patient report.
- Added a **Weekly programme at a glance** table with each phase, daily AM products, example 7-day evening schedule, active frequency and spacing/separation rule.
- Full AM/PM cards remain repeated inside every phase.
- Expanded curated formulary to **76 products across 11 brands**.
- Added Cetaphil, Vichy and Neutrogena plus more treatment-relevant products from existing brands.
- Added **Prefer one brand** mode.
- If the preferred brand lacks a product for a required role, the engine automatically uses the highest-ranked compatible **The Ordinary/CeraVe** core fallback when enabled.
- Product ranking now covers mixed acne+pigmentation, acne/blemish, pigmentation, congestion, ageing and all base-care roles.
- Image-cache Action now tries direct sources and then scrapes the official Boots product page for its current packshot, validates it and stores it locally.

## After upload
1. Commit the v17 files to GitHub.
2. Run **Actions → Cache product packshots → Run workflow** once so newly added product placeholders are replaced with local packshots.
3. Wait for the bot image commit and Vercel redeploy.
4. Reload the site.

## Safety
This remains a cosmetic skincare maintenance planner. X3 scores are decision inputs, not diagnoses. Safety flags and referral rules override brand preference.
