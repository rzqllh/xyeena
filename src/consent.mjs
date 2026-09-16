const DESTRUCTIVE = [
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+push\b.*--force/i,
  /\brm\s+-rf\b/i,
  /\bdrop\s+(table|database)\b/i,
  /\btruncate\s+table\b/i,
  /\bdelete\s+from\b/i,
];
const EXTERNAL = [
  /\bgit\s+push\b/i,
  /\bgit\s+merge\b/i,
  /\bnpm\s+publish\b/i,
  /\bnpm\s+stage\s+publish\b/i,
  /\bdeploy\b/i,
  /\bkubectl\s+(apply|delete)\b/i,
  /\bterraform\s+apply\b/i,
  /\bsend\s+(email|message)\b/i,
];
const MUTATING = [
  /\bgit\s+commit\b/i,
  /\bnpm\s+install\b/i,
  /\bpnpm\s+install\b/i,
  /\byarn\s+install\b/i,
  /\bwrite\b/i,
  /\bedit\b/i,
];
export function classifyOperation(op = '') {
  if (DESTRUCTIVE.some((r) => r.test(op))) return { level: 'destructive', consent: true, exactConfirmation: true };
  if (EXTERNAL.some((r) => r.test(op))) return { level: 'external', consent: true, exactConfirmation: false };
  if (MUTATING.some((r) => r.test(op))) return { level: 'workspace-mutate', consent: false, exactConfirmation: false };
  return { level: 'safe', consent: false, exactConfirmation: false };
}
export function consentRequired(op, authorizedLevels = []) {
  const c = classifyOperation(op);
  return c.consent && !authorizedLevels.includes(c.level);
}
