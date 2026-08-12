# SkinPlan v17.5 — decision-engine audit

Key corrections:
- Spot heat can no longer trigger barrier recovery by itself.
- Blackhead, not pore size alone, triggers the congestion/BHA pathway.
- Wrinkle, not collagen/texture alone, triggers the ageing pathway.
- Oily Baumann skin is no longer switched to a rich dry-skin moisturiser by a single oil sub-score.
- Every remaining abnormal concern can receive a later conditional phase.
- A selected product can cover related concerns, preventing redundant actives.
- Later phases require reassessment before progression.
- Weekly scheduling now enforces the stated same-active spacing and treatment-night caps.
- When a later phase would overcrowd the week, older maintenance actives can be paused in the example schedule rather than stacked.
- Exact regression test added for the clinic case: normal sensitivity + severe spot heat + severe pigmentation must NOT create barrier recovery.

Run:
`npm run test-engine`
