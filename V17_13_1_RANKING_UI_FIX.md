# SkinPlan Clinic v17.13.1 — Ranking UI Fix

Fixes a role-key mismatch in the Library ranking selector.

- The selector previously exposed `ageing_retinoid`, while the audited ranking data had already been split into `ageing_retinoid_starter` and `ageing_retinoid_advanced`.
- This caused the visible “Ageing — retinoid / retinal” ranking to appear empty even though the products existed.
- The selector now exposes both starter and advanced ageing rankings explicitly.
- Eye-ageing rankings are also exposed as sensitive/non-retinoid, retinoid/retinal, and combined clinician view.
- Added a regression audit: every visible Library ranking role must map to a non-empty ranking list.
