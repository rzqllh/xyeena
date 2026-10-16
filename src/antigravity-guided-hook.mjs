import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);
const clean = value => String(value || '').replace(/[\x00-\x1f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
const same = (a, b) => process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);

export function pendingRuns(root, max = 16) {
  root = fs.realpathSync(path.resolve(root));
  const directory = path.join(root, '.xyeena', 'runs');
  if (!fs.existsSync(directory) || fs.lstatSync(directory).isSymbolicLink()) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter(x => x.isDirectory() && validId(x.name)).slice(0, 64).map(entry => {
      const filename = path.join(directory, entry.name, 'snapshot.json');
      try {
        if (fs.lstatSync(filename).isSymbolicLink() || fs.statSync(filename).size > 65536) return null;
        const snapshot = JSON.parse(fs.readFileSync(filename, 'utf8'));
        if (!object(snapshot) || snapshot.run_id !== entry.name || !clean(snapshot.goal) ||
            snapshot.workflow_state === 'CLOSE' ||
            typeof snapshot.cwd !== 'string' || !same(fs.realpathSync(snapshot.cwd), root)) return null;
        return { id: entry.name, snapshot, changed: fs.statSync(filename).mtimeMs };
      } catch { return null; }
    }).filter(Boolean).sort((a, b) => b.changed - a.changed).slice(0, max);
}
export function resumeCapsule(root, id) {
  if (!validId(id)) throw new Error('Invalid run ID');
  const match = pendingRuns(root, 64).find(r => r.id === id);
  if (!match) throw new Error('No unfinished run with that ID in this workspace');
  const s = match.snapshot;
  const tasks = object(s.tasks) ? Object.values(s.tasks).filter(object).slice(0, 8)
    .map(t => ({ title: clean(t.title), state: clean(t.state) })) : [];
  return {
    runId: match.id, goal: clean(s.goal), workflow: clean(s.workflow_state),
    tasks, gitBaseline: typeof s.git_head === 'string' ? s.git_head.slice(0, 40) : null,
    note: 'Verify current Git changes and evidence freshness before continuing. No task was executed.',
  };
}
export function sessionStart(root, payload) {
  if (!object(payload) || !Array.isArray(payload.workspacePaths)) return {};
  root = fs.realpathSync(path.resolve(root));
  const relevant = payload.workspacePaths.some(p => {
    if (typeof p !== 'string') return false;
    try { return same(fs.realpathSync(p), root); } catch { return false; }
  });
  if (!relevant) return {};
  const runs = pendingRuns(root, 8);
  if (runs.length !== 1) return {};
  const run = runs[0];
  const notice = 'Xyeena Rig found an unfinished task: ' + clean(run.snapshot.goal) +
    ' (run ' + run.id + '). Ask the user whether to resume; do not resume or execute automatically. ' +
    'Inspect with: xyeena guided resume --id ' + run.id;
  return { injectSteps: [{ ephemeralMessage: notice }] };
}
async function run() {
  const event = process.argv[2];
  if (event !== 'SessionStart' && event !== 'Stop') { process.stdout.write('{}\n'); return; }
  let input = '', bytes = 0;
  for await (const chunk of process.stdin) {
    bytes += chunk.length;
    if (bytes > 65536) { process.stdout.write('{}\n'); return; }
    input += chunk.toString('utf8');
  }
  try {
    const payload = JSON.parse(input);
    if (event === 'Stop') { process.stdout.write('{"decision":"stop"}\n'); return; }
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
    process.stdout.write(JSON.stringify(sessionStart(root, payload)) + '\n');
  } catch { process.stdout.write('{}\n'); }
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  run().catch(() => process.stdout.write('{}\n'));
}