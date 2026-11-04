/**
 * Xyeena Core - Native Capability Resolver
 * Resolves minimal, lazy-loaded capability sets according to task tier and intent.
 * Enforces strict negative triggers and word-boundary domain matching.
 */

import { TASK_TIERS } from './router.mjs';
import { CAPABILITY_LAYERS } from './registry.mjs';

export class CapabilityResolver {
  /**
   * @param {CapabilityRegistry} registry
   * @param {IntentRouter} router
   */
  constructor(registry, router) {
    this.registry = registry;
    this.router = router;
  }

  /**
   * Resolve active capability set for a given request.
   * @param {string} prompt
   * @param {string} mode
   * @param {string} tier
   * @returns {object[]} Array of resolved capability contract objects
   */
  resolve(prompt, mode, tier) {
    const lower = (prompt || '').toLowerCase();
    
    // Always include L0 Kernel capabilities
    const l0Caps = this.registry.getByLayer(CAPABILITY_LAYERS.L0);
    const candidateIds = new Set(l0Caps.map(c => c.id));

    // If Micro task in Discussion mode: zero L1/L2 overhead!
    if (tier === TASK_TIERS.TIER_0_MICRO) {
      return this.registry.resolveDependencies(Array.from(candidateIds)).map(id => this.registry.get(id));
    }

    // Domain heuristic routing for L1 capabilities (using word boundary checks)
    // 1. Testing & TDD
    if (/\b(test|tests|tdd|spec|specs|testing)\b/i.test(lower)) {
      candidateIds.add('engineering.tdd');
      candidateIds.add('engineering.test-strategy');
    }

    // 2. Debugging & Root Cause
    if (/\b(bug|bugs|error|errors|fail|failing|diagnose|debug|crash)\b/i.test(lower)) {
      candidateIds.add('engineering.root-cause');
      candidateIds.add('thinking.hypothesis');
    }

    // 3. UI, Design & Frontend
    if (/\b(ui|css|layout|component|komponen|modal|dialog|styling|frontend|color|typography)\b/i.test(lower)) {
      candidateIds.add('design.interface');
      candidateIds.add('design.accessibility');
      candidateIds.add('design.responsive');
      candidateIds.add('design.experience');
      candidateIds.add('design.color-theory');
    }

    // 4. Code Review & Architecture
    if (/\b(review|diff|patch|pr)\b/i.test(lower)) {
      candidateIds.add('engineering.code-review');
    }
    if (/\b(architecture|seam|refactor|modular|decouple)\b/i.test(lower)) {
      candidateIds.add('engineering.architecture');
      candidateIds.add('engineering.application-logic');
    }

    // 5. Performance & Reliability
    if (/\b(perf|performance|latency|slow|bottleneck|benchmark|speed)\b/i.test(lower)) {
      candidateIds.add('engineering.performance');
    }
    if (/\b(reliability|retry|circuit|resilience|timeout|backoff)\b/i.test(lower)) {
      candidateIds.add('engineering.reliability');
    }

    // 6. Database & Migration
    if (/\b(db|database|migration|schema|table|sql|nosql|postgres)\b/i.test(lower)) {
      candidateIds.add('engineering.data');
      candidateIds.add('engineering.migration');
    }

    // 7. Security (Passive Guidance)
    if (/\b(security|auth|cors|jwt|csrf|session|token|credential)\b/i.test(lower)) {
      candidateIds.add('security.guidance');
      candidateIds.add('security.threat-model');
    }

    // 8. Planning, Modeling & Research
    if (/\b(plan|planning|langkah|phase|phases|roadmap)\b/i.test(lower)) {
      candidateIds.add('thinking.plan');
      candidateIds.add('thinking.discovery');
    }
    if (/\b(research|riset|source|citation|investigate)\b/i.test(lower)) {
      candidateIds.add('thinking.research');
      candidateIds.add('knowledge.research-quality');
    }
    if (/\b(grill|stress-test|challenge|interrogate)\b/i.test(lower)) {
      candidateIds.add('thinking.grill');
    }

    // 9. Extensibility & Skills
    if (/\b(mcp|skill|manifest|tool\s+schema)\b/i.test(lower)) {
      candidateIds.add('extensibility.skill-authoring');
      candidateIds.add('extensibility.mcp-design');
    }

    // 10. Documentation & Copy
    if (/\b(doc|docs|documentation|copy|readme|adr)\b/i.test(lower)) {
      candidateIds.add('delivery.documentation');
      candidateIds.add('delivery.product-copy');
      candidateIds.add('delivery.adr');
    }

    // Heavyweight L2 checks (Explicit Triggers Only)
    if (lower.includes('full security audit') || lower.includes('audit seluruh keamanan')) {
      this.router.assertNegativeTriggerSafe('security.full-audit', prompt, mode);
      candidateIds.add('security.full-audit');
      candidateIds.add('security.findings-validation');
    }
    if (/\b(release|publish|tag)\b/i.test(lower)) {
      candidateIds.add('delivery.release-check');
      candidateIds.add('engineering.release');
    }

    // Filter candidate IDs against negative triggers
    for (const id of candidateIds) {
      this.router.assertNegativeTriggerSafe(id, prompt, mode);
    }

    // Resolve dependencies topologically
    const validCandidateIds = Array.from(candidateIds).filter(id => this.registry.has(id));
    const resolvedIds = this.registry.resolveDependencies(validCandidateIds);
    return resolvedIds.map(id => this.registry.get(id));
  }
}
