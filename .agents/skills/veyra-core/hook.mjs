/**
 * Optional pre-tool hook for Gemini CLI, Claude Code and Codex.
 * This is a policy check on tool inputs, not an OS sandbox.
 * Hooks must be explicitly enabled by the owner; do not auto-install them.
 */
import { readFileSync, existsSync, lstatSync, realpathSync } from 'node:fs';
import { resolve, relative, dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateScope } from './engine.mjs';

const FILE_WRITE_TOOLS = new Set(['Write','Edit','MultiEdit','NotebookEdit','write_file','edit_file','replace','apply_patch']);
const SHELL_TOOLS = new Set(['Bash','run_shell_command','exec_command','shell_command','powershell']);
const PROTECTED = ['.git', '.veyra', '.env', '.env.local'];

function inside(root, candidate) {
  const rel = relative(root, candidate);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !rel.startsWith('/') && !rel.startsWith('\\'));
}
function safeFile(root, inputPath) {
  if (typeof inputPath !== 'string' || !inputPath.trim() || inputPath.includes('\0')) return null;
  const physicalRoot = realpathSync(root);
  const path = resolve(physicalRoot, inputPath);
  if (path === physicalRoot || !inside(physicalRoot, path)) return null;
  let parent = existsSync(path) ? path : dirname(path);
  while (!existsSync(parent)) {
    const upper = dirname(parent);
    if (upper === parent) return null;
    parent = upper;
  }
  if (!inside(physicalRoot, realpathSync(parent))) return null;
  const rel = relative(physicalRoot, path).replace(/\\/g, '/');
  if (PROTECTED.some(p => rel === p || rel.startsWith(p + '/'))) return null;
  return rel;
}
function policyAt(root) {
  const path = join(root, '.veyra', 'scope.json');
  if (!existsSync(path)) return { readOnly: true, allowedPatterns: [], allowShell: false };
  if (lstatSync(path).isSymbolicLink()) throw new Error('UNSAFE_SCOPE_POLICY_SYMLINK');
  const policy = JSON.parse(readFileSync(path, 'utf8'));
  if (policy.version !== 1 || !Array.isArray(policy.allowedPatterns) ||
      policy.allowedPatterns.some(x => typeof x !== 'string') ||
      typeof policy.readOnly !== 'boolean' || typeof policy.allowShell !== 'boolean') {
    throw new Error('INVALID_SCOPE_POLICY');
  }
  return policy;
}
export function evaluateToolCall(event, options = {}) {
  const root = resolve(options.cwd || process.cwd());
  if (!existsSync(root)) return { allowed: false, reason: 'MISSING_WORKSPACE' };
  const tool = event?.tool_name;
  if (typeof tool !== 'string' || !event.tool_input || typeof event.tool_input !== 'object') {
    return { allowed: false, reason: 'INVALID_TOOL_EVENT' };
  }
  let policy;
  try { policy = policyAt(root); }
  catch { return { allowed: false, reason: 'INVALID_SCOPE_POLICY' }; }
  if (SHELL_TOOLS.has(tool)) {
    return policy.allowShell && !policy.readOnly
      ? { allowed: true, reason: 'SHELL_OWNER_OPT_IN_UNGUARDED', tool }
      : { allowed: false, reason: 'SHELL_BLOCKED_BY_SCOPE_POLICY', tool };
  }
  if (!FILE_WRITE_TOOLS.has(tool)) {
    return { allowed: false, reason: 'UNKNOWN_MATCHED_TOOL_FAIL_CLOSED', tool };
  }
  if (policy.readOnly) return { allowed: false, reason: 'WORKSPACE_READ_ONLY', tool };
  const path = event.tool_input.file_path || event.tool_input.filePath || event.tool_input.path;
  const rel = safeFile(root, path);
  if (!rel) return { allowed: false, reason: 'UNSAFE_OR_UNKNOWN_WRITE_PATH', tool };
  const result = validateScope({ targetFiles: [rel], allowedPatterns: policy.allowedPatterns, actionType: 'WRITE' });
  return { allowed: result.allowed, reason: result.allowed ? 'IN_OWNER_SCOPE' : 'OUTSIDE_OWNER_SCOPE', tool };
}
function main() {
  try {
    const input = readFileSync(0, 'utf8');
    const result = evaluateToolCall(JSON.parse(input));
    if (!result.allowed) {
      console.error('VEYRA_SCOPE_DENIED: ' + result.reason);
      process.exitCode = 2; // PreToolUse block for Gemini/Claude/Codex
    } else {
      process.stdout.write('{}\n'); // valid empty JSON response for supported hook formats
    }
  } catch (error) {
    console.error('VEYRA_SCOPE_DENIED: INVALID_EVENT_OR_POLICY');
    process.exitCode = 2;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
