/**
 * Xyeena Core - Native Capability Registry
 * High-performance, zero-external-dependency registry managing the 64 native capability contracts.
 */

import { ERROR_CODES, XyeenaError } from './errors.mjs';

export const CAPABILITY_LAYERS = Object.freeze({
  L0: 'L0', // Invariant Kernel (Mandatory, budget <= 1500 tokens)
  L1: 'L1', // Adaptive Domain Skills (On-Demand)
  L2: 'L2', // Heavyweight Ops / Explicit Risk Gates
  L3: 'L3'  // External Integrations & Ecosystem Bridges
});

export class CapabilityRegistry {
  constructor() {
    this.capabilities = new Map();
  }

  /**
   * Register a capability contract.
   * @param {object} contract
   */
  register(contract) {
    if (!contract || !contract.id) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, 'Capability contract must have a valid id');
    }
    if (this.capabilities.has(contract.id)) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, `Duplicate capability ID registered: ${contract.id}`);
    }
    if (!CAPABILITY_LAYERS[contract.layer]) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, `Invalid layer "${contract.layer}" for capability ${contract.id}`);
    }

    const normalized = {
      id: contract.id,
      domain: contract.domain || '',
      layer: contract.layer,
      name: contract.name || '',
      purpose: contract.purpose || '',
      activation: contract.activation || 'adaptive',
      positive_trigger: contract.positive_trigger || '',
      negative_trigger: contract.negative_trigger || '',
      inputs: contract.inputs || '',
      outputs: contract.outputs || '',
      dependencies: Array.isArray(contract.dependencies) ? [...contract.dependencies] : [],
      permissions: Array.isArray(contract.permissions) ? [...contract.permissions] : ['read_only'],
      resource_budget: contract.resource_budget || { max_tokens: 500, time_ms: 100 },
      conflict_resolution: contract.conflict_resolution || '',
      fallback: contract.fallback || '',
      evidence_requirements: contract.evidence_requirements || '',
      acceptance_tests: Array.isArray(contract.acceptance_tests) ? [...contract.acceptance_tests] : [],
      deferred_source_research: contract.deferred_source_research || '',
      contract_status: contract.contract_status || 'CONTRACT FROZEN — APPROVED FOR IMPLEMENTATION'
    };

    this.capabilities.set(normalized.id, normalized);
    return normalized;
  }

  get(id) {
    return this.capabilities.get(id) || null;
  }

  has(id) {
    return this.capabilities.has(id);
  }

  getAll() {
    return Array.from(this.capabilities.values());
  }

  getByLayer(layer) {
    return this.getAll().filter(c => c.layer === layer);
  }

  getByDomain(domain) {
    return this.getAll().filter(c => c.domain === domain);
  }

  size() {
    return this.capabilities.size;
  }

  /**
   * Validate entire registry integrity: unique IDs, no broken references, no cycles.
   */
  validate() {
    const allIds = new Set(this.capabilities.keys());

    // 1. Broken dependencies check
    for (const [id, cap] of this.capabilities) {
      for (const dep of cap.dependencies) {
        if (!allIds.has(dep)) {
          throw new XyeenaError(
            ERROR_CODES.CAPABILITY_NOT_FOUND,
            `Capability "${id}" references nonexistent dependency "${dep}"`
          );
        }
      }
    }

    // 2. Cycle detection via DFS
    const visited = new Set();
    const recStack = new Set();

    const dfs = (curr, path) => {
      visited.add(curr);
      recStack.add(curr);

      const cap = this.capabilities.get(curr);
      const deps = cap ? cap.dependencies : [];

      for (const dep of deps) {
        if (!visited.has(dep)) {
          const cyc = dfs(dep, [...path, dep]);
          if (cyc) return cyc;
        } else if (recStack.has(dep)) {
          return [...path, dep];
        }
      }

      recStack.delete(curr);
      return null;
    };

    for (const id of allIds) {
      if (!visited.has(id)) {
        const cycle = dfs(id, [id]);
        if (cycle) {
          throw new XyeenaError(
            ERROR_CODES.CIRCULAR_DEPENDENCY,
            `Circular dependency detected: ${cycle.join(' -> ')}`
          );
        }
      }
    }

    return true;
  }

  /**
   * Resolve and topologically sort all dependencies for a requested set of capabilities.
   * @param {string[]} rootIds
   * @returns {string[]} Ordered capability IDs with dependencies preceding dependents
   */
  resolveDependencies(rootIds) {
    this.validate();
    const result = [];
    const visited = new Set();

    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);

      const cap = this.get(id);
      if (!cap) {
        throw new XyeenaError(ERROR_CODES.CAPABILITY_NOT_FOUND, `Capability "${id}" not found`);
      }

      for (const dep of cap.dependencies) {
        visit(dep);
      }
      result.push(id);
    };

    for (const id of rootIds) {
      visit(id);
    }

    return result;
  }
}
