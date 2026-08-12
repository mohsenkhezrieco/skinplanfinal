# v17.3 — three missing packshots

This patch supplies explicit image sources for:
- Neutrogena Clear & Defend+ Daily Serum 30ml
- Cetaphil PRO Redness Prone Cleansing Wash 236ml
- La Roche-Posay Hyalu B5 Suractivated Serum 30ml

After replacing the files, run:
GitHub → Actions → Cache product packshots → Run workflow

The existing image-cache script will download these sources, normalize them to the local 900×900 JPG files, and commit them into:
- assets/products/neutro_clear_defend.jpg
- assets/products/cet_redness_cleanser.jpg
- assets/products/lrp_hyalu_b5.jpg
