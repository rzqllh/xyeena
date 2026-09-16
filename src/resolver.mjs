import path from 'node:path';
import { normalizeText } from './util.mjs';

const INTENT_HINTS={
  'build-interface':['ui','ux','frontend','landing page','dashboard','redesign','responsive','component','design system'],
  'debug':['bug','debug','error','crash','regression','failing','broken','unexpected'],
  'research':['research','look up','docs','documentation','latest','api behavior','source'],
  'plan':['plan','implementation plan','roadmap','break down','tasks'],
  'review':['review','audit','diff','pull request','pr review'],
  'security':['auth','authorization','permission','secret','credential','injection','security','rls'],
  'release':['release','publish','deploy','merge','push'],
  'skill-authoring':['skill.md','agent skill','plugin skill','skill authoring'],
  'execute':['implement this plan','execute the plan','start implementation','build this task','code this'],
  'writing':['rewrite','copywriting','headline','cta','documentation','readme','code comment']
};

function pathMatch(pattern,p){
  if(!pattern||!p)return false; const ext=path.extname(p).toLowerCase();
  if(pattern.startsWith('**/*.')) return ext===pattern.slice(4).toLowerCase();
  if(pattern.endsWith('/**')) return p.replaceAll('\\','/').startsWith(pattern.slice(0,-3));
  return p.replaceAll('\\','/').includes(pattern.replaceAll('**',''));
}
function phraseMatch(text, phrase){ return text.includes(normalizeText(phrase)); }

export function resolveCapabilities(registry,{prompt='',state='TRIAGE',paths=[],maxSupporting=2}={}){
  const text=normalizeText(prompt); const scored=[];
  for(const cap of registry){
    const name=cap.metadata.name; if(name==='xyeena-core') continue;
    const a=cap.activation||{}; let score=0; const reasons=[]; const stateEligible=(a.states||[]).includes(state);
    for(const t of a.explicitTriggers||[]){if(phraseMatch(text,t)){score+=100;reasons.push(`explicit:${t}`)}}
    for(const sig of a.signals||[]){if(phraseMatch(text,sig)){score+=8;reasons.push(`signal:${sig}`)}}
    for(const intent of a.intents||[]){
      if(phraseMatch(text,intent)){score+=20;reasons.push(`intent:${intent}`)}
      for(const h of INTENT_HINTS[intent]||[]){if(phraseMatch(text,h)){score+=10;reasons.push(`hint:${h}`)}}
    }
    for(const patt of a.paths||[]) if(paths.some(p=>pathMatch(patt,p))){score+=12; reasons.push(`path:${patt}`)}
    if((a.exclude||[]).some(x=>phraseMatch(text,x))){score=-999;reasons.push('excluded')}
    if(score>0 && stateEligible){score+=15; reasons.unshift(`state:${state}`)}
    if(score>0) scored.push({name,score,reasons,capability:cap});
  }
  scored.sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name));
  const explicit=scored.filter(x=>x.score>=100);
  const primary=(explicit[0]||scored[0]||null);
  const supporting=[];
  if(primary){
    const allowed=new Set(primary.capability.chain?.allowed||[]);
    for(const item of scored){
      if(item.name===primary.name) continue;
      if(supporting.length>=maxSupporting) break;
      if(allowed.has(item.name) || item.score>=30) supporting.push(item);
    }
  }
  return {kernel:'xyeena-core',primary:primary?strip(primary):null,supporting:supporting.map(strip),candidates:scored.map(strip)};
}
function strip(x){return {name:x.name,score:x.score,reasons:x.reasons}}
