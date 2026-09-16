import test from 'node:test'; import assert from 'node:assert/strict'; import { transition,initialRoute,breaker } from '../src/governor.mjs';
test('low risk goes execute',()=>assert.equal(initialRoute({}),'EXECUTE'));
test('high ambiguity goes discover',()=>assert.equal(initialRoute({ambiguity:'HIGH'}),'DISCOVER'));
test('verify implementation failure goes debug',()=>assert.equal(transition('VERIFY','fail_implementation'),'DEBUG'));
test('review loop breaker trips',()=>assert.equal(breaker([{type:'review-cycle'},{type:'review-cycle'},{type:'review-cycle'}]).trip,true));
