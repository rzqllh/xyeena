import test from 'node:test'; import assert from 'node:assert/strict'; import { classifyOperation } from '../src/consent.mjs';
test('read is safe',()=>assert.equal(classifyOperation('git status').level,'safe'));
test('publish needs external consent',()=>assert.equal(classifyOperation('npm publish').level,'external'));
test('force reset destructive',()=>assert.equal(classifyOperation('git reset --hard HEAD~1').level,'destructive'));
