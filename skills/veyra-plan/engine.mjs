/**
 * Veyra Plan Engine — veyra-plan
 * Reviewable dependency-ordered execution planning, DAG acyclicity, blast radius estimation.
 * Zero external dependencies.
 */

export function detectCycles(tasks = []) {
  const adj = new Map();
  for (const t of tasks) {
    adj.set(t.id, t.dependsOn || []);
  }

  const visited = new Set();
  const recStack = new Set();
  const cycleNodes = new Set();

  function isCyclic(node, path = []) {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (isCyclic(neighbor, path)) return true;
      } else if (recStack.has(neighbor)) {
        const cycleStartIndex = path.indexOf(neighbor);
        const inCycle = path.slice(cycleStartIndex);
        for (const c of inCycle) cycleNodes.add(c);
        cycleNodes.add(neighbor);
        return true;
      }
    }

    path.pop();
    recStack.delete(node);
    return false;
  }

  for (const [node] of adj) {
    if (!visited.has(node)) {
      if (isCyclic(node, [])) return { hasCycle: true, cycleNodes: Array.from(cycleNodes) };
    }
  }

  return { hasCycle: false, cycleNodes: [] };
}

export function validatePlanDAG(phases = []) {
  if (!Array.isArray(phases) || phases.length === 0) {
    return { valid: false, reason: 'NO_PHASES', taskCount: 0 };
  }

  const allTasks = [];
  for (const p of phases) {
    for (const t of (p.tasks || [])) {
      allTasks.push(t);
    }
  }

  const cycleCheck = detectCycles(allTasks);
  if (cycleCheck.hasCycle) {
    return {
      valid: false,
      reason: 'CIRCULAR_DEPENDENCY',
      cycleNodes: cycleCheck.cycleNodes,
      taskCount: allTasks.length
    };
  }

  return {
    valid: true,
    reason: 'VALID_DAG',
    phaseCount: phases.length,
    taskCount: allTasks.length
  };
}

export function estimateBlastRadius(tasks = []) {
  let fileModCount = 0;
  let hasDestructiveOps = false;
  let externalImpact = false;

  for (const t of tasks) {
    fileModCount += (t.files || []).length;
    if (t.destructive) hasDestructiveOps = true;
    if (t.external) externalImpact = true;
  }

  let riskTier = 'LOW';
  if (hasDestructiveOps || externalImpact || fileModCount > 15) {
    riskTier = 'HIGH';
  } else if (fileModCount > 5) {
    riskTier = 'MEDIUM';
  }

  return {
    taskCount: tasks.length,
    totalFilesTouched: fileModCount,
    hasDestructiveOps,
    externalImpact,
    riskTier
  };
}

export function calculateCriticalPath(tasks = []) {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  let maxPath = [];

  function getDepth(id, currentPath) {
    const task = taskMap.get(id);
    if (!task) return currentPath;
    const deps = task.dependsOn || [];
    if (deps.length === 0) return [...currentPath, id];
    let longest = currentPath;
    for (const d of deps) {
      const p = getDepth(d, [...currentPath, id]);
      if (p.length > longest.length) longest = p;
    }
    return longest;
  }

  for (const t of tasks) {
    const path = getDepth(t.id, []);
    if (path.length > maxPath.length) maxPath = path;
  }

  return { criticalPathLength: maxPath.length, criticalPath: maxPath.reverse() };
}
