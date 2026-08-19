import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PRODUCTS,RANKINGS} from '../api/_private/formulary.mjs';

const shell=fs.readFileSync(new URL('../api/_private/app-shell.mjs',import.meta.url),'utf8');
const client=fs.readFileSync(new URL('../api/_private/app-client-source.mjs',import.meta.url),'utf8');
const endpoint=fs.readFileSync(new URL('../api/library.js',import.meta.url),'utf8');
const adminEndpoint=fs.readFileSync(new URL('../api/admin-formulary.js',import.meta.url),'utf8');
const adminShell=fs.readFileSync(new URL('../api/_private/admin-shell.mjs',import.meta.url),'utf8');
assert.match(shell,/Product Library/);
assert.match(client,/\/api\/library/);
assert.match(endpoint,/requireSession/);
assert.doesNotMatch(endpoint,/RANKINGS/);
assert.doesNotMatch(endpoint,/ROLE_LABELS/);
assert.doesNotMatch(endpoint,/\.why\b/);
assert.match(adminEndpoint,/requireAdmin/);
assert.match(adminEndpoint,/RANKINGS/);
assert.match(adminShell,/\/api\/admin-formulary/);
assert.equal(Object.keys(PRODUCTS).length,92);
assert.ok(Object.keys(RANKINGS).length>=20);
// The browser app must still not contain the proprietary ranking map.
assert.doesNotMatch(client,/const\s+RANKINGS\s*=/);
assert.doesNotMatch(shell,/acne_pigment_shared_robust/);
console.log('Secure product-library audit PASS');
