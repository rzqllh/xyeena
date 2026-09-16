import fs from 'node:fs'; import path from 'node:path'; import { PACKAGE_ROOT } from './paths.mjs'; import { loadRegistry } from './registry.mjs'; import { resolveCapabilities } from './resolver.mjs'; import { transition, initialRoute } from './governor.mjs'; import { classifyOperation } from './consent.mjs';
export function runEvals(){
 const fixtures=JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT,'evals','resolver.json'),'utf8')); const reg=loadRegistry(); let pass=0,fail=0; const details=[];
 for(const f of fixtures){const r=resolveCapabilities(reg,f.input); const actual=r.primary?.name||null; const ok=actual===f.expectedPrimary; details.push({name:f.name,ok,actual,expected:f.expectedPrimary}); ok?pass++:fail++;}
 const g=[['TRIAGE','route_execute','EXECUTE'],['VERIFY','fail_implementation','DEBUG'],['REVIEW','changes_required','EXECUTE']]; for(const [s,e,x] of g){const a=transition(s,e),ok=a===x;details.push({name:`governor ${s}/${e}`,ok,actual:a,expected:x});ok?pass++:fail++;}
 const c=[['git status','safe'],['npm publish','external'],['git reset --hard HEAD~1','destructive']]; for(const [op,x] of c){const a=classifyOperation(op).level,ok=a===x;details.push({name:`consent ${op}`,ok,actual:a,expected:x});ok?pass++:fail++;}
 return {pass,fail,details};
}
