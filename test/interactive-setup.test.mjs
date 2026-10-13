import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { interactiveSelection, availableSkills, availableHarnessGroups } from '../src/selection.mjs';

// Exercise the actual readline wizard without installing a system-wide terminal.
// A separate Windows PowerShell manual pass is still required before release.
async function wizard(answers) {
  const input = new PassThrough();
  const output = new PassThrough();
  input.isTTY = true;
  output.isTTY = true;
  const prompts = [
    'Component [1/2/3/0]: ',
    'Runtime(s): ',
    'Skill(s): ',
    'Guardrail group(s): ',
    'Proceed? [y/N]: ',
  ];
  let shown = '';
  let index = 0;
  output.on('data', chunk => {
    shown += chunk.toString();
    if (index >= answers.length) return;
    const step = answers[index];
    const prompt = prompts.find(item => shown.endsWith(item));
    if (prompt) {
      index++;
      setImmediate(() => input.write(step + '\n'));
    }
  });
  try {
    const result = await interactiveSelection({ input, output });
    assert.equal(index, answers.length, 'wizard did not ask all expected questions');
    return { result, text: shown };
  } finally {
    input.destroy();
    output.destroy();
  }
}

test('interactive wizard cancels when the user chooses zero', { timeout: 10000 }, async () => {
  const { result, text } = await wizard(['0']);
  assert.equal(result, null);
  assert.match(text, /Nothing is installed until you confirm/);
});

test('interactive wizard declines Skills and previews required dependencies', { timeout: 10000 }, async () => {
  const { result, text } = await wizard(['1','codex','xyeena-interface','n']);
  assert.equal(result, null);
  assert.match(text, /Also required: xyeena-core/);
  assert.match(text, /Proceed\? \[y\/N\]/);
});

test('interactive wizard selects only one Harness guardrail group', { timeout: 10000 }, async () => {
  const { result } = await wizard(['2','00-core','y']);
  assert.deepEqual(result, {
    components: ['harness'], runtimes: [], skills: [], guards: ['00-core']
  });
});

test('interactive wizard allows explicit All only after selection and confirmation', { timeout: 10000 }, async () => {
  const { result, text } = await wizard(['3','all','all','all','yes']);
  assert.deepEqual(result.components, ['skills','harness']);
  assert.deepEqual(result.runtimes, ['antigravity','claude','codex']);
  assert.deepEqual(result.skills, availableSkills());
  assert.deepEqual(result.guards, availableHarnessGroups());
  assert.match(text, /Proceed\? \[y\/N\]/);
});
