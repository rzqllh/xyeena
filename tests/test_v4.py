"""Regression checks for source package and offline CLI; no host runtime is simulated."""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LEDGERS=('project-state.json','requirements.json','evidence.json','verification.json')


class V4Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source=ROOT

    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='lean-v4-')
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'source'
        shutil.copytree(ROOT,self.root,ignore=shutil.ignore_patterns('__pycache__','.pytest_cache'))

    def run_cli(self,*args):
        return subprocess.run([sys.executable,str(self.root/'scripts/v4.py'),*args],
                              cwd=self.root,capture_output=True,text=True)

    def test_source_template_validator_passes(self):
        x=self.run_cli('check','--template')
        self.assertEqual(x.returncode,0,x.stdout+x.stderr)

    def test_lean_contract_budget_and_invariants(self):
        text=(self.root/'AGENTS.md').read_text()
        self.assertGreaterEqual(len(text.splitlines()),60)
        self.assertLessEqual(len(text.splitlines()),100)
        self.assertLessEqual(len(text.encode()),8192)
        for term in ('GO','NOT RUN','file:line','YAGNI','todo','self'):
            self.assertIn(term.lower(),text.lower())
        self.assertNotIn(chr(0x2014),text)

    def test_host_adapters_are_native_imports_not_bootstrap(self):
        for name in ('CLAUDE.md','GEMINI.md'):
            text=(self.root/name).read_text()
            self.assertTrue(text.startswith('@AGENTS.md\n'))
            self.assertLessEqual(len(text.splitlines()),6)
            self.assertNotIn('ANTISLOP.md',text)
        cursor=(self.root/'.cursor/rules/v4-core.mdc').read_text()
        self.assertNotIn('alwaysApply: true',cursor)

    def test_scoped_rules_reference_real_domain_files(self):
        for name in ('.claude/rules/ui-quality.md','.cursor/rules/ui-quality.mdc',
                     '.github/instructions/ui-quality.instructions.md'):
            self.assertIn('DESIGN-QUALITY.md',(self.root/name).read_text())
        self.assertIn('Hallmark',(self.root/'.vibe/standards/DESIGN-QUALITY.md').read_text())

    def test_no_old_template_boilerplate(self):
        documents=list((self.root/'templates').rglob('*.md'))
        self.assertEqual(len(documents),59)
        for file in documents:
            text=file.read_text()
            for tag in ('GLOBAL-ANTISLOP','## Document control','## Evidence inventory'):
                self.assertNotIn(tag,text,str(file))

    def test_detects_missing_host_reference(self):
        (self.root/'CLAUDE.md').write_text('@MISSING.md\n')
        r=self.run_cli('check','--template')
        self.assertEqual(r.returncode,1)
        self.assertIn('broken native import',r.stdout)

    def test_detects_missing_scoped_file_reference(self):
        (self.root/'.vibe/standards/DESIGN-QUALITY.md').unlink()
        r=self.run_cli('check','--template')
        self.assertEqual(r.returncode,1)
        self.assertIn('missing core source',r.stdout)

    def test_detects_excessive_agent_lines(self):
        p=self.root/'AGENTS.md'
        p.write_text(p.read_text()+'\n'.join(['- redundant instruction']*50))
        r=self.run_cli('check','--template')
        self.assertEqual(r.returncode,1)
        self.assertIn('60-100 lines',r.stdout)

    def test_detects_legacy_template_marker(self):
        p=self.root/'templates/PRD.md'
        p.write_text(p.read_text()+'\n<!-- GLOBAL-ANTISLOP -->')
        r=self.run_cli('check','--template')
        self.assertEqual(r.returncode,1)
        self.assertIn('legacy mandatory boilerplate',r.stdout)

    def test_catalog_unknown_upstream_rejected(self):
        p=self.root/'.vibe/catalog.json';cat=json.loads(p.read_text())
        cat['templates'][0]['upstream'].append('unknown-made-up-skill')
        p.write_text(json.dumps(cat))
        r=self.run_cli('check','--template')
        self.assertEqual(r.returncode,1)
        self.assertIn('unregistered upstream',r.stdout)

    def test_init_only_creates_draft_no_ledgers(self):
        r=self.run_cli('init','--name','Example','--types','web,api')
        self.assertEqual(r.returncode,0,r.stdout)
        self.assertTrue((self.root/'PROJECT-BRIEF.md').exists())
        self.assertIn('not implementation approval',(self.root/'PROJECT-BRIEF.md').read_text())
        for ledger in LEDGERS:self.assertFalse((self.root/'.vibe'/ledger).exists())
        self.assertEqual(self.run_cli('init','--name','Other').returncode,2)

    def test_activate_and_refuse_overwrite(self):
        p=self.root/'PRD.md'
        self.assertEqual(self.run_cli('activate','prd').returncode,0)
        original=p.read_text()
        self.assertIn('V4-TEMPLATE id=prd',original)
        self.assertEqual(self.run_cli('activate','prd').returncode,2)
        self.assertEqual(p.read_text(),original)

    def test_dry_run_and_invalid_id(self):
        self.assertEqual(self.run_cli('activate','schema','--dry-run').returncode,0)
        self.assertFalse((self.root/'docs/schema.md').exists())
        self.assertEqual(self.run_cli('activate','made-up').returncode,2)

    def test_prevent_symlink_escape(self):
        dest=self.root/'docs/adr'
        external=Path(self.temp.name)/'outside';external.mkdir()
        try:dest.symlink_to(external,target_is_directory=True)
        except OSError:self.skipTest('symlinks unsupported')
        r=self.run_cli('activate','adr')
        self.assertEqual(r.returncode,2,r.stdout)
        self.assertIn('escapes repository',r.stdout)
        self.assertEqual(list(external.iterdir()),[])

    def test_project_check_warns_on_unfinished_draft_and_strict_rejects(self):
        self.assertEqual(self.run_cli('activate','prd').returncode,0)
        r=self.run_cli('check','--project')
        self.assertEqual(r.returncode,0,r.stdout)
        self.assertIn('unresolved draft placeholder',r.stdout)
        r=self.run_cli('check','--project','--strict')
        self.assertEqual(r.returncode,1)

    def test_project_check_rejects_phase_ledger(self):
        (self.root/'.vibe/project-state.json').write_text('{}')
        r=self.run_cli('check','--project')
        self.assertEqual(r.returncode,1)
        self.assertIn('legacy empty lifecycle ledger',r.stdout)

    def test_suggest_does_not_change_project(self):
        r=self.run_cli('suggest','--types','ai,web')
        self.assertEqual(r.returncode,0,r.stdout)
        self.assertFalse((self.root/'PROJECT-BRIEF.md').exists())


if __name__=='__main__':unittest.main()
