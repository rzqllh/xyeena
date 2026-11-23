#!/usr/bin/env python3
"""Offline source-template helper. Project exports do not require this CLI or JSON ledgers."""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIBE = ROOT / '.vibe'
CATEGORIES = {'all','nonsoftware','web','mobile','desktop','api','data','ai','game','cli','embedded','infra'}
CORE = ('AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'START-HERE.md', 'MASTER-PROMPT.md',
        '.vibe/catalog.json', '.vibe/standards/DESIGN-QUALITY.md',
        '.vibe/upstream/sources.json')
HOST_FILES = ('CLAUDE.md','GEMINI.md')
FORBIDDEN_EXPORT = ('.vibe/project-state.json', '.vibe/evidence.json',
                    '.vibe/requirements.json', '.vibe/verification.json')
INSTRUCTION_FILES = ('AGENTS.md','CLAUDE.md','GEMINI.md','START-HERE.md',
                     'MASTER-PROMPT.md','.cursor/rules/v4-core.mdc',
                     '.github/copilot-instructions.md')


def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def catalog():
    return read_json(VIBE/'catalog.json')['templates']


def safe_relative(value):
    if not isinstance(value,str) or not value or '\\' in value or value.startswith('/'):
        return None
    path=Path(value)
    if path.is_absolute() or any(seg in ('.','..','') for seg in path.parts):
        return None
    return path


def report(errors,warnings):
    for e in errors: print('FAIL:',e)
    for w in warnings: print('WARN:',w)
    print(f'SUMMARY: {len(errors)} failure(s), {len(warnings)} warning(s)')
    return 1 if errors else 0


def validate_instructions(errors):
    for name in INSTRUCTION_FILES:
        if not (ROOT/name).is_file(): errors.append('missing instruction: '+name)
    if errors: return
    text=(ROOT/'AGENTS.md').read_text(encoding='utf-8')
    lines=len(text.splitlines())
    if not 60<=lines<=100: errors.append('AGENTS.md must be 60-100 lines; observed '+str(lines))
    if len(text.encode())>8192: errors.append('AGENTS.md exceeds 8192-byte lean core budget')
    for expected in ('GO','NOT RUN','file:line','todo','YAGNI'):
        if expected.lower() not in text.lower(): errors.append('missing core invariant: '+expected)
    if '\u2014' in text: errors.append('AGENTS.md contains forbidden em dash')
    for name in HOST_FILES:
        body=(ROOT/name).read_text(encoding='utf-8')
        if not body.startswith('@AGENTS.md\n'):
            errors.append(name+' must start with @AGENTS.md')
        if len(body.splitlines())>6 or len(body.encode())>512:
            errors.append(name+' must remain ultra-thin (<=6 lines, <=512 bytes)')
        if '.vibe/catalog.json' in body or 'ANTISLOP.md' in body:
            errors.append(name+' repeats mandatory bootstrap')
    cursor=(ROOT/'.cursor/rules/v4-core.mdc').read_text(encoding='utf-8')
    if re.search(r'alwaysApply:\s*true',cursor): errors.append('Cursor pointer must not alwaysApply')
    for name in INSTRUCTION_FILES:
        body=(ROOT/name).read_text(encoding='utf-8')
        if 'GLOBAL-ANTISLOP' in body: errors.append('legacy GLOBAL-ANTISLOP instruction: '+name)
        # Known internal file pointers in root instruction files, not speculative output docs.
        for ref in re.findall(r'`((?:\.vibe/|\.claude/|\.cursor/|\.github/|scripts/|tests/)[\w./-]+\.(?:md|json|py|mdc))`',body):
            if not (ROOT/ref).is_file(): errors.append('broken instruction reference: '+name+' -> '+ref)
        for ref in re.findall(r'^@([\w./-]+\.md)\s*$',body,re.M):
            if not (ROOT/ref).is_file(): errors.append('broken native import: '+name+' -> '+ref)


def check_template():
    errors,warnings=[],[]
    for f in CORE:
        if not (ROOT/f).is_file(): errors.append('missing core source: '+f)
    if errors: return report(errors,warnings)
    validate_instructions(errors)
    try:
        docs=catalog(); upstream=read_json(VIBE/'upstream/sources.json')
    except (OSError,ValueError,KeyError) as exc:
        return report(errors+['catalog/upstream unreadable: '+str(exc)],warnings)
    known={x.get('id') for x in upstream.get('sources',[])}
    ids,outputs=set(),set()
    for doc in docs:
        tid=doc.get('id'); src=doc.get('template'); output=doc.get('output')
        if not isinstance(tid,str) or not re.fullmatch('[a-z][a-z0-9-]*',tid):
            errors.append('invalid id: '+str(tid));continue
        if tid in ids: errors.append('duplicate id: '+tid)
        ids.add(tid)
        if output in outputs: errors.append('duplicate output: '+str(output))
        outputs.add(output)
        a,b=safe_relative(src),safe_relative(output)
        if not a or not b or not src.startswith('templates/'):
            errors.append('unsafe document path: '+tid);continue
        if not (ROOT/a).is_file(): errors.append('missing source: '+src);continue
        content=(ROOT/a).read_text(encoding='utf-8')
        if f'V4-TEMPLATE id={tid};' not in content:
            errors.append('missing template identifier: '+src)
        if 'GLOBAL-ANTISLOP' in content or '## Document control' in content or '## Evidence inventory' in content:
            errors.append('legacy mandatory boilerplate: '+src)
        if not content.lstrip().startswith('# '): errors.append('missing document heading: '+src)
        if len(content.splitlines())<8: warnings.append('short template: '+src)
        for upstream_id in doc.get('upstream',[]):
            if upstream_id not in known: errors.append('unregistered upstream: '+tid+' / '+str(upstream_id))
            else:
                u=next(s for s in upstream['sources'] if s.get('id')==upstream_id)
                if u.get('status')=='candidate': errors.append('unverified upstream rule: '+tid+' / '+upstream_id)
    if len(docs)<40: warnings.append('small universal authoring catalog')
    for banned in FORBIDDEN_EXPORT:
        if (ROOT/banned).exists(): errors.append('unused legacy ledger present: '+banned)
    print('Checked',len(docs),'adaptive source templates and lean agent instructions.')
    return report(errors,warnings)


def check_project(strict=False):
    errors,warnings=[],[]
    for f in ('AGENTS.md','CLAUDE.md','GEMINI.md'):
        if not (ROOT/f).is_file(): errors.append('missing core instruction: '+f)
    if errors: return report(errors,warnings)
    validate_instructions(errors) if all((ROOT/f).exists() for f in INSTRUCTION_FILES) else None
    for banned in FORBIDDEN_EXPORT:
        if (ROOT/banned).exists(): errors.append('legacy empty lifecycle ledger: '+banned)
    # Only real project documents, not template authoring catalog or tooling.
    docs=[p for p in ROOT.rglob('*.md') if 'templates' not in p.relative_to(ROOT).parts
          and not any(seg in {'.vibe','.github','.cursor','.claude','.agents','tests'} for seg in p.relative_to(ROOT).parts)]
    for file in docs:
        rel=str(file.relative_to(ROOT));body=file.read_text(encoding='utf-8')
        if 'GLOBAL-ANTISLOP' in body and rel not in ('CHANGELOG.md','BLUEPRINT.md'):
            errors.append('legacy doc tag: '+rel)
        if '[[FILL:' in body:
            (errors if strict else warnings).append('unresolved draft placeholder: '+rel)
    print('Checked project documents:',len(docs),'(strict='+str(strict)+').')
    return report(errors,warnings)


def item_by_id(tid):
    return next((x for x in catalog() if x['id']==tid),None)


def cmd_list(args):
    for d in catalog():
        if not args.category or d['category']==args.category:
            print(f"{d['id']:<20} {d['category']:<14} -> {d['output']}")
    return 0


def cmd_suggest(args):
    types={x.strip().lower() for x in args.types.split(',') if x.strip()}
    if not types or types-CATEGORIES:
        print('ERROR: unsupported project types:',', '.join(sorted(types-CATEGORIES)),file=sys.stderr)
        return 2
    proposed=[d for d in catalog() if 'all' in d['tags'] or bool(types.intersection(d['tags']))]
    suggested=[d['id'] for d in proposed if d['priority']=='recommended']
    optional=[d['id'] for d in proposed if d['priority']=='conditional']
    print('Suggested, not activated:',', '.join(suggested) or 'none')
    print('Only if useful:',', '.join(optional[:20]) or 'none')
    return 0


def cmd_init(args):
    target=ROOT/'PROJECT-BRIEF.md'
    if not args.name.strip() or target.exists() or target.is_symlink():
        print('REFUSED: blank project name or existing PROJECT-BRIEF.md; no overwrite')
        return 2
    if not set(args.types.split(','))<=CATEGORIES:
        print('ERROR: unsupported project type');return 2
    target.write_text('# Project brief (draft)\n\nProject: '+args.name.strip()+
                      '\nTypes: '+args.types+'\nStatus: proposed, not implementation approval\n',encoding='utf-8')
    print('Created PROJECT-BRIEF.md draft only. No phase ledger or approval implied.')
    return 0


def cmd_activate(args):
    d=item_by_id(args.id)
    if not d:
        print('ERROR: unknown template id:',args.id);return 2
    src=safe_relative(d['template']);target=safe_relative(d['output'])
    if src is None or target is None: print('ERROR: unsafe template path');return 2
    dst=ROOT/target
    if not dst.parent.resolve().is_relative_to(ROOT.resolve()):
        print('REFUSED: target escapes repository via symlink');return 2
    if dst.exists() or dst.is_symlink():
        print('REFUSED: existing file would be overwritten:',target);return 2
    if args.dry_run:
        print('DRY RUN: copy',src,'->',target);return 0
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(ROOT/src,dst)
    print('Activated',args.id,'->',target,'as unapproved draft.')
    return 0


def main(argv=None):
    parser=argparse.ArgumentParser(description='V4 lean, offline template helper')
    sub=parser.add_subparsers(dest='action',required=True)
    x=sub.add_parser('list');x.add_argument('--category')
    x=sub.add_parser('suggest');x.add_argument('--types',required=True)
    x=sub.add_parser('init');x.add_argument('--name',required=True);x.add_argument('--types',default='all')
    x=sub.add_parser('activate');x.add_argument('id');x.add_argument('--dry-run',action='store_true')
    x=sub.add_parser('check');g=x.add_mutually_exclusive_group(required=True)
    g.add_argument('--template',action='store_true');g.add_argument('--project',action='store_true')
    x.add_argument('--strict',action='store_true')
    a=parser.parse_args(argv)
    if a.action=='list': return cmd_list(a)
    if a.action=='suggest': return cmd_suggest(a)
    if a.action=='init': return cmd_init(a)
    if a.action=='activate': return cmd_activate(a)
    if a.action=='check': return check_template() if a.template else check_project(a.strict)
    return 2


if __name__=='__main__': sys.exit(main())
