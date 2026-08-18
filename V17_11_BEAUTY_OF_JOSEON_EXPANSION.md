# SkinPlan Clinic v17.11 — Beauty of Joseon expansion

Added seven treatment-relevant Beauty of Joseon products to the curated library, taking the brand from 3 to 10 products.

New additions:
- Green Plum Refreshing Cleanser 100ml
- Red Bean Water Gel 100ml
- Glow Serum: Propolis + Niacinamide 30ml
- Glow Deep Serum: Rice + Alpha-Arbutin 30ml
- Green Plum Refreshing Toner AHA + BHA 150ml
- Revive Eye Serum: Ginseng + Retinal 30ml
- Relief Sun Aqua-Fresh: Rice + B5 SPF50+ 50ml

Ranking integration:
- cleanser_sensitive / cleanser_oily
- moisturiser_oily
- oil_support
- pigment_only
- congestion_treatment
- spf_oily / spf_general
- new eye_ageing role (manual clinician option; not automatically triggered from the general X3 wrinkle score)

Product packshots use the existing local-image cache workflow. After upload, run the Cache product packshots GitHub Action so new local JPGs are created in assets/products/.
