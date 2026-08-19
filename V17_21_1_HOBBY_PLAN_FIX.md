# SkinPlan v17.21.1 — Vercel Hobby compatibility fix

v17.21.0 added two new protected endpoints and pushed the project to 13 top-level files under `/api`, which Vercel treated as 13 Serverless Functions. The Hobby plan build therefore failed at the 12-function limit and production stayed on v17.20.0.

v17.21.1 consolidates protected client assets and the Owner Formulary view into the existing `/api/app` and `/api/admin` handlers. The project now has 10 top-level Serverless Functions, preserving the Secure Product Library while leaving two function slots free on the Hobby plan.

Routes:
- `/api/app` — authenticated clinic app
- `/api/app?asset=client` — authenticated app JavaScript
- `/api/admin` — owner access control
- `/api/admin?asset=client` — owner-only admin JavaScript
- `/api/admin?view=formulary` — owner-only internal formulary ranking
- `/api/library` — authenticated, ranking-free customer product catalogue
