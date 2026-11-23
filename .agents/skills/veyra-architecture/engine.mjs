/**
 * Veyra Architecture Engine — veyra-architecture
 * Deep module boundary auditing, architectural seams, coupling metrics.
 * Zero external dependencies.
 */

export function auditModuleBoundaries(modules = []) {
  if (!Array.isArray(modules)) return { clean: false, violations: [] };

  const violations = [];
  for (const m of modules) {
    const { name, imports = [], layer = 'DOMAIN' } = m;
    for (const imp of imports) {
      if (layer === 'DOMAIN') {
        if (imp.includes('/infra/') || imp.includes('/ui/') || imp.includes('/adapters/')) {
          violations.push({
            module: name,
            violatingImport: imp,
            rule: 'DOMAIN_LAYER_INVERSION_VIOLATION'
          });
        }
      }
      if (layer === 'UI') {
        if (imp.includes('/db/') || imp.includes('/repository/')) {
          violations.push({
            module: name,
            violatingImport: imp,
            rule: 'UI_DIRECT_DB_COUPLING'
          });
        }
      }
    }
  }

  return {
    clean: violations.length === 0,
    moduleCount: modules.length,
    violationCount: violations.length,
    violations
  };
}

export function calculateAfferentEfferentCoupling(moduleName, graph = {}) {
  const efferent = (graph[moduleName] || []).length;
  let afferent = 0;

  for (const [mod, deps] of Object.entries(graph)) {
    if (mod !== moduleName && deps.includes(moduleName)) {
      afferent++;
    }
  }

  const total = afferent + efferent;
  const instability = total > 0 ? Number((efferent / total).toFixed(3)) : 0;

  return {
    moduleName,
    afferentCoupling: afferent,
    efferentCoupling: efferent,
    instabilityMetric: instability
  };
}

export function detectCircularImports(importGraph = {}) {
  const visited = new Set();
  const stack = new Set();
  const cycles = [];

  function dfs(node, path) {
    visited.add(node);
    stack.add(node);
    for (const neighbor of (importGraph[node] || [])) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path, neighbor]);
      } else if (stack.has(neighbor)) {
        cycles.push([...path, neighbor]);
      }
    }
    stack.delete(node);
  }

  for (const mod of Object.keys(importGraph)) {
    if (!visited.has(mod)) dfs(mod, [mod]);
  }

  return { hasCycles: cycles.length > 0, cycleCount: cycles.length, cycles };
}
