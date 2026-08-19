# SkinPlan Clinic v17.14.0 — Safety, audit and privacy hardening

This release focuses on the highest-priority clinical-safety and privacy issues identified in the v17.13.3 audit.

## Safety gate

- Safety/red-flag review must be explicitly confirmed before report generation.
- Pregnancy, trying to conceive and breastfeeding are recorded separately.
- Prescription treatment, recent procedures, known allergy and current active treatment require details when selected.
- Independent red flags were added for suspicious lesions, nodular/cystic or scarring acne, and possible infection/severe inflammatory reactions.
- The report now displays the exact reason(s) for a safety hold.
- Known allergy or a selected clinical red flag withholds automatic product selection until reviewed.

## Auditability

- Manual X3 score edits retain original device values and record change events in-session.
- A reason is required when a device score is manually corrected.
- Reviewer initials are required and are included in the report audit record.
- The generated report records whether device values were changed.

## Privacy and security

- X3 `shareId` is no longer returned to the browser after server-side import.
- The X3 link input is cleared immediately after a successful import.
- Patient reference and safety answers are reset on a new import.
- Third-party page-capture/PDF JavaScript was removed from the patient page.
- PDF output now uses the browser's native Print / Save PDF flow.
- PNG export was removed to avoid reintroducing page-capture dependencies.
- Global CSP, frame protection, referrer policy, permissions policy and no-sniff headers were added in `vercel.json`.

## Version cleanup

- UI, package and service-worker cache version updated to v17.14.0.
