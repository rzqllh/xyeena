import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AntigravityAdapter,
  ClaudeCodeAdapter,
  CodexAdapter,
  HermesAdapter,
  SkillInstaller
} from '../../src/adapters/index.mjs';
import { ERROR_CODES, XyeenaError } from '../../src/core/errors.mjs';

describe('M4 Host Adapters: Unit Verification Suite', () => {

  describe('Host Detection & Inspection', () => {
    it('detects Antigravity host environment and inspects tools', () => {
      const adapter = new AntigravityAdapter({
        env: { ANTIGRAVITY_APP_DIR: 'C:/fake/app' }
      });
      assert.strictEqual(adapter.detect(), true);

      const caps = adapter.inspectCapabilities({
        run_command: true,
        read_file: true,
        write_file: true,
        edit_file: true,
        invoke_subagent: true
      });
      assert.strictEqual(caps.hasTerminalTool, true);
      assert.strictEqual(caps.hasSubagentTools, true);
    });

    it('detects Claude Code host environment', () => {
      const adapter = new ClaudeCodeAdapter({
        env: { CLAUDE_CODE_ENTRY: '1' }
      });
      assert.strictEqual(adapter.detect(), true);
      assert.ok(adapter.getSkillLocations().some(p => p.includes('.claude')));
    });

    it('detects Codex and Hermes host environments', () => {
      const codex = new CodexAdapter({ env: { CODEX_SESSION: 'xyz' } });
      assert.strictEqual(codex.detect(), true);

      const hermes = new HermesAdapter({ env: { HERMES_HOME: '/tmp/hermes' } });
      assert.strictEqual(hermes.detect(), true);
    });
  });

  describe('Installer & Reversibility', () => {
    it('generates a dry-run preview without modifying filesystem', () => {
      const preview = SkillInstaller.preview('antigravity');
      assert.strictEqual(preview.dryRun, true);
      assert.strictEqual(preview.reversible, true);
      assert.strictEqual(preview.requiresConsent, true);
    });

    it('blocks installation when user consent is not granted', () => {
      assert.throws(() => {
        SkillInstaller.install('antigravity', { userConsented: false });
      }, (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.PERMISSION_DENIED;
      });
    });

    it('executes idempotent installation when consent is granted', () => {
      const res = SkillInstaller.install('antigravity', { userConsented: true });
      assert.strictEqual(res.status, 'INSTALLED');
      assert.strictEqual(res.idempotent, true);
    });

    it('executes clean uninstallation with consent', () => {
      const res = SkillInstaller.uninstall('antigravity', { userConsented: true });
      assert.strictEqual(res.status, 'UNINSTALLED');
      assert.ok(res.removedSkills.length >= 3);
    });
  });

});
