/**
 * Veyra Handoff Engine — veyra-handoff
 * Portable session continuation, structured checkpoint serialization and recovery.
 * Zero external dependencies (pure Node.js ES Module).
 */

export function serializeCheckpoint(data = {}) {
  const {
    status = 'UNKNOWN',
    phase = data.activePhase || 'UNKNOWN',
    activePhase = phase,
    timestamp = data.timestamp || new Date().toISOString(),
    authority = data.authority || 'Canonical Owner Decisions Register (DEC-01 through DEC-35)',
    tasks = data.nextActions ? data.nextActions.map((a, i) => ({ id: `ACTION-${i+1}`, description: a, done: false, status: 'PENDING' })) : [],
    nextAction = data.nextActions && data.nextActions.length > 0 ? data.nextActions[0] : 'AWAIT_OWNER_INSTRUCTION',
    artifacts = data.artifacts || [],
    provenance = data.provenance || {}
  } = data;

  const lines = [
    '# Veyra v1.0 Workspace Checkpoint',
    '',
    `> **Status:** \`${status}\``,
    `> **Active Phase:** ${activePhase}`,
    `> **Timestamp:** ${timestamp}`,
    `> **Authority:** ${authority}`,
    ''
  ];

  if (artifacts.length > 0) {
    lines.push('## Artifacts & Deliverables');
    lines.push('');
    for (const art of artifacts) {
      lines.push(`- **${art.name}:** location: \`${art.location}\` (status: \`${art.status}\`${art.details ? `, details: ${art.details}` : ''})`);
    }
    lines.push('');
  }

  if (provenance.archiveHash || provenance.manifestFiles || provenance.pinnedRepos) {
    lines.push('## Provenance & Integrity');
    lines.push('');
    if (provenance.archiveHash) lines.push(`- **Archive Hash (SHA-256):** \`${provenance.archiveHash}\``);
    if (provenance.manifestFiles) lines.push(`- **Manifest Files:** \`${provenance.manifestFiles}\``);
    if (provenance.pinnedRepos) lines.push(`- **Pinned Repositories:** \`${provenance.pinnedRepos}\``);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## Active Tasks & Verification Status');
  lines.push('');

  if (tasks.length === 0) {
    lines.push('- No active tasks recorded.');
  } else {
    for (const t of tasks) {
      const mark = t.done ? '[x]' : '[ ]';
      lines.push(`- ${mark} **${t.id}:** ${t.description} (status: \`${t.status || 'PENDING'}\`)`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Deterministic Next Action');
  lines.push('');
  lines.push(`1. ${nextAction}`);
  lines.push('');

  const markdown = lines.join('\n');
  return {
    isValid: true,
    markdown,
    toString() { return markdown; }
  };
}

export function createCheckpoint(data) {
  return serializeCheckpoint(data);
}

export function parseCheckpoint(markdownText = '') {
  if (typeof markdownText !== 'string' || markdownText.length === 0) {
    return {
      isValid: false,
      valid: false,
      status: 'EMPTY_OR_INVALID',
      activePhase: 'UNKNOWN',
      phase: 'UNKNOWN',
      tasks: [],
      errors: ['Empty or non-string input'],
      nextAction: 'RECOVER_STATE'
    };
  }

  const statusMatch = markdownText.match(/> \*\*Status:\*\* \`([^\`]+)\`/);
  const phaseMatch = markdownText.match(/> \*\*(?:Active )?Phase:\*\* ([^\n\r]+)/);
  const timestampMatch = markdownText.match(/> \*\*Timestamp:\*\* ([^\n\r]+)/);

  const errors = [];
  if (!statusMatch) errors.push('Missing status header');

  const status = statusMatch ? statusMatch[1].trim() : 'CORRUPTED';
  const phase = phaseMatch ? phaseMatch[1].trim() : 'UNKNOWN';
  const timestamp = timestampMatch ? timestampMatch[1].trim() : null;

  const tasks = [];
  const taskRegex = /- \[([ x])] \*\*([^:]+):\*\* ([^(]+)(?:\(status: \`([^\`]+)\`\))?/g;
  let match;
  while ((match = taskRegex.exec(markdownText)) !== null) {
    tasks.push({
      id: match[2].trim(),
      description: match[3].trim(),
      done: match[1] === 'x',
      status: match[4] ? match[4].trim() : (match[1] === 'x' ? 'DONE' : 'PENDING')
    });
  }

  const nextActionMatch = markdownText.match(/## Deterministic Next Action[\s\S]*?1\. ([^\n\r]+)/);
  const nextAction = nextActionMatch ? nextActionMatch[1].trim() : 'AWAIT_OWNER_INSTRUCTION';

  const isValid = errors.length === 0 && status !== 'CORRUPTED';

  return {
    isValid,
    valid: isValid,
    status,
    activePhase: phase,
    phase,
    timestamp,
    taskCount: tasks.length,
    tasks,
    errors,
    nextAction
  };
}

export function resolveNextAction(checkpointState = {}) {
  const status = checkpointState.status || '';
  const phase = checkpointState.activePhase || checkpointState.phase || '';

  if (!checkpointState.isValid && checkpointState.isValid !== undefined) {
    const act = 'RECOVER_STATE';
    return { action: act, toString() { return act; } };
  }

  let act = 'AWAIT_OWNER_DIRECTION';
  if (status === 'WAVE_0_COMPLETE' || phase.includes('Wave 0')) {
    act = 'AWAIT_OR_START_WAVE_1';
  } else if (status === 'WAVE_1_COMPLETE' || phase.includes('Wave 1')) {
    act = 'AWAIT_WAVE_2_GO';
  } else if (status.includes('ALL_WAVES_') || status.includes('RELEASE_READY')) {
    act = 'PREPARE_RELEASE_PACKAGE_AND_AWAIT_OWNER_FINAL_GO';
  } else {
    const tasks = checkpointState.tasks || [];
    const pending = tasks.find(t => !t.done);
    if (pending) {
      act = `RESUME_TASK: ${pending.id} - ${pending.description}`;
    }
  }

  return {
    action: act,
    toString() { return act; }
  };
}
