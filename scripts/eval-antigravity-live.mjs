import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const LOCALAPPDATA = process.env.LOCALAPPDATA || (process.env.USERPROFILE ? join(process.env.USERPROFILE, 'AppData', 'Local') : '');
const USERPROFILE = process.env.USERPROFILE || process.env.HOME || '';
const AGY_BIN = process.env.AGY_BIN || (LOCALAPPDATA ? join(LOCALAPPDATA, 'agy', 'bin', 'agy.exe') : 'agy');
const BRAIN_DIR = process.env.BRAIN_DIR || (USERPROFILE ? join(USERPROFILE, '.gemini', 'antigravity-cli', 'brain') : '');
const EVIDENCE_FILE = join(REPO_ROOT, 'evals', 'evidence', 'antigravity-live-evidence.json');

export const SKILL_SUITES = [
  {
    skillId: 'xyeena-core',
    positivePrompt: 'Review the evidence rules and operating character disciplines in skills/xyeena-core/SKILL.md. Explain the four disciplines and why discussion mode is not execution.',
    negativePrompt: 'What is 2 + 2?',
    expectedFiles: ['skills/xyeena-core/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-context',
    positivePrompt: 'We just underwent context compaction. Follow skills/xyeena-context/SKILL.md to explain how active context, recovery prompt, and evidence checkpoint work.',
    negativePrompt: 'Write a short haiku about the moon.',
    expectedFiles: ['skills/xyeena-context/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-handoff',
    positivePrompt: 'Prepare a session handoff note following skills/xyeena-handoff/SKILL.md for continuing our v1 development in a new chat session.',
    negativePrompt: 'What is the capital city of France?',
    expectedFiles: ['skills/xyeena-handoff/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-research',
    positivePrompt: 'Conduct primary-source research into the upstream inventory documented in docs/future/UPSTREAM_INVENTORY.md following skills/xyeena-research/SKILL.md.',
    negativePrompt: 'Tell a funny joke about computers.',
    expectedFiles: ['skills/xyeena-research/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-grill',
    positivePrompt: 'Grill gua secara kritis mengenai keputusan arsitektur single-governor Cortex versus multiple independent subagents sesuai skills/xyeena-grill/SKILL.md.',
    negativePrompt: 'Make a grilled cheese sandwich recipe.',
    expectedFiles: ['skills/xyeena-grill/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-plan',
    positivePrompt: 'Create an implementation plan with phased DAG execution for adding a benchmark telemetry reporter, following skills/xyeena-plan/SKILL.md.',
    negativePrompt: 'List planetary distances from the sun.',
    expectedFiles: ['skills/xyeena-plan/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-architecture',
    positivePrompt: 'Analyze the architecture seams and module boundaries between src/core/cortex.mjs and src/resolver.mjs following skills/xyeena-architecture/SKILL.md.',
    negativePrompt: 'Discuss Gothic cathedral architecture history.',
    expectedFiles: ['skills/xyeena-architecture/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-execute',
    positivePrompt: 'Review the locked scope for v1 skill rebuild in docs/v1/SKILL-SYSTEM-REBUILD.md and outline the strict execution boundaries under skills/xyeena-execute/SKILL.md.',
    negativePrompt: 'Define the legal term execution in probate law.',
    expectedFiles: ['skills/xyeena-execute/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-prototype',
    positivePrompt: 'Design a disposable prototype to test whether a lightweight in-memory LRU cache improves resolver lookup speed, following skills/xyeena-prototype/SKILL.md.',
    negativePrompt: 'Explain the general concept of prototyping in industrial manufacturing.',
    expectedFiles: ['skills/xyeena-prototype/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-debug',
    positivePrompt: 'Diagnose and trace the root cause of an unexpected error in our skill activation flow following skills/xyeena-debug/SKILL.md.',
    negativePrompt: 'Write a poem about insects and ladybugs.',
    expectedFiles: ['skills/xyeena-debug/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-test',
    positivePrompt: 'Design a test-driven regression suite (TDD) for nested skill ownership cleanup in src/installer/ownership.mjs following skills/xyeena-test/SKILL.md.',
    negativePrompt: 'What does the word suite mean in hotel terminology?',
    expectedFiles: ['skills/xyeena-test/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-review',
    positivePrompt: 'Perform a dual-axis code review on our recent commits in src/portable-cli-adapter.mjs following skills/xyeena-review/SKILL.md.',
    negativePrompt: 'Review a popular fantasy movie you watched recently.',
    expectedFiles: ['skills/xyeena-review/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-verify',
    positivePrompt: 'Evaluate whether the criteria in docs/v1/IMPLEMENTATION_STATUS.md are ready for completion claim following skills/xyeena-verify/SKILL.md. Check evidence before assertion.',
    negativePrompt: 'What is the philosophical definition of verificationism?',
    expectedFiles: ['skills/xyeena-verify/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-security',
    positivePrompt: 'Review the permission boundaries and external process execution safety in src/portable-cli-adapter.mjs following skills/xyeena-security/SKILL.md.',
    negativePrompt: 'Who is the author of this repository?',
    expectedFiles: ['skills/xyeena-security/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-release',
    positivePrompt: 'Review the release safety checklist and rollback procedure for v1.0.0 following skills/xyeena-release/SKILL.md.',
    negativePrompt: 'What does releasing dopamine mean in biology?',
    expectedFiles: ['skills/xyeena-release/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-interface',
    positivePrompt: 'Review the UI component design guidelines and token hierarchy in harness/guides/30-design/design-system.md following skills/xyeena-interface/SKILL.md.',
    negativePrompt: 'What does a hardware audio interface do?',
    expectedFiles: ['skills/xyeena-interface/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-writing',
    positivePrompt: 'Audit README.md for copywriting cliches and anti-slop guidelines following skills/xyeena-writing/SKILL.md.',
    negativePrompt: 'Write a fictional fantasy story about elves.',
    expectedFiles: ['skills/xyeena-writing/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-skillcraft',
    positivePrompt: 'Audit the skill structure and capability manifest of skills/xyeena-core/ following skills/xyeena-skillcraft/SKILL.md.',
    negativePrompt: 'What is the definition of craftsmanship in carpentry?',
    expectedFiles: ['skills/xyeena-skillcraft/SKILL.md'],
    expectedTools: ['read_file']
  },
  {
    skillId: 'xyeena-orchestrate',
    positivePrompt: 'Plan a multi-agent task DAG coordination with maker-checker separation for a full release verification following skills/xyeena-orchestrate/SKILL.md.',
    negativePrompt: 'Explain the role of an orchestra conductor in classical music.',
    expectedFiles: ['skills/xyeena-orchestrate/SKILL.md'],
    expectedTools: ['read_file']
  }
];

export function runAgy(prompt, timeoutMs = 360000) {
  return new Promise((resolvePromise) => {
    const startTime = Date.now();
    const child = spawn(AGY_BIN, ['--print', prompt, '--output-format', 'json'], {
      cwd: REPO_ROOT,
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolvePromise({
        code: 124,
        parsed: null,
        stdout,
        stderr: stderr + '\n[TIMEOUT] Execution timed out after ' + (timeoutMs / 1000) + 's',
        elapsed: (Date.now() - startTime) / 1000
      });
    }, timeoutMs);

    child.stdout.on('data', chunk => { stdout += chunk.toString('utf8'); });
    child.stderr.on('data', chunk => { stderr += chunk.toString('utf8'); });

    child.on('close', code => {
      clearTimeout(timer);
      const elapsed = (Date.now() - startTime) / 1000;
      let parsed = null;
      try {
        parsed = JSON.parse(stdout.trim());
      } catch {
        const match = stdout.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch {}
        }
      }
      resolvePromise({ code, parsed, stdout, stderr, elapsed });
    });
  });
}

export function getLatestBrainConversationId(sinceMs = 0) {
  if (!BRAIN_DIR || !existsSync(BRAIN_DIR)) return null;
  try {
    const entries = readdirSync(BRAIN_DIR, { withFileTypes: true });
    let latestId = null;
    let latestTime = sinceMs;
    for (const ent of entries) {
      if (ent.isDirectory() && ent.name !== 'scratch') {
        const stat = statSync(join(BRAIN_DIR, ent.name));
        if (stat.mtimeMs > latestTime) {
          latestTime = stat.mtimeMs;
          latestId = ent.name;
        }
      }
    }
    return latestId;
  } catch {
    return null;
  }
}

export function readTranscript(conversationId) {
  if (!conversationId) return { toolCalls: [], steps: [], inspectedFiles: [] };
  const transcriptPath = join(BRAIN_DIR, conversationId, '.system_generated', 'logs', 'transcript.jsonl');
  if (!existsSync(transcriptPath)) return { toolCalls: [], steps: [], inspectedFiles: [] };
  const lines = readFileSync(transcriptPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const toolCalls = [];
  const steps = [];
  const inspectedFiles = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      steps.push({ index: parsed.step_index, type: parsed.type, source: parsed.source });
      if (Array.isArray(parsed.tool_calls)) {
        for (const tc of parsed.tool_calls) {
          toolCalls.push({ name: tc.name, args: tc.args });
          if (tc.name === 'read_file' && tc.args?.Path) {
            inspectedFiles.push(String(tc.args.Path).replace(/^["']|["']$/g, ''));
          }
        }
      }
    } catch {}
  }
  return { toolCalls, steps, inspectedFiles };
}

export function loadState() {
  if (existsSync(EVIDENCE_FILE)) {
    try {
      return JSON.parse(readFileSync(EVIDENCE_FILE, 'utf8'));
    } catch {}
  }
  return {
    timestamp: new Date().toISOString(),
    host: 'Antigravity CLI (agy.exe)',
    version: '1.5.10',
    targetSkillsCount: 19,
    testedCount: 0,
    passedCount: 0,
    overallVerdict: 'IN_PROGRESS',
    skills: []
  };
}

export function saveState(state) {
  state.timestamp = new Date().toISOString();
  state.targetSkillsCount = 19;
  state.testedCount = state.skills.length;
  // A skill is only fully PASS if verdict === 'PASS' and acceptanceTier is HOST_VERIFIED
  state.passedCount = state.skills.filter(s => s.verdict === 'PASS' && s.acceptanceTier === 'HOST_VERIFIED').length;
  state.probedCount = state.skills.filter(s => s.verdict === 'PASS' || s.acceptanceTier === 'POSITIVE_PROBE_EVIDENCE_RECORDED').length;
  state.overallVerdict = (state.passedCount === 19) ? 'ALL_PASS' : 'IN_PROGRESS';
  writeFileSync(EVIDENCE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

export async function evaluateSkill(suite) {
  console.log(`[PROBE] Positive probe for: ${suite.skillId}`);
  const startTime = Date.now();
  const res = await runAgy(suite.positivePrompt);
  const convId = res.parsed?.conversation_id || getLatestBrainConversationId(startTime - 2000);
  const transcript = readTranscript(convId);

  // Evaluate task outcome and genuine tool evidence rather than keyword presence
  const toolCallNames = transcript.toolCalls.map(t => t.name);
  const readExpectedFile = suite.expectedFiles.some(exp =>
    transcript.inspectedFiles.some(f => f.replace(/\\/g, '/').includes(exp))
  );

  const exitOk = res.code === 0;
  const hasSubstantiveResponse = Boolean(res.parsed?.response && res.parsed.response.length > 50);
  const hasSubstantiveTranscript = transcript.toolCalls.length > 0 && transcript.steps.length >= 4;

  let verdict = 'FAIL';
  let acceptanceTier = 'REVIEW_REQUIRED';

  if ((exitOk && hasSubstantiveResponse && (readExpectedFile || toolCallNames.length > 0)) ||
      (readExpectedFile && hasSubstantiveTranscript)) {
    verdict = 'PASS';
    acceptanceTier = 'POSITIVE_PROBE_EVIDENCE_RECORDED';
  } else if (!exitOk) {
    verdict = 'FAIL';
    acceptanceTier = res.code === 124 ? 'TIMEOUT' : 'ERROR';
  }

  return {
    skillId: suite.skillId,
    verdict,
    acceptanceTier,
    exitCode: res.code,
    conversationId: convId,
    durationSeconds: res.elapsed,
    toolCalls: transcript.toolCalls,
    inspectedFiles: transcript.inspectedFiles,
    tokens: res.parsed?.usage?.total_tokens || null,
    notes: (verdict === 'PASS')
      ? `Positive prompt executed with ${transcript.toolCalls.length} tool calls and inspectable receipts`
      : (res.stderr || 'Execution failed')
  };
}

async function main() {
  const args = process.argv.slice(2);
  const state = loadState();

  const targetSkillArg = args.find(a => a.startsWith('--skill='))?.split('=')[1];
  const suitesToRun = targetSkillArg
    ? SKILL_SUITES.filter(s => s.skillId === targetSkillArg)
    : SKILL_SUITES;

  if (suitesToRun.length === 0) {
    console.error(`Skill "${targetSkillArg}" not found in declared suites.`);
    process.exit(1);
  }

  console.log(`[START] Running Antigravity live evaluator for ${suitesToRun.length} skills (Target: 19 skills)...`);

  for (const suite of suitesToRun) {
    const result = await evaluateSkill(suite);
    const existingIdx = state.skills.findIndex(s => s.skillId === suite.skillId);
    if (existingIdx >= 0) {
      state.skills[existingIdx] = result;
    } else {
      state.skills.push(result);
    }
    saveState(state);
    console.log(`[DONE] ${suite.skillId} -> ${result.verdict} (${result.acceptanceTier}, tools: ${result.toolCalls.length}, conv: ${result.conversationId})`);
  }

  console.log(`\n[COMPLETE] Evidence recorded to: ${EVIDENCE_FILE}`);
  console.log(`Host acceptance: ${state.passedCount}/19 HOST_VERIFIED | ${state.probedCount}/19 PROBED`);
}

if (process.argv[1] && process.argv[1].endsWith('eval-antigravity-live.mjs')) {
  main().catch(err => {
    console.error('[ERROR]', err);
    process.exit(1);
  });
}
