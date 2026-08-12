# SkinPlan Clinic v17.8 — Reassessment + PDF Export Final

This version includes the final algorithm and report updates requested for the clinic website.

## What is improved in v17.8

### 1) Final algorithm correction
- Later phases no longer act like automatic guaranteed next steps.
- Every phase after the first now has an explicit **reassessment gate**.
- The user is told to move forward only **after 6–8 weeks**, only if the previous phase is tolerated, and only if a **re-scan / review still shows that the concern remains relevant**.
- This prevents the engine from automatically dropping acne / pigmentation / congestion treatment too early.

### 2) Easier-to-read summary section
- The old dense summary table has been replaced by **phase summary cards**.
- Each card shows:
  - when to start that phase,
  - the morning routine,
  - the example weekly evening plan,
  - and the spacing / safety rule.
- This makes the top summary easier to understand before reading the full routines below.

### 3) Export changes
- The old **Print** option has been removed.
- **Download PNG** remains available.
- A new **Download A4 PDF** button is included.
- The report is first rendered as a long image-style layout, then automatically sliced across multiple A4 pages and exported as a PDF.
- So the user can now download the plan in **two formats**:
  - PNG image
  - multi-page A4 PDF

## Files to deploy
Upload the full contents of this ZIP to the same GitHub repository and redeploy on Vercel.

## Important notes
- Product images remain local.
- Brand ranking, preferred-brand mode, and core fallback are retained.
- The website is still a clinical-support cosmetic maintenance tool, not a prescription system.

Cosmetic skincare maintenance guidance only — not a diagnosis or prescription.
