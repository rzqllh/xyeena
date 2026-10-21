import test from 'node:test'; import assert from 'node:assert/strict'; import { loadRegistry } from '../src/registry.mjs'; import { resolveCapabilities } from '../src/resolver.mjs';
const r=loadRegistry();
test('full grill explicit trigger wins',()=>assert.equal(resolveCapabilities(r,{prompt:'grill gua tentang auth',state:'DISCOVER'}).primary.name,'xyeena-grill'));
test('UI path and prompt route interface',()=>assert.equal(resolveCapabilities(r,{prompt:'redesign dashboard',paths:['src/a.tsx']}).primary.name,'xyeena-interface'));
test('supporting capability budget bounded',()=>assert.ok(resolveCapabilities(r,{prompt:'review auth UI security diff',state:'REVIEW'}).supporting.length<=2));

test('verification prompt containing "suites" does not falsely trigger UI',()=>{
  const result=resolveCapabilities(r,{
    prompt:'Verify all test suites and run security checks before releasing to main',
    state:'VERIFY'
  });
  assert.ok(result.primary);
  assert.notEqual(result.primary.name,'xyeena-interface');
  assert.equal(result.candidates.some(item=>item.name==='xyeena-interface'),false);
});
test('auth inside author and ui inside suites are not partial-word matches',()=>{
  const result=resolveCapabilities(r,{prompt:'An author documents test suites in a repository',state:'TRIAGE'});
  assert.equal(result.candidates.some(item=>item.name==='xyeena-security'),false);
  assert.equal(result.candidates.some(item=>item.name==='xyeena-interface'),false);
});
test('real standalone UI and auth keywords still route to matching skills',()=>{
  const ui=resolveCapabilities(r,{prompt:'Redesign UI/UX for the dashboard',state:'TRIAGE'});
  assert.equal(ui.primary?.name,'xyeena-interface');
  const security=resolveCapabilities(r,{prompt:'Audit auth token security in the backend',state:'REVIEW'});
  assert.ok(security.candidates.some(item=>item.name==='xyeena-security'));
});
test('punctuation and hyphen boundaries retain literal phrase matching',()=>{
  const result=resolveCapabilities(r,{prompt:'Need UI-based redesign and a security review',state:'TRIAGE'});
  assert.ok(result.candidates.some(item=>item.name==='xyeena-interface'));
});
