# v17.18.0 — Multi-user licensed access architecture

## Goal

Support commercial licensing of one SkinPlan deployment to one or more customers while preserving owner control over access.

## Architecture

### Public layer

`/` contains only the username/password login page. No decision-engine source or internal ranking tables are present there.

### Persistent identity store

Customer records are stored server-side in Upstash Redis. Stored fields include username, password hash, role, enabled status, session version, optional expiry, owner note, creation/update timestamps and last-login timestamp.

Plaintext passwords are not stored.

### Owner role

The bootstrap owner has role `admin`. After authentication the owner is directed to `/api/admin`, where customer access can be managed without editing source files or changing environment variables.

### Customer role

Customer accounts have role `user`. After authentication they are directed to `/api/app`. Admin endpoints validate role server-side and reject customer sessions.

### Revocation model

Each account carries `sessionVersion`. The signed session token includes that version. Password changes, disable/enable, username changes and expiry changes increment the stored session version. Every protected API re-reads the current user record, so old tokens stop authorising requests immediately.

The browser application also checks `/api/session` periodically and returns to login if access has been revoked while the page is open.

### Password storage

Passwords use a unique random salt and Node's scrypt implementation with N=2^17, r=8, p=1, producing a 64-byte derived key. Verification uses constant-time comparison.

### Login abuse protection

The server counts failed/login attempts by source IP + normalised username in Redis and applies a sliding ten-minute limit in addition to any Vercel WAF rule configured by the owner.

## Security boundary

This user system controls access to the deployed application and server-side algorithm. It does not make browser-rendered HTML/CSS impossible for an authorised customer to inspect. The proprietary decision engine and ranking tables remain protected by keeping them out of browser-delivered code.
