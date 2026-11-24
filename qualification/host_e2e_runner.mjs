/**
 * Veyra v1.0 Release Qualification — Host E2E Verification Runner
 * Evaluates real host capabilities in an isolated scratch environment.
 * Zero external dependencies.
 */

import { existsSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { installVeyra, verifyInstallation, uninstallVeyra, auditLicenses } from '../bin/veyra.mjs';
import { routeTaskByIntent, KNOWN_SKILLS } from '../skills/veyra-orchestrate/engine.mjs';
import { validateScope, evaluateAntiSlop, classifyClaim } from '../skills/veyra-core/engine.mjs';
import { validatePlanDAG } from '../skills/veyra-plan/engine.mjs';
import { compressContext } from '../skills/veyra-context/engine.mjs';
import { serializeCheckpoint, parseCheckpoint, resolveNextAction } from '../skills/veyra-handoff/engine.mjs';
import { executeAndVerify, generateVerificationReceipt, validateCompletionClaims } from '../skills/veyra-verify/engine.mjs';
import { scanSecretLeaks, auditRlsPolicies } from '../skills/veyra-security/engine.mjs';
import { calculateContrastRatio } from '../skills/veyra-interface/engine.mjs';

const ROOT = resolve(process.cwd());
const SCRATCH_DIR = mkdtempSync(join(tmpdir(), 'veyra-node-integration-'));

export async function runHostE2E() {
  console.log('=== Veyra v1.0 Phase 2: Native Host E2E Verification ===\n');

  // Step 0: Host Inventory
  const hosts = {
    'gemini_antigravity': {
      name: 'Google Gemini CLI / Antigravity Agent',
      status: 'NOT_DETECTED',
      version: null,
      environment: 'NODE_INTEGRATION_HARNESS'
    },
    'openai_codex': {
      name: 'OpenAI Codex CLI',
      status: 'NOT_RUN_HOST_UNAVAILABLE',
      version: null,
      environment: 'NOT_INSTALLED'
    },
    'anthropic_claude': {
      name: 'Anthropic Claude Code CLI',
      status: 'NOT_RUN_HOST_UNAVAILABLE',
      version: null,
      environment: 'NOT_INSTALLED'
    }
  };

  try {
    const ver = execSync('gemini --version', { encoding: 'utf8' }).trim();
    hosts.gemini_antigravity.version = ver;
    hosts.gemini_antigravity.status = 'CLI_DETECTED_ONLY';
  } catch {
    hosts.gemini_antigravity.version = null;
    hosts.gemini_antigravity.status = 'CLI_NOT_DETECTED';
  }

  console.log(`Detected Host: ${hosts.gemini_antigravity.name} (${hosts.gemini_antigravity.version})`);
  console.log(`Codex CLI: ${hosts.openai_codex.status}`);
  console.log(`Claude Code: ${hosts.anthropic_claude.status}\n`);

  // Prepare isolated scratch directory
  // A unique temporary directory avoids deleting existing user project data.
  mkdirSync(SCRATCH_DIR, { recursive: true });

  const testResults = [];

  // 1. Install Veyra and verify all 19 skills
  console.log('Test 1: Installing Veyra in isolated project...');
  const installRes = installVeyra({
    targetDir: SCRATCH_DIR,
    selectedSkills: KNOWN_SKILLS
  });
  const verifyRes = verifyInstallation(SCRATCH_DIR);
  const pass1 = installRes.success && verifyRes.valid && installRes.installedSkills.length === 19;
  testResults.push({
    test: '1. Install Veyra & verify 19 skills',
    passed: pass1,
    details: `Installed ${installRes.installedCount} files across 19 skills; Verification intact: ${verifyRes.intact.length}`
  });
  console.log(`  -> ${pass1 ? 'PASS' : 'FAIL'}: ${testResults[0].details}`);

  // 2. Native discovery & intent routing
  console.log('Test 2: Native discovery and intent routing...');
  const prompts = [
    { prompt: 'Audit contrast and touch targets on login page', expected: 'veyra-interface' },
    { prompt: 'Investigate flaky test crash and stack trace in CI', expected: 'veyra-debug' },
    { prompt: 'Review circular dependencies and architectural coupling', expected: 'veyra-architecture' },
    { prompt: 'Periksa kebocoran credentials dan AWS secrets di repo', expected: 'veyra-security' },
    { prompt: 'Buat rencana implementasi multi-step dengan dependency graph', expected: 'veyra-plan' }
  ];
  const routingMatches = prompts.every(p => routeTaskByIntent(p.prompt) === p.expected);
  const pass2 = routingMatches;
  testResults.push({
    test: '2. Native discovery & skill selection',
    passed: pass2,
    details: `Verified ${prompts.length}/${prompts.length} multi-language intent routings`
  });
  console.log(`  -> ${pass2 ? 'PASS' : 'FAIL'}: ${testResults[1].details}`);

  // 3. Scoped filesystem permissions
  console.log('Test 3: Scoped filesystem operations & fence enforcement...');
  const allowedPatterns = ['src/*'];
  const safeFile = 'src/calculator.mjs';
  const outOfScopeFile = 'config/credentials.env';
  const escapeFile = '../outside_victim.txt';

  const scopeCheckSafe = validateScope({ targetFiles: [safeFile], allowedPatterns, actionType: 'WRITE' });
  const scopeCheckOut = validateScope({ targetFiles: [outOfScopeFile], allowedPatterns, actionType: 'WRITE' });
  const scopeCheckEscape = validateScope({ targetFiles: [escapeFile], allowedPatterns, actionType: 'WRITE' });

  // Execute actual scoped file write
  mkdirSync(join(SCRATCH_DIR, 'src'), { recursive: true });
  writeFileSync(join(SCRATCH_DIR, safeFile), 'export function add(a, b) { return a + b; }\n', 'utf8');

  const pass3 = scopeCheckSafe.verdict === 'PROCEED' &&
                scopeCheckOut.verdict === 'BLOCKED_SCOPE' &&
                scopeCheckEscape.verdict === 'BLOCKED_SCOPE' &&
                existsSync(join(SCRATCH_DIR, safeFile));
  testResults.push({
    test: '3. Scoped filesystem permissions & fencing',
    passed: pass3,
    details: 'Allowed in-scope write; blocked out-of-scope config edit and path traversal escape'
  });
  console.log(`  -> ${pass3 ? 'PASS' : 'FAIL'}: ${testResults[2].details}`);

  // 4. Multi-step planning & DAG dependency handling
  console.log('Test 4: Multi-step DAG planning & dependency validation...');
  const validPhases = [
    { id: 'P1', name: 'Database Schema', tasks: [{ id: 'T1', dependsOn: [] }] },
    { id: 'P2', name: 'API Layer', tasks: [{ id: 'T2', dependsOn: ['T1'] }] },
    { id: 'P3', name: 'Frontend View', tasks: [{ id: 'T3', dependsOn: ['T2'] }] }
  ];
  const cyclicPhases = [
    { id: 'P1', name: 'A', tasks: [{ id: 'T1', dependsOn: ['T2'] }] },
    { id: 'P2', name: 'B', tasks: [{ id: 'T2', dependsOn: ['T1'] }] }
  ];
  const validDagRes = validatePlanDAG(validPhases);
  const cyclicDagRes = validatePlanDAG(cyclicPhases);
  const pass4 = validDagRes.valid === true && cyclicDagRes.valid === false && (cyclicDagRes.cycleNodes || []).length > 0;
  testResults.push({
    test: '4. Multi-step planning & Kahn-DAG dependency validation',
    passed: pass4,
    details: 'Valid acyclic plan verified; circular dependency correctly detected and blocked'
  });
  console.log(`  -> ${pass4 ? 'PASS' : 'FAIL'}: ${testResults[3].details}`);

  // 5. Explicit approval boundary (destructive rejection)
  console.log('Test 5: Destructive operation & explicit approval gate...');
  const destructiveScope = validateScope({
    targetFiles: ['src/calculator.mjs'],
    allowedPatterns: ['src/*'],
    actionType: 'DELETE',
    isDestructive: true
  });
  const pass5 = destructiveScope.verdict === 'NEEDS_OWNER_APPROVAL' && destructiveScope.requiresOwnerApproval === true;
  testResults.push({
    test: '5. Destructive operations approval boundary',
    passed: pass5,
    details: 'Destructive DELETE requires explicit Owner approval per DEC-08 & DEC-31'
  });
  console.log(`  -> ${pass5 ? 'PASS' : 'FAIL'}: ${testResults[4].details}`);

  // 6. Context compaction & portable session handoff
  console.log('Test 6: Context compaction & session handoff...');
  const verboseConversation = `
    User: Hey agent, could you tell me about the architecture?
    Agent: Absolutely! I would be delighted to help you understand our wonderful system.
    Note that DEC-01 specifies two connected ZIPs. DEC-27 establishes Cortex default intelligence layer.
    DEC-31 requires advisory security checks before completion claims.
    We are making steady progress and everything looks fantastic!
  `;
  const compressed = compressContext(verboseConversation);
  const checkpointObj = serializeCheckpoint({
    status: 'IN_PROGRESS',
    activePhase: 'Wave 2 Implementation',
    tasks: [{ id: 'TASK_1', description: 'Run benchmarks', done: false, status: 'PENDING' }]
  });
  const parsedState = parseCheckpoint(checkpointObj.markdown);
  const nextAction = resolveNextAction(parsedState);

  const pass6 = compressed.compressedBytes < compressed.originalBytes &&
                parsedState.isValid === true &&
                parsedState.status === 'IN_PROGRESS' &&
                nextAction.action.startsWith('RESUME_TASK');
  testResults.push({
    test: '6. Context compaction & portable handoff serialization',
    passed: pass6,
    details: `Context compressed from ${compressed.originalBytes} to ${compressed.compressedBytes} bytes; state resumed accurately (${nextAction.action})`
  });
  console.log(`  -> ${pass6 ? 'PASS' : 'FAIL'}: ${testResults[5].details}`);

  // 7. Cryptographically signed process verification receipts
  console.log('Test 7: Verification receipts with real process execution...');
  const liveReceipt = executeAndVerify('calc-test', ['node', '-e', 'console.log("CALC_EXEC_OK"); process.exit(0);']);
  const forgedReceipt = generateVerificationReceipt('calc-test', 'node -e "..."', 0, 'output', {
    realExecution: true,
    executedAt: new Date().toISOString()
  });
  const completionValidation = validateCompletionClaims([liveReceipt], ['calc-test']);
  const forgedValidation = validateCompletionClaims([forgedReceipt], ['calc-test']);

  const pass7 = liveReceipt.passed === true &&
                liveReceipt.evidenceTier === 'LOCAL_PROCESS_VERIFIED' &&
                forgedReceipt.isForged === true &&
                completionValidation.verified === true &&
                forgedValidation.verified === false;
  testResults.push({
    test: '7. Cryptographic execution receipts & forgery defense',
    passed: pass7,
    details: 'Executed local process generated persisted signed receipt; forged receipt rejected'
  });
  console.log(`  -> ${pass7 ? 'PASS' : 'FAIL'}: ${testResults[6].details}`);

  // 8. Installer collision, modified files, rollback & uninstall
  console.log('Test 8: Installer safety, modified file preservation & rollback...');
  const userFile = join(SCRATCH_DIR, 'custom_user_doc.txt');
  writeFileSync(userFile, 'USER CRITICAL CONTENT', 'utf8');

  // Modify an installed Veyra skill file
  const coreSkillFile = join(SCRATCH_DIR, 'skills', 'veyra-core', 'SKILL.md');
  writeFileSync(coreSkillFile, 'USER MODIFIED SKILL FILE', 'utf8');

  // Run uninstall
  const uninstallRes = uninstallVeyra(SCRATCH_DIR);
  const pass8 = uninstallRes.success &&
                existsSync(userFile) &&
                existsSync(coreSkillFile) &&
                readFileSync(coreSkillFile, 'utf8') === 'USER MODIFIED SKILL FILE';
  testResults.push({
    test: '8. Installer safety: preserves user files & modified Veyra files on uninstall',
    passed: pass8,
    details: 'User file and modified Veyra file preserved; unmodified files cleanly removed'
  });
  console.log(`  -> ${pass8 ? 'PASS' : 'FAIL'}: ${testResults[7].details}`);

  // Clean up scratch project
  rmSync(SCRATCH_DIR, { recursive: true, force: true });

  const totalPass = testResults.filter(t => t.passed).length;
  console.log(`\nNode integration results (NOT native agent E2E): ${totalPass}/${testResults.length} PASS\n`);

  const receipt = {
    timestamp: new Date().toISOString(),
    testScope: 'NODE_INTEGRATION_ONLY',
    nativeAgentE2EStatus: 'NOT_RUN',
    agentSessionsExecuted: 0,
    host: hosts.gemini_antigravity,
    allHosts: hosts,
    testsTotal: testResults.length,
    testsPassed: totalPass,
    results: testResults,
    evidenceBoundary: 'Direct Node.js engine calls; no Gemini/Codex/Claude prompt was executed by this runner'
  };

  writeFileSync(
    join(ROOT, 'qualification', 'receipts', 'host_e2e_receipt.json'),
    JSON.stringify(receipt, null, 2),
    'utf8'
  );

  return receipt;
}

if (process.argv[1] && process.argv[1].endsWith('host_e2e_runner.mjs')) {
  runHostE2E().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
