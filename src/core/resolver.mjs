/**
 * Xyeena Core - Native Capability Resolver
 * Resolves minimal, lazy-loaded capability sets according to task tier and intent.
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
    if (/\b(test|tests|tdd|spec|specs)\b/i.test(lower)) {
      candidateIds.add('engineering.tdd');
      candidateIds.add('engineering.test-strategy');
    }
    if (/\b(bug|bugs|error|errors|fail|failing|diagnose|debug)\b/i.test(lower)) {
      candidateIds.add('engineering.root-cause');
      candidateIds.add('thinking.hypothesis');
    }
    if (/\b(ui|css|layout|component|komponen|modal|dialog|styling|frontend)\b/i.test(lower)) {
      candidateIds.add('design.interface');
      candidateIds.add('design.accessibility');
      candidateIds.add('design.responsive');
    }
    if (/\b(review|diff|patch|pr)\b/i.test(lower)) {
      candidateIds.add('engineering.code-review');
    }
    if (/\b(security|auth|cors|jwt|csrf)\b/i.test(lower)) {
      candidateIds.add('security.guidance');
    }
    if (/\b(plan|planning|langkah|phase|phases)\b/i.test(lower)) {
      candidateIds.add('thinking.plan');
    }

    // Heavyweight L2 checks
    if (lower.includes('full security audit') || lower.includes('audit seluruh keamanan')) {
      this.router.assertNegativeTriggerSafe('security.full-audit', prompt, mode);
      candidateIds.add('security.full-audit');
    }
    if (/\b(release|tag)\b/i.test(lower)) {
      candidateIds.add('delivery.release-check');
      candidateIds.add('engineering.release');
    }

    // Filter candidate IDs against negative triggers
    for (const id of candidateIds) {
      this.router.assertNegativeTriggerSafe(id, prompt, mode);
    }

    // Resolve dependencies topologically
    const resolvedIds = this.registry.resolveDependencies(Array.from(candidateIds));
    return resolvedIds.map(id => this.registry.get(id));
  }
}
