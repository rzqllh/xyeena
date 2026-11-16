/**
 * Xyeena Core - Workflow & Prompt Composer
 * Composes L0 Kernel and lazily resolved L1/L2 capability contracts into compact prompt payloads.
 */

import { BehavioralKernel } from './kernel.mjs';
import { estimateTokens } from './budget.mjs';
import { BehavioralTraitOverlay } from './personality.mjs';

export class WorkflowComposer {
  /**
   * @param {BehavioralKernel} [kernel]
   */
  constructor(kernel = new BehavioralKernel()) {
    this.kernel = kernel;
  }

  /**
   * Compose the runtime context pack for an incoming prompt.
   * @param {object} params
   * @param {string} params.prompt - Incoming user request
   * @param {string} params.mode - Execution mode (DISCUSSION, EXECUTION, etc.)
   * @param {string} params.tier - Complexity tier
   * @param {object[]} params.activeCapabilities - Resolved capability objects
   * @returns {object} Composed payload with prompt text and token stats
   */
  compose({ prompt, mode, tier, activeCapabilities = [] }) {
    const sections = [];

    // 1. L0 Invariant Kernel (Always included)
    sections.push(this.kernel.formatKernelPrompt());

    // 2. Execution Mode Context
    sections.push(`\n# Active Execution Gate\nCurrent Mode: ${mode} | Tier: ${tier}`);

    // 3. Active L1/L2 Capabilities (Lazy loaded)
    const nonL0Caps = activeCapabilities.filter(c => c.layer !== 'L0');
    if (nonL0Caps.length > 0) {
      sections.push('\n# Active Domain Capabilities (Lazy-Loaded)');
      for (const cap of nonL0Caps) {
        sections.push(
          `## [${cap.id}] ${cap.name} (${cap.layer})\n` +
          `Purpose: ${cap.purpose}\n` +
          `Guidance: ${cap.positive_trigger}\n` +
          `Fallback: ${cap.fallback}`
        );
      }
    }

    // 4. Behavioral Trait Guidance Overlay (DEC-32 / XYN Methodological Synthesis)
    // TIER_0_MICRO retains zero domain/trait overhead to stay strictly within micro budget (< 500 tokens).
    let traitOverlay = { overlayText: '', tokenEstimate: 0, traitCount: 0 };
    if (tier !== 'TIER_0_MICRO') {
      traitOverlay = BehavioralTraitOverlay.formatOverlay(prompt);
      if (traitOverlay.overlayText) {
        sections.push('\n' + traitOverlay.overlayText);
      }
    }

    const payloadText = sections.join('\n');
    const estimatedTokens = estimateTokens(payloadText);

    return {
      payloadText,
      mode,
      tier,
      activeCapabilityIds: activeCapabilities.map(c => c.id),
      stats: {
        characters: payloadText.length,
        estimatedTokens,
        l0TokenShare: this.kernel.getTokenCount(),
        traitTokenShare: traitOverlay.tokenEstimate,
        domainCapabilityCount: nonL0Caps.length
      }
    };
  }
}
