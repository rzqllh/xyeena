import test from 'node:test'; import assert from 'node:assert/strict'; import { loadRegistry } from '../src/registry.mjs'; import { resolveCapabilities } from '../src/resolver.mjs';
const r=loadRegistry();
test('full grill explicit trigger wins',()=>assert.equal(resolveCapabilities(r,{prompt:'grill gua tentang auth',state:'DISCOVER'}).primary.name,'xyeena-grill'));
test('UI path and prompt route interface',()=>assert.equal(resolveCapabilities(r,{prompt:'redesign dashboard',paths:['src/a.tsx']}).primary.name,'xyeena-interface'));
test('supporting capability budget bounded',()=>assert.ok(resolveCapabilities(r,{prompt:'review auth UI security diff',state:'REVIEW'}).supporting.length<=2));
