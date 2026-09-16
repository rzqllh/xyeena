import test from 'node:test'; import assert from 'node:assert/strict'; import { validateSource } from '../src/validate.mjs'; import { PACKAGE_ROOT } from '../src/paths.mjs';
test('source validates',()=>{const r=validateSource(PACKAGE_ROOT);assert.equal(r.ok,true,JSON.stringify(r.errors));assert.ok(r.capabilities.length>=10)});
