# SkinPlan Clinic v17.21.1 — Multi-user licensed access

This build is designed for selling/licensing SkinPlan to individual customers or clinics.

The public login now uses the approved warm cream/brown “Kingdom” theme with the waving bear hero. Authentication and the protected server-side engine are unchanged.

## What changed

- Login now uses a **username + password** instead of one shared access code.
- The SkinPlan owner has a protected **Access Control** panel at `/api/admin`.
- The owner can create customer accounts, disable/enable access, change passwords, rename usernames, add customer notes, and set an optional licence expiry date.
- Disabling an account, changing its password, renaming it, or changing its expiry increments the account session version, invalidating existing sessions on the next server check.
- The open clinic page checks session status periodically, so a revoked account is redirected back to login even if the page was left open.
- Passwords are never stored in plaintext. They are salted and hashed server-side with scrypt.
- User records are stored in Upstash Redis so account changes persist without editing or redeploying the SkinPlan source.
- The proprietary decision engine and product rankings remain server-side as in v17.17.0.

## Deployment

This is not a static-only website. Deploy to Vercel (or a compatible serverless platform), connect an Upstash Redis database, and configure the environment variables described in `SECURITY_DEPLOYMENT.md`.

## v17.21 secure library

Authenticated customers now have **Generate Plan | Product Library | Settings**. The Product Library is intentionally alphabetical and does not expose internal ranking order. The Owner Access Control page includes a protected **Formulary view** link for the full internal ranking.
